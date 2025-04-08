import React from 'react';
import {
  Card,
  Typography,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  message,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FileExcelOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { VendorTask } from '~/types/dashboard';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

interface VendorDataSectionProps {
  vendorTasks: VendorTask[];
  onAddTask: (task: Omit<VendorTask, 'id'>) => void;
  onEditTask: (id: string, task: Partial<VendorTask>) => void;
  onDeleteTask: (id: string) => void;
}

const VendorDataSection: React.FC<VendorDataSectionProps> = ({
  vendorTasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
}) => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<VendorTask | null>(null);
  const [searchText, setSearchText] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={
          status === 'completed' ? 'green' :
          status === 'pending' ? 'orange' :
          status === 'in_progress' ? 'blue' : 'red'
        }>
          {status === 'completed' ? '已完成' :
           status === 'pending' ? '待处理' :
           status === 'in_progress' ? '进行中' : '已逾期'}
        </Tag>
      ),
    },
    {
      title: '截止日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
    },
    {
      title: '负责人',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: VendorTask) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingTask(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (task: VendorTask) => {
    setEditingTask(task);
    form.setFieldsValue(task);
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个任务吗？',
      onOk: () => onDeleteTask(id),
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingTask) {
        onEditTask(editingTask.id, values);
        message.success('任务更新成功');
      } else {
        onAddTask(values);
        message.success('任务创建成功');
      }
      setIsModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const filteredTasks = vendorTasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <Title level={2} style={{ color: 'var(--carbon-green-dark)', borderBottom: '2px solid var(--carbon-border)', paddingBottom: '12px' }}>
        <FileExcelOutlined style={{ marginRight: 12, color: 'var(--carbon-green-primary)' }} />
        供应商数据收集
      </Title>

      <Card className="carbon-card">
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              style={{ 
                backgroundColor: 'var(--carbon-green-primary)',
                borderColor: 'var(--carbon-green-dark)'
              }}
            >
              新建任务
            </Button>
            <Button icon={<FileExcelOutlined />}>导出数据</Button>
            <Button icon={<ReloadOutlined />}>刷新</Button>
          </Space>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Space>
            <Search
              placeholder="搜索任务"
              allowClear
              onSearch={setSearchText}
              style={{ width: 200 }}
            />
            <Select
              style={{ width: 120 }}
              placeholder="状态筛选"
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="all">全部状态</Option>
              <Option value="pending">待处理</Option>
              <Option value="in_progress">进行中</Option>
              <Option value="completed">已完成</Option>
              <Option value="overdue">已逾期</Option>
            </Select>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredTasks}
          rowKey="id"
          pagination={{
            total: filteredTasks.length,
            pageSize: 10,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={editingTask ? '编辑任务' : '新建任务'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="任务名称"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Option value="pending">待处理</Option>
              <Option value="in_progress">进行中</Option>
              <Option value="completed">已完成</Option>
              <Option value="overdue">已逾期</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="dueDate"
            label="截止日期"
            rules={[{ required: true, message: '请选择截止日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="assignedTo"
            label="负责人"
            rules={[{ required: true, message: '请输入负责人' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default VendorDataSection; 