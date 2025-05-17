import { json, type LoaderFunction, type ActionFunction, redirect } from "@remix-run/cloudflare";
import { useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { message } from "antd";
import { Chat } from "~/components/chat/Chat.client";
import { useStore } from "@nanostores/react";
import { themeStore } from "~/lib/stores/theme";
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { supabase } from "~/lib/supabase";

interface WorkflowResponse {
  workflow?: {
    id: string;
    name: string;
    description: string;
    created_at: string;
    industry_type?: string;
    editor_state?: any;
    scene_info?: any;
    model_score?: any;
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
    created_at: string;
    industry_type?: string;
    editor_state?: any;
    scene_info?: any;
    model_score?: any;
    is_public: boolean;
    status?: string;
    user_id?: string;
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

      const { data: { user }, error: userErr } = await supabase.auth.getUser(jwt);

      if (userErr || !user) {
        console.error('Action: getUser failed', userErr);
        return json({ error: "未登录" }, { status: 401 });
      }
      console.log('Action: Authenticated user', user.id);

      // Use the imported supabase client for the insert
      const { data: workflow, error } = await supabase
        .from('workflows')
        .insert({
          name: '新工作流',
          description: '这是一个新的碳足迹工作流',
          user_id: user.id,
          editor_state: { nodes: [], edges: [], viewport: { x:0, y:0, zoom:1 } },
          scene_info: {},
          model_score: {},
          is_public: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Action: Failed to create workflow:', error);
        return json({ error: "创建工作流失败" }, { status: 500 });
      }

      // 直接返回工作流数据，而不是重定向
      return json({ 
        workflow: {
          ...workflow,
          editor_state: workflow.editor_state || { nodes: [], edges: [], viewport: null },
          scene_info: workflow.scene_info || {},
          model_score: workflow.model_score || {}
        }
      });
    } catch (error) {
      console.error('Action: Error in workflow creation:', error);
      return json({ error: "创建工作流失败" }, { status: 500 });
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
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single();

    console.log('Fetched workflow from DB:', workflow);
    if (workflowError) {
      console.error('Failed to fetch workflow:', workflowError);
      return json({ error: "获取工作流数据失败" }, { status: 500 });
    }

    if (!workflow) {
      return json({ error: "工作流不存在" }, { status: 404 });
    }

    // No longer fetching nodes and edges separately. They are part of workflow.editor_state
    return json({ 
      workflow: {
        ...workflow,
        editor_state: workflow.editor_state || { nodes: [], edges: [], viewport: null },
        scene_info: workflow.scene_info || {},
        model_score: workflow.model_score || {}
      }
    });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return json({ error: "获取工作流数据失败" }, { status: 500 });
  }
};

export default function WorkflowPage() {
  const { error, workflow } = useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const theme = useStore(themeStore);
  const creationAttemptedRef = useRef(false);
  const isCreatingRef = useRef(false);

  console.log('WorkflowPage render:', { error, workflow, creationAttempted: creationAttemptedRef.current, isCreating: isCreatingRef.current });

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
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) {
            console.error('Component: User validation failed:', userError);
            message.error("未登录");
            return;
          }
          
          console.log('user.id', user.id);
          
          const { data: newWorkflow, error } = await supabase 
            .from('workflows')
            .insert({
              name: '新工作流',
              description: '这是一个新的碳足迹工作流',
              editor_state: { nodes: [], edges: [], viewport: { x:0, y:0, zoom:1 } },
              scene_info: {},
              model_score: {},
              is_public: false,
              user_id: user.id
            })
            .select()
            .single();

          if (error) {
            console.error('Component: Failed to create workflow:', error);
            message.error(`创建工作流失败: ${error.message}`);
            return;
          }

          if (newWorkflow) {
            console.log('Component: Workflow created successfully:', newWorkflow);
            // Simply navigate to the new workflow URL
            // The session cookie will be automatically included in the request
            navigate(`/workflow/${newWorkflow.id}`, { replace: true });
          } else {
            console.error('Component: No workflow data returned');
            message.error("创建工作流失败：未返回数据");
          }
        } catch (error) {
          console.error('Component: Error creating workflow:', error);
          message.error("创建工作流失败");
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <span>正在创建工作流...</span>
      </div>
    );
  }

  console.log('Rendering workflow page with workflow:', workflow);
  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
    </div>
  );
} 