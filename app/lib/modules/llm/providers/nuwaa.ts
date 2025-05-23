import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('NuwaaProvider');

interface NuwaaApiModel {
  id: string;
  context_window?: number; 
  max_tokens?: number; 
  [key: string]: any;
}

interface NuwaaApiModelsResponse {
  data: NuwaaApiModel[];
  object?: string;
}

export default class NuwaaProvider extends BaseProvider {
  name = 'Nuwaa';
  getApiKeyLink = '';

  config = {
    baseUrlKey: 'NUWAA_API_BASE_URL',
    apiTokenKey: 'NUWAA_API_KEY',
    baseUrl: 'https://api.nuwaapi.com',
  };

  staticModels: ModelInfo[] = [
    { name: 'deepseek-r1', label: 'DeepSeek R1 (Static)', provider: 'Nuwaa', maxTokenAllowed: 8000 },
    { name: 'deepseek-v3', label: 'DeepSeek V3 (Static)', provider: 'Nuwaa', maxTokenAllowed: 8000 },
    { name: 'deepseek-chat', label: 'DeepSeek Chat (Static)', provider: 'Nuwaa', maxTokenAllowed: 16384 },
    { name: 'gpt-4-1106-preview', label: 'GPT-4 1106 Preview (Static)', provider: 'Nuwaa', maxTokenAllowed: 128000 },
    { name: 'gpt-4', label: 'GPT-4 (Static)', provider: 'Nuwaa', maxTokenAllowed: 8000 },
    { name: 'gpt-4-0613', label: 'GPT-4 0613 (Static)', provider: 'Nuwaa', maxTokenAllowed: 8000 },
    { name: 'gpt-4-turbo-2024-04-09', label: 'GPT-4 Turbo 2024-04-09 (Static)', provider: 'Nuwaa', maxTokenAllowed: 128000 },
    { name: 'gpt-4-32k', label: 'GPT-4 32k (Static)', provider: 'Nuwaa', maxTokenAllowed: 32000 },
    { name: 'gpt-4-0125-preview', label: 'GPT-4 0125 Preview (Static)', provider: 'Nuwaa', maxTokenAllowed: 128000 },
    { name: 'gpt-4o', label: 'GPT-4o (Static)', provider: 'Nuwaa', maxTokenAllowed: 128000 },
    { name: 'gpt-4o-mini', label: 'GPT-4o Mini (Static)', provider: 'Nuwaa', maxTokenAllowed: 128000 },
    { name: 'text-embedding-ada-002', label: 'Text Embedding Ada 002 (Static)', provider: 'Nuwaa', maxTokenAllowed: 8191 },
    { name: 'text-embedding-3-large', label: 'Text Embedding 3 Large (Static)', provider: 'Nuwaa', maxTokenAllowed: 8191 },
    { name: 'text-embedding-3-small', label: 'Text Embedding 3 Small (Static)', provider: 'Nuwaa', maxTokenAllowed: 8191 },
    { name: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Static)', provider: 'Nuwaa', maxTokenAllowed: 16385 },
    { name: 'gpt-3.5-turbo-0301', label: 'GPT-3.5 Turbo 0301 (Static)', provider: 'Nuwaa', maxTokenAllowed: 4000 },
    { name: 'gpt-3.5-turbo-0613', label: 'GPT-3.5 Turbo 0613 (Static)', provider: 'Nuwaa', maxTokenAllowed: 4000 },
    { name: 'gpt-3.5-turbo-0125', label: 'GPT-3.5 Turbo 0125 (Static)', provider: 'Nuwaa', maxTokenAllowed: 16385 },
    { name: 'gpt-3.5-turbo-16k', label: 'GPT-3.5 Turbo 16k (Static)', provider: 'Nuwaa', maxTokenAllowed: 16385 },
    { name: 'gpt-3.5-turbo-1106', label: 'GPT-3.5 Turbo 1106 (Static)', provider: 'Nuwaa', maxTokenAllowed: 16385 },
    { name: 'gpt-3.5-turbo-16k-0613', label: 'GPT-3.5 Turbo 16k 0613 (Static)', provider: 'Nuwaa', maxTokenAllowed: 16385 },
    { name: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet 20240229 (Static)', provider: 'Nuwaa', maxTokenAllowed: 200000 },
    { name: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku 20240307 (Static)', provider: 'Nuwaa', maxTokenAllowed: 200000 },
    { name: 'claude-3-opus-20240229', label: 'Claude 3 Opus 20240229 (Static)', provider: 'Nuwaa', maxTokenAllowed: 200000 },
    { name: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet 20240620 (Static)', provider: 'Nuwaa', maxTokenAllowed: 200000 },
    { name: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku 20241022 (Static)', provider: 'Nuwaa', maxTokenAllowed: 200000 },
    { name: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet 20241022 (Static)', provider: 'Nuwaa', maxTokenAllowed: 200000 },
    { name: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Static)', provider: 'Nuwaa', maxTokenAllowed: 1048576 },
    { name: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Static)', provider: 'Nuwaa', maxTokenAllowed: 1048576 },
    { name: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Static)', provider: 'Nuwaa', maxTokenAllowed: 8192 },
    { name: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash Exp (Static)', provider: 'Nuwaa', maxTokenAllowed: 8192 },
    { name: 'gemini-2.0-flash-thinking-exp', label: 'Gemini 2.0 Flash Thinking Exp (Static)', provider: 'Nuwaa', maxTokenAllowed: 65536 },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    const { apiKey, baseUrl } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: this.config.baseUrlKey,
      defaultApiTokenKey: this.config.apiTokenKey,
    });

    if (!apiKey) {
      logger.warn(`API key for ${this.name} is not configured. Skipping dynamic model fetching.`);
      return [];
    }

    const modelsApiUrl = `${baseUrl || this.config.baseUrl}/v1/models`;

    try {
      const response = await fetch(modelsApiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error(`Failed to fetch dynamic models from ${this.name}: ${response.status} ${response.statusText}`, errorBody);
        return [];
      }

      const result = (await response.json()) as NuwaaApiModelsResponse;

      if (!result.data || !Array.isArray(result.data)) {
        logger.error(`Invalid response structure from ${this.name} models API. Expected a 'data' array.`, result);
        return [];
      }
      
      return result.data.map((modelApi): ModelInfo => {
        const staticModelConfig = this.staticModels.find(sm => sm.name === modelApi.id);
        let maxTokenAllowed = 8000;

        if (staticModelConfig?.maxTokenAllowed) {
          maxTokenAllowed = staticModelConfig.maxTokenAllowed;
        } else if (modelApi.context_window) {
          maxTokenAllowed = modelApi.context_window;
        } else if (modelApi.max_tokens) { 
          maxTokenAllowed = modelApi.max_tokens;
        }

        return {
          name: modelApi.id,
          label: `${modelApi.id} (Nuwaa)`,
          provider: this.name,
          maxTokenAllowed: maxTokenAllowed,
        };
      }).sort((a, b) => a.label.localeCompare(b.label));

    } catch (error) {
      logger.error(`Error fetching or parsing dynamic models from ${this.name}:`, error);
      return [];
    }
  }

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey, baseUrl: configuredBaseUrl } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: this.config.baseUrlKey,
      defaultApiTokenKey: this.config.apiTokenKey,
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    let finalBaseUrl = configuredBaseUrl || this.config.baseUrl;
    if (finalBaseUrl && !finalBaseUrl.endsWith('/v1') && !finalBaseUrl.includes('/v1/')) {
        finalBaseUrl = finalBaseUrl.replace(/\/?$/, '/v1'); 
    }
    
    const nuwaaAI = createOpenAI({
      baseURL: finalBaseUrl,
      apiKey,
    });

    return nuwaaAI(model);
  }
} 