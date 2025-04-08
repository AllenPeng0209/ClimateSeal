import React, { useState } from 'react';
import { Typography, Card, Input, Select, List, Tag, Button, Tabs } from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  BookOutlined, 
  FileTextOutlined, 
  TeamOutlined,
  EyeOutlined,
  DownloadOutlined,
  StarOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import './IndustryKnowledgeSection.css';

const { Title } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;

interface KnowledgeItem {
  id: string;
  title: string;
  summary: string;
  category_id: string;
  knowledge_type: string;
  industry: string;
  author: string;
  source: string;
  views: number;
  rating: number;
  created_at: string;
  updated_at: string;
  category: string;
  tags: string[];
}

const IndustryKnowledgeSection: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // 模拟行业知识库数据
  const knowledgeItems: KnowledgeItem[] = [
    {
      id: '1',
      title: '钢铁行业碳排放核算指南',
      summary: '本指南详细介绍了钢铁行业碳排放核算的方法、数据收集要求及报告规范，适用于钢铁企业进行碳排放核算工作。',
      category_id: '1',
      knowledge_type: 'guide',
      industry: 'steel',
      author: '行业专家',
      source: '行业协会',
      views: 1234,
      rating: 4.8,
      created_at: '2024-01-15',
      updated_at: '2024-01-15',
      category: '核算指南',
      tags: ['钢铁', '碳排放', '核算方法']
    },
    {
      id: '2',
      title: '水泥行业减排技术分析报告',
      summary: '报告分析了水泥行业主要减排技术路线，包括能源替代、工艺优化、碳捕集等，并提供了具体实施建议。',
      category_id: '2',
      knowledge_type: 'report',
      industry: 'cement',
      author: '研究机构',
      source: '行业研究',
      views: 856,
      rating: 4.5,
      created_at: '2024-01-10',
      updated_at: '2024-01-10',
      category: '技术分析',
      tags: ['水泥', '减排技术', '碳捕集']
    }
  ];

  const industries = [
    { value: 'steel', label: '钢铁行业' },
    { value: 'cement', label: '水泥行业' },
    { value: 'power', label: '电力行业' },
    { value: 'chemical', label: '化工行业' }
  ];

  const knowledgeTypes = [
    { value: 'guide', label: '核算指南' },
    { value: 'report', label: '研究报告' },
    { value: 'case', label: '案例分享' },
    { value: 'policy', label: '政策解读' }
  ];

  const filteredItems = knowledgeItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         item.summary.toLowerCase().includes(searchText.toLowerCase());
    const matchesIndustry = !industryFilter || item.industry === industryFilter;
    const matchesType = !typeFilter || item.knowledge_type === typeFilter;
    return matchesSearch && matchesIndustry && matchesType;
  });

  return (
    <div className="knowledge-base-container">
      <Title level={2} style={{ 
        color: 'var(--carbon-green-dark)', 
        borderBottom: '2px solid var(--carbon-border)', 
        paddingBottom: '12px',
        marginBottom: '24px'
      }}>
        <BookOutlined style={{ marginRight: 12, color: 'var(--carbon-green-primary)' }} />
        行业知识库
      </Title>
      
      <Card className="carbon-card" style={{ marginBottom: '24px' }}>
        <div className="knowledge-search-container">
          <Input.Search
            placeholder="搜索知识库内容..."
            allowClear
            enterButton={
              <Button 
                type="primary" 
                style={{ 
                  backgroundColor: 'var(--carbon-green-primary)',
                  borderColor: 'var(--carbon-green-dark)'
                }}
              >
                搜索
              </Button>
            }
            size="large"
            style={{ marginBottom: '16px' }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          
          <div className="knowledge-filter-container">
            <Select
              placeholder="选择行业"
              style={{ width: 200, marginRight: '16px' }}
              options={industries}
              value={industryFilter}
              onChange={setIndustryFilter}
            />
            <Select
              placeholder="选择知识类型"
              style={{ width: 200, marginRight: '16px' }}
              options={knowledgeTypes}
              value={typeFilter}
              onChange={setTypeFilter}
            />
            <Select
              placeholder="选择时间范围"
              style={{ width: 200 }}
              defaultValue="all"
            >
              <Select.Option value="all">全部时间</Select.Option>
              <Select.Option value="week">最近一周</Select.Option>
              <Select.Option value="month">最近一月</Select.Option>
              <Select.Option value="quarter">最近一季度</Select.Option>
              <Select.Option value="year">最近一年</Select.Option>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="carbon-card">
        <Tabs defaultActiveKey="1" className="carbon-tabs">
          <TabPane tab="研究报告" key="1">
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
              dataSource={filteredItems}
              renderItem={item => (
                <List.Item>
                  <Card
                    hoverable
                    className="knowledge-card"
                    cover={
                      <div className="knowledge-card-cover">
                        <FileTextOutlined style={{ fontSize: 48, color: 'var(--carbon-green-primary)' }} />
                      </div>
                    }
                    actions={[
                      <Button type="link" icon={<EyeOutlined />}>查看</Button>,
                      <Button type="link" icon={<DownloadOutlined />}>下载</Button>,
                      <Button type="link" icon={<StarOutlined />}>收藏</Button>
                    ]}
                  >
                    <Card.Meta
                      title={
                        <div style={{ 
                          fontSize: '16px', 
                          fontWeight: 500,
                          color: 'var(--carbon-green-dark)',
                          marginBottom: '8px'
                        }}>
                          {item.title}
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ 
                            color: 'var(--carbon-text)',
                            marginBottom: '8px',
                            height: '40px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {item.summary}
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            color: 'var(--carbon-text)',
                            fontSize: '12px'
                          }}>
                            <span>
                              <UserOutlined style={{ marginRight: 4 }} />
                              {item.author}
                            </span>
                            <span>
                              <CalendarOutlined style={{ marginRight: 4 }} />
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div style={{ marginTop: '8px' }}>
                            {item.tags.map(tag => (
                              <Tag key={tag} color="green" style={{ marginBottom: '4px' }}>
                                {tag}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </List.Item>
              )}
            />
          </TabPane>
          <TabPane tab="技术文档" key="2">
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
              dataSource={filteredItems}
              renderItem={item => (
                <List.Item>
                  <Card
                    hoverable
                    className="knowledge-card"
                    cover={
                      <div className="knowledge-card-cover">
                        <FileTextOutlined style={{ fontSize: 48, color: 'var(--carbon-green-primary)' }} />
                      </div>
                    }
                    actions={[
                      <Button type="link" icon={<EyeOutlined />}>查看</Button>,
                      <Button type="link" icon={<DownloadOutlined />}>下载</Button>,
                      <Button type="link" icon={<StarOutlined />}>收藏</Button>
                    ]}
                  >
                    <Card.Meta
                      title={
                        <div style={{ 
                          fontSize: '16px', 
                          fontWeight: 500,
                          color: 'var(--carbon-green-dark)',
                          marginBottom: '8px'
                        }}>
                          {item.title}
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ 
                            color: 'var(--carbon-text)',
                            marginBottom: '8px',
                            height: '40px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {item.summary}
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            color: 'var(--carbon-text)',
                            fontSize: '12px'
                          }}>
                            <span>
                              <UserOutlined style={{ marginRight: 4 }} />
                              {item.author}
                            </span>
                            <span>
                              <CalendarOutlined style={{ marginRight: 4 }} />
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div style={{ marginTop: '8px' }}>
                            {item.tags.map(tag => (
                              <Tag key={tag} color="green" style={{ marginBottom: '4px' }}>
                                {tag}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </List.Item>
              )}
            />
          </TabPane>
          <TabPane tab="案例分析" key="3">
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
              dataSource={filteredItems}
              renderItem={item => (
                <List.Item>
                  <Card
                    hoverable
                    className="knowledge-card"
                    cover={
                      <div className="knowledge-card-cover">
                        <FileTextOutlined style={{ fontSize: 48, color: 'var(--carbon-green-primary)' }} />
                      </div>
                    }
                    actions={[
                      <Button type="link" icon={<EyeOutlined />}>查看</Button>,
                      <Button type="link" icon={<DownloadOutlined />}>下载</Button>,
                      <Button type="link" icon={<StarOutlined />}>收藏</Button>
                    ]}
                  >
                    <Card.Meta
                      title={
                        <div style={{ 
                          fontSize: '16px', 
                          fontWeight: 500,
                          color: 'var(--carbon-green-dark)',
                          marginBottom: '8px'
                        }}>
                          {item.title}
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ 
                            color: 'var(--carbon-text)',
                            marginBottom: '8px',
                            height: '40px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {item.summary}
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            color: 'var(--carbon-text)',
                            fontSize: '12px'
                          }}>
                            <span>
                              <UserOutlined style={{ marginRight: 4 }} />
                              {item.author}
                            </span>
                            <span>
                              <CalendarOutlined style={{ marginRight: 4 }} />
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div style={{ marginTop: '8px' }}>
                            {item.tags.map(tag => (
                              <Tag key={tag} color="green" style={{ marginBottom: '4px' }}>
                                {tag}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </List.Item>
              )}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default IndustryKnowledgeSection; 