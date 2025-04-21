import { useStore } from '@nanostores/react';
import { AnimatePresence, motion } from 'framer-motion';
import { computed } from 'nanostores';
import { memo, useEffect, useRef, useState } from 'react';
import { createHighlighter, type BundledLanguage, type BundledTheme, type HighlighterGeneric } from 'shiki';
import type { ActionState } from '~/lib/runtime/action-runner';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { WORK_DIR } from '~/utils/constants';

const highlighterOptions = {
  langs: ['shell'],
  themes: ['light-plus', 'dark-plus'],
};

const shellHighlighter: HighlighterGeneric<BundledLanguage, BundledTheme> =
  import.meta.hot?.data.shellHighlighter ?? (await createHighlighter(highlighterOptions));

if (import.meta.hot) {
  import.meta.hot.data.shellHighlighter = shellHighlighter;
}

interface ArtifactProps {
  messageId: string;
}

export const Artifact = memo(({ messageId }: ArtifactProps) => {
  const userToggledActions = useRef(false);
  const [showActions, setShowActions] = useState(false);
  const [allActionFinished, setAllActionFinished] = useState(false);

  const artifacts = useStore(workbenchStore.artifacts);
  const artifact = artifacts[messageId];

  const actions = useStore(
    computed(artifact.runner.actions, (actions) => {
      // Filter out Supabase actions except for migrations
      return Object.values(actions).filter((action) => {
        // Exclude actions with type 'supabase' or actions that contain 'supabase' in their content
        return action.type !== 'supabase' && !(action.type === 'shell' && action.content?.includes('supabase'));
      });
    }),
  );

  const toggleActions = () => {
    userToggledActions.current = true;
    setShowActions(!showActions);
  };

  useEffect(() => {
    if (actions.length && !showActions && !userToggledActions.current) {
      setShowActions(true);
    }

    if (actions.length !== 0 && artifact.type === 'bundled') {
      const finished = !actions.find((action) => action.status !== 'complete');

      if (allActionFinished !== finished) {
        setAllActionFinished(finished);
      }
    }
  }, [actions]);

  return (
    <div className="artifact border border-bolt-elements-borderColor flex flex-col overflow-hidden rounded-lg w-full transition-border duration-150">
      <div className="flex">
        <button
          className="flex items-stretch bg-bolt-elements-artifacts-background hover:bg-bolt-elements-artifacts-backgroundHover w-full overflow-hidden"
          onClick={() => {
            const showWorkbench = workbenchStore.showWorkbench.get();
            workbenchStore.showWorkbench.set(!showWorkbench);
          }}
        >
          {artifact.type == 'bundled' && (
            <>
              <div className="p-4">
                {allActionFinished ? (
                  <div className={'i-ph:files-light'} style={{ fontSize: '2rem' }}></div>
                ) : (
                  <div className={'i-svg-spinners:90-ring-with-bg'} style={{ fontSize: '2rem' }}></div>
                )}
              </div>
              <div className="bg-bolt-elements-artifacts-borderColor w-[1px]" />
            </>
          )}
          <div className="px-5 p-3.5 w-full text-left">
            <div className="w-full text-bolt-elements-textPrimary font-medium leading-5 text-sm">{artifact?.title}</div>
            <div className="w-full w-full text-bolt-elements-textSecondary text-xs mt-0.5">Click to open Workbench</div>
          </div>
        </button>
        <div className="bg-bolt-elements-artifacts-borderColor w-[1px]" />
        <AnimatePresence>
          {actions.length && artifact.type !== 'bundled' && (
            <motion.button
              initial={{ width: 0 }}
              animate={{ width: 'auto' }}
              exit={{ width: 0 }}
              transition={{ duration: 0.15, ease: cubicEasingFn }}
              className="bg-bolt-elements-artifacts-background hover:bg-bolt-elements-artifacts-backgroundHover"
              onClick={toggleActions}
            >
              <div className="p-4">
                <div className={showActions ? 'i-ph:caret-up-bold' : 'i-ph:caret-down-bold'}></div>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {artifact.type !== 'bundled' && showActions && actions.length > 0 && (
          <motion.div
            className="actions"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: '0px' }}
            transition={{ duration: 0.15 }}
          >
            <div className="bg-bolt-elements-artifacts-borderColor h-[1px]" />

            <div className="p-5 text-left bg-bolt-elements-actions-background">
              <ActionList actions={actions} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

interface ShellCodeBlockProps {
  classsName?: string;
  code: string;
}

function ShellCodeBlock({ classsName, code }: ShellCodeBlockProps) {
  return (
    <div
      className={classNames('text-xs', classsName)}
      dangerouslySetInnerHTML={{
        __html: shellHighlighter.codeToHtml(code, {
          lang: 'shell',
          theme: 'dark-plus',
        }),
      }}
    ></div>
  );
}

interface ActionListProps {
  actions: ActionState[];
}

const actionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function openArtifactInWorkbench(filePath: any) {
  if (workbenchStore.currentView.get() !== 'code') {
    workbenchStore.currentView.set('code');
  }

  workbenchStore.setSelectedFile(`${WORK_DIR}/${filePath}`);
}

const ActionList = memo(({ actions }: ActionListProps) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      <ul className="list-none space-y-2.5">
        {actions.map((action, index) => {
          const { status, type, content } = action;
          const isLast = index === actions.length - 1;

          return (
            <motion.li
              key={index}
              variants={actionVariants}
              initial="hidden"
              animate="visible"
              transition={{
                duration: 0.2,
                ease: cubicEasingFn,
              }}
            >
              <div className="flex items-center gap-1.5 text-sm">
                <div className={classNames('text-lg', getIconColor(action.status))}>
                  {status === 'running' ? (
                    <>
                      {type === 'start' ? (
                        <div className="i-ph:terminal-window-duotone"></div>
                      ) : type === 'carbonflow' ? (
                        <div className="i-svg-spinners:180-ring-with-bg text-emerald-500"></div>
                      ) : (
                        <div className="i-svg-spinners:90-ring-with-bg"></div>
                      )}
                    </>
                  ) : status === 'pending' ? (
                    <>
                      {type === 'carbonflow' ? (
                        <div className="i-ph:flow-arrow text-emerald-400"></div>
                      ) : (
                        <div className="i-ph:circle-duotone"></div>
                      )}
                    </>
                  ) : status === 'complete' ? (
                    <>
                      {type === 'carbonflow' ? (
                        <div className="i-ph:graph text-emerald-500"></div>
                      ) : (
                        <div className="i-ph:check"></div>
                      )}
                    </>
                  ) : status === 'failed' || status === 'aborted' ? (
                    <div className="i-ph:x"></div>
                  ) : null}
                </div>
                {type === 'file' ? (
                  <div>
                    Create{' '}
                    <code
                      className="bg-bolt-elements-artifacts-inlineCode-background text-bolt-elements-artifacts-inlineCode-text px-1.5 py-1 rounded-md text-bolt-elements-item-contentAccent hover:underline cursor-pointer"
                      onClick={() => openArtifactInWorkbench(action.filePath)}
                    >
                      {action.filePath}
                    </code>
                  </div>
                ) : type === 'shell' ? (
                  <div className="flex items-center w-full min-h-[28px]">
                    <span className="flex-1">Run command</span>
                  </div>
                ) : type === 'start' ? (
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      workbenchStore.currentView.set('preview');
                    }}
                    className="flex items-center w-full min-h-[28px]"
                  >
                    <span className="flex-1">Start Application</span>
                  </a>
                ) : type === 'carbonflow' ? (
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      workbenchStore.currentView.set('carbonflow');
                    }}
                    className="flex items-center w-full min-h-[28px] text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    <span className="flex-1">
                      <span className="font-medium">CarbonFlow:</span> {
                        // 显示简化的操作类型
                        (action as any).operation === 'add' ? 
                          `添加${(action as any).nodeType}节点` :
                        (action as any).operation === 'connect' ? 
                          `连接节点` :
                        (action as any).operation === 'calculate' ? 
                          `计算碳足迹` :
                        (action as any).operation || '操作'
                      }
                    </span>
                    <div className="i-ph:flow-arrow-duotone text-lg ml-2"></div>
                  </a>
                ) : null}
              </div>
              {(type === 'shell' || type === 'start') && (
                <ShellCodeBlock
                  classsName={classNames('mt-1', {
                    'mb-3.5': !isLast,
                  })}
                  code={content}
                />
              )}
              {type === 'carbonflow' && (
                <div className={classNames(
                  'mt-1 px-3 py-1.5 rounded-md text-xs bg-gray-800 text-gray-200 border border-gray-700',
                  { 'mb-3.5': !isLast }
                )}>
                  {content && content.includes('{') && (
                    (() => {
                      try {
                        const jsonData = JSON.parse(content.substring(
                          content.indexOf('{'),
                          content.lastIndexOf('}') + 1
                        ));
                        
                        if (jsonData.components && jsonData.components.length > 0) {
                          const component = jsonData.components[0];
                          return (
                            <div className="mt-2 border-t border-gray-700 pt-2">
                              {component.name && (
                                <div className="ml-4 text-gray-300">• 节点名称: <span className="font-medium text-gray-100">{component.name}</span></div>
                              )}
                              
                              {component.lifecycleStage && (
                                <div className="ml-4 text-gray-300">• 生命周期阶段: <span className="font-medium text-gray-100">{component.lifecycleStage}</span></div>
                              )}
                              
                              {component.emissionType && (
                                <div className="ml-4 text-gray-300">• 排放类型: <span className="font-medium text-gray-100">{component.emissionType}</span></div>
                              )}
                              
                              {component.quantity && (
                                <div className="ml-4 text-gray-300">• 数量: <span className="font-medium text-gray-100">{component.quantity}</span></div>
                              )}

                              {component.carbonFactor && (
                                <div className="ml-4 text-gray-300">• 碳因子: <span className="font-medium text-gray-100">{component.carbonFactor}</span></div>
                              )}

                              {component.activitydataSource && (
                                <div className="ml-4 text-gray-300">• 数据来源: <span className="font-medium text-gray-100">{component.activitydataSource}</span></div>
                              )}

                              {component.activityScore && (
                                <div className="ml-4 text-gray-300">• 活动评分: <span className="font-medium text-gray-100">{component.activityScore}</span></div>
                              )}

                              {component.carbonFootprint && (
                                <div className="ml-4 text-gray-300">• 碳足迹: <span className="font-medium text-gray-100">{component.carbonFootprint}</span></div>
                              )}

                              {/* 制造节点特有属性 */}
                              {component.energyConsumption && (
                                <div className="ml-4 text-gray-300">• 能源消耗: <span className="font-medium text-gray-100">{component.energyConsumption}</span></div>
                              )}

                              {component.energyType && (
                                <div className="ml-4 text-gray-300">• 能源类型: <span className="font-medium text-gray-100">{component.energyType}</span></div>
                              )}

                              {component.processEfficiency && (
                                <div className="ml-4 text-gray-300">• 工艺效率: <span className="font-medium text-gray-100">{component.processEfficiency}</span></div>
                              )}

                              {/* 运输节点特有属性 */}
                              {component.transportationMode && (
                                <div className="ml-4 text-gray-300">• 运输方式: <span className="font-medium text-gray-100">{component.transportationMode}</span></div>
                              )}

                              {component.transportationDistance && (
                                <div className="ml-4 text-gray-300">• 运输距离: <span className="font-medium text-gray-100">{component.transportationDistance}</span></div>
                              )}

                              {component.vehicleType && (
                                <div className="ml-4 text-gray-300">• 车辆类型: <span className="font-medium text-gray-100">{component.vehicleType}</span></div>
                              )}

                              {/* 使用节点特有属性 */}
                              {component.lifespan && (
                                <div className="ml-4 text-gray-300">• 使用寿命: <span className="font-medium text-gray-100">{component.lifespan}</span></div>
                              )}

                              {component.energyConsumptionPerUse && (
                                <div className="ml-4 text-gray-300">• 每次使用能耗: <span className="font-medium text-gray-100">{component.energyConsumptionPerUse}</span></div>
                              )}

                              {component.usageFrequency && (
                                <div className="ml-4 text-gray-300">• 使用频率: <span className="font-medium text-gray-100">{component.usageFrequency}</span></div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      } catch (e) {
                        return null;
                      }
                    })()
                  )}
                  {(action as any).operation === 'add' && (action as any).nodeType && (
                    <div className="ml-4 text-gray-300">• 添加 <span className="font-medium text-gray-100">{(action as any).nodeType}</span> 类型节点</div>
                  )}
                  {(action as any).operation === 'connect' && (action as any).source && (action as any).target && (
                    <div className="ml-4 text-gray-300">• 连接 <span className="font-medium text-gray-100">{(action as any).source}</span> 到 <span className="font-medium text-gray-100">{(action as any).target}</span></div>
                  )}
                  {(action as any).operation === 'calculate' && (
                    <div className="ml-4 text-gray-300">• 计算碳足迹值</div>
                  )}
                  {(action as any).operation === 'update' && (
                    <div className="ml-4 text-gray-300">• 更新节点信息</div>
                  )}
                  {(action as any).operation === 'delete' && (
                    <div className="ml-4 text-gray-300">• 删除节点</div>
                  )}
                  {(action as any).operation === 'query' && (
                    <div className="ml-4 text-gray-300">• 查询节点信息</div>
                  )}
                  {(action as any).operation === 'layout' && (
                    <div className="ml-4 text-gray-300">• 调整节点布局</div>
                  )}
                  {(action as any).position && (
                    <div className="ml-4 text-gray-300">• 节点位置: <span className="font-medium text-gray-100">{(action as any).position}</span></div>
                  )}
                  {(action as any).description && (
                    <div className="ml-4 text-gray-300">• 描述: <span className="font-medium text-gray-100">{(action as any).description}</span></div>
                  )}
                </div>
              )}
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
});

function getIconColor(status: ActionState['status']) {
  switch (status) {
    case 'pending': {
      return 'text-bolt-elements-textTertiary';
    }
    case 'running': {
      return 'text-bolt-elements-loader-progress';
    }
    case 'complete': {
      return 'text-bolt-elements-icon-success';
    }
    case 'aborted': {
      return 'text-bolt-elements-textSecondary';
    }
    case 'failed': {
      return 'text-bolt-elements-icon-error';
    }
    default: {
      return undefined;
    }
  }
}
