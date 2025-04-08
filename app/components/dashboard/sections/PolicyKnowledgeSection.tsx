import React from 'react';
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
  GlobalOutlined,
  FileTextOutlined,
  EyeOutlined,
  DownloadOutlined,
  StarOutlined,
  CalendarOutlined,
  SafetyOutlined,
} from '@ant-design/icons';

const { Title } = Typography;
const { TabPane } = Tabs;

const PolicyKnowledgeSection: React.FC = () => {
  // 模拟政策法规数据
  const policyItems = [
    {
      id: 1,
      title: "国家碳排放权交易管理办法（试行）",
      summary: "规定了碳排放权交易的范围、配额分配、交易流程和监管要求等内容",
      category_id: 1,
      knowledge_type: "法规",
      created_at: "2023-06-10T12:00:00Z",
      updated_at: "2023-06-10T12:00:00Z",
      category: {
        id: 1,
        name: "碳交易",
      },
      tags: [
        { id: 1, name: "碳交易" },
        { id: 2, name: "国家政策" },
      ],
    },
    {
      id: 2,
      title: "工业企业碳排放数据核算与报告指南",
      summary: "详细规定了工业企业碳排放数据的核算方法、报告格式和要求",
      category_id: 2,
      knowledge_type: "指南",
      created_at: "2023-05-20T09:30:00Z",
      updated_at: "2023-05-25T14:20:00Z",
      category: {
        id: 2,
        name: "核算方法",
      },
      tags: [
        { id: 3, name: "数据核算" },
        { id: 4, name: "工业企业" },
        { id: 5, name: "报告指南" },
      ],
    },
    {
      id: 3,
      title: "企业环境信息依法披露管理办法",
      summary: "规定了企业环境信息公开的范围、方式、内容和法律责任",
      category_id: 3,
      knowledge_type: "法规",
      created_at: "2023-04-15T16:45:00Z",
      updated_at: "2023-04-18T10:30:00Z",
      category: {
        id: 3,
        name: "信息披露",
      },
      tags: [
        { id: 6, name: "环境信息" },
        { id: 7, name: "信息披露" },
        { id: 8, name: "法规" },
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
        <GlobalOutlined style={{ marginRight: 12, color: 'var(--carbon-green-primary)' }} />
        政策法规库
      </Title>

      <Card className="carbon-card" style={{ marginBottom: '24px' }}>
        <div className="knowledge-search-container">
          <Input.Search
            placeholder="搜索政策法规..."
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
              placeholder="选择地区"
              style={{ width: 200, marginRight: '16px' }}
              defaultValue="all"
            >
              <Select.Option value="all">全部地区</Select.Option>
              <Select.Option value="china">中国大陆</Select.Option>
              <Select.Option value="hongkong">香港特别行政区</Select.Option>
              <Select.Option value="macau">澳门特别行政区</Select.Option>
              <Select.Option value="taiwan">台湾地区</Select.Option>
              <Select.Option value="international">国际法规</Select.Option>
            </Select>

            <Select
              placeholder="选择法规类型"
              style={{ width: 200, marginRight: '16px' }}
              defaultValue="all"
            >
              <Select.Option value="all">全部类型</Select.Option>
              <Select.Option value="environmental">环境法规</Select.Option>
              <Select.Option value="energy">能源法规</Select.Option>
              <Select.Option value="carbon">碳排放法规</Select.Option>
              <Select.Option value="safety">安全生产法规</Select.Option>
              <Select.Option value="quality">质量标准</Select.Option>
            </Select>

            <Select
              placeholder="选择时间范围"
              style={{ width: 200 }}
              defaultValue="all"
            >
              <Select.Option value="all">全部时间</Select.Option>
              <Select.Option value="year">最近一年</Select.Option>
              <Select.Option value="three-years">最近三年</Select.Option>
              <Select.Option value="five-years">最近五年</Select.Option>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="carbon-card">
        <Tabs defaultActiveKey="1" className="carbon-tabs">
          <TabPane tab="最新政策" key="1">
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
              dataSource={policyItems}
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
                      <Button type="link" icon={<EyeOutlined />}>查看详情</Button>,
                      <Button type="link" icon={<DownloadOutlined />}>下载原文</Button>,
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
                              <CalendarOutlined style={{ marginRight: 4 }} />
                              发布日期: {new Date(item.created_at).toLocaleDateString()}
                            </span>
                            <span>
                              <SafetyOutlined style={{ marginRight: 4 }} />
                              生效日期: {new Date(item.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div style={{ marginTop: '8px' }}>
                            <Tag color="blue" style={{ marginBottom: '4px' }}>
                              {item.category?.name || '未分类'}
                            </Tag>
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
          <TabPane tab="重点法规" key="2">
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
              dataSource={policyItems}
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
                      <Button type="link" icon={<EyeOutlined />}>查看详情</Button>,
                      <Button type="link" icon={<DownloadOutlined />}>下载原文</Button>,
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
                              <CalendarOutlined style={{ marginRight: 4 }} />
                              发布日期: {new Date(item.created_at).toLocaleDateString()}
                            </span>
                            <span>
                              <SafetyOutlined style={{ marginRight: 4 }} />
                              生效日期: {new Date(item.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div style={{ marginTop: '8px' }}>
                            <Tag color="blue" style={{ marginBottom: '4px' }}>
                              {item.category?.name || '未分类'}
                            </Tag>
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
        </Tabs>
      </Card>
    </div>
  );
};

export default PolicyKnowledgeSection; 