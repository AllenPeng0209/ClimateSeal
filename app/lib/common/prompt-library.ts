import { getSystemPrompt } from './prompts/prompts_chinese';
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
    default: {
      label: '默认提示词',
      description: '这是经过验证的默认系统提示词',
      get: (options) => getSystemPrompt(options.cwd, options.supabase),
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
