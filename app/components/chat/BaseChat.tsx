/*
 * @ts-nocheck
 * Preventing TS checks with files presented in the video for a better presentation.
 */
import type { JSONValue, Message } from 'ai';
import React, { type RefCallback, useEffect, useState, useRef, useCallback, type RefObject } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Menu } from '~/components/sidebar/Menu.client';
import { IconButton } from '~/components/ui/IconButton';
import { Workbench } from '~/components/workbench/Workbench.client';
import { classNames } from '~/utils/classNames';
import { PROVIDER_LIST } from '~/utils/constants';
import { Messages } from './Messages.client';
import { SendButton } from './SendButton.client';
import { APIKeyManager, getApiKeysFromCookies } from './APIKeyManager';
import Cookies from 'js-cookie';
import * as Tooltip from '@radix-ui/react-tooltip';
import { supabase } from '~/lib/supabase';

import styles from './BaseChat.module.scss';
import { ExportChatButton } from '~/components/chat/chatExportAndImport/ExportChatButton';
import { ImportButtons } from '~/components/chat/chatExportAndImport/ImportButtons';
import { ExamplePrompts } from '~/components/chat/ExamplePrompts';
import GitCloneButton from './GitCloneButton';

import FilePreview from './FilePreview';
import { ModelSelector } from '~/components/chat/ModelSelector';
import { SpeechRecognitionButton } from '~/components/chat/SpeechRecognition';
import type { ProviderInfo } from '~/types/model';
import { ScreenshotStateManager } from './ScreenshotStateManager';
import { toast } from 'react-toastify';
import StarterTemplates from './StarterTemplates';
import type { ActionAlert, SupabaseAlert } from '~/types/actions';
import ChatAlert from './ChatAlert';
import type { ModelInfo } from '~/lib/modules/llm/types';
import ProgressCompilation from './ProgressCompilation';
import type { ProgressAnnotation } from '~/types/context';
import type { ActionRunner } from '~/lib/runtime/action-runner';
import { LOCAL_PROVIDERS } from '~/lib/stores/settings';
import { SupabaseChatAlert } from '~/components/chat/SupabaseAlert';
import { SupabaseConnection } from './SupabaseConnection';
import type { FileMap } from '~/types/file';

const TEXTAREA_MIN_HEIGHT = 76;

interface CSVData {
  headers: string[];
  data: Record<string, string>[];
  fileName: string;
  rowCount: number;
  parseStatus: 'idle' | 'parsing' | 'success' | 'error';
  errorMessage?: string;
}

interface BaseChatProps {
  textareaRef?: RefObject<HTMLTextAreaElement> | undefined;
  messageRef?: RefCallback<HTMLDivElement> | undefined;
  scrollRef?: RefObject<HTMLDivElement> | undefined;
  showChat?: boolean;
  chatStarted?: boolean;
  isStreaming?: boolean;
  onStreamingChange?: (streaming: boolean) => void;
  messages?: Message[];
  description?: string;
  enhancingPrompt?: boolean;
  promptEnhanced?: boolean;
  input?: string;
  model?: string;
  setModel?: (model: string) => void;
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  providerList?: ProviderInfo[];
  handleStop?: () => void;
  sendMessage?: (event: React.UIEvent, messageInput?: string) => void;
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  enhancePrompt?: () => void;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
  exportChat?: () => void;
  uploadedFiles?: File[];
  setUploadedFiles?: (files: File[]) => void;
  imageDataList?: string[];
  setImageDataList?: (dataList: string[]) => void;
  actionAlert?: ActionAlert;
  clearAlert?: () => void;
  supabaseAlert?: SupabaseAlert;
  clearSupabaseAlert?: () => void;
  data?: JSONValue[] | undefined;
  actionRunner?: ActionRunner;
  promptId?: string;
  carbonFlowData?: any;
  setInput?: (input: string) => void;
  workflowId?: string;
}

