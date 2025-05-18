import React from 'react';
import { Card, Row, Col, Progress, List } from 'antd';
import { useCarbonFlowStore } from '~/components/workbench/CarbonFlow/CarbonFlowBridge';
import type { NodeData } from '~/types/nodes';

interface VisualizationAnalysisProps {
  onBack: () => void;
  workflowName?: string;
}

// Helper function for lifecycle stage colors (example)
const getStageColor = (stage: string) => {
  switch (stage) {
    case '原材料获取':
      return '#1890ff';
    case '生产制造':
      return '#13c2c2';
    case '分销运输':
      return '#ffc53d';
    case '使用阶段':
      return '#ff7a45';
    case '废弃处置':
      return '#ff4d4f';
    default:
      return '#8c8c8c';
  }
};

const mockData = {
  productInfo: {
    name: '某产品A',
    boundary: '从摇篮到大门', // 或 '从摇篮到坟墓'
    period: '2024.5.10-2025.5.10',
    standard: 'ISO 14067',
    unit: '件',
    footprint: 123.45,
    credibilityScore: 70, // 添加可信总分
  },
  conversion: [
    { label: '家庭用电量', value: '456 kWh', icon: '⚡️' },
    { label: '汽油车行驶里程', value: '789 km', icon: '🚗' },
    { label: '梭梭树碳吸收量', value: '12 棵', icon: '🌳' },
  ],
  lifecycle: [
    { stage: '原材料获取', percent: 40 },
    { stage: '生产制造', percent: 25 },
    { stage: '分销运输', percent: 15 },
    { stage: '使用阶段', percent: 10 },
    { stage: '废弃处置', percent: 10 },
  ],
  hotspot: [
    { name: '原材料A', percent: 30 },
    { name: '运输B', percent: 20 },
    { name: '能源C', percent: 15 },
    { name: '包装D', percent: 10 },
    { name: '废弃E', percent: 8 },
  ],
  reduction: [
    { measure: '替换原材料', percent: 10, icon: '🔄' },
    { measure: '优化运输', percent: 5, icon: '🚚' },
    { measure: '能源结构调整', percent: 8, icon: '⚡️' },
  ],
};

