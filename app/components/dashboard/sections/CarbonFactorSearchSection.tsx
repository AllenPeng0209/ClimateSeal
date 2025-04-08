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
  Progress,
  Divider,
  List,
  Spin,
  Empty,
  Tooltip,
  Statistic,
  Radio,
  Segmented,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  SyncOutlined,
  BarChartOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  FileSearchOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import './CarbonFactorSearchSection.css';

const { Title, Text, Paragraph } = Typography;
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
  sourceType: 'database' | 'online';
  reliability: number;
  industry?: string;
  locationScope?: string;
  updateDate: string;
}

const CarbonFactorSearchSection: React.FC = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [selectedFactor, setSelectedFactor] = React.useState<CarbonFactor | null>(null);
  const [searchText, setSearchText] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [regionFilter, setRegionFilter] = React.useState<string>('all');
  const [searchMode, setSearchMode] = React.useState<'offline' | 'online' | 'hybrid'>('offline');
  const [loading, setLoading] = React.useState(false);
  const [onlineSearchProgress, setOnlineSearchProgress] = React.useState(0);
  const [onlineSearchMessages, setOnlineSearchMessages] = React.useState<string[]>([]);

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
      sourceType: 'database',
      reliability: 4.5,
      industry: '电力',
      locationScope: '华东',
      updateDate: '2023-12-31',
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
      sourceType: 'online',
      reliability: 4.0,
      industry: '能源',
      locationScope: '全国',
      updateDate: '2023-12-31',
    },
  ];

  const columns = [
    {
      title: '因子名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: CarbonFactor) => (
        <Space>
          {text}
          {record.sourceType === 'database' ? (
            <Tooltip title="离线数据库">
              <DatabaseOutlined style={{ color: '#1890ff' }} />
            </Tooltip>
          ) : (
            <Tooltip title="在线搜索">
              <GlobalOutlined style={{ color: '#722ed1' }} />
            </Tooltip>
          )}
        </Space>
      ),
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
      render: (value: number, record: CarbonFactor) => (
        <Space>
          <Text strong>{value}</Text>
          <Text type="secondary">{record.unit}</Text>
        </Space>
      ),
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
    <div className="carbon-factor-search">
      <Card 
        title={
          <Space>
            <BarChartOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <Title level={3} style={{ margin: 0 }}>碳排放因子搜索</Title>
          </Space>
        }
        bordered={false}
        style={{ marginBottom: 24, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
        extra={
          <Space className="search-mode-selector">
            <Text type="secondary">搜索模式：</Text>
            <Segmented
              value={searchMode}
              onChange={value => setSearchMode(value as any)}
              options={[
                {
                  label: (
                    <div className="search-segment-option">
                      <DatabaseOutlined style={{ marginRight: 4 }} />
                      <span>离线搜索</span>
                    </div>
                  ),
                  value: 'offline',
                },
                {
                  label: (
                    <div className="search-segment-option">
                      <GlobalOutlined style={{ marginRight: 4 }} />
                      <span>在线搜索</span>
                    </div>
                  ),
                  value: 'online',
                },
                {
                  label: (
                    <div className="search-segment-option">
                      <SyncOutlined style={{ marginRight: 4 }} />
                      <span>混合搜索</span>
                    </div>
                  ),
                  value: 'hybrid',
                },
              ]}
            />
          </Space>
        }
      >
        <Paragraph type="secondary">
          {searchMode === 'offline' && '离线搜索可快速匹配本地数据库中的碳排因子数据。'}
          {searchMode === 'online' && '在线搜索会连接全球碳排放数据库，提供更全面的结果。'}
          {searchMode === 'hybrid' && '混合搜索先在本地查找，结果不足时自动触发在线查询。'}
          输入关键词即可开始搜索，系统会自动匹配最合适的结果。
        </Paragraph>

        <div className="carbon-card">
          <Space style={{ marginBottom: 16 }}>
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
        </div>
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
            <div style={{ 
              background: '#f5f5f5', 
              padding: '16px', 
              borderRadius: '8px', 
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <Title level={2} style={{ margin: 0, color: '#f5222d' }}>
                {selectedFactor.value} <Text type="secondary" style={{ fontSize: '16px' }}>{selectedFactor.unit}</Text>
              </Title>
              <Text type="secondary">碳排放因子值</Text>
            </div>

            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>名称：</Text>
                <Text>{selectedFactor.name}</Text>
              </div>
              <div>
                <Text strong>类别：</Text>
                <Tag color="blue">{selectedFactor.category}</Tag>
              </div>
              <div>
                <Text strong>单位：</Text>
                <Text>{selectedFactor.unit}</Text>
              </div>
              <div>
                <Text strong>数值：</Text>
                <Text>{selectedFactor.value}</Text>
              </div>
              <div>
                <Text strong>来源：</Text>
                <Text>{selectedFactor.source}</Text>
              </div>
              <div>
                <Text strong>年份：</Text>
                <Text>{selectedFactor.year}</Text>
              </div>
              <div>
                <Text strong>地区：</Text>
                <Text>{selectedFactor.region}</Text>
              </div>
              <div>
                <Text strong>描述：</Text>
                <Text>{selectedFactor.description}</Text>
              </div>
              <div>
                <Text strong>可靠性评分：</Text>
                <Text>{selectedFactor.reliability}/5</Text>
              </div>
              <div>
                <Text strong>更新日期：</Text>
                <Text>{selectedFactor.updateDate}</Text>
              </div>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CarbonFactorSearchSection; 