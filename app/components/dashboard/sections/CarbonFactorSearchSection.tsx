import React from 'react';
import {
  Card,
  Typography,
  Input,
  Select,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  message,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

interface CarbonFactor {
  id: string;
  name: string;
  category: string;
  unit: string;
  value: number;
  source: string;
  year: string;
  region: string;
  description: string;
}

const CarbonFactorSearchSection: React.FC = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [selectedFactor, setSelectedFactor] = React.useState<CarbonFactor | null>(null);
  const [searchText, setSearchText] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [regionFilter, setRegionFilter] = React.useState<string>('all');

  // 模拟数据
  const mockData: CarbonFactor[] = [
    {
      id: '1',
      name: '电力消耗',
      category: '能源',
      unit: 'kgCO2e/kWh',
      value: 0.879,
      source: 'IPCC 2019',
      year: '2023',
      region: '中国',
      description: '电网电力消耗的碳排放因子',
    },
    {
      id: '2',
      name: '天然气',
      category: '能源',
      unit: 'kgCO2e/m³',
      value: 2.02,
      source: 'IPCC 2019',
      year: '2023',
      region: '中国',
      description: '天然气燃烧的碳排放因子',
    },
    // 可以添加更多模拟数据
  ];

  const columns = [
    {
      title: '因子名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color="blue">{category}</Tag>
      ),
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: '数值',
      dataIndex: 'value',
      key: 'value',
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
    },
    {
      title: '年份',
      dataIndex: 'year',
      key: 'year',
    },
    {
      title: '地区',
      dataIndex: 'region',
      key: 'region',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: CarbonFactor) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<InfoCircleOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            详情
          </Button>
        </Space>
      ),
    },
  ];

  const handleViewDetails = (factor: CarbonFactor) => {
    setSelectedFactor(factor);
    setIsModalVisible(true);
  };

  const filteredData = mockData.filter(factor => {
    const matchesSearch = factor.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || factor.category === categoryFilter;
    const matchesRegion = regionFilter === 'all' || factor.region === regionFilter;
    return matchesSearch && matchesCategory && matchesRegion;
  });

  return (
    <>
      <Title level={2} style={{ color: 'var(--carbon-green-dark)', borderBottom: '2px solid var(--carbon-border)', paddingBottom: '12px' }}>
        <FilterOutlined style={{ marginRight: 12, color: 'var(--carbon-green-primary)' }} />
        碳排放因子搜索
      </Title>

      <Card className="carbon-card">
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Search
              placeholder="搜索因子名称"
              allowClear
              onSearch={setSearchText}
              style={{ width: 200 }}
            />
            <Select
              style={{ width: 120 }}
              placeholder="类别筛选"
              value={categoryFilter}
              onChange={setCategoryFilter}
            >
              <Option value="all">全部类别</Option>
              <Option value="能源">能源</Option>
              <Option value="材料">材料</Option>
              <Option value="运输">运输</Option>
              <Option value="废弃物">废弃物</Option>
            </Select>
            <Select
              style={{ width: 120 }}
              placeholder="地区筛选"
              value={regionFilter}
              onChange={setRegionFilter}
            >
              <Option value="all">全部地区</Option>
              <Option value="中国">中国</Option>
              <Option value="美国">美国</Option>
              <Option value="欧盟">欧盟</Option>
            </Select>
            <Button icon={<DownloadOutlined />}>导出数据</Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{
            total: filteredData.length,
            pageSize: 10,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title="因子详情"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedFactor && (
          <div>
            <p><strong>名称：</strong>{selectedFactor.name}</p>
            <p><strong>类别：</strong>{selectedFactor.category}</p>
            <p><strong>单位：</strong>{selectedFactor.unit}</p>
            <p><strong>数值：</strong>{selectedFactor.value}</p>
            <p><strong>来源：</strong>{selectedFactor.source}</p>
            <p><strong>年份：</strong>{selectedFactor.year}</p>
            <p><strong>地区：</strong>{selectedFactor.region}</p>
            <p><strong>描述：</strong>{selectedFactor.description}</p>
          </div>
        )}
      </Modal>
    </>
  );
};

export default CarbonFactorSearchSection; 