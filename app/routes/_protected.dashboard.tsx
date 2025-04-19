import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { Layout, Typography, Tabs, Input, Card, List, Avatar, Table } from "antd";
import { useAuthContext } from "~/contexts/AuthContext";
import DashboardLayout from "~/components/dashboard/DashboardLayout";
import "~/styles/workbench.css";

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

export async function loader({ request }: LoaderFunctionArgs) {
  // 获取进行中的碳足迹核算任务
  const carbonFootprintTasks = [
    {
      id: "task-1",
      serialNumber: 1,
      name: "产品A碳足迹核算",
      product: "产品A",
      aiAgent: "ISO14067专家",
      status: "进行中",
      updatedAt: "2024-04-07 14:30:00"
    },
  ];

  // 获取其他待办任务
  const otherTasks = [
    {
      id: "other-1",
      serialNumber: 1,
      name: "供应商数据审核",
      type: "数据审核",
      status: "进行中",
      updatedAt: "2024-04-07 15:00:00"
    },
  ];

  // 获取历史对话记录
  const chatHistory = [
    {
      id: "chat-1",
      title: "产品A碳足迹分析讨论",
      timestamp: "2024-04-07 13:00:00"
    },
  ];

  // AI Agents数据
  const aiAgents = [
    {
      id: "agent-1",
      name: "ISO14067专家",
      icon: "🌍",
      description: "专业的碳足迹核算专家，帮助您完成产品碳足迹核算"
    },
    {
      id: "agent-2",
      name: "欧盟新电池法专家",
      icon: "🔋",
      description: "欧盟新电池法规专家，协助您完成电池碳足迹核算"
    },
    {
      id: "agent-3",
      name: "EPD专家",
      icon: "📊",
      description: "环境产品声明专家，帮助您完成EPD报告编制"
    }
  ];

  return json({
    carbonFootprintTasks,
    otherTasks,
    chatHistory,
    aiAgents
  });
}

export default function Dashboard() {
  const { carbonFootprintTasks, otherTasks, chatHistory, aiAgents } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const handleTaskClick = (taskId: string, taskType: 'carbon' | 'other') => {
    if (taskType === 'carbon') {
      navigate(`/carbon-footprint/${taskId}`);
    } else {
      navigate(`/task/${taskId}`);
    }
  };

  const handleAgentSelect = (agentId: string) => {
    navigate(`/carbon-footprint/new?agent=${agentId}`);
  };

  const handleChatSelect = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  // 碳足迹核算任务表格列定义
  const carbonFootprintColumns = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 60,
    },
    {
      title: '核算任务名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '核算产品',
      dataIndex: 'product',
      key: 'product',
    },
    {
      title: 'AI Agent',
      dataIndex: 'aiAgent',
      key: 'aiAgent',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
    },
  ];

  // 其他待办任务表格列定义
  const otherTaskColumns = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 60,
    },
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '任务类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
    },
  ];

  return (
    <DashboardLayout>
      <div className="workbench-container">
        <div className="workbench-content">
          {/* 左侧：历史对话记录 */}
          <div className="chat-history-area">
            <Title level={4}>历史对话</Title>
            <List
              dataSource={chatHistory}
              renderItem={chat => (
                <List.Item onClick={() => handleChatSelect(chat.id)}>
                  <Text>{chat.title}</Text>
                  <Text type="secondary">{chat.timestamp}</Text>
                </List.Item>
              )}
            />
          </div>

          {/* 中间：AI交互区域 */}
          <div className="ai-interaction-area">
            <Title level={3}>今天您想了解点什么？</Title>
            <TextArea
              placeholder="请输入您的问题..."
              autoSize={{ minRows: 4, maxRows: 6 }}
              className="ai-input"
            />
            
            <div className="ai-agents-section">
              <Text>使用适合的AI碳足迹Agent，建立、跟踪碳足迹核算任务：</Text>
              <div className="ai-agents-list">
                {aiAgents.map(agent => (
                  <Card
                    key={agent.id}
                    className="agent-card"
                    onClick={() => handleAgentSelect(agent.id)}
                  >
                    <Avatar size={40}>{agent.icon}</Avatar>
                    <Title level={4}>{agent.name}</Title>
                    <Text type="secondary">{agent.description}</Text>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：任务跟踪区域 */}
          <div className="task-tracking-area">
            <Title level={3}>任务跟踪</Title>
            <Tabs defaultActiveKey="carbon">
              <TabPane tab="进行中碳足迹核算任务" key="carbon">
                <Table
                  dataSource={carbonFootprintTasks}
                  columns={carbonFootprintColumns}
                  rowKey="id"
                  pagination={false}
                  onRow={(record) => ({
                    onClick: () => handleTaskClick(record.id, 'carbon'),
                    style: { cursor: 'pointer' }
                  })}
                />
              </TabPane>
              <TabPane tab="其他待办任务" key="other">
                <Table
                  dataSource={otherTasks}
                  columns={otherTaskColumns}
                  rowKey="id"
                  pagination={false}
                  onRow={(record) => ({
                    onClick: () => handleTaskClick(record.id, 'other'),
                    style: { cursor: 'pointer' }
                  })}
                />
              </TabPane>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 