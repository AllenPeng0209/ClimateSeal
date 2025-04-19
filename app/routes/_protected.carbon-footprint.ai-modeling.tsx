import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useState } from "react";
import { 
  Table, 
  Button, 
  Space, 
  Popconfirm,
  Typography,
  message
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import "~/styles/workbench.css";

const { Title } = Typography;

// 模拟数据
const mockTasks = [
  {
    id: "task-001",
    name: "产品A碳足迹建模",
    product: "产品A",
    confidenceScore: 0.85,
    createdAt: "2024-04-01 10:00:00",
    updatedAt: "2024-04-07 14:30:00",
    updatedBy: "张三"
  },
  {
    id: "task-002",
    name: "产品B碳足迹建模",
    product: "产品B",
    confidenceScore: 0.92,
    createdAt: "2024-04-03 09:15:00",
    updatedAt: "2024-04-06 16:45:00",
    updatedBy: "李四"
  },
  {
    id: "task-003",
    name: "产品C碳足迹建模",
    product: "产品C",
    confidenceScore: 0.78,
    createdAt: "2024-04-05 11:30:00",
    updatedAt: "2024-04-07 10:20:00",
    updatedBy: "王五"
  }
];

// 模拟产品数据
const mockProducts = [
  { id: "product-001", name: "产品A" },
  { id: "product-002", name: "产品B" },
  { id: "product-003", name: "产品C" },
  { id: "product-004", name: "产品D" }
];

export async function loader({ request }: LoaderFunctionArgs) {
  // 在实际应用中，这里应该从API获取数据
  return json({
    tasks: mockTasks
  });
}

export default function AIModeling() {
  const { tasks } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  // 表格列定义
  const columns = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '核算产品',
      dataIndex: 'product',
      key: 'product',
    },
    {
      title: '可信得分',
      dataIndex: 'confidenceScore',
      key: 'confidenceScore',
      render: (score: number) => `${(score * 100).toFixed(1)}%`,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
    },
    {
      title: '更新人',
      dataIndex: 'updatedBy',
      key: 'updatedBy',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => navigate(`/workflow/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个任务吗？"
            description="删除后将无法恢复，相关的数据也会被删除。"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 处理新增任务
  const handleAdd = () => {
    navigate('/workflow/new');
  };

  // 处理删除任务
  const handleDelete = (taskId: string) => {
    // 在实际应用中，这里应该调用API删除任务
    message.success('任务已删除');
    // 刷新数据
    // 这里只是模拟，实际应用中应该重新加载数据
  };

  return (
    <div className="ai-modeling-container">
      <div className="page-header">
        <Title level={2}>AI建模核算</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdd}
        >
          新增建模任务
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={tasks}
        rowKey="id"
      />
    </div>
  );
} 