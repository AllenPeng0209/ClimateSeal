import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { Layout, Typography, Table, Button, Input, Select, Space, Tag, DatePicker, message } from "antd";
import { SearchOutlined, DownloadOutlined, FilterOutlined } from "@ant-design/icons";
import "~/styles/operation-logs.css";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

export async function loader({ request }: LoaderFunctionArgs) {
  // 模拟日志数据
  const logs = [
    {
      id: "log-1",
      time: "2024-04-07 14:30:00",
      user: "张三",
      module: "碳足迹核算",
      type: "新增",
      content: "创建新的碳足迹核算任务",
      result: "成功",
      ip: "192.168.1.100",
    },
    {
      id: "log-2",
      time: "2024-04-07 15:00:00",
      user: "李四",
      module: "数据管理",
      type: "修改",
      content: "更新供应商数据",
      result: "成功",
      ip: "192.168.1.101",
    },
  ];

  return json({ logs });
}

export default function OperationLogs() {
  const { logs } = useLoaderData<typeof loader>();
  const [searchText, setSearchText] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedResult, setSelectedResult] = useState<string>("all");
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const handleExport = () => {
    // TODO: 实现日志导出逻辑
    message.success("开始导出日志");
  };

  const columns = [
    {
      title: "操作时间",
      dataIndex: "time",
      key: "time",
    },
    {
      title: "操作用户",
      dataIndex: "user",
      key: "user",
    },
    {
      title: "操作模块",
      dataIndex: "module",
      key: "module",
    },
    {
      title: "操作类型",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color={type === "新增" ? "green" : type === "修改" ? "blue" : "red"}>
          {type}
        </Tag>
      ),
    },
    {
      title: "操作内容",
      dataIndex: "content",
      key: "content",
    },
    {
      title: "操作结果",
      dataIndex: "result",
      key: "result",
      render: (result: string) => (
        <Tag color={result === "成功" ? "success" : "error"}>
          {result}
        </Tag>
      ),
    },
    {
      title: "IP地址",
      dataIndex: "ip",
      key: "ip",
    },
  ];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchText.toLowerCase()) ||
      log.content.toLowerCase().includes(searchText.toLowerCase());
    const matchesModule = selectedModule === "all" || log.module === selectedModule;
    const matchesType = selectedType === "all" || log.type === selectedType;
    const matchesResult = selectedResult === "all" || log.result === selectedResult;
    const matchesDate = !dateRange || (
      log.time >= dateRange[0] &&
      log.time <= dateRange[1]
    );
    return matchesSearch && matchesModule && matchesType && matchesResult && matchesDate;
  });

  return (
    <div className="operation-logs-container">
      <div className="operation-logs-header">
        <Title level={2}>操作日志</Title>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExport}
        >
          导出日志
        </Button>
      </div>

      <div className="operation-logs-filters">
        <Space wrap>
          <Search
            placeholder="搜索用户或操作内容"
            allowClear
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
          <Select
            defaultValue="all"
            style={{ width: 120 }}
            onChange={value => setSelectedModule(value)}
          >
            <Option value="all">全部模块</Option>
            <Option value="碳足迹核算">碳足迹核算</Option>
            <Option value="数据管理">数据管理</Option>
            <Option value="系统管理">系统管理</Option>
          </Select>
          <Select
            defaultValue="all"
            style={{ width: 120 }}
            onChange={value => setSelectedType(value)}
          >
            <Option value="all">全部类型</Option>
            <Option value="新增">新增</Option>
            <Option value="修改">修改</Option>
            <Option value="删除">删除</Option>
            <Option value="查询">查询</Option>
          </Select>
          <Select
            defaultValue="all"
            style={{ width: 120 }}
            onChange={value => setSelectedResult(value)}
          >
            <Option value="all">全部结果</Option>
            <Option value="成功">成功</Option>
            <Option value="失败">失败</Option>
          </Select>
          <RangePicker
            showTime
            onChange={(dates) => {
              if (dates) {
                setDateRange([
                  dates[0]?.format("YYYY-MM-DD HH:mm:ss") || "",
                  dates[1]?.format("YYYY-MM-DD HH:mm:ss") || "",
                ]);
              } else {
                setDateRange(null);
              }
            }}
          />
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredLogs}
        rowKey="id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />
    </div>
  );
} 