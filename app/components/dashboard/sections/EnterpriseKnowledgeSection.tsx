import React, { useState } from 'react';
import {
  Typography,
  Card,
  Input,
  Select,
  List,
  Tag,
  Button,
  Tabs,
} from 'antd';
import {
  BookOutlined,
  FileTextOutlined,
  EyeOutlined,
  DownloadOutlined,
  StarOutlined,
  SearchOutlined,
  UserOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import './EnterpriseKnowledgeSection.css';

const { Title } = Typography;
const { TabPane } = Tabs;

interface KnowledgeItem {
  id: number;
  title: string;
  summary: string;
  category_id: number;
  knowledge_type: string;
  industry: string;
  author: string;
  source: string;
  views: number;
  rating: number;
  created_at: string;
  updated_at: string;
  category: {
    id: number;
    name: string;
  };
  tags: Array<{
    id: number;
    name: string;
  }>;
}

const EnterpriseKnowledgeSection: React.FC = () => {
  // 模拟知识库数据
  const knowledgeItems: KnowledgeItem[] = [
    {
      id: 1,
      title: "电子产品碳足迹核算指南",
      summary: "详细介绍了电子产品生命周期各阶段的碳足迹核算方法和数据收集规范",
      category_id: 1,
      knowledge_type: "技术文档",
      industry: "电子制造",
      author: "张工",
      source: "内部资料",
      views: 156,
      rating: 4.5,
      created_at: "2023-06-10T12:00:00Z",
      updated_at: "2023-06-10T12:00:00Z",
      category: {
        id: 1,
        name: "碳足迹核算",
      },
      tags: [
        { id: 1, name: "电子产品" },
        { id: 2, name: "核算方法" },
        { id: 3, name: "生命周期评估" },
      ],
    },
    {
      id: 2,
      title: "供应链减碳最佳实践案例集",
      summary: "汇集了多个行业领先企业在供应链减碳方面的成功经验和实践案例",
      category_id: 2,
      knowledge_type: "研究报告",
      industry: "多行业",
      author: "李研究",
      source: "可持续发展研究中心",
      views: 238,
      rating: 4.8,
      created_at: "2023-05-20T09:30:00Z",
      updated_at: "2023-05-25T14:20:00Z",
      category: {
        id: 2,
        name: "减碳实践",
      },
      tags: [
        { id: 4, name: "供应链管理" },
        { id: 5, name: "减碳案例" },
        { id: 6, name: "最佳实践" },
      ],
    },
  ];

  return (
    <div className="knowledge-base-container">
      <Title level={2} style={{ 
        color: 'var(--carbon-green-dark)', 
        borderBottom: '2px solid var(--carbon-border)', 
        paddingBottom: '12px',
        marginBottom: '24px'
      }}>
        <BookOutlined style={{ marginRight: 12, color: 'var(--carbon-green-primary)' }} />
        企业知识库
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
          />

          <div className="knowledge-filter-container">
            <Select
              placeholder="选择行业"
              style={{ width: 200, marginRight: '16px' }}
              defaultValue="all"
            >
              <Select.Option value="all">全部行业</Select.Option>
              <Select.Option value="电子制造">电子制造</Select.Option>
              <Select.Option value="纺织业">纺织业</Select.Option>
              <Select.Option value="汽车制造">汽车制造</Select.Option>
              <Select.Option value="食品加工">食品加工</Select.Option>
              <Select.Option value="化工">化工</Select.Option>
            </Select>

            <Select
              placeholder="选择知识类型"
              style={{ width: 200, marginRight: '16px' }}
              defaultValue="all"
            >
              <Select.Option value="all">全部类型</Select.Option>
              <Select.Option value="技术文档">技术文档</Select.Option>
              <Select.Option value="研究报告">研究报告</Select.Option>
              <Select.Option value="案例分析">案例分析</Select.Option>
              <Select.Option value="最佳实践">最佳实践</Select.Option>
            </Select>

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
              dataSource={knowledgeItems}
              renderItem={(item) => (
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
                            {item.summary || '暂无描述'}
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
                              {item.author || '未知作者'}
                            </span>
                            <span>
                              <CalendarOutlined style={{ marginRight: 4 }} />
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div style={{ marginTop: '8px' }}>
                            {item.tags?.map(tag => (
                              <Tag key={tag.id} color="green" style={{ marginBottom: '4px' }}>
                                {tag.name}
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
            {/* 技术文档内容 */}
          </TabPane>
          <TabPane tab="案例分析" key="3">
            {/* 案例分析内容 */}
          </TabPane>
          <TabPane tab="最佳实践" key="4">
            {/* 最佳实践内容 */}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default EnterpriseKnowledgeSection; 