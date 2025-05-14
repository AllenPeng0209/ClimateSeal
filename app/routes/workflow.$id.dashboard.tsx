import React from 'react';
import { useParams, useNavigate } from '@remix-run/react';
import { Card, Typography, Row, Col, Statistic, Button, message } from 'antd';
import { CloudOutlined, LineChartOutlined, BarChartOutlined, ArrowLeftOutlined } from '@ant-design/icons';

export default function WorkflowDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!id) {
      message.error('未找到工作流ID');
      navigate('/');
    }
    console.log('Dashboard mounted with ID:', id);
  }, [id, navigate]);

  return (
    <div style={{ padding: 24 }}>
      {/* 顶部导航 */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
        >
          返回
        </Button>
        <Typography.Title level={3} style={{ margin: '0 0 0 16px' }}>
          产品生命周期分析报告
        </Typography.Title>
      </div>

      {/* 基础信息 */}
      <Card title="基础信息" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Typography.Text strong>工作流ID：</Typography.Text>
            <Typography.Text>{id}</Typography.Text>
          </Col>
        </Row>
      </Card>

      {/* 总览卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="总碳足迹"
              value={1234}
              suffix="kg CO₂e"
              prefix={<CloudOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="单位产品碳足迹"
              value={12.34}
              suffix="kg CO₂e/件"
              prefix={<LineChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="减排潜力"
              value={25}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 生命周期分析 */}
      <Card title="生命周期阶段分析" style={{ marginBottom: 24 }}>
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          图表区域（生命周期阶段分布）
        </div>
      </Card>

      {/* 排放热点 */}
      <Card title="排放热点分析" style={{ marginBottom: 24 }}>
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          图表区域（热点分析）
        </div>
      </Card>

      {/* 同类产品对比 */}
      <Card title="同类产品对比分析">
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          图表区域（对比分析）
        </div>
      </Card>

      {/* 占位内容 */}
      <Card title="分析结果">
        <Typography.Text>
          这里将展示详细的分析结果...
        </Typography.Text>
      </Card>
    </div>
  );
} 