import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useState } from "react";
import { 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message,
  Typography,
  Popconfirm
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import "~/styles/workbench.css";

const { Title } = Typography;
const { Option } = Select;

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
    tasks: mockTasks,
    products: mockProducts
  });
}

export default function AIModeling() {
  const { tasks, products } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingTask, setEditingTask] = useState<any>(null);

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
            onClick={() => handleEdit(record)}
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
    setEditingTask(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 处理编辑任务
  const handleEdit = (task: any) => {
    setEditingTask(task);
    form.setFieldsValue({
      name: task.name,
      product: task.product,
      confidenceScore: task.confidenceScore,
    });
    setIsModalVisible(true);
  };

  // 处理删除任务
  const handleDelete = (taskId: string) => {
    // 在实际应用中，这里应该调用API删除任务
    message.success('任务已删除');
    // 刷新数据
    // 这里只是模拟，实际应用中应该重新加载数据
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // 在实际应用中，这里应该调用API保存任务
      if (editingTask) {
        message.success('任务已更新');
      } else {
        message.success('任务已创建');
      }
      setIsModalVisible(false);
      // 刷新数据
      // 这里只是模拟，实际应用中应该重新加载数据
    } catch (error) {
      console.error('表单验证失败:', error);
    }
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
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingTask ? "编辑建模任务" : "新增建模任务"}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ confidenceScore: 0.8 }}
        >
          <Form.Item
            name="name"
            label="任务名称"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="请输入任务名称" />
          </Form.Item>
          <Form.Item
            name="product"
            label="核算产品"
            rules={[{ required: true, message: '请选择核算产品' }]}
          >
            <Select placeholder="请选择核算产品">
              {products.map(product => (
                <Option key={product.id} value={product.name}>
                  {product.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="confidenceScore"
            label="可信得分"
            rules={[{ required: true, message: '请输入可信得分' }]}
          >
            <Input type="number" min={0} max={1} step={0.01} placeholder="请输入可信得分（0-1之间）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 