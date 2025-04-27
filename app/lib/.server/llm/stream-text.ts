import { convertToCoreMessages, streamText as _streamText, type Message } from 'ai';
import { MAX_TOKENS, type FileMap } from './constants';
import { getSystemPrompt } from '~/lib/common/prompts/prompts';
import { DEFAULT_MODEL, DEFAULT_PROVIDER, MODIFICATIONS_TAG_NAME, PROVIDER_LIST, WORK_DIR } from '~/utils/constants';
import type { IProviderSetting } from '~/types/model';
import { PromptLibrary } from '~/lib/common/prompt-library';
import { allowedHTMLElements } from '~/utils/markdown';
import { LLMManager } from '~/lib/modules/llm/manager';
import { createScopedLogger } from '~/utils/logger';
import { createFilesContext, extractPropertiesFromMessage } from './utils';
import { getFilePaths } from './select-context';
import { processFile } from '../file-processor';
import { processFileWithLLM } from './file-parser';

export type Messages = Message[];

// 新增: CarbonFlowData接口定义
export interface CarbonFlowData {
  nodes?: any[];
  Score?: any;
  State?: any; // 添加conversationState字段
}

export interface StreamingOptions extends Omit<Parameters<typeof _streamText>[0], 'model'> {
  supabaseConnection?: {
    isConnected: boolean;
    hasSelectedProject: boolean;
    credentials?: {
      anonKey?: string;
      supabaseUrl?: string;
    };
  };
  carbonFlowData?: CarbonFlowData; // 添加carbonFlowData属性
}

const logger = createScopedLogger('stream-text');

interface BoltAction {
  type: string;
  file?: File;
  [key: string]: any;
}

function extractBoltAction(content: string): BoltAction | null {
  const match = content.match(/<boltAction\s+([^>]+)\/>/);
  if (!match) return null;
  const attrs: BoltAction = { type: '' };
  match[1].replace(/(\w+)="([^"]+)"/g, (_, key, value) => {
    attrs[key] = value;
    return '';
  });
  return attrs;
}

