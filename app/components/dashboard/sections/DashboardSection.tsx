import React from 'react';
import {
  Card,
  Typography,
  Statistic,
  Progress,
  Row,
  Col,
  Tag,
  Avatar,
  List,
  Tabs,
  Badge,
} from 'antd';
import {
  SafetyOutlined,
  ReconciliationOutlined,
  DatabaseOutlined,
  CloudOutlined,
  AimOutlined,
  LineChartOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { Product, WorkflowTask, VendorDataTask, CarbonReductionTask } from '~/types';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface DashboardSectionProps {
  products: Product[];
  workflowTasks: WorkflowTask[];
  vendorDataTasks: VendorDataTask[];
  carbonReductionTasks: CarbonReductionTask[];
  carbonTrendData: {
    months: string[];
    values: number[];
    industryAvg: number[];
    leadingAvg: number[];
    ourCompany: number[];
  };
}

const DashboardSection: React.FC<DashboardSectionProps> = ({
  products,
  workflowTasks,
  vendorDataTasks,
  carbonReductionTasks,
  carbonTrendData
}) => {
  // 计算平均碳足迹
  const avgCarbonFootprint = products.reduce((acc, product) => acc + (product.carbonFootprint || 0), 0) / products.length;

  // 计算碳减排潜力（模拟数据）
  const carbonReductionPotential = avgCarbonFootprint * 0.25;

  return (
    <>
      <Card
        className="carbon-company-profile"
        style={{ marginBottom: "24px" }}
      >
        <Row gutter={16} align="middle">
          <Col span={4}>
            <Avatar size={80} style={{ 
              backgroundColor: 'var(--carbon-green-primary)', 
              boxShadow: '0 4px 12px rgba(46, 139, 87, 0.2)' 
            }}>
              <SafetyOutlined style={{ fontSize: 40 }} />
            </Avatar>
          </Col>
          <Col span={20}>
            <Title level={4} style={{ color: 'var(--carbon-green-dark)' }}>氣候印記科技有限公司</Title>
            <Paragraph>
              <Tag color="green">ISO 14064 认证</Tag>
              <Tag color="blue">碳中和路径规划</Tag>
              <Tag color="orange">ESG 披露就绪</Tag>
            </Paragraph>
            <Paragraph style={{ color: 'var(--carbon-text)' }}>
              致力于可持续发展的高科技企业，专注于降低产品生命周期碳足迹，实现2030碳中和目标。
            </Paragraph>
            <Progress 
              percent={65} 
              strokeColor="var(--carbon-green-primary)" 
              trailColor="var(--carbon-border)"
              className="carbon-progress"
              style={{ marginTop: 8 }}
            />
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--carbon-text)' }}>
              碳中和目标达成进度: 65%
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: "24px" }}>
        <Col span={6}>
          <Card className="carbon-card">
            <Statistic
              title="工作流总数"
              value={workflowTasks.length}
              prefix={<ReconciliationOutlined className="carbon-icon" />}
              className="carbon-statistic"
            />
          </Card>
        </Col>

        <Col span={6}>
          <Card className="carbon-card">
            <Statistic
              title="供应商任务总数"
              value={vendorDataTasks.length}
              prefix={<DatabaseOutlined className="carbon-icon" />}
              className="carbon-statistic"
            />
          </Card>
        </Col>

        <Col span={6}>
          <Card className="carbon-card">
            <Statistic
              title="平均碳足迹 (kgCO2e)"
              value={avgCarbonFootprint.toFixed(2)}
              precision={2}
              prefix={<CloudOutlined className="carbon-icon" />}
              className="carbon-statistic"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="carbon-card">
            <Statistic
              title="减排潜力 (kgCO2e)"
              value={carbonReductionPotential.toFixed(2)}
              precision={2}
              prefix={<AimOutlined className="carbon-icon" />}
              valueStyle={{ color: '#3cb371' }}
              className="carbon-statistic"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card 
            title={
              <span><LineChartOutlined style={{ marginRight: 8 }} />碳足迹趋势分析</span>
            } 
            className="carbon-card"
            style={{ marginBottom: "24px" }}
          >
            <div className="chart-container" style={{ height: "240px", position: "relative", borderRadius: "8px", overflow: "hidden" }}>
              {/* 这里会展示碳足迹趋势图表，为了简化先使用占位符 */}
              <div style={{ 
                width: '100%', 
                height: '100%', 
                background: 'linear-gradient(to bottom, rgba(250, 252, 254, 0.8), rgba(245, 250, 253, 0.4))',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                color: 'var(--carbon-text-light)'
              }}>
                <LineChartOutlined style={{ fontSize: 36, marginBottom: 16, color: 'var(--carbon-green-primary)' }} />
                <Text>碳足迹趋势图表</Text>
                <Text type="secondary" style={{ fontSize: 12, marginTop: 8 }}>每月碳足迹数据对比趋势</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title={
              <span><BarChartOutlined style={{ marginRight: 8 }} />行业对标分析</span>
            }
            className="carbon-card"
            style={{ marginBottom: "24px" }}
          >
            <div className="chart-container" style={{ height: "240px", position: "relative", borderRadius: "8px", overflow: "hidden" }}>
              {/* 这里会展示行业对标图表，为了简化先使用占位符 */}
              <div style={{ 
                width: '100%', 
                height: '100%', 
                background: 'linear-gradient(to bottom, rgba(250, 252, 254, 0.8), rgba(245, 250, 253, 0.4))',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                color: 'var(--carbon-text-light)'
              }}>
                <BarChartOutlined style={{ fontSize: 36, marginBottom: 16, color: 'var(--carbon-blue)' }} />
                <Text>行业对标图表</Text>
                <Text type="secondary" style={{ fontSize: 12, marginTop: 8 }}>与行业平均和领先企业对比</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card 
        title={
          <span>
            <ReconciliationOutlined style={{ marginRight: 8 }} />
            当前任务
          </span>
        }
        className="carbon-card carbon-tabs"
      >
        <Tabs defaultActiveKey="workflow">
          <TabPane tab="工作流任务" key="workflow">
            <List
              itemLayout="horizontal"
              dataSource={workflowTasks}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <a key="process" style={{ color: 'var(--carbon-green-primary)' }}>处理</a>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        fontSize: "20px",
                        color: "var(--carbon-green-primary)",
                        background: "rgba(46, 139, 87, 0.1)",
                        padding: "8px",
                        borderRadius: "50%"
                      }}>
                        {item.status === "进行中" ? 
                          <ClockCircleOutlined /> : 
                          item.status === "未开始" ? 
                          <CalendarOutlined /> : 
                          <CheckCircleOutlined />}
                      </div>
                    }
                    title={
                      <span>
                        {item.title}{" "}
                        <Badge
                          color={
                            item.priority === "high"
                              ? "var(--carbon-green-dark)"
                              : item.priority === "medium"
                                ? "var(--carbon-green-primary)"
                                : "var(--carbon-green-light)"
                          }
                          text={
                            item.priority === "high"
                              ? "高优先级"
                              : item.priority === "medium"
                                ? "中等优先级"
                                : "低优先级"
                          }
                        />
                      </span>
                    }
                    description={
                      <>
                        <div style={{ marginBottom: 6 }}>
                          截止日期: {item.deadline}
                          <span style={{ marginLeft: 16, color: 'var(--carbon-text)' }}>
                            状态: <span style={{ 
                              color: item.status === "进行中" ? 'var(--carbon-blue)' : 
                                     item.status === "未开始" ? 'var(--carbon-green-light)' : 
                                     'var(--carbon-green-primary)' 
                            }}>
                              {item.status}
                            </span>
                          </span>
                        </div>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </TabPane>

          <TabPane tab="供应商收数任务" key="vendor">
            <List
              itemLayout="horizontal"
              dataSource={vendorDataTasks}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <a key="action" style={{ color: 'var(--carbon-green-primary)' }}>
                      {item.status === "待提交" || item.status === "逾期" ? "催交" : "查看"}
                    </a>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar style={{ 
                        backgroundColor: 
                          item.status === "已提交" ? 'var(--carbon-green-primary)' : 
                          item.status === "逾期" ? 'var(--carbon-earth)' : 
                          'var(--carbon-blue)' 
                      }}>
                        {item.vendor?.substring(0, 1) || '?'}
                      </Avatar>
                    }
                    title={
                      <span>
                        {item.vendor} - {item.product}{" "}
                        <Tag color={
                          item.status === "已提交" ? 'green' : 
                          item.status === "逾期" ? 'orange' : 
                          'blue'
                        }>
                          {item.status}
                        </Tag>
                      </span>
                    }
                    description={
                      <>
                        <div>截止日期: {item.deadline}</div>
                        {item.submittedAt && (
                          <div style={{ color: 'var(--carbon-green-primary)' }}>
                            提交时间: {item.submittedAt}
                            {item.dataQuality && (
                              <span style={{ marginLeft: 16 }}>
                                数据质量: {item.dataQuality}
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </TabPane>

          <TabPane tab="减碳任务" key="reduction">
            <List
              itemLayout="horizontal"
              dataSource={carbonReductionTasks}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <a key="details" style={{ color: 'var(--carbon-green-primary)' }}>详情</a>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        fontSize: "20px",
                        color: "var(--carbon-green-primary)",
                        background: "rgba(46, 139, 87, 0.1)",
                        padding: "8px",
                        borderRadius: "50%"
                      }}>
                        <AimOutlined />
                      </div>
                    }
                    title={
                      <span>
                        {item.title}{" "}
                        <Tag color="green" style={{ fontWeight: 'normal' }}>
                          {item.target}
                        </Tag>
                      </span>
                    }
                    description={
                      <>
                        <div style={{ marginBottom: 6 }}>
                          <span style={{ color: 'var(--carbon-text)' }}>负责部门: {item.responsible}</span>
                          <span style={{ marginLeft: 16, color: 'var(--carbon-text)' }}>
                            截止日期: {item.deadline}
                          </span>
                          <span style={{ marginLeft: 16, color: 'var(--carbon-text)' }}>
                            状态: <span style={{ 
                              color: item.status === "进行中" ? 'var(--carbon-blue)' : 
                                     item.status === "未开始" ? 'var(--carbon-green-light)' : 
                                     item.status === "规划中" ? 'var(--carbon-earth)' : 
                                     'var(--carbon-green-primary)' 
                            }}>
                              {item.status}
                            </span>
                          </span>
                        </div>
                        <Progress 
                          percent={item.progress} 
                          size="small" 
                          status="active"
                          strokeColor="var(--carbon-green-primary)" 
                          trailColor="var(--carbon-border)"
                        />
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </TabPane>
        </Tabs>
      </Card>
    </>
  );
};

export default DashboardSection; 