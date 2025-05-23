/*
 * @ts-nocheck
 * Preventing TS checks with files presented in the video for a better presentation.
 */
import { useStore } from '@nanostores/react';
import type { Message } from 'ai';
import { useChat } from 'ai/react';
import { useAnimate } from 'framer-motion';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { cssTransition, toast, ToastContainer } from 'react-toastify';
import { useMessageParser, usePromptEnhancer, useShortcuts, useSnapScroll } from '~/lib/hooks';
import { description, useChatHistory } from '~/lib/persistence';
import { chatStore } from '~/lib/stores/chat';
import { chatMessagesStore } from '~/lib/stores/chatMessagesStore';
import { workbenchStore } from '~/lib/stores/workbench';
import { DEFAULT_MODEL, DEFAULT_PROVIDER, PROMPT_COOKIE_KEY, PROVIDER_LIST } from '~/utils/constants';
import { cubicBezier } from 'framer-motion';
import { createScopedLogger, renderLogger } from '~/utils/logger';
import { BaseChat } from './BaseChat';
import Cookies from 'js-cookie';
import { debounce } from '~/utils/debounce';
import { useSettings } from '~/lib/hooks/useSettings';
import type { ProviderInfo } from '~/types/model';
import { useSearchParams, useParams } from '@remix-run/react';
import { createSampler } from '~/utils/sampler';
import { getTemplates, selectStarterTemplate } from '~/utils/selectStarterTemplate';
import { logStore } from '~/lib/stores/logs';
import { streamingState } from '~/lib/stores/streaming';
import { filesToArtifacts } from '~/utils/fileUtils';
import { supabaseConnection } from '~/lib/stores/supabase';
import { subscribeToCarbonFlowData } from '~/components/workbench/CarbonFlow/CarbonFlowStore';
import { useLoaderData } from '@remix-run/react';

const toastAnimation = cssTransition({
  enter: 'animated fadeInRight',
  exit: 'animated fadeOutRight',
});

const logger = createScopedLogger('Chat');

const cubicEasingFn = cubicBezier(0.4, 0, 0.2, 1);

export function Chat() {
  renderLogger.trace('Chat');

  const { ready, storeMessageHistory, importChat, exportChat } = useChatHistory();
  const title = useStore(description);
  const { id: promptId } = useParams();

  return (
    <>
      {ready && (
        <ChatImpl
          description={title}
          exportChat={exportChat}
          storeMessageHistory={storeMessageHistory}
          importChat={importChat}
        />
      )}
      <ToastContainer
        closeButton={({ closeToast }) => {
          return (
            <button className="Toastify__close-button" onClick={closeToast}>
              <div className="i-ph:x text-lg" />
            </button>
          );
        }}
        icon={({ type }) => {
          /**
           * @todo Handle more types if we need them. This may require extra color palettes.
           */
          switch (type) {
            case 'success': {
              return <div className="i-ph:check-bold text-bolt-elements-icon-success text-2xl" />;
            }
            case 'error': {
              return <div className="i-ph:warning-circle-bold text-bolt-elements-icon-error text-2xl" />;
            }
          }

          return undefined;
        }}
        position="bottom-right"
        pauseOnFocusLoss
        transition={toastAnimation}
      />
    </>
  );
}

const processSampledMessages = createSampler(
  (options: {
    messages: Message[];
    initialMessages: Message[];
    isLoading: boolean;
    parseMessages: (messages: Message[], isLoading: boolean) => void;
    storeMessageHistory: (messages: Message[]) => Promise<void>;
  }) => {
    const { messages, initialMessages, isLoading, parseMessages, storeMessageHistory } = options;
    parseMessages(messages, isLoading);

    if (messages.length > initialMessages.length) {
      storeMessageHistory(messages).catch((error) => toast.error(error.message));
    }
  },
  50,
);

interface ChatProps {
  storeMessageHistory: (messages: Message[]) => Promise<void>;
  importChat: (description: string, messages: Message[]) => Promise<void>;
  exportChat: () => void;
  description?: string;
}

