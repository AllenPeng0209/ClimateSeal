import { generateText } from 'ai';
import type { FileInfo } from '../file-processor';
import { DEFAULT_MODEL, DEFAULT_PROVIDER } from '~/utils/constants';
import { LLMManager } from '~/lib/modules/llm/manager';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('file-parser');

export interface ParseResult {
  keyInfo: any;
  templateMapping: any;
  conversionParams: any;
}

export async function parseFileWithLLM(fileInfo: FileInfo): Promise<ParseResult> {
  const provider = DEFAULT_PROVIDER;
  const modelDetails = LLMManager.getInstance().getStaticModelListFromProvider(provider)
    .find(m => m.name === DEFAULT_MODEL);

  if (!modelDetails) {
    throw new Error('Model not found');
  }

  const prompt = `
    请解析以下${fileInfo.type}文件内容，提取关键信息，并映射到固定模板。
    文件名：${fileInfo.name}
    文件内容：
    ${fileInfo.content}
    
    请按以下JSON格式返回：
    {
      "keyInfo": {
        // 提取的关键信息
      },
      "templateMapping": {
        // 与模板的映射关系
      },
      "conversionParams": {
        // 转换参数（用于后续转换function）
      }
    }
  `;

  try {
    const result = await generateText({
      model: provider.getModelInstance({
        model: modelDetails.name,
      }),
      messages: [{ role: 'user', content: prompt }],
    });

    logger.info('File parsed successfully', { fileName: fileInfo.name, type: fileInfo.type });
    return JSON.parse(result.text);
  } catch (error) {
    logger.error('Failed to parse file', { error, fileName: fileInfo.name });
    throw new Error('Failed to parse file content');
  }
}

export function extractConversionParams(parseResult: ParseResult) {
  return parseResult.conversionParams;
}

export async function processFileWithLLM(fileInfo: FileInfo): Promise<{
  originalContent: string;
  parsedContent: ParseResult;
  conversionParams: any;
}> {
  const parsedContent = await parseFileWithLLM(fileInfo);
  const conversionParams = extractConversionParams(parsedContent);

  return {
    originalContent: fileInfo.content,
    parsedContent,
    conversionParams
  };
} 