import { useStore } from '@nanostores/react';
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';
import { computed } from 'nanostores';
import { memo, useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { ActionRunner } from '~/lib/runtime/action-runner';
import type { FileHistory } from '~/types/actions';
import {
  type OnChangeCallback as OnEditorChange,
  type OnScrollCallback as OnEditorScroll,
} from '~/components/editor/codemirror/CodeMirrorEditor';
import { IconButton } from '~/components/ui/IconButton';
import { PanelHeaderButton } from '~/components/ui/PanelHeaderButton';
import { Slider, type SliderOptions } from '~/components/ui/Slider';
import { workbenchStore, type WorkbenchViewType } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { renderLogger } from '~/utils/logger';
import { EditorPanel } from './EditorPanel';
import { Preview } from './Preview';
import { CarbonFlow } from './CarbonFlow';
import useViewport from '~/lib/hooks';
import { PushToGitHubDialog } from '~/components/@settings/tabs/connections/components/PushToGitHubDialog';
import { CarbonFlowBridge } from './CarbonFlow/carbonflow-bridge';

interface WorkspaceProps {
  chatStarted?: boolean;
  isStreaming?: boolean;
  actionRunner: ActionRunner;
  metadata?: {
    gitUrl?: string;
  };
  updateChatMestaData?: (metadata: any) => void;
}

const viewTransition = { ease: cubicEasingFn };

const sliderOptions: SliderOptions<WorkbenchViewType> = {
  left: {
    value: 'code',
    text: 'Code',
  },
  middle: {
    value: 'preview',
    text: 'Preview',
  },
  right: {
    value: 'carbonflow',
    text: 'CarbonFlow',
  },
} as const;

const workbenchVariants = {
  closed: {
    width: 0,
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
  open: {
    width: 'var(--workbench-width)',
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
} satisfies Variants;

export const Workbench = memo(
  ({ chatStarted, isStreaming, actionRunner, metadata, updateChatMestaData }: WorkspaceProps) => {
    renderLogger.trace('Workbench');

    const [isSyncing, setIsSyncing] = useState(false);
    const [isPushDialogOpen, setIsPushDialogOpen] = useState(false);
    const [fileHistory, setFileHistory] = useState<Record<string, FileHistory>>({});
    const [carbonFlowBridgeInitialized, setCarbonFlowBridgeInitialized] = useState(false);

    const hasPreview = useStore(computed(workbenchStore.previews, (previews) => previews.length > 0));
    const showWorkbench = useStore(workbenchStore.showWorkbench);
    const selectedFile = useStore(workbenchStore.selectedFile);
    const currentDocument = useStore(workbenchStore.currentDocument);
    const unsavedFiles = useStore(workbenchStore.unsavedFiles);
    const files = useStore(workbenchStore.files);
    
    // Ensure 'carbonflow' view is selected and effectively hide the switcher for this context
    useEffect(() => {
      workbenchStore.currentView.set('carbonflow');
    }, []);
    const selectedView = useStore(workbenchStore.currentView);

    const isSmallViewport = useViewport(1024);

    // This function might not be actively used if the Slider is hidden for 'carbonflow'
    const setSelectedView = useCallback((view: WorkbenchViewType) => {
      workbenchStore.currentView.set(view);
    }, []);

    // Removed the useEffect that depended on hasPreview to change selectedView,
    // as we are fixing it to 'carbonflow'.

    useEffect(() => {
      workbenchStore.setDocuments(files);
    }, [files]);

    const onEditorChange = useCallback<OnEditorChange>((update) => {
      workbenchStore.setCurrentDocumentContent(update.content);
    }, []);

    const onEditorScroll = useCallback<OnEditorScroll>((position) => {
      workbenchStore.setCurrentDocumentScrollPosition(position);
    }, []);

    const onFileSelect = useCallback((filePath: string | undefined) => {
      workbenchStore.setSelectedFile(filePath);
    }, []);

    const onFileSave = useCallback(() => {
      workbenchStore.saveCurrentDocument().catch(() => {
        toast.error('Failed to update file content');
      });
    }, []);

    const onFileReset = useCallback(() => {
      workbenchStore.resetCurrentDocument();
    }, []);

    const handleSyncFiles = useCallback(async () => {
      setIsSyncing(true);

      try {
        const directoryHandle = await window.showDirectoryPicker();
        await workbenchStore.syncFiles(directoryHandle);
        toast.success('Files synced successfully');
      } catch (error) {
        console.error('Error syncing files:', error);
        toast.error('Failed to sync files');
      } finally {
        setIsSyncing(false);
      }
    }, []);

    // 初始化CarbonFlowBridge
    useEffect(() => {
      if (actionRunner && !carbonFlowBridgeInitialized) {
        try {
          const bridge = CarbonFlowBridge.getInstance();
          bridge.initialize(actionRunner);
          setCarbonFlowBridgeInitialized(true);
          console.log('[Workbench] CarbonFlowBridge 初始化成功');
        } catch (error) {
          console.error('[Workbench] CarbonFlowBridge 初始化失败:', error);
        }
      }
    }, [actionRunner, carbonFlowBridgeInitialized]);

    return (
      chatStarted && (
        <motion.div
          initial="closed"
          animate={showWorkbench ? 'open' : 'closed'}
          variants={workbenchVariants}
          className="z-workbench"
        >
          <div
            className={classNames(
              'fixed top-[calc(var(--header-height)-2.8rem)] bottom-2 w-[var(--workbench-inner-width)] mr-4 z-0 transition-[left,width] duration-200 bolt-ease-cubic-bezier',
              {
                'w-full': isSmallViewport,
                'left-0': showWorkbench && isSmallViewport,
                'left-[var(--workbench-left)]': showWorkbench,
                'left-[100%]': !showWorkbench,
              },
            )}
            style={{
              '--workbench-inner-width': '68%',
              '--workbench-left': '32%',
            } as React.CSSProperties}
          >
            <div className="absolute inset-0 px-2 lg:px-6">
              <div className="h-full flex flex-col bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor shadow-sm rounded-lg overflow-hidden">
                {selectedView !== 'carbonflow' && ( // Conditionally render the header bar
                  <div className="flex items-center px-3 py-2 border-b border-bolt-elements-borderColor">
                    <Slider selected={selectedView} options={sliderOptions} setSelected={setSelectedView} />
                    <div className="ml-auto" />
                    {selectedView === 'code' && (
                      <div className="flex overflow-y-auto">
                        <PanelHeaderButton
                          className="mr-1 text-sm"
                          onClick={() => {
                            workbenchStore.downloadZip();
                          }}
                        >
                          <div className="i-ph:code" />
                          Download Code
                        </PanelHeaderButton>
                        <PanelHeaderButton className="mr-1 text-sm" onClick={handleSyncFiles} disabled={isSyncing}>
                          {isSyncing ? <div className="i-ph:spinner" /> : <div className="i-ph:cloud-arrow-down" />}
                          {isSyncing ? 'Syncing...' : 'Sync Files'}
                        </PanelHeaderButton>
                        <PanelHeaderButton
                          className="mr-1 text-sm"
                          onClick={() => {
                            workbenchStore.toggleTerminal(!workbenchStore.showTerminal.get());
                          }}
                        >
                          <div className="i-ph:terminal" />
                          Toggle Terminal
                        </PanelHeaderButton>
                        <PanelHeaderButton className="mr-1 text-sm" onClick={() => setIsPushDialogOpen(true)}>
                          <div className="i-ph:git-branch" />
                          Push to GitHub
                        </PanelHeaderButton>
                      </div>
                    )}
                    {/* <IconButton
                      icon="i-ph:x-circle"
                      className="-mr-1"
                      size="xl"
                      onClick={() => {
                        workbenchStore.showWorkbench.set(false);
                      }}
                    /> */}
                  </div>
                )}
                <div className="relative flex-1 overflow-hidden">
                  <View initial={{ x: '0%' }} animate={{ x: selectedView === 'code' ? '0%' : '-100%' }}>
                    <EditorPanel
                      editorDocument={currentDocument}
                      isStreaming={isStreaming}
                      selectedFile={selectedFile}
                      files={files}
                      unsavedFiles={unsavedFiles}
                      fileHistory={fileHistory}
                      onFileSelect={onFileSelect}
                      onEditorScroll={onEditorScroll}
                      onEditorChange={onEditorChange}
                      onFileSave={onFileSave}
                      onFileReset={onFileReset}
                    />
                  </View>
                  <View initial={{ x: '100%' }} animate={{ x: selectedView === 'preview' ? '0%' : '100%' }}>
                    <Preview />
                  </View>
                  <View initial={{ x: '100%' }} animate={{ x: selectedView === 'carbonflow' ? '0%' : '100%' }}>
                    <CarbonFlow />
                  </View>
                </div>
              </div>
            </div>
          </div>
          <PushToGitHubDialog
            isOpen={isPushDialogOpen}
            onClose={() => setIsPushDialogOpen(false)}
            onPush={async (repoName, username, token) => {
              try {
                const commitMessage = prompt('Please enter a commit message:', 'Initial commit') || 'Initial commit';
                await workbenchStore.pushToGitHub(repoName, commitMessage, username, token);

                const repoUrl = `https://github.com/${username}/${repoName}`;

                if (updateChatMestaData && !metadata?.gitUrl) {
                  updateChatMestaData({
                    ...(metadata || {}),
                    gitUrl: repoUrl,
                  });
                }

                return repoUrl;
              } catch (error) {
                console.error('Error pushing to GitHub:', error);
                toast.error('Failed to push to GitHub');
                throw error;
              }
            }}
          />
        </motion.div>
      )
    );
  },
);

// View component for rendering content with motion transitions
interface ViewProps extends HTMLMotionProps<'div'> {
  children: JSX.Element;
}

const View = memo(({ children, ...props }: ViewProps) => {
  return (
    <motion.div className="absolute inset-0" transition={viewTransition} {...props}>
      {children}
    </motion.div>
  );
});
