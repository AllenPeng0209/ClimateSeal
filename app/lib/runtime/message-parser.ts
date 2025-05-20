import type {
  ActionType,
  BoltAction,
  BoltActionData,
  FileAction,
  ShellAction,
  SupabaseAction,
  CarbonFlowAction,
} from '~/types/actions';
import type { BoltArtifactData } from '~/types/artifact';
import type { NodeData } from '~/types/nodes';
import { createScopedLogger } from '~/utils/logger';
import { unreachable } from '~/utils/unreachable';

// Type predicate to ensure the action is a FileAction with a filePath
function isActualFileAction(action: BoltActionData): action is FileAction {
  return action.type === 'file' && typeof (action as FileAction).filePath === 'string';
}

const ARTIFACT_TAG_OPEN = '<boltArtifact';
const ARTIFACT_TAG_CLOSE = '</boltArtifact>';
const ARTIFACT_ACTION_TAG_OPEN = '<boltAction';
const ARTIFACT_ACTION_TAG_CLOSE = '</boltAction>';

const logger = createScopedLogger('MessageParser');

export interface ArtifactCallbackData extends BoltArtifactData {
  messageId: string;
}

export interface ActionCallbackData {
  artifactId: string;
  messageId: string;
  actionId: string;
  action: BoltAction;
}

export type ArtifactCallback = (data: ArtifactCallbackData) => void;
export type ActionCallback = (data: ActionCallbackData) => void;

export interface ParserCallbacks {
  onArtifactOpen?: ArtifactCallback;
  onArtifactClose?: ArtifactCallback;
  onActionOpen?: ActionCallback;
  onActionStream?: ActionCallback;
  onActionClose?: ActionCallback;
}

interface ElementFactoryProps {
  messageId: string;
}

type ElementFactory = (props: ElementFactoryProps) => string;

export interface StreamingMessageParserOptions {
  callbacks?: ParserCallbacks;
  artifactElement?: ElementFactory;
}

interface MessageState {
  position: number;
  insideArtifact: boolean;
  insideAction: boolean;
  currentArtifact?: BoltArtifactData;
  currentAction: BoltActionData;
  actionId: number;
}

function cleanoutMarkdownSyntax(content: string) {
  const codeBlockRegex = /^\s*```\w*\n([\s\S]*?)\n\s*```\s*$/;
  const match = content.match(codeBlockRegex);

  // console.log('matching', !!match, content);

  if (match) {
    return match[1]; // Remove common leading 4-space indent
  } else {
    return content;
  }
}

