import { useState } from "react";
import { Table, Button, Space, Form, Select, DatePicker, Input, Modal, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "@remix-run/react";
import { EyeOutlined, CloseCircleOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import "~/styles/tasks.css";

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface Task {
  id: string;
  name: string;
  type: "核算任务" | "供应商任务" | "内部数据收集任务";
  createTime: string;
  owner: string;
  status: "进行中" | "已完成" | "已关闭";
}

// 模拟数据
const mockTasks: Task[] = [
  {
    id: "TASK001",
    name: "2024年第一季度碳足迹核算",
    type: "核算任务",
    createTime: "2024-01-01",
    owner: "张三",
    status: "进行中",
  },
  {
    id: "TASK002",
    name: "供应商A数据收集",
    type: "供应商任务",
    createTime: "2024-01-15",
    owner: "李四",
    status: "已完成",
  },
  {
    id: "TASK003",
    name: "内部能源消耗数据收集",
    type: "内部数据收集任务",
    createTime: "2024-02-01",
    owner: "王五",
    status: "已关闭",
  },
];

export default function TaskList() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(mockTasks);

  // 处理查询
  const handleSearch = async () => {
    try {
      const values = await form.validateFields();
      let filtered = [...mockTasks];

      // 按任务类型筛选
      if (values.type) {
        filtered = filtered.filter(task => task.type === values.type);
      }

      // 按状态筛选
      if (values.status) {
        filtered = filtered.filter(task => task.status === values.status);
      }

      // 按负责人筛选
      if (values.owner) {
        filtered = filtered.filter(task => 
          task.owner.toLowerCase().includes(values.owner.toLowerCase())
        );
      }

      // 按时间范围筛选
      if (values.dateRange) {
        const [startDate, endDate] = values.dateRange;
        filtered = filtered.filter(task => {
          const taskDate = new Date(task.createTime);
          return taskDate >= startDate.startOf('day') && taskDate <= endDate.endOf('day');
        });
      }

      setFilteredTasks(filtered);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 处理重置
  const handleReset = () => {
    form.resetFields();
    setFilteredTasks(mockTasks);
  };

  // 处理任务跟进
  const handleFollow = (task: Task) => {
    switch (task.type) {
      case "核算任务":
        navigate(`/carbon-footprint/${task.id}`);
        break;
      case "供应商任务":
        navigate(`/supplier-tasks/${task.id}`);
        break;
      case "内部数据收集任务":
        navigate(`/internal-tasks/${task.id}`);
        break;
    }
  };

  // 处理关闭任务
  const handleClose = (task: Task) => {
    setSelectedTask(task);
    setCloseModalVisible(true);
  };

  // 确认关闭任务
  const handleConfirmClose = () => {
    if (selectedTask) {
      // TODO: 实现关闭任务的逻辑
      console.log("关闭任务:", selectedTask.id);
      setCloseModalVisible(false);
      setSelectedTask(null);
    }
  };

  // 取消关闭任务
  const handleCancelClose = () => {
    setCloseModalVisible(false);
    setSelectedTask(null);
  };

  // 处理查看详情
  const handleViewDetails = (task: Task) => {
    navigate(`/tasks/${task.id}`);
  };

  const columns: ColumnsType<Task> = [
    {
      title: "任务ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "任务名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "任务类型",
      dataIndex: "type",
      key: "type",
      filters: [
        { text: "核算任务", value: "核算任务" },
        { text: "供应商任务", value: "供应商任务" },
        { text: "内部数据收集任务", value: "内部数据收集任务" },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
      key: "createTime",
      sorter: (a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime(),
    },
    {
      title: "负责人",
      dataIndex: "owner",
      key: "owner",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "进行中", value: "进行中" },
        { text: "已完成", value: "已完成" },
        { text: "已关闭", value: "已关闭" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "操作",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          {record.status !== "已关闭" && (
            <Button type="link" onClick={() => handleFollow(record)}>
              任务跟进
            </Button>
          )}
          {record.status !== "已关闭" && (
            <Button 
              type="link" 
              danger 
              icon={<CloseCircleOutlined />}
              onClick={() => handleClose(record)}
            >
              关闭
            </Button>
          )}
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="task-list-container">
      <Title level={2}>任务管理</Title>

      <Form
        form={form}
        layout="inline"
        className="task-filter-form"
      >
        <Form.Item name="type" label="任务类型">
          <Select
            style={{ width: 200 }}
            options={[
              { value: "核算任务", label: "核算任务" },
              { value: "供应商任务", label: "供应商任务" },
              { value: "内部数据收集任务", label: "内部数据收集任务" },
            ]}
            allowClear
          />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select
            style={{ width: 200 }}
            options={[
              { value: "进行中", label: "进行中" },
              { value: "已完成", label: "已完成" },
              { value: "已关闭", label: "已关闭" },
            ]}
            allowClear
          />
        </Form.Item>
        <Form.Item name="owner" label="负责人">
          <Input style={{ width: 200 }} />
        </Form.Item>
        <Form.Item name="dateRange" label="时间范围">
          <RangePicker />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button 
              type="primary" 
              icon={<SearchOutlined />}
              onClick={handleSearch}
            >
              查询
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={handleReset}
            >
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        columns={columns}
        dataSource={filteredTasks}
        rowKey="id"
        className="task-table"
      />

      <Modal
        title="确认关闭任务"
        open={closeModalVisible}
        onOk={handleConfirmClose}
        onCancel={handleCancelClose}
      >
        <p>确定要关闭任务 "{selectedTask?.name}" 吗？</p>
        <p>关闭后任务将无法继续跟进。</p>
      </Modal>
    </div>
  );
} 