import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export default class AliyunProvider extends BaseProvider {
  name = 'Aliyun';
  getApiKeyLink = 'https://ram.console.aliyun.com/manage/ak';
  labelForGetApiKey = '获取通义千问 API Key';

  config = {
    baseUrlKey: 'ALIYUN_API_BASE_URL',
    apiTokenKey: 'ALIYUN_API_KEY',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  };

  staticModels: ModelInfo[] = [
    { 
      name: 'qwen-turbo', 
      label: '通义千问 Turbo', 
      provider: 'Aliyun', 
      maxTokenAllowed: 6000 
    },
    { 
      name: 'qwen-plus', 
      label: '通义千问 Plus', 
      provider: 'Aliyun', 
      maxTokenAllowed: 6000 
    },
    { 
      name: 'qwen-max', 
      label: '通义千问 Max', 
      provider: 'Aliyun', 
      maxTokenAllowed: 6000 
    },
    { 
      name: 'qwen-max-longcontext', 
      label: '通义千问 Max 长文本版', 
      provider: 'Aliyun', 
      maxTokenAllowed: 28000 
    }
  ];

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: 'ALIYUN_API_BASE_URL',
      defaultApiTokenKey: 'ALIYUN_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    // 使用OpenAI兼容模式
    const openai = createOpenAI({
      baseURL: baseUrl || this.config.baseUrl,
      apiKey,
    });

    return openai(model);
  }
} 