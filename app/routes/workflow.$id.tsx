import { json, type LoaderFunction, type ActionFunction, redirect } from "@remix-run/cloudflare";
import { useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
import { useEffect, useRef, lazy, Suspense, useState } from "react";
import { message, Spin } from "antd";
import { supabase, supabaseCache } from "~/lib/supabase";
import { useStore } from "@nanostores/react";
import { themeStore } from "~/lib/stores/theme";
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';

// 使用懒加载减少首次加载体积
const Chat = lazy(() => import('~/components/chat/Chat.client').then(module => ({ default: module.Chat })));

// 添加超时Promise
const timeoutPromise = (ms: number) => new Promise((_, reject) => {
  setTimeout(() => reject(new Error('Request timeout')), ms);
});

// 定义类型
interface WorkflowResponse {
  workflow?: {
    id: string;
    name: string;
    description: string;
    total_carbon_footprint: number;
    created_at: string;
    industry_type?: string;
    nodes: any[];
    edges: any[];
    data: any;
    is_public: boolean;
  };
  error?: string;
}

interface LoaderData {
  error?: string;
  workflow?: {
    id: string;
    name: string;
    description: string;
    total_carbon_footprint: number;
    created_at: string;
    industry_type?: string;
    nodes: any[];
    edges: any[];
    data: any;
    is_public: boolean;
  };
}

// 验证工作流ID格式
const isValidWorkflowId = (id: string): boolean => {
  // UUID格式验证
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const action: ActionFunction = async ({ request }) => {
  console.log('Action: Starting workflow creation process');
  const formData = await request.formData();
  const intent = formData.get("intent");
  console.log('Action: Received intent:', intent);

  if (intent === "create") {
    try {
      const authHeader = request.headers.get("authorization") || "";
      const jwt = authHeader.replace(/Bearer\s+/i, "").trim();

      if (!jwt) {
        console.warn('Action: no Authorization header');
        return json({ error: "未登录" }, { status: 401 });
      }

      // 设置超时保护
      const userPromise = supabase.auth.getUser(jwt);
      const result = await Promise.race([
        userPromise,
        timeoutPromise(5000) // 5秒超时
      ]).catch(err => {
        console.error('Action: getUser timeout', err);
        return { data: { user: null }, error: new Error('获取用户信息超时') };
      });

      const { data: { user }, error: userErr } = result as any;

      if (userErr || !user) {
        console.error('Action: getUser failed', userErr);
        return json({ error: userErr ? userErr.message : "未登录" }, { status: 401 });
      }
      console.log('Action: Authenticated user', user.id);

      // 使用超时保护执行数据库插入
      const insertPromise = supabase
        .from('workflows')
        .insert({
          name: '新工作流',
          description: '这是一个新的碳足迹工作流',
          user_id: user.id,
          data: {},
          is_public: false,
          total_carbon_footprint: 0.0,
        })
        .select()
        .single();

      const insertResult = await Promise.race([
        insertPromise,
        timeoutPromise(8000) // 8秒超时
      ]).catch(err => {
        console.error('Action: insert timeout', err);
        return { data: null, error: new Error('创建工作流超时，请稍后再试') };
      });

      const { data: workflow, error } = insertResult as any;

      if (error) {
        console.error('Action: Failed to create workflow:', error);
        return json({ error: "创建工作流失败: " + error.message }, { status: 500 });
      }

      // 直接返回工作流数据，而不是重定向
      return json({ 
        workflow: {
          ...workflow,
          nodes: [],
          edges: []
        }
      });
    } catch (error: any) {
      console.error('Action: Error in workflow creation:', error);
      return json({ error: "创建工作流失败: " + (error.message || '未知错误') }, { status: 500 });
    }
  }

  return null;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  console.log('Loader: Starting with params:', params);
  const { id } = params;

  // 处理新建工作流的情况
  if (id === "new") {
    console.log('Loader: New workflow requested');
    return json({ workflow: null });
  }

  // 验证工作流ID格式
  if (!id || !isValidWorkflowId(id)) {
    return json({ error: "无效的工作流ID格式" }, { status: 400 });
  }

  try {
    // 并行请求以减少等待时间
    const [workflowResult, nodesResult, edgesResult] = await Promise.all([
      Promise.race([
        supabase.from('workflows').select('*').eq('id', id).single(),
        timeoutPromise(8000)
      ]).catch(err => ({ data: null, error: new Error('获取工作流数据超时') })),
      
      Promise.race([
        supabase.from('workflow_nodes').select('*').eq('workflow_id', id),
        timeoutPromise(5000)
      ]).catch(err => ({ data: [], error: null })),
      
      Promise.race([
        supabase.from('workflow_edges').select('*').eq('workflow_id', id),
        timeoutPromise(5000)
      ]).catch(err => ({ data: [], error: null }))
    ]);

    const { data: workflow, error: workflowError } = workflowResult as any;

    if (workflowError) {
      console.error('Failed to fetch workflow:', workflowError);
      return json({ error: "获取工作流数据失败: " + workflowError.message }, { status: 500 });
    }

    if (!workflow) {
      return json({ error: "工作流不存在" }, { status: 404 });
    }

    // 合并工作流数据，确保 nodes 和 edges 至少是空数组
    return json({ 
      workflow: {
        ...workflow,
        nodes: (nodesResult as any).data || [],
        edges: (edgesResult as any).data || []
      }
    });
  } catch (error: any) {
    console.error('Error fetching workflow:', error);
    return json({ error: "获取工作流数据失败: " + (error.message || '未知错误') }, { status: 500 });
  }
};

export default function WorkflowPage() {
  const { error, workflow } = useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const theme = useStore(themeStore);
  const creationAttemptedRef = useRef(false);
  const isCreatingRef = useRef(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('初始化工作流...');

  console.log('WorkflowPage render:', { error, workflow, creationAttempted: creationAttemptedRef.current, isCreating: isCreatingRef.current });

  // 进度条加载动画
  useEffect(() => {
    if (!workflow && !error) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          
          // 在不同阶段更新消息
          if (prev === 20) setLoadingMessage('连接数据库...');
          if (prev === 40) setLoadingMessage('获取用户信息...');
          if (prev === 60) setLoadingMessage('创建工作流...');
          if (prev === 80) setLoadingMessage('准备工作流界面...');
          
          return prev + 5;
        });
      }, 300);
      
      return () => clearInterval(interval);
    } else {
      setLoadingProgress(100);
    }
  }, [workflow, error]);

  useEffect(() => {
    if (error) {
      console.error('Component: Error detected:', error);
      message.error(error);
      setTimeout(() => {
        console.log('Component: Navigating to home page due to error');
        navigate("/dashboard");
      }, 1500);
    }
  }, [error, navigate]);

  // 如果是新工作流，自动提交创建请求
  useEffect(() => {
    if (!workflow && !creationAttemptedRef.current && !isCreatingRef.current) {
      isCreatingRef.current = true;
      creationAttemptedRef.current = true;
      console.log('Component: No workflow found, initiating creation');

      (async () => {
        try {
          console.log('Component: Getting user_id...');
          setLoadingMessage('获取用户信息...');
          
          // 使用带缓存的用户信息获取
          const { data: { user }, error: userError } = await supabaseCache.getUser();
          
          if (userError || !user) {
            console.error('Component: User validation failed:', userError);
            message.error("未登录");
            return;
          }
          
          console.log('user.id', user.id);
          setLoadingMessage('创建工作流...');
          
          const createPromise = supabase 
            .from('workflows')
            .insert({
              name: '新工作流',
              description: '这是一个新的碳足迹工作流',
              data: {}, 
              is_public: false,
              total_carbon_footprint: 0.0,
              user_id: user.id
            })
            .select()
            .single();
            
          // 添加超时保护
          const result = await Promise.race([
            createPromise,
            timeoutPromise(8000)
          ]).catch(err => {
            console.error('Component: workflow creation timeout', err);
            return { data: null, error: new Error('创建工作流超时，请稍后再试') };
          });
          
          const { data: newWorkflow, error } = result as any;

          if (error) {
            console.error('Component: Failed to create workflow:', error);
            message.error(`创建工作流失败: ${error.message}`);
            return;
          }

          if (newWorkflow) {
            console.log('Component: Workflow created successfully:', newWorkflow);
            setLoadingMessage('准备工作流界面...');
            // Simply navigate to the new workflow URL
            // The session cookie will be automatically included in the request
            navigate(`/workflow/${newWorkflow.id}`, { replace: true });
          } else {
            console.error('Component: No workflow data returned');
            message.error("创建工作流失败：未返回数据");
          }
        } catch (error: any) {
          console.error('Component: Error creating workflow:', error);
          message.error(`创建工作流失败: ${error.message || '未知错误'}`);
        } finally {
          isCreatingRef.current = false;
        }
      })();
    }
  }, [workflow, navigate, submit]);

  if (error) {
    console.log('Rendering error state');
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>错误</h2>
        <p>{error}</p>
        <p>正在返回首页...</p>
      </div>
    );
  }

  if (!workflow) {
    console.log('Rendering loading state');
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ 
          width: '400px', 
          textAlign: 'center',
          padding: '24px',
          borderRadius: '8px',
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '24px' }}>加载中</h2>
          <div style={{ marginBottom: '16px' }}>
            <Spin size="large" />
          </div>
          <div style={{ marginBottom: '16px' }}>
            {loadingMessage}
          </div>
          <div style={{ 
            height: '6px', 
            backgroundColor: '#f0f0f0', 
            borderRadius: '3px', 
            overflow: 'hidden' 
          }}>
            <div style={{ 
              height: '100%', 
              width: `${loadingProgress}%`, 
              backgroundColor: '#1890ff', 
              borderRadius: '3px',
              transition: 'width 0.3s ease-in-out'
            }} />
          </div>
        </div>
      </div>
    );
  }

  console.log('Rendering workflow page with workflow:', workflow);
  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <ClientOnly fallback={<BaseChat />}>
        {() => (
          <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Spin size="large" tip="加载工作流组件..." />
          </div>}>
            <Chat />
          </Suspense>
        )}
      </ClientOnly>
    </div>
  );
} 