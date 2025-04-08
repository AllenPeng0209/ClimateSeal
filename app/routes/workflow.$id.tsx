import { json, type LoaderFunction } from "@remix-run/cloudflare";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useEffect } from "react";
import { message } from "antd";

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
  };
}

// 验证工作流ID格式
const isValidWorkflowId = (id: string): boolean => {
  // UUID格式验证
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const loader: LoaderFunction = async ({ params }) => {
  const { id } = params;

  // 处理新建工作流的情况
  if (id === "new") {
    return json({ workflow: null });
  }

  // 验证工作流ID格式
  if (!id || !isValidWorkflowId(id)) {
    return json({ error: "无效的工作流ID格式" }, { status: 400 });
  }

  try {
    // 这里可以添加从后端获取工作流数据的逻辑
    // 暂时返回模拟数据
    return json({
      workflow: {
        id,
        name: "示例工作流",
        description: "这是一个示例工作流",
        total_carbon_footprint: 0,
        created_at: new Date().toISOString(),
        nodes: [],
        edges: []
      }
    });
  } catch (error) {
    return json({ error: "获取工作流数据失败" }, { status: 500 });
  }
};

export default function WorkflowPage() {
  const { error, workflow } = useLoaderData<LoaderData>();
  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      message.error(error);
      // 延迟重定向，让用户能看到错误消息
      setTimeout(() => {
        navigate("/");
      }, 1500);
    }
  }, [error, navigate]);

  if (error) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>错误</h2>
        <p>{error}</p>
        <p>正在返回首页...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>工作流详情</h1>
      {workflow ? (
        <div>
          <h2>{workflow.name}</h2>
          <p>{workflow.description}</p>
          <p>碳足迹: {workflow.total_carbon_footprint}</p>
          <p>创建时间: {new Date(workflow.created_at).toLocaleString()}</p>
        </div>
      ) : (
        <div>
          <h2>创建新工作流</h2>
          {/* 这里可以添加工作流编辑器的组件 */}
        </div>
      )}
    </div>
  );
} 