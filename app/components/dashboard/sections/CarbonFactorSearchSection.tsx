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
  Descriptions,
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
  StarOutlined,
  StarFilled,
  CopyOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import './CarbonFactorSearchSection.css';
import copy from 'copy-to-clipboard';

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
  const [yearFilter, setYearFilter] = React.useState<string>('all');
  const [dbFilter, setDbFilter] = React.useState<string>('all');
  const [industryFilter, setIndustryFilter] = React.useState<string>('all');
  const [favorites, setFavorites] = React.useState<string[]>(() => JSON.parse(localStorage.getItem('carbonFactorFavorites') || '[]'));
  const [tablePage, setTablePage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [showResult, setShowResult] = React.useState(false);

  // 模拟数据 - 增加更多数据以测试滚动和分页
  const mockData: CarbonFactor[] = Array.from({ length: 50 }, (_, i) => ({
    id: `${i + 1}`,
    name: `因子名称 ${i + 1}`,
    category: i % 3 === 0 ? '能源' : i % 3 === 1 ? '材料' : '运输',
    unit: 'kgCO2e/kWh',
    value: parseFloat((Math.random() * 2).toFixed(4)),
    source: i % 4 === 0 ? 'IPCC 2019' : i % 4 === 1 ? 'CNEMC' : i % 4 === 2 ? '生态环境部' : '行业数据库',
    year: `${2020 + (i % 5)}`,
    region: i % 3 === 0 ? '中国' : i % 3 === 1 ? '美国' : '欧盟',
    description: `这是因子 ${i + 1} 的详细描述信息，用于展示。`,
    sourceType: i % 2 === 0 ? 'database' : 'online',
    reliability: parseFloat((Math.random() * 5).toFixed(1)),
    industry: i % 3 === 0 ? '电力' : i % 3 === 1 ? '化工' : '建筑',
    locationScope: '全国',
    updateDate: `2024-01-${String(i % 28 + 1).padStart(2, '0')}`,
  }));

  const columns = [
    {
      title: '活动名称',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      fixed: 'left' as 'left',
      render: (text: string, record: CarbonFactor) => (
        <div style={{ fontWeight: 500 }}>{text}</div>
      ),
    },
    {
      title: '数值',
      dataIndex: 'value',
      key: 'value',
      width: 120,
      align: 'right' as 'right',
      sorter: (a: CarbonFactor, b: CarbonFactor) => a.value - b.value,
      render: (value: number) => (
        <Text strong>{value}</Text>
      ),
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 100,
    },
    {
      title: '数据来源',
      dataIndex: 'source',
      key: 'source',
      width: 150,
      render: (text: string) => (
        <Tag color="blue">{text}</Tag>
      ),
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry',
      width: 120,
    },
    {
      title: '地理位置',
      dataIndex: 'region',
      key: 'region',
      width: 120,
    },
    {
      title: '年份',
      dataIndex: 'year',
      key: 'year',
      width: 100,
      align: 'center' as 'center',
      sorter: (a: CarbonFactor, b: CarbonFactor) => parseInt(a.year) - parseInt(b.year),
    },
    {
      title: '查看描述',
      key: 'viewDesc',
      width: 100,
      align: 'center' as 'center',
      render: (_: any, record: CarbonFactor) => (
        <Tooltip 
          title={record.description}
          color="#1a365d"
          placement="top"
          overlayStyle={{ maxWidth: 350 }}
          overlayInnerStyle={{ padding: '12px 16px', fontSize: '14px', lineHeight: '1.6' }}
        >
          <InfoCircleOutlined 
            style={{ color: '#1890ff', fontSize: '16px', cursor: 'pointer' }}
            className="description-icon" 
          />
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as 'right',
      align: 'center' as 'center',
      render: (_: any, record: CarbonFactor) => (
        <Space size="small">
          <Tooltip title="复制信息">
            <Button 
              className="copy-btn"
              size="small" 
              icon={<CopyOutlined />} 
              onClick={() => handleCopy(record)} 
            />
          </Tooltip>
          <Tooltip title={isFavorited(record) ? '取消收藏' : '收藏'}>
            <Button 
              size="small" 
              type="text" 
              icon={isFavorited(record) ? <StarFilled style={{color:'#faad14'}} /> : <StarOutlined />} 
              onClick={() => toggleFavorite(record)} 
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleViewDetails = (factor: CarbonFactor) => {
    setSelectedFactor(factor);
    setIsModalVisible(true);
  };

  const handleCopy = (factor: CarbonFactor) => {
    const text = `名称: ${factor.name}\n数值: ${factor.value} ${factor.unit}\n地理位置: ${factor.region}\n行业: ${factor.industry}\n数据来源: ${factor.source}\n年份: ${factor.year}`;
    copy(text);
    
    message.success({
      content: (
        <span className="carbon-copy-success">
          <span style={{ marginRight: 8 }}>✓</span>
          已复制 <b>{factor.name}</b> 的信息到剪贴板
        </span>
      ),
      duration: 3
    });
  };

  const isFavorited = (factor: CarbonFactor) => favorites.includes(factor.id);

  const toggleFavorite = (factor: CarbonFactor) => {
    let newFavs;
    if (isFavorited(factor)) {
      newFavs = favorites.filter(id => id !== factor.id);
    } else {
      newFavs = [...favorites, factor.id];
    }
    setFavorites(newFavs);
    localStorage.setItem('carbonFactorFavorites', JSON.stringify(newFavs));
  };

  const handleReset = () => {
    setSearchText('');
    setCategoryFilter('all');
    setRegionFilter('all');
    setYearFilter('all');
    setDbFilter('all');
    setIndustryFilter('all');
    setTablePage(1);
  };

  const filteredData = mockData.filter(factor => {
    const matchesSearch = factor.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || factor.category === categoryFilter;
    
    // 支持多选的地理位置筛选
    const matchesRegion = regionFilter === 'all' || 
      (regionFilter.split(',').includes(factor.region));
    
    // 支持多选的年份筛选
    const matchesYear = yearFilter === 'all' || 
      (yearFilter.split(',').includes(factor.year));
    
    // 支持多选的数据库筛选
    const matchesDb = dbFilter === 'all' || 
      (dbFilter.split(',').includes(factor.source));
    
    // 支持多选的行业筛选
    const matchesIndustry = industryFilter === 'all' || 
      (industryFilter.split(',').includes(factor.industry || ''));
    
    return matchesSearch && matchesCategory && matchesRegion && matchesYear && matchesDb && matchesIndustry;
  });

  const handleHeroSearch = () => {
    // Implementation of handleHeroSearch
  };

  const handleSearch = () => {
    // Implementation of handleSearch
  };

  return (
    <div className="carbon-factor-search-page">
      {/* Hero 搜索区 */}
      <div className="carbon-search-hero">
        <div className="carbon-search-hero-content">
          <h1 className="carbon-search-title">碳排放因子智能搜索</h1>
          <div className="carbon-search-bar">
            <Input
              size="large"
              placeholder="请输入因子名称、关键词或描述"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              className="carbon-search-input"
            />
            <Button type="primary" size="large" onClick={handleSearch} className="carbon-search-btn">
              搜索
            </Button>
            <Button 
              size="large" 
              className="carbon-search-btn ai" 
              onClick={() => { setSearchMode('online'); handleSearch(); }}
              icon={<GlobalOutlined />}
            >
              联网搜索
            </Button>
          </div>
          <div className="carbon-search-tags">
            <span style={{ color: 'rgba(255,255,255,0.85)', marginRight: '12px' }}>热门搜索：</span>
            {['电力', '能源', '交通', '建筑', 'IPCC', 'ecoinvent'].map(tag => (
              <Tag 
                key={tag} 
                className="carbon-search-tag" 
                onClick={() => { setSearchText(tag); handleSearch(); }}
              >
                {tag}
              </Tag>
            ))}
          </div>
        </div>
      </div>

      {/* 搜索结果区域 */}
      <div className="carbon-search-results">
        <div className="carbon-content-wrapper">
          <div className="carbon-filter-sidebar">
            <div className="filter-header">
              <Typography.Text>筛选条件</Typography.Text>
              <Button 
                type="text" 
                icon={<ReloadOutlined />} 
                onClick={handleReset} 
                size="small"
              >
                重置筛选
              </Button>
            </div>
            
            <Form layout="vertical">
              <Form.Item label="数据来源">
                <Select
                  mode="multiple"
                  showSearch
                  placeholder="请选择数据来源"
                  value={dbFilter === 'all' ? [] : dbFilter.split(',')}
                  onChange={vals => setDbFilter(vals.length === 0 ? 'all' : vals.join(','))}
                  optionFilterProp="label"
                  style={{ width: '100%' }}
                  maxTagCount="responsive"
                  filterOption={(input, option) => 
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={[
                    { label: 'IPCC', value: 'IPCC 2019' },
                    { label: 'ecoinvent', value: 'ecoinvent' },
                    { label: '生态环境部', value: '生态环境部' },
                    { label: '行业数据库', value: '行业数据库' }
                  ]}
                />
              </Form.Item>
              
              <Form.Item label="行业分类">
                <Select
                  mode="multiple"
                  showSearch
                  placeholder="请选择行业"
                  value={industryFilter === 'all' ? [] : industryFilter.split(',')}
                  onChange={vals => setIndustryFilter(vals.length === 0 ? 'all' : vals.join(','))}
                  optionFilterProp="label"
                  style={{ width: '100%' }}
                  maxTagCount="responsive"
                  filterOption={(input, option) => 
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={[
                    { label: '电力', value: '电力' },
                    { label: '能源', value: '能源' },
                    { label: '化工', value: '化工' },
                    { label: '建筑', value: '建筑' }
                  ]}
                />
              </Form.Item>
              
              <Form.Item label="地理位置">
                <Select
                  mode="multiple"
                  showSearch
                  placeholder="请选择地区"
                  value={regionFilter === 'all' ? [] : regionFilter.split(',')}
                  onChange={vals => setRegionFilter(vals.length === 0 ? 'all' : vals.join(','))}
                  optionFilterProp="label"
                  style={{ width: '100%' }}
                  maxTagCount="responsive"
                  filterOption={(input, option) => 
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={[
                    { label: '中国', value: '中国' },
                    { label: '美国', value: '美国' },
                    { label: '欧盟', value: '欧盟' },
                    { label: '全球', value: '全球' }
                  ]}
                />
              </Form.Item>
              
              <Form.Item label="年份">
                <Select
                  mode="multiple"
                  showSearch
                  placeholder="请选择年份"
                  value={yearFilter === 'all' ? [] : yearFilter.split(',')}
                  onChange={vals => setYearFilter(vals.length === 0 ? 'all' : vals.join(','))}
                  optionFilterProp="label"
                  style={{ width: '100%' }}
                  maxTagCount="responsive"
                  filterOption={(input, option) => 
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={[
                    { label: '2024', value: '2024' },
                    { label: '2023', value: '2023' },
                    { label: '2022', value: '2022' },
                    { label: '2021', value: '2021' },
                    { label: '2020', value: '2020' }
                  ]}
                />
              </Form.Item>
            </Form>
          </div>
          
          <div className="carbon-result-table">
            <div className="carbon-result-header">
              <div className="search-result-count">
                {searchText ? `"${searchText}" - 匹配到 ${filteredData.length} 条结果` : `匹配到 ${filteredData.length} 条结果`}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Space>
                  <Button icon={<ReloadOutlined />} onClick={handleReset}>重置筛选</Button>
                </Space>
              </div>
            </div>
            
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="id"
              scroll={{ x: 1200 }}
              pagination={{ 
                total: filteredData.length,
                pageSize: pageSize,
                current: tablePage,
                showTotal: (total, range) => `${range[0]}-${range[1]} 共 ${total} 条`,
                onChange: (page, size) => {
                  setTablePage(page);
                  if (size) setPageSize(size);
                },
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
              }}
              locale={{ emptyText: <Empty description="未找到符合条件的碳排放因子，请调整搜索条件" /> }}
              size="middle"
            />
          </div>
        </div>
      </div>

      {/* 详情弹窗 */}
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
              <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                {selectedFactor.value}
                <Text type="secondary" style={{ fontSize: '14px', marginLeft: '8px' }}>{selectedFactor.unit}</Text>
              </Title>
              <Text type="secondary">碳排放因子值</Text>
            </div>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="排放因子">{selectedFactor.name}</Descriptions.Item>
              <Descriptions.Item label="描述">{selectedFactor.description}</Descriptions.Item>
              <Descriptions.Item label="数据来源">{selectedFactor.source}</Descriptions.Item>
              <Descriptions.Item label="行业">{selectedFactor.industry}</Descriptions.Item>
              <Descriptions.Item label="年份">{selectedFactor.year}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CarbonFactorSearchSection; 