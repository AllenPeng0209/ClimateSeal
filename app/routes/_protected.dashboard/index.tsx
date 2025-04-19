import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { Layout, Typography, Tabs, Input, Card, List, Avatar, Table, Button, Tag, message } from "antd";
import { useAuthContext } from "~/contexts/AuthContext";
import "~/styles/workbench.css";
import { useState } from "react";

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

export default function DashboardIndex() {
  const { carbonFootprintTasks, otherTasks, chatHistory, aiAgents } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSendMessage = () => {
    if (!message.trim()) {
      message.warning("请输入消息内容");
      return;
    }

    // 添加用户消息
    const userMessage = {
      id: `msg-${Date.now()}`,
      content: message,
      sender: 'user' as const,
      timestamp: new Date().toLocaleString(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    // 模拟AI响应
    setTimeout(() => {
      const aiMessage = {
        id: `msg-${Date.now() + 1}`,
        content: "感谢您的提问。我是您的AI助手，可以帮助您解答关于碳足迹核算的问题。请问您需要了解哪些具体内容？",
        sender: 'ai' as const,
        timestamp: new Date().toLocaleString(),
      };
      setChatMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="workbench-container">
      <Title level={2}>工作台</Title>
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
          
          {/* 对话消息区域 */}
          <div className="chat-messages">
            {chatMessages.map(msg => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                <div className="message-content">
                  <Text>{msg.content}</Text>
                  <Text type="secondary" className="message-time">{msg.timestamp}</Text>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message ai">
                <div className="message-content">
                  <Text>正在思考...</Text>
                </div>
              </div>
            )}
          </div>

          <div className="ai-input-container">
            <TextArea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="请输入您的问题..."
              autoSize={{ minRows: 4, maxRows: 6 }}
              className="ai-input"
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button 
              type="primary" 
              onClick={handleSendMessage} 
              className="send-button"
              loading={isLoading}
            >
              发送
            </Button>
          </div>
          
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
                  <Title level={5}>{agent.name}</Title>
                  <Text type="secondary">{agent.description}</Text>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧：任务跟踪区域 */}
        <div className="task-tracking-area">
          <Title level={4}>任务跟踪</Title>
          <Tabs defaultActiveKey="carbon">
            <TabPane tab="碳足迹核算任务" key="carbon">
              <div className="task-cards">
                {carbonFootprintTasks.map(task => (
                  <Card
                    key={task.id}
                    className="task-card"
                    onClick={() => handleTaskClick(task.id, 'carbon')}
                  >
                    <div className="task-card-header">
                      <Text strong>{task.name}</Text>
                      <Tag color="blue">{task.status}</Tag>
                    </div>
                    <div className="task-card-content">
                      <div className="task-info-item">
                        <Text type="secondary">核算产品：</Text>
                        <Text>{task.product}</Text>
                      </div>
                      <div className="task-info-item">
                        <Text type="secondary">AI Agent：</Text>
                        <Text>{task.aiAgent}</Text>
                      </div>
                      <div className="task-info-item">
                        <Text type="secondary">更新时间：</Text>
                        <Text>{task.updatedAt}</Text>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabPane>
            <TabPane tab="其他待办任务" key="other">
              <div className="task-cards">
                {otherTasks.map(task => (
                  <Card
                    key={task.id}
                    className="task-card"
                    onClick={() => handleTaskClick(task.id, 'other')}
                  >
                    <div className="task-card-header">
                      <Text strong>{task.name}</Text>
                      <Tag color="blue">{task.status}</Tag>
                    </div>
                    <div className="task-card-content">
                      <div className="task-info-item">
                        <Text type="secondary">任务类型：</Text>
                        <Text>{task.type}</Text>
                      </div>
                      <div className="task-info-item">
                        <Text type="secondary">更新时间：</Text>
                        <Text>{task.updatedAt}</Text>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabPane>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 