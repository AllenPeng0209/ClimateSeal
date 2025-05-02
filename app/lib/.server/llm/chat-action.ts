import { createScopedLogger } from '~/utils/logger';
import { processFile } from '../services/file-processor';
import type { BoltAction } from './bolt-action';

const logger = createScopedLogger('chat-action');

export interface ChatActionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

export async function handleChatAction(action: BoltAction): Promise<ChatActionResult> {
  switch (action.type) {
    case 'file_upload':
      if (action.file) {
        try {
          const processingResult = await processFile(action.file, action.workflowId);
          return {
            success: true,
            message: processingResult.userPrompt,
            data: {
              ...processingResult,
              filePrompt: processingResult.userPrompt,
            },
          } as ChatActionResult;
        } catch (error) {
          logger.error(error);
          console.error('Failed to handle file upload:', error);
          return {
            success: false,
            error: 'Failed to process file upload'
          };
        }
      }
      return {
        success: false,
        error: 'No file provided for upload'
      } as ChatActionResult;
      
    default:
      return {
        success: false,
        error: `Unsupported action type: ${action.type}`
      };
  }
} 