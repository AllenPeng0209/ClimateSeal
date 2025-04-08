import React from "react";
import { Card, Row, Col, Statistic, Progress, List, Typography, Tag } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import type { Product, WorkflowTask, VendorTask, CarbonReductionTask, CarbonTrendPoint } from "~/types/dashboard";
import { Area } from '@ant-design/plots';

const { Title } = Typography;

interface DashboardSectionProps {
  products: Product[];
  workflowTasks: WorkflowTask[];
  vendorDataTasks: VendorTask[];
  carbonReductionTasks: CarbonReductionTask[];
  carbonTrendData: CarbonTrendPoint[];
}

const DashboardSection: React.FC<DashboardSectionProps> = ({
  products,
  workflowTasks,
  vendorDataTasks,
  carbonReductionTasks,
  carbonTrendData,
}) => {
  const completedTasks = workflowTasks.filter(task => task.status === "completed").length;
  const totalTasks = workflowTasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const latestCarbonValue = carbonTrendData[carbonTrendData.length - 1]?.value || 0;
  const previousCarbonValue = carbonTrendData[carbonTrendData.length - 2]?.value || 0;
  const carbonChange = previousCarbonValue > 0 
    ? ((latestCarbonValue - previousCarbonValue) / previousCarbonValue) * 100 
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <div className="dashboard-section">
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="工作流完成率"
              value={completionRate}
              suffix="%"
              valueStyle={{ color: completionRate >= 80 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="碳排放趋势"
              value={carbonChange}
              precision={2}
              suffix="%"
              prefix={carbonChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              valueStyle={{ color: carbonChange <= 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理任务"
              value={workflowTasks.filter(task => task.status === "pending").length}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="供应商数据收集"
              value={vendorDataTasks.filter(task => task.status === "completed").length}
              suffix={`/ ${vendorDataTasks.length}`}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="碳排放趋势">
            <Area
              data={carbonTrendData}
              xField="date"
              yField="value"
              seriesField="unit"
              smooth
              areaStyle={{
                fillOpacity: 0.6,
              }}
              line={{
                color: '#1890ff',
              }}
              area={{
                color: '#1890ff',
              }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="工作流任务">
            <List
              dataSource={workflowTasks}
              renderItem={task => (
                <List.Item>
                  <List.Item.Meta
                    title={task.name}
                    description={
                      <>
                        <Tag color={getStatusColor(task.status)}>{task.status}</Tag>
                        <span style={{ marginLeft: 8 }}>截止日期: {task.dueDate}</span>
                      </>
                    }
                  />
                  <Progress percent={task.progress} size="small" />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="供应商数据收集">
            <List
              dataSource={vendorDataTasks}
              renderItem={task => (
                <List.Item>
                  <List.Item.Meta
                    title={task.name}
                    description={
                      <>
                        <Tag color={getStatusColor(task.status)}>{task.status}</Tag>
                        <span style={{ marginLeft: 8 }}>负责人: {task.assignedTo}</span>
                        <span style={{ marginLeft: 8 }}>截止日期: {task.dueDate}</span>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="碳减排任务">
            <List
              dataSource={carbonReductionTasks}
              renderItem={task => (
                <List.Item>
                  <List.Item.Meta
                    title={task.name}
                    description={
                      <>
                        <span>目标: {task.targetReduction} {task.unit}</span>
                        <span style={{ marginLeft: 8 }}>截止日期: {task.deadline}</span>
                      </>
                    }
                  />
                  <Progress
                    percent={Math.round((task.currentReduction / task.targetReduction) * 100)}
                    size="small"
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="产品碳足迹">
            <List
              dataSource={products}
              renderItem={product => (
                <List.Item>
                  <List.Item.Meta
                    title={product.name}
                    description={`碳足迹: ${product.carbonFootprint} ${product.unit}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardSection; 