import React from 'react';
import { Card, Input, Typography, List } from 'antd';
import {
  RobotOutlined,
  BatteryOutlined,
  FileProtectOutlined,
} from '@ant-design/icons';
import './AIInteractionSection.css';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface ChatHistory {
  id: string;
  title: string;
  timestamp: string;
}

interface AIInteractionSectionProps {
  chatHistory: ChatHistory[];
  onSendMessage: (message: string, agentId: string | null) => void;
  onAgentSelect: (agentId: string) => void;
  onChatSelect: (chatId: string) => void;
}

const AIInteractionSection: React.FC<AIInteractionSectionProps> = ({
  chatHistory,
  onSendMessage,
  onAgentSelect,
  onChatSelect
}) => {
  const [selectedAgent, setSelectedAgent] = React.useState<string | null>(null);
  const [chatInput, setChatInput] = React.useState("");

  const aiAgents = [
    {
      id: "iso14067",
      name: "ISO14067专家",
      icon: <RobotOutlined />,
      description: "专注于产品碳足迹核算标准解读与应用"
    },
    {
      id: "battery",
      name: "欧盟新电池法专家",
      icon: <BatteryOutlined />,
      description: "专注于电池产品碳足迹计算与合规"
    },
    {
      id: "epd",
      name: "EPD专家",
      icon: <FileProtectOutlined />,
      description: "专注于环境产品声明的编制与验证"
    }
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      setChatInput(prev => prev + '\n');
      e.preventDefault();
    } else if (e.key === 'Enter' && !e.ctrlKey) {
      handleSendMessage();
      e.preventDefault();
    }
  };

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      onSendMessage(chatInput, selectedAgent);
      setChatInput("");
    }
  };

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId);
    onAgentSelect(agentId);
  };

  return (
    <div className="ai-interaction-section">
      <Title level={4}>今天您想了解点什么？</Title>
      
      <div className="agent-section">
        <Text>使用适合的AI碳足迹Agent，建立、跟踪碳足迹核算任务：</Text>
        <div className="agent-cards">
          {aiAgents.map(agent => (
            <Card
              key={agent.id}
              hoverable
              className={`agent-card ${selectedAgent === agent.id ? 'selected' : ''}`}
              onClick={() => handleAgentSelect(agent.id)}
            >
              <Card.Meta
                avatar={agent.icon}
                title={agent.name}
                description={agent.description}
              />
            </Card>
          ))}
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-history">
          <Title level={5}>历史对话</Title>
          <List
            size="small"
            dataSource={chatHistory}
            renderItem={item => (
              <List.Item 
                className="chat-history-item"
                onClick={() => onChatSelect(item.id)}
              >
                <Text>{item.title}</Text>
                <Text type="secondary">{item.timestamp}</Text>
              </List.Item>
            )}
          />
        </div>

        <div className="chat-main">
          <div className="message-container">
            {/* 消息展示区域 */}
          </div>
          
          <div className="input-area">
            <TextArea
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="请输入您的问题...(按Enter发送，Ctrl+Enter换行)"
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInteractionSection; 