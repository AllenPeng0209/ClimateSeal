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

    file_upload: {
      label: '文件上传场景提示词',
      description: '当用户上传文件后使用的系统提示词，帮助模型理解文件内容并指导下一步操作',
      get: (options) => {
        const basePrompt = getSystemPromptCarbonChinese(options.cwd, options.supabase);
        return `
${basePrompt}

### 上下文说明
用户刚刚上传了一个数据文件，系统已解析其内容。请利用以下原则与用户互动：
1. 首先向用户确认文件类型与关键内容是否正确。
2. 根据文件所含信息（如BOM、能耗或分销数据），提出继续完善碳足迹模型的具体建议。
3. 若需要更多信息以完成模型，请以简洁的问题引导用户补充。
4. 回答尽量具体、专业，并体现出对碳足迹评估流程的理解。`;
      },
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