export const BaseChat = React.forwardRef<HTMLDivElement, BaseChatProps>(
  (
    {
      textareaRef,
      messageRef,
      scrollRef,
      showChat = true,
      chatStarted = false,
      isStreaming = false,
      onStreamingChange,
      model,
      setModel,
      provider,
      setProvider,
      providerList,
      input = '',
      enhancingPrompt,
      handleInputChange,

      // promptEnhanced,
      enhancePrompt,
      sendMessage,
      handleStop,
      importChat,
      exportChat,
      uploadedFiles = [],
      setUploadedFiles,
      imageDataList = [],
      setImageDataList,
      messages,
      actionAlert,
      clearAlert,
      supabaseAlert,
      clearSupabaseAlert,
      data,
      actionRunner,
      promptId,
      carbonFlowData,
      setInput,
      workflowId,
    },
    ref,
  ) => {
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;
    const [apiKeys, setApiKeys] = useState<Record<string, string>>(getApiKeysFromCookies());
    const [modelList, setModelList] = useState<ModelInfo[]>([]);
    const [isModelSettingsCollapsed, setIsModelSettingsCollapsed] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
    const [transcript, setTranscript] = useState('');
    const [isModelLoading, setIsModelLoading] = useState<string | undefined>('all');
    const [progressAnnotations, setProgressAnnotations] = useState<ProgressAnnotation[]>([]);
    const prevMessagesLengthRef = useRef(messages?.length ?? 0);
    const [csvData, setCsvData] = useState<CSVData | null>(null);
    const [showCSVPreview, setShowCSVPreview] = useState(false);
    const [apiKey, setApiKey] = useState<string>('');
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setIsClient(true);
    }, []);
    
    // 简单可靠的强制滚动函数
    const forceScrollToBottom = useCallback(() => {
      try {
        // 尝试所有可能的滚动容器
        if (scrollRef?.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
        
        // 直接查找消息容器
        const messagesContainer = document.querySelector('.flex-1.overflow-y-auto');
        if (messagesContainer && messagesContainer instanceof HTMLElement) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      } catch (error) {
        console.error("滚动失败:", error);
      }
    }, [scrollRef]);
    
    // 监听消息变化
    useEffect(() => {
      if (messages && messages.length > 0) {
        // 多次延时滚动
        forceScrollToBottom();
        setTimeout(forceScrollToBottom, 100);
        setTimeout(forceScrollToBottom, 300);
        setTimeout(forceScrollToBottom, 800);
      }
    }, [messages, forceScrollToBottom]);
    
    // 流式输出期间滚动
    useEffect(() => {
      if (!isStreaming) return;
      
      const scrollInterval = setInterval(() => {
        if (isStreaming) {
          forceScrollToBottom();
        }
      }, 200);
      
      return () => clearInterval(scrollInterval);
    }, [isStreaming, forceScrollToBottom]);
    
    // 修改发送消息处理函数
    const handleSendMessage = useCallback(async (event: React.UIEvent<Element>, messageInput?: string) => {
      let messageContent = messageInput || input;

      if (!messageContent?.trim()) {
        return;
      }

      if (isStreaming) {
        handleStop?.();
        return;
      }

      if (isModelLoading) {
        return;
      }

      // 确保 promptId 是字符串
      if (typeof promptId !== 'string') {
        toast.error('缺少必要的 promptId');
        return;
      }

      // ===== 新增：如果有csvData，拼接全部内容 =====
      if (csvData && csvData.parseStatus === 'success') {
        // Markdown 表格预览（前5行）
        const previewRows = csvData.data.slice(0, 5);
        const tableHeader = `| ${csvData.headers.join(' | ')} |`;
        const tableDivider = `| ${csvData.headers.map(() => '---').join(' | ')} |`;
        const tableRows = previewRows.map(row =>
          `| ${csvData.headers.map(h => row[h]).join(' | ')} |`
        ).join('\n');
        const table = [tableHeader, tableDivider, tableRows].join('\n');
        // 全部数据（JSON）
        const fullData = JSON.stringify(csvData.data, null, 2);

        messageContent += `\n\n【文件内容】\n文件名: ${csvData.fileName}\n共 ${csvData.rowCount} 行\n\n部分内容预览（前5行）：\n${table}\n\n全部数据（JSON）：\n${fullData}`;
      }

      try {
        // 使用 sendMessage prop 发送消息
        if (sendMessage) {
          await sendMessage(event, messageContent);
          // 清除输入和上传的文件
          if (setInput) setInput('');
          if (setUploadedFiles) setUploadedFiles([]);
          if (setImageDataList) setImageDataList([]);
          if (setCsvData) setCsvData(null); // 发送后清空csvData

          // 延时滚动
          setTimeout(forceScrollToBottom, 100);
          setTimeout(forceScrollToBottom, 500);
        } else {
          throw new Error('sendMessage function is not provided');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        toast.error('发送消息失败');
      }
    }, [sendMessage, isStreaming, handleStop, isModelLoading, input, forceScrollToBottom, promptId, setInput, setUploadedFiles, setImageDataList, setCsvData, csvData]);
    
    // AI 初始问候消息
    useEffect(() => {
      if (!messages || messages.length === 0) {
        const timer = setTimeout(() => {
          if (typeof window !== 'undefined' && sendMessage) {
            const fakeEvent = {} as React.UIEvent;
            sendMessage(fakeEvent, '正在初始化您的专属碳顾问');
          }
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }, [messages, sendMessage]);
    
    useEffect(() => {
      if (data) {
        const progressList = data.filter(
          (x) => typeof x === 'object' && (x as any).type === 'progress',
        ) as ProgressAnnotation[];
        setProgressAnnotations(progressList);
      }
    }, [data]);

    useEffect(() => {
      console.log(transcript);
    }, [transcript]);

    useEffect(() => {
      onStreamingChange?.(isStreaming);
    }, [isStreaming, onStreamingChange]);

    useEffect(() => {
      if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join('');

          setTranscript(transcript);

          if (handleInputChange) {
            const syntheticEvent = {
              target: { value: transcript },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            handleInputChange(syntheticEvent);
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        setRecognition(recognition);
      }
    }, []);

    useEffect(() => {
      if (typeof window !== 'undefined') {
        let parsedApiKeys: Record<string, string> | undefined = {};

        try {
          parsedApiKeys = getApiKeysFromCookies();
          setApiKeys(parsedApiKeys);
        } catch (error) {
          console.error('Error loading API keys from cookies:', error);
          Cookies.remove('apiKeys');
        }

        setIsModelLoading('all');
        fetch('/api/models')
          .then((response) => response.json())
          .then((data) => {
            const typedData = data as { modelList: ModelInfo[] };
            setModelList(typedData.modelList);
          })
          .catch((error) => {
            console.error('Error fetching model list:', error);
          })
          .finally(() => {
            setIsModelLoading(undefined);
          });
      }
    }, [providerList, provider]);

    const onApiKeysChange = async (providerName: string, apiKey: string) => {
      const newApiKeys = { ...apiKeys, [providerName]: apiKey };
      setApiKeys(newApiKeys);
      Cookies.set('apiKeys', JSON.stringify(newApiKeys));

      setIsModelLoading(providerName);

      let providerModels: ModelInfo[] = [];

      try {
        const response = await fetch(`/api/models/${encodeURIComponent(providerName)}`);
        const data = await response.json();
        providerModels = (data as { modelList: ModelInfo[] }).modelList;
      } catch (error) {
        console.error('Error loading dynamic models for:', providerName, error);
      }

      // Only update models for the specific provider
      setModelList((prevModels) => {
        const otherModels = prevModels.filter((model) => model.provider !== providerName);
        return [...otherModels, ...providerModels];
      });
      setIsModelLoading(undefined);
    };

    const startListening = () => {
      if (recognition) {
        recognition.start();
        setIsListening(true);
      }
    };

    const stopListening = () => {
      if (recognition) {
        recognition.stop();
        setIsListening(false);
      }
    };

    // 修改CSV解析工具函数
    const parseCSV = (csvContent: string): { headers: string[], data: Record<string, string>[] } => {
      // 移除BOM标记
      const cleanContent = csvContent.replace(/^\uFEFF/, '');
      
      // 分割行，处理Windows和Unix换行符
      const rows = cleanContent.split(/\r?\n/).filter(row => row.trim());
      
      if (rows.length === 0) {
        throw new Error('CSV文件为空');
      }

      // 解析表头
      const rawHeaders = parseCSVRow(rows[0]);
      if (rawHeaders.length === 0) {
        throw new Error('CSV文件必须包含表头');
      }

      // 处理空列名和重复列名
      const headerCounts: Record<string, number> = {};
      const emptyColumnIndices: number[] = [];
      
      const headers = rawHeaders.map((header, index) => {
        const trimmedHeader = header.trim();
        
        if (!trimmedHeader) {
          // 记录空列名的索引
          emptyColumnIndices.push(index);
          // 生成默认列名
          const defaultHeader = `Column_${index + 1}`;
          return defaultHeader;
        }
        
        if (headerCounts[trimmedHeader]) {
          headerCounts[trimmedHeader]++;
          return `${trimmedHeader}_${headerCounts[trimmedHeader]}`;
        } else {
          headerCounts[trimmedHeader] = 1;
          return trimmedHeader;
        }
      });

      // 如果有空列名，显示警告
      if (emptyColumnIndices.length > 0) {
        toast.warning(`发现${emptyColumnIndices.length}个空列名，已自动命名为Column_1, Column_2等`);
      }

      // 如果有重复列名，显示警告
      const duplicateHeaders = Object.entries(headerCounts)
        .filter(([_, count]) => count > 1)
        .map(([header]) => header);
        
      if (duplicateHeaders.length > 0) {
        toast.warning(`发现重复列名: ${duplicateHeaders.join(', ')}，已自动添加后缀区分`);
      }

      // 解析数据行
      const data = rows.slice(1).map((row, index) => {
        const values = parseCSVRow(row);
        const rowData: Record<string, string> = {};
        
        // 智能处理列数不匹配的情况
        if (values.length < headers.length) {
          // 如果数据行的列数少于表头，用空字符串填充
          const paddedValues = [...values, ...Array(headers.length - values.length).fill('')];
          headers.forEach((header, i) => {
            rowData[header] = paddedValues[i].trim();
          });
          toast.warning(`第${index + 2}行的列数少于表头，已自动填充空值`);
        } else if (values.length > headers.length) {
          // 如果数据行的列数多于表头，截断多余的值
          headers.forEach((header, i) => {
            rowData[header] = values[i].trim();
          });
          toast.warning(`第${index + 2}行的列数多于表头，已自动截断多余的值`);
        } else {
          // 列数匹配，正常处理
          headers.forEach((header, i) => {
            rowData[header] = values[i].trim();
          });
        }
        
        return rowData;
      });

      return { headers, data };
    };

    // 解析单行CSV数据
    const parseCSVRow = (row: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        
        if (char === '"') {
          if (inQuotes && row[i + 1] === '"') {
            // 处理双引号转义
            current += '"';
            i++;
          } else {
            // 切换引号状态
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          // 字段分隔符
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      
      // 添加最后一个字段
      result.push(current);
      
      return result;
    };

    const handleFileUpload = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,.csv';

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];

        if (file) {
          // 检查用户是否已登录
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            toast.error('请先登录后再上传文件');
            return;
          }

          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const base64Image = e.target?.result as string;
              if (setUploadedFiles && setImageDataList) {
                setUploadedFiles([...uploadedFiles, file]);
                setImageDataList([...imageDataList, base64Image]);
              }
            };
            reader.readAsDataURL(file);
          } else {
            const reader = new FileReader();
            
            // 设置解析状态为进行中
            setCsvData({
              headers: [],
              data: [],
              fileName: file.name,
              rowCount: 0,
              parseStatus: 'parsing'
            });
            
            reader.onload = async (e) => {
              const csvContent = e.target?.result as string;
              try {
                // 使用改进的CSV解析函数
                const { headers, data } = parseCSV(csvContent);
                
                // 检查数据完整性
                const hasEmptyCells = data.some(row => 
                  Object.values(row).some(value => value === '')
                );
                
                if (hasEmptyCells) {
                  toast.warning('CSV文件包含空单元格，这可能会影响分析结果');
                }

                // Store CSV data for later use
                setCsvData({
                  headers,
                  data,
                  fileName: file.name,
                  rowCount: data.length,
                  parseStatus: 'success'
                });
                
                // Add file to uploaded files
                if (setUploadedFiles) {
                  setUploadedFiles([...uploadedFiles, file]);
                }

                // 上传文件到 Supabase storage
                try {
                  // 调用 processFile 处理文件
                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('workflowId', workflowId || '');

                  const response = await fetch('/api/chat', {
                    method: 'POST',
                    body: formData
                  });

                  if (!response.ok) {
                    throw new Error('Failed to process file');
                  }

                  const result = await response.json();
                  console.log('File processing result:', result);
                } catch (error) {
                  console.error('Error processing file:', error);
                  toast.error('文件处理失败');
                }
                
                // 显示成功提示
                toast.success(`CSV文件 "${file.name}" 解析成功，共 ${data.length} 行数据，${headers.length} 列`);
                
                // 自动显示预览
                setShowCSVPreview(true);
              } catch (error) {
                console.error('Error parsing CSV:', error);
                setCsvData({
                  headers: [],
                  data: [],
                  fileName: file.name,
                  rowCount: 0,
                  parseStatus: 'error',
                  errorMessage: error instanceof Error ? error.message : '解析CSV文件失败'
                });
                toast.error(`CSV文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
              }
            };
            reader.readAsText(file);
          }
        }
      };

      input.click();
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;

      if (!items) {
        return;
      }

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();

          const file = item.getAsFile();

          if (file) {
            const reader = new FileReader();

            reader.onload = (e) => {
              const base64Image = e.target?.result as string;
              setUploadedFiles?.([...uploadedFiles, file]);
              setImageDataList?.([...imageDataList, base64Image]);
            };
            reader.readAsDataURL(file);
          }

          break;
        }
      }
    };

    // 添加事件监听器来处理隐藏消息
    useEffect(() => {
      const handleHiddenMessage = (event: CustomEvent) => {
        const hiddenMessage = event.detail;
        // 这里可以处理隐藏消息，例如将其添加到消息列表中但不显示
        // 或者通过其他方式传递给AI
        console.log('Hidden message received:', hiddenMessage);
        
        // 如果需要，可以将隐藏消息添加到消息列表中
        // 但标记为不显示
        if (messages && typeof messages === 'object') {
          // 这里需要根据您的消息处理逻辑来实现
          // 例如，可以添加一个特殊的标记，表示这条消息不应该显示
        }
      };
      
      // 添加事件监听器
      window.addEventListener('sendHiddenMessage', handleHiddenMessage as EventListener);
      
      // 清理函数
      return () => {
        window.removeEventListener('sendHiddenMessage', handleHiddenMessage as EventListener);
      };
    }, [messages]);

    const baseChat = (
      <div
        ref={ref}
        className={classNames(styles.BaseChat, 'flex h-full w-full fixed bottom-0 left-0 z-50 w-[600px] h-[600px] overflow-hidden bg-black/90 border border-bolt-elements-borderColor rounded-tl-lg shadow-lg')}

        data-chat-visible={showChat}
      >
        <ClientOnly>{() => <Menu />}</ClientOnly>
        <div ref={scrollRef} className="flex flex-col lg:flex-row overflow-hidden w-full h-full">
          <div className={classNames(styles.Chat, 'flex flex-col flex-grow lg:min-w-[var(--chat-min-width)] h-full')}>
            {!chatStarted && (
              <div id="intro" className="mt-[18vh] max-w-chat mx-auto text-center px-4 lg:px-0">
                <h1 className="text-3xl lg:text-6xl font-bold text-bolt-elements-textPrimary mb-6 animate-fade-in bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI碳咨询顾问
                </h1>
                <p className="text-md lg:text-xl mb-12 text-bolt-elements-textSecondary animate-fade-in animation-delay-200">
                  让AI协助您进行碳足迹评估、减排规划与可持续发展咨询
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-blue-500/50 transition-all duration-300">
                    <div className="text-4xl mb-4 text-blue-500">1</div>
                    <h3 className="text-lg font-semibold mb-2 text-bolt-elements-textPrimary">行业类型</h3>
                    <p className="text-sm text-bolt-elements-textSecondary">请选择您所属的行业领域</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-blue-500/50 transition-all duration-300">
                    <div className="text-4xl mb-4 text-purple-500">2</div>
                    <h3 className="text-lg font-semibold mb-2 text-bolt-elements-textPrimary">产品信息</h3>
                    <p className="text-sm text-bolt-elements-textSecondary">提供产品详细信息</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-blue-500/50 transition-all duration-300">
                    <div className="text-4xl mb-4 text-indigo-500">3</div>
                    <h3 className="text-lg font-semibold mb-2 text-bolt-elements-textPrimary">BOM清单</h3>
                    <p className="text-sm text-bolt-elements-textSecondary">上传您的物料清单（如有）</p>
                  </div>
                </div>
              </div>
            )}
            <div
              className={classNames('flex flex-col h-full', {
                'pt-12 px-2 sm:px-6': chatStarted,
              })}
              ref={scrollRef}
            >
              <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth pb-80">
                <ClientOnly>
                  {() => {
                    return chatStarted ? (
                      <Messages
                        ref={messageRef}
                        className="flex flex-col w-full flex-1 max-w-chat pb-6 mx-auto z-50 animate-fade-in"
                        messages={messages}
                        isStreaming={isStreaming}
                      />
                    ) : null;
                  }}
                </ClientOnly>
              </div>
              
              <div className="flex-shrink-0 mt-auto transition-all duration-300">
                {supabaseAlert && (
                  <SupabaseChatAlert
                    alert={supabaseAlert}
                    clearAlert={() => clearSupabaseAlert?.()}
                    postMessage={(message) => {
                      sendMessage?.({} as any, message);
                      clearSupabaseAlert?.();
                    }}
                  />
                )}
                <div
                  className={classNames('flex flex-col gap-4 w-full max-w-chat mx-auto z-40', {
                    'sticky bottom-0 bg-gradient-to-b from-transparent via-black/30 to-black/50 backdrop-blur-sm': chatStarted,
                  })}
                >
                  <div className="bg-bolt-elements-background-depth-2/50 backdrop-blur-sm rounded-lg border border-bolt-elements-borderColor/50">
                    {actionAlert && (
                      <ChatAlert
                        alert={actionAlert}
                        clearAlert={() => clearAlert?.()}
                        postMessage={(message) => {
                          sendMessage?.({} as any, message);
                          clearAlert?.();
                        }}
                      />
                    )}
                  </div>
                  {progressAnnotations && <ProgressCompilation data={progressAnnotations} />}
                  <div
                    className={classNames(
                      'bg-bolt-elements-background-depth-2 p-3 rounded-lg border border-bolt-elements-borderColor relative w-full max-w-chat mx-auto z-prompt',

                      /*
                       * {
                       *   'sticky bottom-2': chatStarted,
                       * },
                       */
                    )}
                  >
                    <svg className={classNames(styles.PromptEffectContainer)}>
                      <defs>
                        <linearGradient
                          id="line-gradient"
                          x1="20%"
                          y1="0%"
                          x2="-14%"
                          y2="10%"
                          gradientUnits="userSpaceOnUse"
                          gradientTransform="rotate(-45)"
                        >
                          <stop offset="0%" stopColor="#b44aff" stopOpacity="0%"></stop>
                          <stop offset="40%" stopColor="#b44aff" stopOpacity="80%"></stop>
                          <stop offset="50%" stopColor="#b44aff" stopOpacity="80%"></stop>
                          <stop offset="100%" stopColor="#b44aff" stopOpacity="0%"></stop>
                        </linearGradient>
                        <linearGradient id="shine-gradient">
                          <stop offset="0%" stopColor="white" stopOpacity="0%"></stop>
                          <stop offset="40%" stopColor="#ffffff" stopOpacity="80%"></stop>
                          <stop offset="50%" stopColor="#ffffff" stopOpacity="80%"></stop>
                          <stop offset="100%" stopColor="white" stopOpacity="0%"></stop>
                        </linearGradient>
                      </defs>
                      <rect className={classNames(styles.PromptEffectLine)} pathLength="100" strokeLinecap="round"></rect>
                      <rect className={classNames(styles.PromptShine)} x="48" y="24" width="70" height="1"></rect>
                    </svg>
                    <div>
                      <ClientOnly>
                        {() => (
                          <div className={isModelSettingsCollapsed ? 'hidden' : ''}>
                            <ModelSelector
                              key={provider?.name + ':' + modelList.length}
                              model={model}
                              setModel={setModel}
                              modelList={modelList}
                              provider={provider}
                              setProvider={setProvider}
                              providerList={providerList || (PROVIDER_LIST as ProviderInfo[])}
                              apiKeys={apiKeys}
                              modelLoading={isModelLoading}
                            />
                            {(providerList || []).length > 0 &&
                              provider &&
                              (!LOCAL_PROVIDERS.includes(provider.name) || 'OpenAILike') && (
                                <APIKeyManager
                                  provider={provider}
                                  apiKey={apiKeys[provider.name] || ''}
                                  setApiKey={(key) => {
                                    onApiKeysChange(provider.name, key);
                                  }}
                                />
                              )}
                          </div>
                        )}
                      </ClientOnly>
                    </div>
                    <FilePreview
                      files={uploadedFiles}
                      imageDataList={imageDataList}
                      onRemove={(index) => {
                        // 检查是否删除了CSV文件
                        const fileToRemove = uploadedFiles[index];
                        if (fileToRemove && (fileToRemove.type === 'text/csv' || fileToRemove.name.endsWith('.csv'))) {
                          setCsvData(null);
                        }
                        
                        setUploadedFiles?.(uploadedFiles.filter((_, i) => i !== index));
                        setImageDataList?.(imageDataList.filter((_, i) => i !== index));
                      }}
                    />
                    {csvData && showCSVPreview && (
                      <div className="mt-4 p-4 bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-sm font-medium">CSV预览: {csvData.fileName}</h3>
                          <button 
                            onClick={() => setShowCSVPreview(false)}
                            className="text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary"
                          >
                            <div className="i-ph:x text-lg"></div>
                          </button>
                        </div>
                        
                        {csvData.parseStatus === 'parsing' && (
                          <div className="flex items-center gap-2 text-sm text-bolt-elements-textTertiary">
                            <div className="i-svg-spinners:90-ring-with-bg text-bolt-elements-loader-progress text-xl animate-spin"></div>
                            正在解析CSV文件...
                          </div>
                        )}
                        
                        {csvData.parseStatus === 'success' && (
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="border-b border-bolt-elements-borderColor">
                                  {csvData.headers.map((header, index) => (
                                    <th key={index} className="px-4 py-2 text-left">{header}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {csvData.data.slice(0, 5).map((row, rowIndex) => (
                                  <tr key={rowIndex} className="border-b border-bolt-elements-borderColor/50">
                                    {csvData.headers.map((header, colIndex) => (
                                      <td key={colIndex} className="px-4 py-2">{row[header]}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {csvData.data.length > 5 && (
                              <div className="text-xs text-bolt-elements-textTertiary mt-2">
                                显示前5行，共 {csvData.data.length} 行数据
                              </div>
                            )}
                          </div>
                        )}
                        
                        {csvData.parseStatus === 'error' && (
                          <div className="text-sm text-red-500">
                            解析错误: {csvData.errorMessage}
                          </div>
                        )}
                      </div>
                    )}
                    <ClientOnly>
                      {() => (
                        <ScreenshotStateManager
                          setUploadedFiles={setUploadedFiles}
                          setImageDataList={setImageDataList}
                          uploadedFiles={uploadedFiles}
                          imageDataList={imageDataList}
                        />
                      )}
                    </ClientOnly>
                    <div
                      className={classNames(
                        'relative shadow-xs border border-bolt-elements-borderColor backdrop-blur rounded-lg',
                      )}
                    >
                      <textarea
                        ref={textareaRef}
                        className={classNames(
                          'w-full pl-4 pt-4 pr-16 outline-none resize-none text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary bg-transparent text-sm',
                          'transition-all duration-200',
                          'hover:border-bolt-elements-focus',
                        )}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.border = '2px solid #1488fc';
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.border = '2px solid #1488fc';
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.border = '1px solid var(--bolt-elements-borderColor)';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.border = '1px solid var(--bolt-elements-borderColor)';

                          const files = Array.from(e.dataTransfer.files);
                          files.forEach((file) => {
                            if (file.type.startsWith('image/')) {
                              const reader = new FileReader();

                              reader.onload = (e) => {
                                const base64Image = e.target?.result as string;
                                setUploadedFiles?.([...uploadedFiles, file]);
                                setImageDataList?.([...imageDataList, base64Image]);
                              };
                              reader.readAsDataURL(file);
                            }
                          });
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            if (event.shiftKey) {
                              return;
                            }

                            event.preventDefault();

                            if (isStreaming) {
                              handleStop?.();
                              return;
                            }

                            // ignore if using input method engine
                            if (event.nativeEvent.isComposing) {
                              return;
                            }

                            handleSendMessage?.(event);
                          }
                        }}
                        value={input}
                        onChange={(event) => {
                          handleInputChange?.(event);
                        }}
                        onPaste={handlePaste}
                        style={{
                          minHeight: TEXTAREA_MIN_HEIGHT,
                          maxHeight: TEXTAREA_MAX_HEIGHT,
                        }}
                        placeholder="您好, 我能帮你完成你的碳排放报告, 请你说出你的需求?"
                        translate="no"
                      />
                      <ClientOnly>
                        {() => (
                          <SendButton
                            show={input.length > 0 || isStreaming || uploadedFiles.length > 0}
                            isStreaming={isStreaming}
                            disabled={!providerList || providerList.length === 0}
                            onClick={(event) => {
                              if (isStreaming) {
                                handleStop?.();
                                return;
                              }

                              if (input.length > 0 || uploadedFiles.length > 0) {
                                handleSendMessage?.(event);
                              }
                            }}
                          />
                        )}
                      </ClientOnly>
                      <div className="flex justify-between items-center text-sm p-4 pt-2">
                        <div className="flex gap-1 items-center">
                          <IconButton title="Upload file" className="transition-all" onClick={() => handleFileUpload()}>
                            <div className="i-ph:paperclip text-xl"></div>
                          </IconButton>
                          <IconButton
                            title="Enhance prompt"
                            disabled={input.length === 0 || enhancingPrompt}
                            className={classNames('transition-all', enhancingPrompt ? 'opacity-100' : '')}
                            onClick={() => {
                              enhancePrompt?.();
                              toast.success('Prompt enhanced!');
                            }}
                          >
                            {enhancingPrompt ? (
                              <div className="i-svg-spinners:90-ring-with-bg text-bolt-elements-loader-progress text-xl animate-spin"></div>
                            ) : (
                              <div className="i-bolt:stars text-xl"></div>
                            )}
                          </IconButton>

                          <SpeechRecognitionButton
                            isListening={isListening}
                            onStart={startListening}
                            onStop={stopListening}
                            disabled={isStreaming}
                          />
                          {chatStarted && <ClientOnly>{() => <ExportChatButton exportChat={exportChat} />}</ClientOnly>}
                          <IconButton
                            title="Model Settings"
                            className={classNames('transition-all flex items-center gap-1', {
                              'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent':
                                isModelSettingsCollapsed,
                              'bg-bolt-elements-item-backgroundDefault text-bolt-elements-item-contentDefault':
                                !isModelSettingsCollapsed,
                            })}
                            onClick={() => setIsModelSettingsCollapsed(!isModelSettingsCollapsed)}
                            disabled={!providerList || providerList.length === 0}
                          >
                            <div className={`i-ph:caret-${isModelSettingsCollapsed ? 'right' : 'down'} text-lg`} />
                            {isModelSettingsCollapsed ? <span className="text-xs">{model}</span> : <span />}
                          </IconButton>
                        </div>
                        {input.length > 3 ? (
                          <div className="text-xs text-bolt-elements-textTertiary">
                            Use <kbd className="kdb px-1.5 py-0.5 rounded bg-bolt-elements-background-depth-2">Shift</kbd>{' '}
                            + <kbd className="kdb px-1.5 py-0.5 rounded bg-bolt-elements-background-depth-2">Return</kbd>{' '}
                            a new line
                          </div>
                        ) : null}
                        <SupabaseConnection />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-5">
              {!chatStarted && (
                <div className="flex justify-center gap-2">
                  {ImportButtons(importChat)}
                  <GitCloneButton importChat={importChat} />
                </div>
              )}
              {!chatStarted &&
                ExamplePrompts((event, messageInput) => {
                  if (isStreaming) {
                    handleStop?.();
                    return;
                  }

                  handleSendMessage?.(event, messageInput);
                })}
              {!chatStarted && <StarterTemplates />}
            </div>
          </div>
          <ClientOnly>
            {() => (
              <Workbench
                actionRunner={actionRunner ?? ({} as ActionRunner)}
                chatStarted={chatStarted}
                isStreaming={isStreaming}
              />
            )}
          </ClientOnly>
        </div>
      </div>
    );

    return <Tooltip.Provider delayDuration={200}>{baseChat}</Tooltip.Provider>;
  },
);
