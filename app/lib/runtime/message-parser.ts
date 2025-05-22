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
      const operation = this.#extractAttribute(actionTag, 'operation') as CarbonFlowAction['operation'];
      const content = this.#extractAttribute(actionTag, 'content') as string;
      (actionAttributes as CarbonFlowAction).content = content;
      (actionAttributes as CarbonFlowAction).operation = operation;

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
