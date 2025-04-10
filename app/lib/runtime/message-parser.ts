import type { ActionType, BoltAction, BoltActionData, FileAction, ShellAction, SupabaseAction, CarbonFlowAction } from '~/types/actions';
import type { BoltArtifactData } from '~/types/artifact';
import { createScopedLogger } from '~/utils/logger';
import { unreachable } from '~/utils/unreachable';

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
        currentAction: { content: '' },
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

            if ('type' in currentAction && currentAction.type === 'file') {
              // Remove markdown code block syntax if present and file is not markdown
              if (!currentAction.filePath.endsWith('.md')) {
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
            state.currentAction = { content: '' };

            i = closeIndex + ARTIFACT_ACTION_TAG_CLOSE.length;
          } else {
            if ('type' in currentAction && currentAction.type === 'file') {
              let content = input.slice(i);

              if (!currentAction.filePath.endsWith('.md')) {
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
      
      // 添加日志，记录CarbonFlow操作解析开始
      console.log(`[PARSER_CARBONFLOW] 开始解析CarbonFlow操作: ${operation}`, {
        tag: actionTag
      });
      
      if (!operation || !['add', 'update', 'delete', 'query', 'connect', 'layout', 'calculate'].includes(operation)) {
        logger.warn(`Invalid or missing operation for CarbonFlow action: ${operation}`);
        throw new Error(`Invalid CarbonFlow operation: ${operation}`);
      }
      
      (actionAttributes as CarbonFlowAction).operation = operation as 'add' | 'update' | 'delete' | 'query' | 'connect' | 'layout' | 'calculate';
      
      // 根据操作类型提取不同属性
      if (operation === 'add') {
        const nodeType = this.#extractAttribute(actionTag, 'nodeType');
        const position = this.#extractAttribute(actionTag, 'position');
        
        if (!nodeType) {
          logger.warn('Node type required for add operation');
          throw new Error('Node type required for add operation');
        }
        
        (actionAttributes as CarbonFlowAction).nodeType = nodeType;
        (actionAttributes as CarbonFlowAction).position = position;
        
        // 为content字段添加更详细的操作说明
        if (!actionAttributes.content || actionAttributes.content.trim() === '') {
          (actionAttributes as CarbonFlowAction).description = `Add ${nodeType} node to CarbonFlow diagram${position ? ` at position ${position}` : ''}`;
          // 不再設置content字段，這樣它將保持為空或原始JSON
        }
        
        // 添加日志，记录add操作的关键属性
        console.log(`[PARSER_CARBONFLOW_ADD] 解析到添加节点操作:`, {
          nodeType,
          position
        });
      } 
      else if (operation === 'update' || operation === 'delete' || operation === 'query') {
        const nodeId = this.#extractAttribute(actionTag, 'nodeId');
        // 如果nodeId不存在，尝试使用nodeName作为替代
        const nodeName = !nodeId ? this.#extractAttribute(actionTag, 'nodeName') : undefined;
        
        if (!nodeId && !nodeName) {
          logger.warn(`Node ID required for ${operation} operation`);
          throw new Error(`Node ID required for ${operation} operation`);
        }
        
        // 使用nodeId或nodeName
        (actionAttributes as CarbonFlowAction).nodeId = nodeId || nodeName;
        
        // 为content字段添加更详细的操作说明
        if (!actionAttributes.content || actionAttributes.content.trim() === '') {
          (actionAttributes as CarbonFlowAction).description = `CarbonFlow ${operation} operation on node ${nodeId || nodeName}`;
          // 不再設置content字段
        }
        
        // 添加日志，记录操作的关键属性
        console.log(`[PARSER_CARBONFLOW_${operation.toUpperCase()}] 解析到${operation}操作:`, {
          nodeId: nodeId || nodeName,
          source: nodeName ? '来自nodeName属性' : '来自nodeId属性'
        });
      }
      else if (operation === 'connect') {
        const source = this.#extractAttribute(actionTag, 'source');
        const target = this.#extractAttribute(actionTag, 'target');
        
        if (!source || !target) {
          logger.warn('Source and target required for connect operation');
          throw new Error('Source and target required for connect operation');
        }
        
        (actionAttributes as CarbonFlowAction).source = source;
        (actionAttributes as CarbonFlowAction).target = target;
        
        // 为content字段添加更详细的操作说明
        if (!actionAttributes.content || actionAttributes.content.trim() === '') {
          (actionAttributes as CarbonFlowAction).description = `Connect node "${source}" to "${target}"`;
          // 不再設置content字段
        }
        
        // 添加日志，记录connect操作的关键属性
        console.log(`[PARSER_CARBONFLOW_CONNECT] 解析到连接节点操作:`, {
          source,
          target
        });
      }
      else if (operation === 'layout') {
        // 布局操作不需要额外属性
        console.log(`[PARSER_CARBONFLOW_LAYOUT] 解析到布局操作`);
        
        // 为content字段添加更详细的操作说明
        if (!actionAttributes.content || actionAttributes.content.trim() === '') {
          (actionAttributes as CarbonFlowAction).description = `Arrange layout of CarbonFlow diagram`;
          // 不再設置content字段
        }
      }
      else if (operation === 'calculate') {
        const target = this.#extractAttribute(actionTag, 'target');
        if (target) {
          (actionAttributes as CarbonFlowAction).target = target;
        }
        
        // 为content字段添加更详细的操作说明
        if (!actionAttributes.content || actionAttributes.content.trim() === '') {
          (actionAttributes as CarbonFlowAction).description = target 
            ? `Calculate carbon footprint for "${target}"`
            : `Calculate carbon footprint for all nodes`;
          // 不再設置content字段
        }
        
        // 添加日志，记录calculate操作的关键属性
        console.log(`[PARSER_CARBONFLOW_CALCULATE] 解析到计算操作:`, {
          target: target || '未指定目标'
        });
      }
      
      // 最后记录完整的解析结果
      console.log(`[PARSER_CARBONFLOW_RESULT] CarbonFlow操作解析完成:`, actionAttributes);
    } else if (!['shell', 'start'].includes(actionType)) {
      logger.warn(`Unknown action type '${actionType}'`);
    }

    return actionAttributes as FileAction | ShellAction | CarbonFlowAction;
  }

  #extractAttribute(tag: string, attributeName: string): string | undefined {
    const match = tag.match(new RegExp(`${attributeName}="([^"]*)"`, 'i'));
    const result = match ? match[1] : undefined;
    
    // 为CarbonFlow操作添加额外的属性提取日志
    if (tag.includes('type="carbonflow"')) {
      console.log(`[PARSER_ATTR] 提取属性 ${attributeName}: ${result}`);
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