export async function streamText(props: {
  messages: Omit<Message, 'id'>[];
  env?: Env;
  options?: StreamingOptions;
  apiKeys?: Record<string, string>;
  files?: FileMap;
  providerSettings?: Record<string, IProviderSetting>;
  promptId?: string;
  contextOptimization?: boolean;
  contextFiles?: FileMap;
  summary?: string;
  messageSliceId?: number;
  carbonFlowData?: CarbonFlowData; // 新增: 碳足迹数据参数
}) {
  const {
    messages,
    env: serverEnv,
    options,
    apiKeys,
    files,
    providerSettings,
    promptId,
    contextOptimization,
    contextFiles,
    summary,
    carbonFlowData, // 新增: 碳足迹数据
  } = props;
  let currentModel = DEFAULT_MODEL;
  let currentProvider = DEFAULT_PROVIDER.name;
  let processedMessages = messages.map((message) => {
    if (message.role === 'user') {
      const { model, provider, content } = extractPropertiesFromMessage(message);
      currentModel = model;
      currentProvider = provider;

      return { ...message, content };
    } else if (message.role == 'assistant') {
      let content = message.content;
      content = content.replace(/<div class=\\"__boltThought__\\">.*?<\/div>/s, '');
      content = content.replace(/<think>.*?<\/think>/s, '');

      return { ...message, content };
    }

    return message;
  });

  const provider = PROVIDER_LIST.find((p) => p.name === currentProvider) || DEFAULT_PROVIDER;
  const staticModels = LLMManager.getInstance().getStaticModelListFromProvider(provider);
  let modelDetails = staticModels.find((m) => m.name === currentModel);

  if (!modelDetails) {
    const modelsList = [
      ...(provider.staticModels || []),
      ...(await LLMManager.getInstance().getModelListFromProvider(provider, {
        apiKeys,
        providerSettings,
        serverEnv: serverEnv as any,
      })),
    ];

    if (!modelsList.length) {
      throw new Error(`No models found for provider ${provider.name}`);
    }

    modelDetails = modelsList.find((m) => m.name === currentModel);

    if (!modelDetails) {
      // Fallback to first model
      logger.warn(
        `MODEL [${currentModel}] not found in provider [${provider.name}]. Falling back to first model. ${modelsList[0].name}`,
      );
      modelDetails = modelsList[0];
    }
  }

  const dynamicMaxTokens = modelDetails && modelDetails.maxTokenAllowed ? modelDetails.maxTokenAllowed : MAX_TOKENS;

  let systemPrompt =
    PromptLibrary.getPropmtFromLibrary(promptId || 'default', {
      cwd: WORK_DIR,
      allowedHtmlElements: allowedHTMLElements,
      modificationTagName: MODIFICATIONS_TAG_NAME,
      supabase: {
        isConnected: options?.supabaseConnection?.isConnected || false,
        hasSelectedProject: options?.supabaseConnection?.hasSelectedProject || false,
        credentials: options?.supabaseConnection?.credentials || undefined,
      },
    }) ?? getSystemPrompt();

  // 添加碳足迹数据到系统提示
  if (carbonFlowData) {
    let carbonFlowContext =
      '\n\n### 以下是carbonflow数据, 包括階段信息、碳節點信息、打分信息, 你需要透過這三個信息, 引導用戶持續增加打分, 完成最終報告\n';

    // 提取评估阶段完整信息
    if (carbonFlowData.State) {
      carbonFlowContext += `
#### 当前项目进展
\`\`\`json
${JSON.stringify(carbonFlowData.State, null, 2)}
\`\`\`

您需要根据上述项目进展信息，确定当前处于哪个评估阶段，并引导用户完成该阶段剩余工作。
`;
    }

    // 添加节点摘要统计和完整节点信息
    if (carbonFlowData.nodes && carbonFlowData.nodes.length > 0) {
      // 按生命周期阶段分组统计
      const stageMap = new Map();

      carbonFlowData.nodes.forEach((node) => {
        const stage = node.data?.lifecycleStage || '未分类';

        if (!stageMap.has(stage)) {
          stageMap.set(stage, 0);
        }

        stageMap.set(stage, stageMap.get(stage) + 1);
      });

      carbonFlowContext += `
#### 当前模型概况
- 总节点数: ${carbonFlowData.nodes.length}
- 生命周期覆盖:
${Array.from(stageMap.entries())
  .map(([stage, count]) => `  - ${stage}: ${count}个节点`)
  .join('\n')}

#### 关键节点
${carbonFlowData.nodes
  .filter((node) => node.type === 'finalProduct' || (node.data?.carbonFootprint && node.data?.carbonFootprint > 10))
  .slice(0, 5)
  .map((node) => `- ${node.data?.label || node.id}: ${node.data?.carbonFootprint || 0} kgCO₂e`)
  .join('\n')}
`;

      // 添加完整的节点信息
      carbonFlowContext += `
#### 完整节点信息
\`\`\`json
${JSON.stringify(
  carbonFlowData.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    data: node.data,
  })),
  null,
  2,
)}
\`\`\`

请您根据以上完整节点信息分析产品碳足迹模型的详细情况，包括各节点之间的关系和数据质量。
`;
    }

    // 添加完整打分信息
    if (carbonFlowData.Score) {
      carbonFlowContext += `
#### 完整打分信息
\`\`\`json
${JSON.stringify(carbonFlowData.Score, null, 2)}
\`\`\`
`;
    }

    // 指导模型如何解读和使用这些数据
    carbonFlowContext += `
### 模型解读指南
1. 基于上述数据分析当前碳足迹评估的完成度
2. 识别数据缺口并优先引导用户填补这些缺口
4. 根据《数据质量评分系统》给出的标准评估数据质量
5. 根据项目进展信息确定当前阶段，遵循该阶段的工作流程引导用户
6. 分析节点之间的关系，找出可能的优化空间

请基于当前状态为用户提供下一步行动建议，保持专业性的同时确保用户理解每一步的目的。
`;

    // 将碳足迹上下文添加到系统提示
    systemPrompt = `${systemPrompt}${carbonFlowContext}`;
    logger.info('Added complete CarbonFlow data to system prompt');
  }

  if (files && contextFiles && contextOptimization) {
    const codeContext = createFilesContext(contextFiles, true);
    const filePaths = getFilePaths(files);

    systemPrompt = `${systemPrompt}
Below are all the files present in the project:
---
${filePaths.join('\n')}
---

Below is the artifact containing the context loaded into context buffer for you to have knowledge of and might need changes to fullfill current user request.
CONTEXT BUFFER:
---
${codeContext}
---
`;

    if (summary) {
      systemPrompt = `${systemPrompt}
      below is the chat history till now
CHAT SUMMARY:
---
${props.summary}
---
`;

      if (props.messageSliceId) {
        processedMessages = processedMessages.slice(props.messageSliceId);
      } else {
        const lastMessage = processedMessages.pop();

        if (lastMessage) {
          processedMessages = [lastMessage];
        }
      }
    }
  }

  logger.info(`Sending llm call to ${provider.name} with model ${modelDetails.name}`);

  // Store original messages for reference
  const originalMessages = [...messages];
  const hasMultimodalContent = originalMessages.some((msg) => Array.isArray(msg.content));

  try {
    if (hasMultimodalContent) {
      /*
       * For multimodal content, we need to preserve the original array structure
       * but make sure the roles are valid and content items are properly formatted
       */
      const multimodalMessages = originalMessages.map((msg) => ({
        role: msg.role === 'system' || msg.role === 'user' || msg.role === 'assistant' ? msg.role : 'user',
        content: Array.isArray(msg.content)
          ? msg.content.map((item) => {
              // Ensure each content item has the correct format
              if (typeof item === 'string') {
                return { type: 'text', text: item };
              }

              if (item && typeof item === 'object') {
                if (item.type === 'image' && item.image) {
                  return { type: 'image', image: item.image };
                }

                if (item.type === 'text') {
                  return { type: 'text', text: item.text || '' };
                }
              }

              // Default fallback for unknown formats
              return { type: 'text', text: String(item || '') };
            })
          : [{ type: 'text', text: typeof msg.content === 'string' ? msg.content : String(msg.content || '') }],
      }));

      const result = await _streamText({
        model: provider.getModelInstance({
          model: modelDetails.name,
          serverEnv,
          apiKeys,
          providerSettings,
        }),
        system: systemPrompt,
        maxTokens: dynamicMaxTokens,
        messages: multimodalMessages as any,
        ...options,
      });

      // 检测并处理 boltAction
      const boltAction = extractBoltAction(await result.text);
      if (boltAction) {
        if (boltAction.type === 'parseFile' && boltAction.file) {
          // 获取文件信息
          const fileInfo = await processFile(boltAction.file);
          // 使用LLM解析文件
          const parseResult = await processFileWithLLM(fileInfo);
          
          // 返回原始LLM回复和解析结果
          return {
            ...result,
            text: `${await result.text}\n\n文件解析结果：\n${JSON.stringify(parseResult, null, 2)}`
          };
        }
      }

      return result;
    } else {
      const normalizedTextMessages = processedMessages.map((msg) => ({
        role: msg.role === 'system' || msg.role === 'user' || msg.role === 'assistant' ? msg.role : 'user',
        content: typeof msg.content === 'string' ? msg.content : String(msg.content || ''),
      }));

      const result = await _streamText({
        model: provider.getModelInstance({
          model: modelDetails.name,
          serverEnv,
          apiKeys,
          providerSettings,
        }),
        system: systemPrompt,
        maxTokens: dynamicMaxTokens,
        messages: convertToCoreMessages(normalizedTextMessages),
        ...options,
      });

      // 检测并处理 boltAction
      const boltAction = extractBoltAction(await result.text);
      if (boltAction) {
        if (boltAction.type === 'parseFile' && boltAction.file) {
          // 获取文件信息
          const fileInfo = await processFile(boltAction.file);
          // 使用LLM解析文件
          const parseResult = await processFileWithLLM(fileInfo);
          
          // 返回原始LLM回复和解析结果
          return {
            ...result,
            text: `${await result.text}\n\n文件解析结果：\n${JSON.stringify(parseResult, null, 2)}`
          };
        }
      }

      return result;
    }
  } catch (error: any) {
    // Special handling for format errors
    if (error.message && error.message.includes('messages must be an array of CoreMessage or UIMessage')) {
      logger.warn('Message format error detected, attempting recovery with explicit formatting...');

      // Create properly formatted messages for all cases as a last resort
      const fallbackMessages = processedMessages.map((msg) => {
        // Determine text content with careful type handling
        let textContent = '';

        if (typeof msg.content === 'string') {
          textContent = msg.content;
        } else if (Array.isArray(msg.content)) {
          // Handle array content safely
          const contentArray = msg.content as any[];
          textContent = contentArray
            .map((contentItem) =>
              typeof contentItem === 'string'
                ? contentItem
                : contentItem?.text || contentItem?.image || String(contentItem || ''),
            )
            .join(' ');
        } else {
          textContent = String(msg.content || '');
        }

        return {
          role: msg.role === 'system' || msg.role === 'user' || msg.role === 'assistant' ? msg.role : 'user',
          content: [
            {
              type: 'text',
              text: textContent,
            },
          ],
        };
      });

      // Try one more time with the fallback format
      return await _streamText({
        model: provider.getModelInstance({
          model: modelDetails.name,
          serverEnv,
          apiKeys,
          providerSettings,
        }),
        system: systemPrompt,
        maxTokens: dynamicMaxTokens,
        messages: fallbackMessages as any,
        ...options,
      });
    }

    // If it's not a format error, re-throw the original error
    throw error;
  }
}