export const ChatImpl = memo(
  ({ description, storeMessageHistory, importChat, exportChat }: ChatProps) => {
    useShortcuts();

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [chatStarted, setChatStarted] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [imageDataList, setImageDataList] = useState<string[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [fakeLoading, setFakeLoading] = useState(false);
    const files = useStore(workbenchStore.files);
    const actionAlert = useStore(workbenchStore.alert);
    const supabaseConn = useStore(supabaseConnection);
    const selectedProject = supabaseConn.stats?.projects?.find(
      (project) => project.id === supabaseConn.selectedProjectId,
    );
    const supabaseAlert = useStore(workbenchStore.supabaseAlert);
    const { activeProviders, promptId, autoSelectTemplate, contextOptimizationEnabled } = useSettings();
    const { workflow } = useLoaderData<any>();

    const [model, setModel] = useState(() => {
      const savedModel = Cookies.get('selectedModel');
      return savedModel || DEFAULT_MODEL;
    });
    const [provider, setProvider] = useState(() => {
      const savedProvider = Cookies.get('selectedProvider');
      return (PROVIDER_LIST.find((p) => p.name === savedProvider) || DEFAULT_PROVIDER) as ProviderInfo;
    });

    const { showChat } = useStore(chatStore);

    const [animationScope, animate] = useAnimate();

    const [apiKeys, setApiKeys] = useState<Record<string, string>>({});

    const messagesFromStore = useStore(chatMessagesStore);
    const [carbonFlowData, setCarbonFlowData] = useState<any>(null);
    
    useEffect(() => {
      const unsubscribe = subscribeToCarbonFlowData((data) => {
        // console.log('[Chat] 收到CarbonFlow数据更新:', data);
        setCarbonFlowData(data);
      });
      
      return () => {
        unsubscribe();
      };
    }, []);

    const {
      messages,
      isLoading,
      input,
      handleInputChange,
      setInput,
      stop,
      append,
      setMessages,
      reload,
      error,
      data: chatData,
      setData,
    } = useChat({
      api: '/api/chat',
      body: (() => {
        let finalCarbonFlowDataPayload = null;

        if (workflow?.sceneInfo || carbonFlowData) {
          finalCarbonFlowDataPayload = {
            State: workflow?.sceneInfo ?? null,
            nodes: carbonFlowData?.nodes ?? [],
            Score: carbonFlowData?.aiSummary ?? null,
          };
        }

        const requestBody = {
          apiKeys,
          files,
          promptId,
          contextOptimization: contextOptimizationEnabled,
          carbonFlowData: finalCarbonFlowDataPayload,
          supabase: {
            isConnected: supabaseConn.isConnected,
            hasSelectedProject: !!selectedProject,
            credentials: {
              supabaseUrl: supabaseConn?.credentials?.supabaseUrl,
              anonKey: supabaseConn?.credentials?.anonKey,
            },
          },
        };


        return requestBody;
      })(),
      sendExtraMessageFields: true,
      onError: (e) => {
        logger.error('Request failed\n\n', e, error);
        logStore.logError('Chat request failed', e, {
          files: files?.length || 0,
          carbonFlowData: !!carbonFlowData,
        });
        toast.error(
          'There was an error processing your request: ' + (e.message ? e.message : 'No details were returned'),
        );
      },
      onFinish: (message, response) => {
        const usage = response.usage;
        setData(undefined);

        if (usage) {
          console.log('Token usage:', usage);
          logStore.logProvider('Chat response completed', {
            component: 'Chat',
            action: 'response',
            model,
            provider: provider.name,
            usage,
            messageLength: message.content.length,
          });
        }

        logger.debug('Finished streaming');
      },
      initialMessages: messagesFromStore,
      initialInput: Cookies.get(PROMPT_COOKIE_KEY) || '',
    });
    useEffect(() => {
      const prompt = searchParams.get('prompt');

      if (prompt) {
        setSearchParams({});
        runAnimation();
        append({
          role: 'user',
          content: [
            {
              type: 'text',
              text: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${prompt}`,
            },
          ] as any,
        });
      }
    }, [model, provider, searchParams]);

    const { enhancingPrompt, promptEnhanced, enhancePrompt, resetEnhancer } = usePromptEnhancer();
    const { parsedMessages, parseMessages } = useMessageParser();

    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;
    const TEXTAREA_MIN_HEIGHT = 48;

    useEffect(() => {
      chatStore.setKey('started', true);
      setChatStarted(true);
    }, []);

    useEffect(() => {
      const { started } = chatStore.get();
      if (started !== chatStarted) {
        setChatStarted(started);
      }
    }, [chatStarted]);

    useEffect(() => {
      processSampledMessages({
        messages,
        initialMessages: messagesFromStore,
        isLoading,
        parseMessages,
        storeMessageHistory,
      });
    }, [messages, isLoading, parseMessages, storeMessageHistory, messagesFromStore]);

    const scrollTextArea = () => {
      const textarea = textareaRef.current;

      if (textarea) {
        textarea.scrollTop = textarea.scrollHeight;
      }
    };

    const abort = () => {
      stop();
      chatStore.setKey('aborted', true);
      workbenchStore.abortAllActions();

      logStore.logProvider('Chat response aborted', {
        component: 'Chat',
        action: 'abort',
        model,
        provider: provider.name,
      });
    };

    useEffect(() => {
      const textarea = textareaRef.current;

      if (textarea) {
        textarea.style.height = 'auto';

        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = `${Math.max(TEXTAREA_MIN_HEIGHT, Math.min(scrollHeight, TEXTAREA_MAX_HEIGHT))}px`;
        textarea.style.overflowY = scrollHeight > TEXTAREA_MAX_HEIGHT ? 'auto' : 'hidden';
      }
    }, [input, textareaRef]);

    const runAnimation = async () => {
      try {
        const examplesElement = document.getElementById('examples');
        const introElement = document.getElementById('intro');

        if (examplesElement) {
          await animate(examplesElement, { opacity: 0 }, {
            duration: 0.3,
            ease: cubicEasingFn,
          });
          examplesElement.style.display = 'none';
        }

        if (introElement) {
          await animate(introElement, { opacity: 0 }, {
            duration: 0.3,
            ease: cubicEasingFn,
          });
          introElement.style.display = 'none';
        }

        setChatStarted(true);
      } catch (error) {
        console.error('Animation error:', error);
        // Fallback to immediate state change if animation fails
        setChatStarted(true);
      }
    };

    const sendMessage = async (_event: React.UIEvent, messageInput?: string) => {
      const messageContent = messageInput || input;

      if (!messageContent?.trim()) {
        return;
      }

      if (isLoading) {
        abort();
        return;
      }

      runAnimation();

      if (!chatStarted) {
        setFakeLoading(true);

        if (autoSelectTemplate) {
          const { template, title } = await selectStarterTemplate({
            message: messageContent,
            model,
            provider,
          });

          if (template !== 'blank') {
            const temResp = await getTemplates(template, title).catch((e) => {
              if (e.message.includes('rate limit')) {
                toast.warning('Rate limit exceeded. Skipping starter template\n Continuing with blank template');
              } else {
                toast.warning('Failed to import starter template\n Continuing with blank template');
              }

              return null;
            });

            if (temResp) {
              const { assistantMessage, userMessage } = temResp;
              setMessages([
                {
                  id: `1-${new Date().getTime()}`,
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${messageContent}`,
                    },
                    ...imageDataList.map((imageData) => ({
                      type: 'image',
                      image: imageData,
                    })),
                  ] as any,
                },
                {
                  id: `2-${new Date().getTime()}`,
                  role: 'assistant',
                  content: assistantMessage,
                },
                {
                  id: `3-${new Date().getTime()}`,
                  role: 'user',
                  content: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${userMessage}`,
                  annotations: ['hidden'],
                },
              ]);
              reload();
              setInput('');
              Cookies.remove(PROMPT_COOKIE_KEY);

              setUploadedFiles([]);
              setImageDataList([]);

              resetEnhancer();

              textareaRef.current?.blur();
              setFakeLoading(false);

              return;
            }
          }
        }

        setMessages([
          {
            id: `${new Date().getTime()}`,
            role: 'user',
            content: [
              {
                type: 'text',
                text: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${messageContent}`,
              },
              ...imageDataList.map((imageData) => ({
                type: 'image',
                image: imageData,
              })),
            ] as any,
          },
        ]);
        reload();
        setFakeLoading(false);
        setInput('');
        Cookies.remove(PROMPT_COOKIE_KEY);

        setUploadedFiles([]);
        setImageDataList([]);

        resetEnhancer();

        textareaRef.current?.blur();

        return;
      }

      if (error != null) {
        setMessages(messages.slice(0, -1));
      }

      const modifiedFiles = workbenchStore.getModifiedFiles();

      chatStore.setKey('aborted', false);

      if (modifiedFiles !== undefined) {
        const userUpdateArtifact = filesToArtifacts(modifiedFiles, `${Date.now()}`);
        append({
          role: 'user',
          content: [
            {
              type: 'text',
              text: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${userUpdateArtifact}${messageContent}`,
            },
            ...imageDataList.map((imageData) => ({
              type: 'image',
              image: imageData,
            })),
          ] as any,
        });

        workbenchStore.resetAllFileModifications();
      } else {
        append({
          role: 'user',
          content: [
            {
              type: 'text',
              text: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${messageContent}`,
            },
            ...imageDataList.map((imageData) => ({
              type: 'image',
              image: imageData,
            })),
          ] as any,
        });
      }

      setInput('');
      Cookies.remove(PROMPT_COOKIE_KEY);

      setUploadedFiles([]);
      setImageDataList([]);

      resetEnhancer();

      textareaRef.current?.blur();
    };

    const onTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleInputChange(event);
    };

    const debouncedCachePrompt = useCallback(
      debounce((event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const trimmedValue = event.target.value.trim();
        Cookies.set(PROMPT_COOKIE_KEY, trimmedValue, { expires: 30 });
      }, 1000),
      [],
    );

    const [messageRef, scrollRef] = useSnapScroll();

    useEffect(() => {
      const storedApiKeys = Cookies.get('apiKeys');

      if (storedApiKeys) {
        setApiKeys(JSON.parse(storedApiKeys));
      }
    }, []);

    const handleModelChange = (newModel: string) => {
      setModel(newModel);
      Cookies.set('selectedModel', newModel, { expires: 30 });
    };

    const handleProviderChange = (newProvider: ProviderInfo) => {
      setProvider(newProvider);
      Cookies.set('selectedProvider', newProvider.name, { expires: 30 });
    };

    useEffect(() => {
      const handleChatHistoryUpdate = (event: CustomEvent) => {
        if (event.detail?.messages) {
          setMessages(event.detail.messages);
        }
      };

      window.addEventListener('chatHistoryUpdated', handleChatHistoryUpdate as EventListener);
      return () => {
        window.removeEventListener('chatHistoryUpdated', handleChatHistoryUpdate as EventListener);
      };
    }, []);

    // 监听右侧面板触发的事件
    useEffect(() => {
      const handleCarbonFlowTriggerChat = (event: CustomEvent) => {
        const { type, payload, matchResults: oldMatchResults } = event.detail; // matchResults for backward compatibility
        
        console.log('[Chat] 收到CarbonFlow触发chat事件:', type, event.detail);
        
        let userAnalysisPrompt = '';
        const fakeEvent = {} as React.UIEvent; // 用于 sendMessage

        if (type === 'factor_match_complete' && sendMessage) {
          // 优先使用 payload?.matchResults，然后是顶层的 matchResults (oldMatchResults)
          const currentMatchResults = payload?.matchResults || oldMatchResults || {};
          const { totalMatched, successCount, failedCount, updated } = currentMatchResults;

          userAnalysisPrompt = `请分析以下碳因子匹配的详细结果：
- 总共尝试匹配的节点数：${totalMatched}
- 成功匹配并更新的节点数：${successCount}
- 匹配失败的节点数：${failedCount}
- 是否有节点数据因此次匹配而被实际更新：${(updated && successCount > 0) ? '是' : '否'}

基于上述数据，请提供一份详细的分析报告和下一步操作建议。`;
          sendMessage(fakeEvent, userAnalysisPrompt);

        } else if (type === 'goal_scope_saved' && sendMessage) {
          const { status, message, data } = payload || {};
          let statusText = status === 'success' ? '成功' : '失败';
          userAnalysisPrompt = `“目标与范围”已保存。
状态：${statusText}。
${message ? `信息：${message}` : ''}
${data ? `详情摘要：${typeof data === 'string' ? data : JSON.stringify(data)}` : ''}

请确认此操作或提供进一步的总结与分析。`;
          sendMessage(fakeEvent, userAnalysisPrompt);

        } else if (type === 'file_parse_complete' && sendMessage) {
          const { status, fileName, itemsParsed, errors } = payload || {};
          let statusText = status === 'success' ? '成功' : '失败';
          userAnalysisPrompt = `文件“${fileName || '未知文件'}”解析完成。
状态：${statusText}。
${itemsParsed !== undefined ? `成功解析条目数：${itemsParsed}` : ''}
${errors && errors.length > 0 ? `遇到的错误：${errors.join(', ')}` : ''}

请对解析结果进行总结或提示用户下一步操作。`;
          sendMessage(fakeEvent, userAnalysisPrompt);
        
        } else if (type === 'generic_panel_action_complete' && sendMessage) {
          const { title, summary, status } = payload || {};
          let statusText = status === 'success' ? '成功' : (status === 'failure' ? '失败' : (status || '已完成'));

          if (title && summary) {
            userAnalysisPrompt = `操作“${title}”已${statusText}。
摘要：${summary}

请提供进一步的分析或确认。`;
            sendMessage(fakeEvent, userAnalysisPrompt);
          }
        }
        // 可以根据需要添加更多的 else if 来处理其他事件类型
      };
      
      window.addEventListener('carbonflow-trigger-chat', handleCarbonFlowTriggerChat as EventListener);
      
      return () => {
        window.removeEventListener('carbonflow-trigger-chat', handleCarbonFlowTriggerChat as EventListener);
      };
    }, [append]); // 依赖 sendMessage 函数

    return (
      <BaseChat
        ref={animationScope}
        textareaRef={textareaRef}
        input={input}
        showChat={showChat}
        chatStarted={chatStarted}
        isStreaming={isLoading || fakeLoading}
        onStreamingChange={(streaming) => {
          streamingState.set(streaming);
        }}
        enhancingPrompt={enhancingPrompt}
        promptEnhanced={promptEnhanced}
        sendMessage={sendMessage}
        model={model}
        setModel={handleModelChange}
        provider={provider}
        setProvider={handleProviderChange}
        providerList={activeProviders}
        messageRef={messageRef}
        scrollRef={scrollRef}
        handleInputChange={(e) => {
          onTextareaChange(e);
          debouncedCachePrompt(e);
        }}
        handleStop={abort}
        description={description}
        importChat={importChat}
        exportChat={exportChat}
        messages={messages.map((message, i) => {
          if (message.role === 'user') {
            return message;
          }

          return {
            ...message,
            content: parsedMessages[i] || '',
          };
        })}
        enhancePrompt={() => {
          enhancePrompt(
            input,
            (input) => {
              setInput(input);
              scrollTextArea();
            },
            model,
            provider,
            apiKeys,
          );
        }}
        uploadedFiles={uploadedFiles}
        setUploadedFiles={setUploadedFiles}
        imageDataList={imageDataList}
        setImageDataList={setImageDataList}
        actionAlert={actionAlert}
        clearAlert={() => workbenchStore.clearAlert()}
        supabaseAlert={supabaseAlert}
        clearSupabaseAlert={() => workbenchStore.clearSupabaseAlert()}
        data={chatData}
        promptId={promptId}
        workflowId={workflow?.id}
      />
    );
  },
);
