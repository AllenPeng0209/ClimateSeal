import React from 'react';
import { Tabs, List, Typography, Tag } from 'antd';
import './TaskTrackingSection.css';
import { Link } from '@remix-run/react';
import { AppstoreOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

interface CarbonFootprintTask {
  id: string;
  serialNumber: number;
  name: string;
  product: string;
  aiAgent: string;
  status: string;
  updatedAt: string;
}

interface OtherTask {
  id: string;
  serialNumber: number;
  name: string;
  type: string;
  status: string;
  updatedAt: string;
}

interface TaskTrackingSectionProps {
  carbonFootprintTasks: CarbonFootprintTask[];
  otherTasks: OtherTask[];
  onTaskClick: (taskId: string, taskType: 'carbon' | 'other') => void;
}

const TaskTrackingSection: React.FC<TaskTrackingSectionProps> = ({
  carbonFootprintTasks,
  otherTasks,
  onTaskClick
}) => {
  const menuItems = [
    {
      key: '/dashboard',
      icon: <AppstoreOutlined />,
      label: <Link to="/dashboard">工作台</Link>,
    },
    // ... 其他菜单项
  ];

  return (
    <div className="task-tracking-section">
      <Title level={4}>任务跟踪</Title>
      <Tabs defaultActiveKey="carbon-tasks">
        <TabPane tab="进行中碳足迹核算任务" key="carbon-tasks">
          <List
            className="task-list"
            dataSource={carbonFootprintTasks.sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            )}
            renderItem={task => (
              <List.Item 
                className="task-item"
                onClick={() => onTaskClick(task.id, 'carbon')}
              >
                <div className="task-content">
                  <div className="task-header">
                    <Text strong>{`${task.serialNumber}. ${task.name}`}</Text>
                    <Text type="secondary">{task.updatedAt}</Text>
                  </div>
                  <div className="task-info">
                    <Text type="secondary">产品：{task.product}</Text>
                    <Text type="secondary">AI Agent：{task.aiAgent}</Text>
                    <Tag color="processing">进行中</Tag>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </TabPane>
        <TabPane tab="其他待办任务" key="other-tasks">
          <List
            className="task-list"
            dataSource={otherTasks.sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            )}
            renderItem={task => (
              <List.Item
                className="task-item"
                onClick={() => onTaskClick(task.id, 'other')}
              >
                <div className="task-content">
                  <div className="task-header">
                    <Text strong>{`${task.serialNumber}. ${task.name}`}</Text>
                    <Text type="secondary">{task.updatedAt}</Text>
                  </div>
                  <div className="task-info">
                    <Text type="secondary">类型：{task.type}</Text>
                    <Tag color="processing">进行中</Tag>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default TaskTrackingSection; 