function cleanEscapedTags(content: string) {
  return content.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

// 定义 CarbonFlow 操作类型
interface CarbonFlowOperation {
  type: 'carbonflow';
  operation: string;
  data: any;
}

export class StreamingMessageParser {
  #messages = new Map<string, MessageState>();

  constructor(private _options: StreamingMessageParserOptions = {}) {}

  parse(messageId: string, input: string) {
    let state = this.#messages.get(messageId);

    if (!state) {
      state = {
        position: 0,
        insideAction: false,
        insideArtifact: false,
        currentAction: { type: 'llm', content: '' }, // Assign a default ActionType
        actionId: 0,
      };

      this.#messages.set(messageId, state);
    }

    let output = '';
    let i = state.position;
    let earlyBreak = false;

    while (i < input.length) {
      if (state.insideArtifact) {
        const currentArtifact = state.currentArtifact;

        if (currentArtifact === undefined) {
          unreachable('Artifact not initialized');
        }

        if (state.insideAction) {
          const closeIndex = input.indexOf(ARTIFACT_ACTION_TAG_CLOSE, i);

          const currentAction = state.currentAction;

          if (closeIndex !== -1) {
            currentAction.content += input.slice(i, closeIndex);

            let content = currentAction.content.trim();

            if (isActualFileAction(currentAction)) {
              // currentAction is narrowed to FileAction here by the type predicate.
              // Create a new const with the narrowed type for clarity and to help the compiler.
              const action: FileAction = currentAction;
              // Remove markdown code block syntax if present and file is not markdown
              // @ts-expect-error - TypeScript struggles to correctly narrow BoltActionData to FileAction
              // in this context, despite the isActualFileAction type predicate. The predicate ensures
              // that 'action' is indeed a FileAction and 'filePath' exists and is a string.
              if (!action.filePath.endsWith('.md')) {
                content = cleanoutMarkdownSyntax(content);
                content = cleanEscapedTags(content);
              }

              content += '\n';
            }

            currentAction.content = content;

            this._options.callbacks?.onActionClose?.({
              artifactId: currentArtifact.id,
              messageId,

              /**
               * We decrement the id because it's been incremented already
               * when `onActionOpen` was emitted to make sure the ids are
               * the same.
               */
              actionId: String(state.actionId - 1),

              action: currentAction as BoltAction,
            });

            state.insideAction = false;
            state.currentAction = { type: 'llm', content: '' }; // Assign a default ActionType

            i = closeIndex + ARTIFACT_ACTION_TAG_CLOSE.length;
          } else {
            if ('type' in currentAction && currentAction.type === 'file') {
              const fileAction = currentAction as FileAction;
              let content = input.slice(i);

              if (!fileAction.filePath.endsWith('.md')) {
                content = cleanoutMarkdownSyntax(content);
                content = cleanEscapedTags(content);
              }

              this._options.callbacks?.onActionStream?.({
                artifactId: currentArtifact.id,
                messageId,
                actionId: String(state.actionId - 1),
                action: {
                  ...(currentAction as FileAction),
                  content,
                  filePath: currentAction.filePath,
                },
              });
            }

            break;
          }
        } else {
          const actionOpenIndex = input.indexOf(ARTIFACT_ACTION_TAG_OPEN, i);
          const artifactCloseIndex = input.indexOf(ARTIFACT_TAG_CLOSE, i);

          if (actionOpenIndex !== -1 && (artifactCloseIndex === -1 || actionOpenIndex < artifactCloseIndex)) {
            const actionEndIndex = input.indexOf('>', actionOpenIndex);

            if (actionEndIndex !== -1) {
              state.insideAction = true;

              state.currentAction = this.#parseActionTag(input, actionOpenIndex, actionEndIndex);

              this._options.callbacks?.onActionOpen?.({
                artifactId: currentArtifact.id,
                messageId,
                actionId: String(state.actionId++),
                action: state.currentAction as BoltAction,
              });

              i = actionEndIndex + 1;
            } else {
              break;
            }
          } else if (artifactCloseIndex !== -1) {
            this._options.callbacks?.onArtifactClose?.({ messageId, ...currentArtifact });

            state.insideArtifact = false;
            state.currentArtifact = undefined;

            i = artifactCloseIndex + ARTIFACT_TAG_CLOSE.length;
          } else {
            break;
          }
        }
      } else if (input[i] === '<' && input[i + 1] !== '/') {
        let j = i;
        let potentialTag = '';

        while (j < input.length && potentialTag.length < ARTIFACT_TAG_OPEN.length) {
          potentialTag += input[j];

          if (potentialTag === ARTIFACT_TAG_OPEN) {
            const nextChar = input[j + 1];

            if (nextChar && nextChar !== '>' && nextChar !== ' ') {
              output += input.slice(i, j + 1);
              i = j + 1;
              break;
            }

            const openTagEnd = input.indexOf('>', j);

            if (openTagEnd !== -1) {
              const artifactTag = input.slice(i, openTagEnd + 1);

              const artifactTitle = this.#extractAttribute(artifactTag, 'title') as string;
              const type = this.#extractAttribute(artifactTag, 'type') as string;
              const artifactId = this.#extractAttribute(artifactTag, 'id') as string;

              if (!artifactTitle) {
                logger.warn('Artifact title missing');
              }

              if (!artifactId) {
                logger.warn('Artifact id missing');
              }

              state.insideArtifact = true;

              const currentArtifact = {
                id: artifactId,
                title: artifactTitle,
                type,
              } satisfies BoltArtifactData;

              state.currentArtifact = currentArtifact;

              this._options.callbacks?.onArtifactOpen?.({ messageId, ...currentArtifact });

              const artifactFactory = this._options.artifactElement ?? createArtifactElement;

              output += artifactFactory({ messageId });

              i = openTagEnd + 1;
            } else {
              earlyBreak = true;
            }

            break;
          } else if (!ARTIFACT_TAG_OPEN.startsWith(potentialTag)) {
            output += input.slice(i, j + 1);
            i = j + 1;
            break;
          }

          j++;
        }

        if (j === input.length && ARTIFACT_TAG_OPEN.startsWith(potentialTag)) {
          break;
        }
      } else {
        output += input[i];
        i++;
      }

      if (earlyBreak) {
        break;
      }
    }

    state.position = i;

    return output;
  }
  
    reset() {
      this.#messages.clear();
    }
    
  #parseActionTag(input: string, actionOpenIndex: number, actionEndIndex: number) {
    const actionTag = input.slice(actionOpenIndex, actionEndIndex + 1);

    const actionType = this.#extractAttribute(actionTag, 'type') as ActionType;

    const actionAttributes = {
      type: actionType,
      content: '',
    };

    if (actionType === 'supabase') {
      const operation = this.#extractAttribute(actionTag, 'operation');

      if (!operation || !['migration', 'query'].includes(operation)) {
        logger.warn(`Invalid or missing operation for Supabase action: ${operation}`);
        throw new Error(`Invalid Supabase operation: ${operation}`);
      }

      (actionAttributes as SupabaseAction).operation = operation as 'migration' | 'query';

      if (operation === 'migration') {
        const filePath = this.#extractAttribute(actionTag, 'filePath');

        if (!filePath) {
          logger.warn('Migration requires a filePath');
          throw new Error('Migration requires a filePath');
        }

        (actionAttributes as SupabaseAction).filePath = filePath;
      }
    } else if (actionType === 'file') {
      const filePath = this.#extractAttribute(actionTag, 'filePath') as string;

      if (!filePath) {
        logger.debug('File path not specified');
      }

      (actionAttributes as FileAction).filePath = filePath;
    } else if (actionType === 'carbonflow') {
      const operation = this.#extractAttribute(actionTag, 'operation');

        // 添加更详细的日志，记录完整的 tag 内容
        console.log(`[PARSER_CARBONFLOW] 开始解析CarbonFlow操作: ${operation}`, {
          tag: actionTag,
          tagLength: actionTag.length,
        });
  
        if (
          !operation ||
          !['create', 'update', 'delete', 'query', 'connect', 'layout', 'calculate', 'plan'].includes(operation)
        ) {
          logger.warn(`Invalid or missing operation for CarbonFlow action: ${operation}`);
          throw new Error(`Invalid CarbonFlow operation: ${operation}`);
        }
  
        (actionAttributes as CarbonFlowAction).operation = operation as
          | 'create'
          | 'update'
          | 'delete'
          | 'query'
          | 'connect'
          | 'layout'
          | 'calculate'
          | 'plan'
          ;
  
        // 使用 #parseCarbonFlowOperation 方法解析操作
        const carbonFlowOperation = this.#parseCarbonFlowOperation(actionTag);
  
      if (carbonFlowOperation) {
        // 根据操作类型提取不同属性
        if (operation === 'plan') { 
          const data = this.#extractAttribute(actionTag, 'data');

          console.log(`[PARSER_CARBONFLOW_PLAN] 解析到计划操作:`, {
            data: carbonFlowOperation.data,
          });
          
          (actionAttributes as CarbonFlowAction).data = carbonFlowOperation.data;
        } else if (operation === 'create') {
          const position = this.#extractAttribute(actionTag, 'position');
          
          const nodeType = this.#extractAttribute(actionTag, 'nodeType');
          
          (actionAttributes as CarbonFlowAction).nodeType = nodeType;
          (actionAttributes as CarbonFlowAction).position = position;
          (actionAttributes as CarbonFlowAction).data = carbonFlowOperation.data;

          // 添加日志，记录create操作的关键属性
          console.log(`[PARSER_CARBONFLOW_CREATE] 解析到添加节点操作:`, {
            position: position || '未指定',
            dataLength: JSON.stringify(carbonFlowOperation.data).length,
          });
        } else if (operation === 'update') {
          const nodeId = this.#extractAttribute(actionTag, 'nodeId');
          if (!nodeId) {
            logger.warn('Node ID required for update operation');
            throw new Error('Node ID required for update operation');
          }

          (actionAttributes as CarbonFlowAction).nodeId = nodeId;
          (actionAttributes as CarbonFlowAction).data = carbonFlowOperation.data;

          // 添加日志，记录update操作的关键属性
          console.log(`[PARSER_CARBONFLOW_UPDATE] 解析到更新节点操作:`, {
            nodeId,
          });
        } else if (operation === 'delete' || operation === 'query') {
          const nodeId = this.#extractAttribute(actionTag, 'nodeId');
          // 如果nodeId不存在，尝试使用nodeName作为替代
          const nodeName = !nodeId ? this.#extractAttribute(actionTag, 'nodeName') : undefined;

          if (!nodeId && !nodeName) {
            logger.warn(`Node ID required for ${operation} operation`);
            throw new Error(`Node ID required for ${operation} operation`);
          }

          // 使用nodeId或nodeName
          (actionAttributes as CarbonFlowAction).nodeId = nodeId || nodeName;
          (actionAttributes as CarbonFlowAction).data = carbonFlowOperation.data;

          // 添加日志，记录操作的关键属性
          console.log(`[PARSER_CARBONFLOW_${operation.toUpperCase()}] 解析到${operation}操作:`, {
            nodeId: nodeId || nodeName,
            source: nodeName ? '来自nodeName属性' : '来自nodeId属性',
          });
        } else if (operation === 'connect') {
          const source = this.#extractAttribute(actionTag, 'source');
          const target = this.#extractAttribute(actionTag, 'target');

          if (!source || !target) {
            logger.warn('Source and target required for connect operation');
            throw new Error('Source and target required for connect operation');
          }

          (actionAttributes as CarbonFlowAction).data = carbonFlowOperation.data;

          // 添加日志，记录connect操作的关键属性
          console.log(`[PARSER_CARBONFLOW_CONNECT] 解析到连接节点操作:`, {
            source,
            target,
          });
        } else if (operation === 'layout') {
          // 布局操作不需要额外属性
          (actionAttributes as CarbonFlowAction).data = carbonFlowOperation.data;

          console.log(`[PARSER_CARBONFLOW_LAYOUT] 解析到布局操作`);
        } else if (operation === 'calculate') {
          const target = this.#extractAttribute(actionTag, 'target');
          if (target) {
            (actionAttributes as CarbonFlowAction).target = target;
          }

          (actionAttributes as CarbonFlowAction).data = carbonFlowOperation.data;

          // 添加日志，记录calculate操作的关键属性
          console.log(`[PARSER_CARBONFLOW_CALCULATE] 解析到计算操作:`, {
            target: target || '未指定目标',
          });
        }
      } else {
        // 如果解析失败，设置默认的空数据
        (actionAttributes as CarbonFlowAction).data = JSON.stringify({});
        console.log(`[PARSER_CARBONFLOW_WARNING] CarbonFlow操作解析失败，使用默认空数据`);
      }

      // 最后记录完整的解析结果
      console.log(`[PARSER_CARBONFLOW_RESULT] CarbonFlow操作解析完成:`, actionAttributes);
    } else if (!['shell', 'start'].includes(actionType)) {
      logger.warn(`Unknown action type '${actionType}'`);
    }

    return actionAttributes as FileAction | ShellAction | CarbonFlowAction;
  }

  #extractAttribute(tag: string, attributeName: string): string | undefined {
    // 修改正则表达式，同时匹配单引号和双引号包裹的属性值，并处理多行内容
    const regex = new RegExp(`${attributeName}=["']([\\s\\S]*?)["'](?=\\s|>)`, 'i');
    const match = tag.match(regex);
    let result = match ? match[1] : undefined;

    // 为CarbonFlow操作添加额外的属性提取日志
    if (tag.includes('type="carbonflow"')) {
      // 清理和规范化结果
      if (result) {
        // 移除多余的空白字符
        result = result.replace(/\s+/g, ' ').trim();
        
        // 如果是JSON格式的字符串，尝试解析和重新格式化
        if (result.startsWith('{') || result.startsWith('[')) {
          try {
            const parsed = JSON.parse(result);
            result = JSON.stringify(parsed);
          } catch (e) {
            // 如果解析失败，保持原始值
            console.log(`[PARSER_ATTR_WARNING] 无法解析JSON格式的属性 ${attributeName}`);
          }
        }
      }

      console.log(`[PARSER_ATTR] 提取属性 ${attributeName}:`, {
        value: result ? result.substring(0, 50) + (result.length > 50 ? '...' : '') : 'undefined',
        length: result ? result.length : 0,
        hasHtmlComment: result ? result.includes('<!--') || result.includes('-->') : false,
      });

      // 如果属性值中包含HTML注释，记录警告
      if (result && (result.includes('<!--') || result.includes('-->'))) {
        console.log(`[PARSER_ATTR_WARNING] 属性 ${attributeName} 包含HTML注释，可能导致解析问题`);
      }
    }

    return result;
  }

  #parseCarbonFlowOperation(actionTag: string): CarbonFlowAction | null {
    logger.debug('[CarbonFlowParser] Entering #parseCarbonFlowOperation with actionTag:', actionTag);
    try {
      // 提取必需的属性
      const operation = this.#extractAttribute(actionTag, 'operation');
      if (!operation) {
        logger.warn('Missing operation in CarbonFlow action');
        return null;
      }

      // 验证操作类型
      const validOperations = ['create', 'update', 'delete', 'query', 'connect', 'layout', 'calculate', 'plan'];
      if (!validOperations.includes(operation)) {
        logger.warn(`Invalid operation type: ${operation}`);
        return null;
      }

      // 提取其他属性
      const nodeId = this.#extractAttribute(actionTag, 'nodeId');
      const position = this.#extractAttribute(actionTag, 'position');
      const target = this.#extractAttribute(actionTag, 'target');
      const description = this.#extractAttribute(actionTag, 'description');
      const source = this.#extractAttribute(actionTag, 'source');

      // 记录提取的属性
      logger.info('Extracted CarbonFlow attributes', {
        operation,
        nodeId,
        position,
        target,
        description,
        source
      });

      // 提取并解析数据
      let data: string | undefined;
      const dataRegex = /data=(['"])([\s\S]*)\1/i; // 贪婪匹配data属性内容
      const dataMatch = actionTag.match(dataRegex);
      if (dataMatch && dataMatch[2]) {
        data = dataMatch[2];
        logger.debug('[CarbonFlowParser] Raw data string extracted:', data ? data.substring(0, 200) + (data.length > 200 ? '...' : '') : 'undefined');
        logger.info('Custom greedy data extraction in #parseCarbonFlowOperation succeeded.', { dataLength: data.length, preview: data.substring(0,100) });
      } else {
        logger.warn('Custom greedy data extraction for data attribute failed in #parseCarbonFlowOperation. Check tag format.');
      }
      let parsedData = '{}';

      if (data) {
        try {
          // 如果data已经是对象，直接使用
          if (typeof data === 'object') {
            parsedData = JSON.stringify(data);
          } else {
            // 清理数据字符串
            data = data
              .replace(/<!--[\s\S]*?-->/g, '') // 移除HTML注释
              .replace(/\s+/g, ' ') // 规范化空白字符
              .trim();

            // 尝试解析数据
            const parsed = JSON.parse(data);
            parsedData = JSON.stringify(parsed);
            
            logger.debug('[CarbonFlowParser] Successfully parsed data to JSON string:', parsedData ? parsedData.substring(0, 200) + (parsedData.length > 200 ? '...' : '') : 'undefined');
            logger.info('Successfully parsed CarbonFlow data', {
              dataLength: data.length,
              parsedDataLength: parsedData.length
            });
          }
        } catch (error) {
          logger.debug('[CarbonFlowParser] Data string before failed JSON parse:', typeof data === 'string' ? data.substring(0, 100) + (data.length > 100 ? '...' : '') : 'Non-string data or undefined');
          logger.warn('Failed to parse CarbonFlow data as JSON, using empty object', { 
            error,
            dataPreview: typeof data === 'string' ? data.substring(0, 100) + (data.length > 100 ? '...' : '') : '非字符串数据'
          });
        }
      } else {
        logger.debug('[CarbonFlowParser] No "data" attribute found or data string was empty.');
        logger.info('No data attribute found in CarbonFlow action');
      }

      // 构建 CarbonFlow 操作对象
      const carbonFlowAction: CarbonFlowAction = {
        type: 'carbonflow',
        operation: operation as CarbonFlowAction['operation'],
        content: '', // 保持 content 字段为空字符串
        data: parsedData, // 将解析后的数据存储在 data 字段中
      };

      // 添加可选属性
      if (nodeId) carbonFlowAction.nodeId = nodeId;
      if (position) {
        try {
          // 尝试解析position为JSON对象
          const positionObj = JSON.parse(position);
          carbonFlowAction.position = JSON.stringify(positionObj);
        } catch (e) {
          // 如果解析失败，直接使用原始字符串
          carbonFlowAction.position = position;
        }
      }
      if (target) carbonFlowAction.target = target;
      if (description) carbonFlowAction.description = description;
      if (source) carbonFlowAction.source = source;

      logger.debug('[CarbonFlowParser] Constructed CarbonFlowAction object:', carbonFlowAction);
      logger.info('Successfully parsed CarbonFlow operation', { 
        operation,
        hasNodeId: !!nodeId,
        hasPosition: !!position,
        hasTarget: !!target,
        hasDescription: !!description,
        hasSource: !!source,
        dataLength: parsedData.length
      });

      return carbonFlowAction;
    } catch (error) {
      logger.error('Error parsing CarbonFlow operation', { error });
      return null;
    }
  }
}

const createArtifactElement: ElementFactory = (props) => {
  const elementProps = [
    'class="__boltArtifact__"',
    ...Object.entries(props).map(([key, value]) => {
      return `data-${camelToDashCase(key)}=${JSON.stringify(value)}`;
    }),
  ];

  return `<div ${elementProps.join(' ')}></div>`;
};

function camelToDashCase(input: string) {
  return input.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
