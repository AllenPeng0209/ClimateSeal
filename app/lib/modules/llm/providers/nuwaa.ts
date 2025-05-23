import { BaseProvider, getOpenAILikeModel } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai'; // 假设 Nuwaa API 与 OpenAI API 兼容

export default class NuwaaProvider extends BaseProvider {
  name = 'Nuwaa'; // 服务商名称
  getApiKeyLink = ''; // 如果有获取 API Key 的链接，可以填在这里

  config = {
    baseUrlKey: 'NUWAA_API_BASE_URL', // 环境变量中存储 API Base URL 的键名
    apiTokenKey: 'NUWAA_API_KEY', // 环境变量中存储 API Key 的键名
    baseUrl: 'https://api.nuwaapi.com', // API 的默认 Base URL
  };

  staticModels: ModelInfo[] = [
    // DeepSeek 系列
    { name: 'deepseek-r1', label: 'DeepSeek R1', provider: 'Nuwaa', maxTokenAllowed: 8000 },
    { name: 'deepseek-v3', label: 'DeepSeek V3', provider: 'Nuwaa', maxTokenAllowed: 8000 },
    { name: 'deepseek-chat', label: 'DeepSeek Chat', provider: 'Nuwaa', maxTokenAllowed: 16384 },

    // GPT-4 系列
    { name: 'gpt-4-1106-preview', label: 'GPT-4 1106 Preview', provider: 'Nuwaa', maxTokenAllowed: 128000 },
    { name: 'gpt-4', label: 'GPT-4', provider: 'Nuwaa', maxTokenAllowed: 8000 },
    { name: 'gpt-4-0613', label: 'GPT-4 0613', provider: 'Nuwaa', maxTokenAllowed: 8000 },
    { name: 'gpt-4-turbo-2024-04-09', label: 'GPT-4 Turbo 2024-04-09', provider: 'Nuwaa', maxTokenAllowed: 128000 },
    { name: 'gpt-4-32k', label: 'GPT-4 32k', provider: 'Nuwaa', maxTokenAllowed: 32000 },
    { name: 'gpt-4-0125-preview', label: 'GPT-4 0125 Preview', provider: 'Nuwaa', maxTokenAllowed: 128000 },
    { name: 'gpt-4o', label: 'GPT-4o', provider: 'Nuwaa', maxTokenAllowed: 128000 },
    { name: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'Nuwaa', maxTokenAllowed: 128000 },
    // { name: 'o1-mini', label: 'o1 Mini', provider: 'Nuwaa', maxTokenAllowed: 8000 }, // o1 系列模型信息较少，暂用通用值
    // { name: 'o1-preview', label: 'o1 Preview', provider: 'Nuwaa', maxTokenAllowed: 8000 }, // o1 系列模型信息较少，暂用通用值
    
    // Embedding Models
    { name: 'text-embedding-ada-002', label: 'Text Embedding Ada 002', provider: 'Nuwaa', maxTokenAllowed: 8191 },
    { name: 'text-embedding-3-large', label: 'Text Embedding 3 Large', provider: 'Nuwaa', maxTokenAllowed: 8191 },
    { name: 'text-embedding-3-small', label: 'Text Embedding 3 Small', provider: 'Nuwaa', maxTokenAllowed: 8191 },

    // GPT-3.5 系列
    { name: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'Nuwaa', maxTokenAllowed: 50000 },
    { name: 'gpt-3.5-turbo-0301', label: 'GPT-3.5 Turbo 0301', provider: 'Nuwaa', maxTokenAllowed: 4000 },
    { name: 'gpt-3.5-turbo-0613', label: 'GPT-3.5 Turbo 0613', provider: 'Nuwaa', maxTokenAllowed: 4000 }, // Can be 16k with specific version, but Nuwaa lists it generally
    { name: 'gpt-3.5-turbo-0125', label: 'GPT-3.5 Turbo 0125', provider: 'Nuwaa', maxTokenAllowed: 16385 },
    { name: 'gpt-3.5-turbo-16k', label: 'GPT-3.5 Turbo 16k', provider: 'Nuwaa', maxTokenAllowed: 16385 },
    { name: 'gpt-3.5-turbo-1106', label: 'GPT-3.5 Turbo 1106', provider: 'Nuwaa', maxTokenAllowed: 16385 },
    { name: 'gpt-3.5-turbo-16k-0613', label: 'GPT-3.5 Turbo 16k 0613', provider: 'Nuwaa', maxTokenAllowed: 16385 },

    // Claude 系列
    { name: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet 20240229', provider: 'Nuwaa', maxTokenAllowed: 200000 },
    { name: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku 20240307', provider: 'Nuwaa', maxTokenAllowed: 200000 },
    { name: 'claude-3-opus-20240229', label: 'Claude 3 Opus 20240229', provider: 'Nuwaa', maxTokenAllowed: 200000 },
    { name: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet 20240620', provider: 'Nuwaa', maxTokenAllowed: 200000 },
    { name: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku 20241022', provider: 'Nuwaa', maxTokenAllowed: 200000 },
    { name: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet 20241022', provider: 'Nuwaa', maxTokenAllowed: 200000 },
    
    // Gemini 系列
    { name: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', provider: 'Nuwaa', maxTokenAllowed: 1048576 }, // 1M tokens
    { name: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', provider: 'Nuwaa', maxTokenAllowed: 1048576 }, // 1M tokens
    { name: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'Nuwaa', maxTokenAllowed: 8192 }, // Defaulting based on Bolt's Google provider for similar exp models
    { name: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash Exp', provider: 'Nuwaa', maxTokenAllowed: 8192 },
    { name: 'gemini-2.0-flash-thinking-exp', label: 'Gemini 2.0 Flash Thinking Exp', provider: 'Nuwaa', maxTokenAllowed: 65536 },
  ];

  // 如果 Nuwaa API 与 OpenAI API 兼容，可以使用下面的 getModelInstance 方法
  // 否则，您可能需要根据 Nuwaa API 的 SDK 或特性进行调整
  getModelInstance(options: {
    model: string;
    serverEnv: Env; // 通常是 process.env
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey, baseUrl: configuredBaseUrl } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: 'NUWAA_API_BASE_URL',
      defaultApiTokenKey: 'NUWAA_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    // 确保 baseUrl 包含 /v1 后缀，如果用户没有在环境变量中特别指定的话
    let finalBaseUrl = configuredBaseUrl || this.config.baseUrl;
    if (finalBaseUrl && !finalBaseUrl.endsWith('/v1') && !finalBaseUrl.includes('/v1/')) {
        finalBaseUrl = finalBaseUrl.replace(/\/?$/, '/v1'); // 追加 /v1，同时处理末尾是否有斜杠的情况
    }

    const nuwaaAI = createOpenAI({ 
      baseURL: finalBaseUrl, // 使用调整后的 baseUrl
      apiKey,
      // 我们可以尝试添加 compatibility: 'compatible'，虽然通常不需要，但某些特定实现可能受益
      // compatibility: 'compatible', 
    });

    return nuwaaAI(model);
  }
} 