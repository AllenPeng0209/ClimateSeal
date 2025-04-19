import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { Layout, Typography, Table, Button, Input, Select, Space, Tag, message, Modal } from "antd";
import { DownloadOutlined, DeleteOutlined, ShareAltOutlined, SearchOutlined } from "@ant-design/icons";
import "~/styles/downloads.css";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

export async function loader({ request }: LoaderFunctionArgs) {
  // 模拟文件数据
  const files = [
    {
      id: "file-1",
      name: "产品A碳足迹报告",
      type: "报告",
      size: "2.5MB",
      uploadTime: "2024-04-07 14:30:00",
      uploader: "张三",
      downloadCount: 5,
    },
    {
      id: "file-2",
      name: "供应商数据清单",
      type: "数据清单",
      size: "1.8MB",
      uploadTime: "2024-04-07 15:00:00",
      uploader: "李四",
      downloadCount: 3,
    },
  ];

  return json({ files });
}

export default function Downloads() {
  const { files } = useLoaderData<typeof loader>();
  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const handleDownload = (fileId: string) => {
    // TODO: 实现文件下载逻辑
    message.success("开始下载文件");
  };

  const handleBatchDownload = () => {
    if (selectedFiles.length === 0) {
      message.warning("请选择要下载的文件");
      return;
    }
    // TODO: 实现批量下载逻辑
    message.success(`开始下载 ${selectedFiles.length} 个文件`);
  };

  const handleDelete = (fileId: string) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这个文件吗？",
      onOk: () => {
        // TODO: 实现删除逻辑
        message.success("文件已删除");
      },
    });
  };

  const handleShare = (fileId: string) => {
    // TODO: 实现分享逻辑
    message.success("分享链接已生成");
  };

  const columns = [
    {
      title: "文件名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "文件类型",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color={type === "报告" ? "blue" : type === "数据清单" ? "green" : "orange"}>
          {type}
        </Tag>
      ),
    },
    {
      title: "文件大小",
      dataIndex: "size",
      key: "size",
    },
    {
      title: "上传时间",
      dataIndex: "uploadTime",
      key: "uploadTime",
    },
    {
      title: "上传人",
      dataIndex: "uploader",
      key: "uploader",
    },
    {
      title: "下载次数",
      dataIndex: "downloadCount",
      key: "downloadCount",
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record.id)}
          >
            下载
          </Button>
          <Button
            type="link"
            icon={<ShareAltOutlined />}
            onClick={() => handleShare(record.id)}
          >
            分享
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

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesType = selectedType === "all" || file.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="downloads-container">
      <div className="downloads-header">
        <Title level={2}>下载管理</Title>
        <Space>
          <Search
            placeholder="搜索文件"
            allowClear
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
          <Select
            defaultValue="all"
            style={{ width: 120 }}
            onChange={value => setSelectedType(value)}
          >
            <Option value="all">全部类型</Option>
            <Option value="报告">报告</Option>
            <Option value="数据清单">数据清单</Option>
            <Option value="报表">报表</Option>
            <Option value="其他">其他</Option>
          </Select>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleBatchDownload}
            disabled={selectedFiles.length === 0}
          >
            批量下载
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredFiles}
        rowKey="id"
        rowSelection={{
          selectedRowKeys: selectedFiles,
          onChange: (selectedRowKeys) => setSelectedFiles(selectedRowKeys as string[]),
        }}
      />
    </div>
  );
} 