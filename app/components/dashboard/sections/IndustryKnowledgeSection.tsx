import React, { useState } from 'react';
import { Typography, Card, Input, Select, List, Tag, Button, Tabs } from 'antd';
import { SearchOutlined, FilterOutlined, BookOutlined, FileTextOutlined, TeamOutlined } from '@ant-design/icons';
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
      <Title level={2}>行业知识库</Title>
      
      <div className="knowledge-search-container">
        <Search
          placeholder="搜索知识库内容"
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
        
        <div className="knowledge-filter-container">
          <Select
            placeholder="选择行业"
            allowClear
            style={{ width: 200 }}
            options={industries}
            value={industryFilter}
            onChange={setIndustryFilter}
          />
          <Select
            placeholder="选择类型"
            allowClear
            style={{ width: 200 }}
            options={knowledgeTypes}
            value={typeFilter}
            onChange={setTypeFilter}
          />
        </div>
      </div>

      <Tabs defaultActiveKey="1" className="carbon-tabs">
        <TabPane tab="最新发布" key="1">
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
            dataSource={filteredItems}
            renderItem={item => (
              <List.Item>
                <Card
                  className="knowledge-card"
                  cover={
                    <div className="knowledge-card-cover">
                      <BookOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                    </div>
                  }
                >
                  <Card.Meta
                    title={item.title}
                    description={
                      <div>
                        <p>{item.summary}</p>
                        <div style={{ marginTop: 8 }}>
                          {item.tags.map(tag => (
                            <Tag key={tag} color="blue">{tag}</Tag>
                          ))}
                        </div>
                        <div style={{ marginTop: 8, color: '#999' }}>
                          <span>{item.author}</span>
                          <span style={{ marginLeft: 16 }}>{item.views} 次浏览</span>
                        </div>
                      </div>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        </TabPane>
        <TabPane tab="热门推荐" key="2">
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
            dataSource={filteredItems.sort((a, b) => b.views - a.views)}
            renderItem={item => (
              <List.Item>
                <Card
                  className="knowledge-card"
                  cover={
                    <div className="knowledge-card-cover">
                      <FileTextOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                    </div>
                  }
                >
                  <Card.Meta
                    title={item.title}
                    description={
                      <div>
                        <p>{item.summary}</p>
                        <div style={{ marginTop: 8 }}>
                          {item.tags.map(tag => (
                            <Tag key={tag} color="blue">{tag}</Tag>
                          ))}
                        </div>
                        <div style={{ marginTop: 8, color: '#999' }}>
                          <span>{item.author}</span>
                          <span style={{ marginLeft: 16 }}>{item.views} 次浏览</span>
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
    </div>
  );
};

export default IndustryKnowledgeSection; 