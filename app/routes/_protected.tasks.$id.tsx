import { useParams } from "@remix-run/react";
import { Card, Descriptions, Typography } from "antd";
import "~/styles/tasks.css";

const { Title } = Typography;

// 模拟数据
const mockTaskDetails = {
  id: "TASK001",
  name: "2024年第一季度碳足迹核算",
  type: "核算任务",
  createTime: "2024-01-01",
  owner: "张三",
  status: "进行中",
  description: "对2024年第一季度的碳足迹进行核算",
  progress: "60%",
  lastUpdateTime: "2024-03-15",
  attachments: ["碳排放数据表.xlsx", "能源消耗记录.pdf"],
};

export default function TaskDetails() {
  const { id } = useParams();

  return (
    <div className="task-details-container">
      <Title level={2}>任务详情</Title>
      
      <Card className="task-details-card">
        <Descriptions bordered>
          <Descriptions.Item label="任务ID">{mockTaskDetails.id}</Descriptions.Item>
          <Descriptions.Item label="任务名称">{mockTaskDetails.name}</Descriptions.Item>
          <Descriptions.Item label="任务类型">{mockTaskDetails.type}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{mockTaskDetails.createTime}</Descriptions.Item>
          <Descriptions.Item label="负责人">{mockTaskDetails.owner}</Descriptions.Item>
          <Descriptions.Item label="状态">{mockTaskDetails.status}</Descriptions.Item>
          <Descriptions.Item label="任务描述" span={3}>
            {mockTaskDetails.description}
          </Descriptions.Item>
          <Descriptions.Item label="完成进度">{mockTaskDetails.progress}</Descriptions.Item>
          <Descriptions.Item label="最后更新时间">{mockTaskDetails.lastUpdateTime}</Descriptions.Item>
          <Descriptions.Item label="附件">
            {mockTaskDetails.attachments.map((file, index) => (
              <div key={index}>{file}</div>
            ))}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
} 