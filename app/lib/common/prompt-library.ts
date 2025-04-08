import { getSystemPrompt } from './prompts/prompts';
import { getSystemPromptCarbon } from './prompts/prompts_carbon';
import { getSystemPromptCarbonChinese } from './prompts/prompts_carbon_chinese';
import optimized from './prompts/optimized';

export interface PromptOptions {
  cwd: string;
  allowedHtmlElements: string[];
  modificationTagName: string;
  supabase?: {
    isConnected: boolean;
    hasSelectedProject: boolean;
    credentials?: {
      anonKey?: string;
      supabaseUrl?: string;
    };
  };
}

export class PromptLibrary {
  static library: Record<
    string,
    {
      label: string;
      description: string;
      get: (options: PromptOptions) => string;
    }
  > = {
    default_old: {
      label: '默认提示词',
      description: '这是经过验证的默认系统提示词',
      get: (options) => getSystemPrompt(options.cwd, options.supabase),
    },
    
    default_chinese: {
      label: '碳足迹量化提示词',
      description: '专门用于碳足迹量化评估的系统提示词',
      get: (options) => getSystemPromptCarbon(options.cwd, options.supabase),

    },
    default: {
      label: '碳足迹量化提示词',
      description: '专门用于碳足迹量化评估的系统提示词',
      get: (options) => getSystemPromptCarbonChinese(options.cwd, options.supabase),

    },

    optimized: {
      label: '优化提示词（实验性）',
      description: '一个实验性的提示词版本，用于降低 token 使用量',
      get: (options) => optimized(options),
    },
  };
  static getList() {
    return Object.entries(this.library).map(([key, value]) => {
      const { label, description } = value;
      return {
        id: key,
        label,
        description,
      };
    });
  }
  static getPropmtFromLibrary(promptId: string, options: PromptOptions) {
    const prompt = this.library[promptId];

    if (!prompt) {
      throw '未找到提示词';
    }

    return this.library[promptId]?.get(options);
  }
}
