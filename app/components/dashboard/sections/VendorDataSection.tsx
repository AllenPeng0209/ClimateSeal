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
  Tabs,
  Row,
  Col,
  Statistic,
  Upload,
  Tooltip,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FileExcelOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
  FilePdfOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  AreaChartOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { VendorDataTask } from '~/types';
import './VendorDataSection.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;
const { Option } = Select;

interface VendorDataSectionProps {
  vendorTasks: VendorDataTask[];
  onAddTask: (task: Omit<VendorDataTask, 'id'>) => void;
  onEditTask: (id: string, task: Partial<VendorDataTask>) => void;
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
  const [editingTask, setEditingTask] = React.useState<VendorDataTask | null>(null);
  const [searchText, setSearchText] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [activeTab, setActiveTab] = React.useState('1');

  // 统计数据
  const stats = {
    total: vendorTasks.length,
    submitted: vendorTasks.filter(task => task.status === '已提交').length,
    pending: vendorTasks.filter(task => task.status === '待提交').length,
    overdue: vendorTasks.filter(task => task.status === '逾期').length,
  };

  const columns = [
    {
      title: '供应商',
      dataIndex: 'vendor',
      key: 'vendor',
      render: (text: string, record: VendorDataTask) => (
        <Space>
          <Text strong>{text}</Text>
          <Tooltip title="查看详情">
            <Button type="link" icon={<AreaChartOutlined />} onClick={() => handleViewDetails(record)} />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap = {
          '已提交': { text: '已提交', color: 'success', icon: <CheckCircleOutlined /> },
          '待提交': { text: '待提交', color: 'default', icon: <ClockCircleOutlined /> },
          '逾期': { text: '逾期', color: 'error', icon: <ExclamationCircleOutlined /> },
        };
        const statusInfo = statusMap[status as keyof typeof statusMap] || { text: status, color: 'default', icon: null };
        return (
          <Tag color={statusInfo.color} icon={statusInfo.icon}>
            {statusInfo.text}
          </Tag>
        );
      },
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (date: string) => (
        <Space>
          <Text>{date}</Text>
          {new Date(date) < new Date() && (
            <Badge status="error" text="已逾期" />
          )}
        </Space>
      ),
    },
    {
      title: '产品',
      dataIndex: 'product',
      key: 'product',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: VendorDataTask) => (
        <Space size="middle">
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="下载模板">
            <Button
              type="link"
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadTemplate(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingTask(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (task: VendorDataTask) => {
    setEditingTask(task);
    form.setFieldsValue(task);
    setIsModalVisible(true);
  };

  const handleDelete = (record: VendorDataTask) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除供应商 ${record.vendor} 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        onDeleteTask(record.id);
        message.success('删除成功');
      },
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

  const handleExport = () => {
    message.success('导出成功');
  };

  const handleRefresh = () => {
    message.success('刷新成功');
  };

  const handleViewDetails = (record: VendorDataTask) => {
    // TODO: 实现查看详情功能
    console.log('查看详情:', record);
  };

  const handleDownloadTemplate = (record: VendorDataTask) => {
    // TODO: 实现下载模板功能
    message.success('模板下载成功');
  };

  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/v1/vendor-tasks/upload',
    headers: {
      authorization: 'Bearer ' + localStorage.getItem('token'),
    },
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 文件上传成功`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 文件上传失败`);
      }
    },
    beforeUpload(file) {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel';
      if (!isExcel) {
        message.error('只能上传Excel文件!');
        return false;
      }
      return true;
    },
  };

  const filteredTasks = vendorTasks;
  // .filter(task => {
  //   const matchesSearch = task.vendor.toLowerCase().includes(searchText.toLowerCase());
  //   const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
  //   return matchesSearch && matchesStatus;
  // });

  return (
    <div className="vendor-data-section">
      <Title level={2} style={{ color: 'var(--carbon-green-dark)', borderBottom: '2px solid var(--carbon-border)', paddingBottom: '12px' }}>
        <FileExcelOutlined style={{ marginRight: 12, color: 'var(--carbon-green-primary)' }} />
        供应商数据管理
      </Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="总任务数"
              value={stats.total}
              prefix={<FileExcelOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="已提交"
              value={stats.submitted}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="待提交"
              value={stats.pending}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="逾期"
              value={stats.overdue}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card className="vendor-card">
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
              添加供应商
            </Button>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>批量导入</Button>
            </Upload>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出数据
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
          </Space>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Space>
            <Search
              placeholder="搜索供应商"
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
              <Option value="已提交">已提交</Option>
              <Option value="待提交">待提交</Option>
              <Option value="逾期">逾期</Option>
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
        title={editingTask ? '编辑供应商' : '添加供应商'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            label="供应商"
            name="vendor"
            rules={[{ required: true, message: '请输入供应商名称' }]}
          >
            <Input placeholder="请输入供应商名称" />
          </Form.Item>
          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="已提交">已提交</Option>
              <Option value="待提交">待提交</Option>
              <Option value="逾期">逾期</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="deadline"
            label="截止日期"
            rules={[{ required: true, message: '请选择截止日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VendorDataSection; 