export const VisualizationAnalysis: React.FC<VisualizationAnalysisProps> = ({ onBack: _onBack }) => {
  // 根据分数决定显示颜色
  const getScoreColor = (score: number) => {
    if (score > 80) {
      return '#52c41a'; // 绿色
    }

    if (score >= 61) {
      return '#faad14'; // 橙色
    }

    return '#f5222d'; // 红色
  };
  const store = useCarbonFlowStore();
  const {
    nodes,
    aiSummary,
    sceneInfo: { productName = '', standard = '', boundary = '' },
  } = store.getCarbonFlowData();

  const totalCarbonFootprint = parseFloat(
    nodes
      .map((x: { data: NodeData }) => x.data.carbonFootprint)
      .reduce((a: number, b: string | number) => Number(a) + Number(b || 0), 0)
      .toFixed(2),
  );
  const scoreColor = getScoreColor(aiSummary.credibilityScore);
  const conversion = [
    { label: '家庭用电量', value: `${(totalCarbonFootprint / 0.5582).toFixed(2)} kWh`, icon: '⚡️' },
    { label: '汽油车行驶里程', value: `${(totalCarbonFootprint / 0.203).toFixed(2)} km`, icon: '🚗' },
    { label: '梭梭树碳吸收量', value: `${(totalCarbonFootprint / 17.9).toFixed(2)} 棵`, icon: '🌳' },
  ];

  const calcPercent = (stage: string) => {
    let lifecycleStage = '';

    switch (stage) {
      case '原材料获取':
        lifecycleStage = '原材料获取阶段';
        break;
      case '生产制造':
        lifecycleStage = '生产阶段';
        break;
      case '分销运输':
        lifecycleStage = '分销运输阶段';
        break;
      case '使用阶段':
        lifecycleStage = '使用阶段';
        break;
      case '废弃处置':
        lifecycleStage = '寿命终止阶段';
        break;
    }

    const stageCarbonFootprint = nodes
      .filter((x: { data: NodeData }) => x.data.lifecycleStage === lifecycleStage)
      .map((x: { data: NodeData }) => x.data.carbonFootprint)
      .reduce((a: number, b: string | number) => Number(a) + Number(b || 0), 0);

    const percentage = (stageCarbonFootprint / (totalCarbonFootprint || 1)) * 100; // Avoid division by zero

    return Number(percentage.toFixed(2));
  };

  const lifecycle = !boundary
    ? []
    : boundary === '从摇篮到大门'
      ? [
          { stage: '原材料获取', percent: calcPercent('原材料获取') },
          { stage: '生产制造', percent: calcPercent('生产制造') },
        ]
      : [
          { stage: '原材料获取', percent: calcPercent('原材料获取') },
          { stage: '生产制造', percent: calcPercent('生产制造') },
          { stage: '分销运输', percent: calcPercent('分销运输') },
          { stage: '使用阶段', percent: calcPercent('使用阶段') },
          { stage: '废弃处置', percent: calcPercent('废弃处置') },
        ];

  function getTopEmissionTypesPercent(
    currentTotalCarbonFootprint: number,
    data: Array<{ data: NodeData }>,
  ): Array<{ name: string; percent: number }> {
    const summary: Record<string, number> = {};

    // 累加同类 emissionType 的 carbonFootprint
    for (const item of data) {
      const { label, carbonFootprint } = item.data;

      if (label && carbonFootprint) {
        const value = parseFloat(carbonFootprint as string) || 0;
        summary[label] = (summary[label] || 0) + value;
      }
    }

    // 转为数组并计算百分比
    const result = Object.entries(summary).map(([label, total]) => {
      const percent = Number(((total / (currentTotalCarbonFootprint || 1)) * 100).toFixed(2)); // Avoid division by zero
      return { name: label, percent };
    });

    // 排序取前5
    return result.sort((a, b) => b.percent - a.percent).slice(0, 5);
  }

  const hotspot = getTopEmissionTypesPercent(totalCarbonFootprint, nodes);

  return (
    <div
      style={{
        background: '#181818',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* 顶部固定区域 - 包含导航和产品信息 */}
      <div
        style={{
          padding: '20px 32px',
          borderBottom: '1px solid #333',
          background: '#181818',
          color: '#e0e0e0',
          zIndex: 10,
        }}
      >
        {/* 产品信息和可信得分上下对齐 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* 左侧产品信息区 */}
          <div
            style={{
              flex: '1',
              border: '1px solid #333',
              borderRadius: '4px',
              padding: '16px',
              backgroundColor: 'rgba(40, 40, 40, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#faad14', marginRight: 16 }}>{productName}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#faad14' }}>
                {totalCarbonFootprint} kgCO₂e/{mockData.productInfo.unit}
              </div>
            </div>

            <Row gutter={[24, 8]}>
              <Col>核算边界：{boundary}</Col>
              <Col>核算周期：{mockData.productInfo.period}</Col>
              <Col>核算标准：{standard}</Col>
            </Row>
          </div>

          {/* 右侧可信得分区 */}
          <div
            style={{
              marginLeft: '16px',
              width: '120px',
              height: '120px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              border: '1px solid #333',
              borderRadius: '4px',
              backgroundColor: 'rgba(40, 40, 40, 0.3)',
            }}
          >
            <div
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                border: `2px solid ${scoreColor}`,
                backgroundColor: 'rgba(42, 26, 14, 0.8)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 600, color: scoreColor }}>{aiSummary.credibilityScore}</div>
            </div>
            <div style={{ fontSize: 14, color: '#e0e0e0' }}>可信得分</div>
          </div>
        </div>
      </div>

      {/* 可滚动内容区域 */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 32px 32px',
          color: '#e0e0e0',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 0',
            position: 'sticky',
            top: 0,
            background: '#181818',
            zIndex: 5,
          }}
        >
          <span style={{ fontWeight: 'bold', fontSize: 16 }}>碳足迹等效换算</span>
        </div>

        {/* 相当于区块 */}
        <div style={{ marginBottom: 20 }}>
          <Row gutter={16}>
            {conversion.map((item) => (
              <Col span={8} key={item.label}>
                <Card
                  hoverable
                  bodyStyle={{ padding: '16px', background: '#262626', borderRadius: '4px' }}
                  style={{ background: '#262626', border: '1px solid #444' }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: '8px' }}>{item.icon}</div>
                    <div style={{ fontSize: 16, color: '#bfbfbf', marginBottom: '4px' }}>{item.label}</div>
                    <div style={{ fontSize: 18, color: '#1890ff', fontWeight: 600 }}>{item.value}</div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* 生命周期分析 + 热点分析 并列 */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col span={12}>
            <Card
              title="生命周期阶段碳排放占比"
              headStyle={{ borderBottom: '1px solid #444', color: '#e0e0e0', fontSize: '18px' }}
              bodyStyle={{ padding: '16px', background: '#262626', borderRadius: '0 0 4px 4px' }}
              style={{ color: '#e0e0e0', border: '1px solid #444', background: '#262626' }}
            >
              <List
                itemLayout="horizontal"
                dataSource={lifecycle}
                renderItem={(item) => (
                  <List.Item
                    style={{
                      padding: '12px 0',
                      borderBottom: lifecycle[lifecycle.length - 1] === item ? 'none' : '1px solid #444',
                    }}
                  >
                    <List.Item.Meta
                      title={<span style={{ color: '#e0e0e0', fontSize: '14px' }}>{item.stage}</span>}
                      description={
                        <Progress
                          percent={item.percent}
                          showInfo={false}
                          strokeColor={getStageColor(item.stage)}
                          trailColor="#555"
                          style={{ lineHeight: '12px' }}
                        />
                      }
                    />
                    <span
                      style={{
                        color: getStageColor(item.stage),
                        marginLeft: '16px',
                        fontSize: '14px',
                        fontWeight: 600,
                      }}
                    >
                      {item.percent}%
                    </span>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card
              title="碳排放热点分析 (Top 5)"
              headStyle={{ borderBottom: '1px solid #444', color: '#e0e0e0', fontSize: '18px' }}
              bodyStyle={{ padding: '16px', background: '#262626', borderRadius: '0 0 4px 4px' }}
              style={{ color: '#e0e0e0', border: '1px solid #444', background: '#262626' }}
            >
              <List
                itemLayout="horizontal"
                dataSource={[...hotspot].sort((a, b) => b.percent - a.percent)}
                renderItem={(item) => (
                  <List.Item
                    style={{
                      padding: '12px 0',
                      borderBottom: hotspot[hotspot.length - 1] === item ? 'none' : '1px solid #444',
                    }}
                  >
                    <List.Item.Meta
                      title={<span style={{ color: '#e0e0e0', fontSize: '14px' }}>{item.name}</span>}
                      description={
                        <Progress
                          percent={item.percent}
                          showInfo={false}
                          strokeColor="#faad14"
                          trailColor="#555"
                          style={{ lineHeight: '12px' }}
                        />
                      }
                    />
                    <span
                      style={{
                        color: '#faad14',
                        marginLeft: '16px',
                        fontSize: '14px',
                        fontWeight: 600,
                      }}
                    >
                      {item.percent}%
                    </span>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>

        {/* 减排潜力 */}
        <Card
          title="减排潜力分析"
          headStyle={{ borderBottom: '1px solid #444', color: '#e0e0e0', fontSize: '18px' }}
          bodyStyle={{ padding: '16px', background: '#262626', borderRadius: '0 0 4px 4px' }}
          style={{ color: '#e0e0e0', border: '1px solid #444', background: '#262626' }}
        >
          <List
            itemLayout="vertical"
            dataSource={mockData.reduction}
            renderItem={(item) => (
              <List.Item
                style={{
                  padding: '12px 0',
                  borderBottom: mockData.reduction[mockData.reduction.length - 1] === item ? 'none' : '1px solid #444',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 24, marginRight: '16px' }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#e0e0e0', fontSize: '16px', marginBottom: '4px' }}>{item.measure}</div>
                    <Progress
                      percent={item.percent}
                      showInfo={false}
                      strokeColor="#52c41a"
                      trailColor="#555"
                      style={{ lineHeight: '12px' }}
                    />
                  </div>
                  <span
                    style={{
                      color: '#52c41a',
                      fontSize: '16px',
                      fontWeight: 600,
                      marginLeft: '16px',
                    }}
                  >
                    {item.percent}%
                  </span>
                </div>
              </List.Item>
            )}
          />
        </Card>
      </div>
    </div>
  );
};
