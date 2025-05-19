import React from 'react';

import { useCarbonFlowStore } from '~/components/workbench/CarbonFlow/CarbonFlowBridge';

import { Row, Col, Card, Typography, Empty, Tabs, Button as AntButton, Table } from 'antd';
import { Pie, Bar, Column } from '@ant-design/plots';
import type { Node } from 'reactflow';
import type { FinalProductNodeData, ProductNodeData, ManufacturingNodeData, DistributionNodeData } from '~/types/nodes'; // Removed unused NodeData, ensured path is correct

const { Title, Text } = Typography;

interface VisualizationAnalysisV2Props {
  onBack?: () => void;
}

const VisualizationAnalysisV2: React.FC<VisualizationAnalysisV2Props> = ({ onBack }) => {
  const { nodes, aiSummary } = useCarbonFlowStore();

  if (!nodes || nodes.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', background: '#0f172a', minHeight: '100vh' }}>
        <Empty description={<span style={{ color: '#e0e0e0' }}>没有可用于分析的数据。请先在流程图中添加节点。</span>} />
        {onBack && (
          <AntButton onClick={onBack} style={{ marginTop: 20 }}>
            返回
          </AntButton>
        )}
      </div>
    );
  }

  // --- 数据处理 ---
  const finalProductNode = nodes.find((node) => node.type === 'finalProduct') as Node<FinalProductNodeData> | undefined;
  const totalCarbonFootprint = finalProductNode?.data?.totalCarbonFootprint ??
    nodes.reduce((sum, node) => {
      const footprint = parseFloat(node.data.carbonFootprint || '0');
      return sum + (isNaN(footprint) ? 0 : footprint);
    }, 0);

  // 1. 按生命周期阶段划分
  const lifecycleStagesData = nodes
    .filter((node) => node.type !== 'finalProduct')
    .reduce<Record<string, number>>((acc, node) => {
      const stage = node.data.lifecycleStage || '未知阶段';
      const footprint = parseFloat(node.data.carbonFootprint || '0');

      if (!isNaN(footprint)) {
        acc[stage] = (acc[stage] || 0) + footprint;
      }

      return acc;
    }, {});

  const lifecyclePieData = Object.entries(lifecycleStagesData)
    .map(([type, value]) => ({ type, value }))
    .filter((item) => item.value > 0);

  // 2. 碳足迹热点节点 (Top 10)
  const nodeSpecificFootprintData = nodes
    .filter((node) => node.type !== 'finalProduct')
    .map((node) => ({
      name: node.data.label || node.id,
      value: parseFloat(node.data.carbonFootprint || '0'),
    }))
    .filter((item) => !isNaN(item.value) && item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // 3. 按排放类型划分 (示例, 假设 NodeData 中有 emissionScope: 'Scope 1' | 'Scope 2' | 'Scope 3')
  const emissionScopeData = nodes
    .filter((node) => node.type !== 'finalProduct' && (node.data as any).emissionScope) // 假设存在 emissionScope
    .reduce<Record<string, number>>((acc, node) => {
      const scope = (node.data as any).emissionScope as string;
      const footprint = parseFloat(node.data.carbonFootprint || '0');

      if (!isNaN(footprint)) {
        acc[scope] = (acc[scope] || 0) + footprint;
      }

      return acc;
    }, {});
  const emissionScopePieData = Object.entries(emissionScopeData)
    .map(([type, value]) => ({ type, value }))
    .filter((item) => item.value > 0);

  // 4. 数据验证状态
  const verificationStatusData = nodes.reduce<Record<string, number>>((acc, node) => {
    const status = node.data.verificationStatus || '未指定';
    acc[status] = (acc[status] || 0) + 1; // 节点数量

    return acc;
  }, {});
  const verificationPieData = Object.entries(verificationStatusData)
    .map(([type, value]) => ({ type, value }))
    .filter((item) => item.value > 0);

  // 5. 材料碳足迹贡献 (产品节点)
  const materialBreakdownData = nodes
    .filter(
      (node): node is Node<ProductNodeData> =>
        node.data.nodeType === 'product' &&
        typeof (node.data as ProductNodeData).material === 'string' &&
        (node.data as ProductNodeData).material?.trim() !== '',
    )
    .reduce<Record<string, number>>((acc, node) => {
      const materialName = (node.data as ProductNodeData).material;
      const footprint = parseFloat(node.data.carbonFootprint || '0');

      if (!isNaN(footprint) && materialName) {
        acc[materialName] = (acc[materialName] || 0) + footprint;
      }

      return acc;
    }, {});
  const materialColumnData = Object.entries(materialBreakdownData)
    .map(([type, value]) => ({ type, value }))
    .filter((item) => item.value > 0);

  // 6. 能源类型碳足迹贡献 (制造节点)
  const energyBreakdownData = nodes
    .filter(
      (node): node is Node<ManufacturingNodeData> =>
        node.data.nodeType === 'manufacturing' &&
        typeof (node.data as ManufacturingNodeData).energyType === 'string' &&
        (node.data as ManufacturingNodeData).energyType.trim() !== '',
    )
    .reduce<Record<string, number>>((acc, node) => {
      const energyName = (node.data as ManufacturingNodeData).energyType;
      const footprint = parseFloat(node.data.carbonFootprint || '0');

      if (!isNaN(footprint)) {
        acc[energyName] = (acc[energyName] || 0) + footprint;
      }

      return acc;
    }, {});
  const energyColumnData = Object.entries(energyBreakdownData)
    .map(([type, value]) => ({ type, value }))
    .filter((item) => item.value > 0);

  // 7. 运输方式碳足迹贡献 (分销节点)
  const transportBreakdownData = nodes
    .filter(
      (node): node is Node<DistributionNodeData> =>
        node.data.nodeType === 'distribution' &&
        typeof (node.data as DistributionNodeData).transportationMode === 'string' &&
        (node.data as DistributionNodeData).transportationMode.trim() !== '',
    )
    .reduce<Record<string, number>>((acc, node) => {
      const transportName = (node.data as DistributionNodeData).transportationMode;
      const footprint = parseFloat(node.data.carbonFootprint || '0');

      if (!isNaN(footprint)) {
        acc[transportName] = (acc[transportName] || 0) + footprint;
      }

      return acc;
    }, {});
  const transportColumnData = Object.entries(transportBreakdownData)
    .map(([type, value]) => ({ type, value }))
    .filter((item) => item.value > 0);

  // 8. 原始数据表
  const allNodesTableData = nodes.map((node) => ({
    key: node.id,
    name: node.data.label || node.id,
    type: node.data.nodeType || '未知',
    lifecycleStage: node.data.lifecycleStage || '未知阶段',
    carbonFootprint: parseFloat(node.data.carbonFootprint || '0'),
    verificationStatus: node.data.verificationStatus || '未指定',

    // Add more fields as needed
  }));

  const tableColumns = [
    {
      title: '节点名称',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
      ellipsis: true,
    },
    { title: '节点类型', dataIndex: 'type', key: 'type', sorter: (a: any, b: any) => a.type.localeCompare(b.type) },
    {
      title: '生命周期阶段',
      dataIndex: 'lifecycleStage',
      key: 'lifecycleStage',
      sorter: (a: any, b: any) => a.lifecycleStage.localeCompare(b.lifecycleStage),
      ellipsis: true,
    },
    {
      title: '碳足迹 (kgCO2e)',
      dataIndex: 'carbonFootprint',
      key: 'carbonFootprint',
      sorter: (a: any, b: any) => a.carbonFootprint - b.carbonFootprint,
      render: (val: number) => (isNaN(val) ? 'N/A' : val.toFixed(2)),
      align: 'right' as const,
    },
    {
      title: '验证状态',
      dataIndex: 'verificationStatus',
      key: 'verificationStatus',
      sorter: (a: any, b: any) => a.verificationStatus.localeCompare(b.verificationStatus),
    },
  ];

  /* --- 图表配置 --- */
  const commonTooltipFormatter = (datum: any) => ({
    name: datum.type || datum.name,
    value: `${isNaN(datum.value) ? 'N/A' : datum.value.toFixed(2)} kgCO2e`,
  });
  const commonLabelStyle = { fill: '#e0e0e0', fontSize: 10 };
  const commonAxisStyle = {
    label: { style: { fill: '#ccc', fontSize: 10 } },
    title: { style: { fill: '#e0e0e0', fontSize: 12 } },
    line: { style: { stroke: '#444' } },
    tickLine: { style: { stroke: '#444' } },
    grid: { line: { style: { stroke: '#333' } } },
  };

  const pieConfigBase = {
    appendPadding: 10,
    angleField: 'value',
    colorField: 'type',
    radius: 0.85,
    innerRadius: 0.4,
    label: {
      type: 'outer',
      offset: '30%',
      content: (item: any) => `${item.type}: ${(item.percent * 100).toFixed(1)}%`,
      style: commonLabelStyle,
    },
    interactions: [{ type: 'element-selected' }, { type: 'element-active' }, { type: 'legend-highlight' }],
    tooltip: { formatter: commonTooltipFormatter },
    legend: {
      itemName: { style: { fill: '#e0e0e0' } },
    },
  };

  const horizontalBarConfigBase = {
    yField: 'name',
    xField: 'value',
    seriesField: 'name', // For distinct colors if desired, or remove if single color
    legend: false as const,
    barWidthRatio: 0.6,
    label: {
      position: 'right' as const,
      content: (item: any) => `${isNaN(item.value) ? '' : item.value.toFixed(1)}`,
      style: { ...commonLabelStyle, fill: '#ccc' },
    },
    xAxis: { ...commonAxisStyle, title: { ...commonAxisStyle.title, text: '碳足迹 (kgCO2e)' } },
    yAxis: {
      ...commonAxisStyle,
      title: { ...commonAxisStyle.title, text: '' },
      label: {
        ...commonAxisStyle.label,
        autoHide: false,
        autoRotate: false,
        formatter: (text: string) => (text.length > 15 ? text.substring(0, 12) + '...' : text),
      },
    }, // Truncate long labels
    tooltip: { formatter: commonTooltipFormatter },
  };

  const columnConfigBase = {
    xField: 'type',
    yField: 'value',
    seriesField: 'type', // For distinct colors
    legend: false as const, // Can be enabled: { position: 'top-right', itemName: { style: {fill: '#e0e0e0'} } },
    label: {
      position: 'top' as const,
      content: (item: any) => `${isNaN(item.value) ? '' : item.value.toFixed(1)}`,
      style: commonLabelStyle,
    },
    xAxis: {
      ...commonAxisStyle,
      title: { ...commonAxisStyle.title, text: '' },
      label: { ...commonAxisStyle.label, autoHide: true, autoRotate: true },
    },
    yAxis: { ...commonAxisStyle, title: { ...commonAxisStyle.title, text: '碳足迹 (kgCO2e)' } },
    tooltip: { formatter: commonTooltipFormatter },
  };

  const cardStyle = { background: '#1e293b', borderColor: '#334155', color: '#e0e0e0' };
  const titleStyle = { color: '#94a3b8' };

  const tabItems = [
    {
      label: '概览',
      key: '1',
      children: (
        <Row gutter={[16, 24]}>
          <Col xs={24} lg={12}>
            <Card title={<Text style={titleStyle}>按生命周期阶段划分</Text>} style={cardStyle} headStyle={cardStyle}>
              {lifecyclePieData.length > 0 ? (
                <Pie {...pieConfigBase} data={lifecyclePieData} height={300} />
              ) : (
                <Empty description={<span style={{ color: '#aaa' }}>无生命周期数据</span>} />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={<Text style={titleStyle}>碳足迹热点节点 (Top 10)</Text>}
              style={cardStyle}
              headStyle={cardStyle}
            >
              {nodeSpecificFootprintData.length > 0 ? (
                <Bar {...horizontalBarConfigBase} data={nodeSpecificFootprintData} height={300} />
              ) : (
                <Empty description={<span style={{ color: '#aaa' }}>无热点节点数据</span>} />
              )}
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      label: '详细分解',
      key: '2',
      children: (
        <Row gutter={[16, 24]}>
          {materialColumnData.length > 0 && (
            <Col xs={24} md={12} lg={8}>
              <Card
                title={<Text style={titleStyle}>材料碳足迹 (产品节点)</Text>}
                style={cardStyle}
                headStyle={cardStyle}
              >
                <Column {...columnConfigBase} data={materialColumnData} height={280} />
              </Card>
            </Col>
          )}
          {energyColumnData.length > 0 && (
            <Col xs={24} md={12} lg={8}>
              <Card
                title={<Text style={titleStyle}>能源类型碳足迹 (制造节点)</Text>}
                style={cardStyle}
                headStyle={cardStyle}
              >
                <Column {...columnConfigBase} data={energyColumnData} height={280} />
              </Card>
            </Col>
          )}
          {transportColumnData.length > 0 && (
            <Col xs={24} md={12} lg={8}>
              <Card
                title={<Text style={titleStyle}>运输方式碳足迹 (分销节点)</Text>}
                style={cardStyle}
                headStyle={cardStyle}
              >
                <Column {...columnConfigBase} data={transportColumnData} height={280} />
              </Card>
            </Col>
          )}
          {materialColumnData.length === 0 && energyColumnData.length === 0 && transportColumnData.length === 0 && (
            <Col span={24}>
              <Empty description={<span style={{ color: '#aaa' }}>无详细分解数据</span>} />
            </Col>
          )}
        </Row>
      ),
    },
    {
      label: '数据质量与分布',
      key: '3',
      children: (
        <Row gutter={[16, 24]}>
          <Col xs={24} lg={12}>
            <Card title={<Text style={titleStyle}>节点验证状态分布</Text>} style={cardStyle} headStyle={cardStyle}>
              {verificationPieData.length > 0 ? (
                <Pie {...pieConfigBase} data={verificationPieData} height={300} />
              ) : (
                <Empty description={<span style={{ color: '#aaa' }}>无验证状态数据</span>} />
              )}
            </Card>
          </Col>
          {emissionScopePieData.length > 0 && (
            <Col xs={24} lg={12}>
              <Card
                title={<Text style={titleStyle}>按排放范围划分 (示例)</Text>}
                style={cardStyle}
                headStyle={cardStyle}
              >
                <Pie {...pieConfigBase} data={emissionScopePieData} height={300} />
              </Card>
            </Col>
          )}
        </Row>
      ),
    },
    {
      label: '原始数据',
      key: '4',
      children: (
        <Card title={<Text style={titleStyle}>所有节点数据</Text>} style={cardStyle} headStyle={cardStyle}>
          <Table
            dataSource={allNodesTableData}
            columns={tableColumns}
            rowKey="key"
            pagination={{ pageSize: 10, showSizeChanger: true, style: { color: '#e0e0e0' } }}
            scroll={{ x: 800 }}
            size="small"
            style={{ background: '#1e293b' }}
          />
        </Card>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: '20px',
        background: '#0f172a',
        color: '#e0e0e0',
        minHeight: 'calc(100vh - 60px)',
        overflowY: 'auto',
      }}
    >
      <Row gutter={[16, 16]} justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={2} style={{ color: '#e0e0e0', margin: 0 }}>
            碳足迹可视化分析
          </Title>
        </Col>
        {onBack && (
          <Col>
            <AntButton onClick={onBack}>返回</AntButton>
          </Col>
        )}
      </Row>

      <Card style={{ ...cardStyle, marginBottom: 20, padding: '10px 20px' }} bodyStyle={{ padding: 0 }}>
        <Row gutter={32} align="middle">
          <Col xs={24} sm={8} md={6}>
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <Text style={{ fontSize: 16, color: '#94a3b8' }}>总碳足迹 (kgCO₂e)</Text>
              <Title level={1} style={{ color: '#22c55e', margin: '5px 0 0 0', fontSize: 'clamp(24px, 4vw, 38px)' }}>
                {isNaN(totalCarbonFootprint) ? 'N/A' : totalCarbonFootprint.toFixed(2)}
              </Title>
            </div>
          </Col>
          <Col xs={24} sm={16} md={18}>
            <Text style={{ fontSize: 16, color: '#94a3b8' }}>AI碳排放分析总结</Text>
            {aiSummary && typeof aiSummary === 'string' && aiSummary.trim() !== '' ? (
              <Typography.Paragraph
                style={{ color: '#cbd5e1', marginTop: 8, maxHeight: 100, overflowY: 'auto' }}
                ellipsis={{ rows: 3, expandable: true, symbol: <Text style={{ color: '#1890ff' }}>展开</Text> }}
              >
                {aiSummary}
              </Typography.Paragraph>
            ) : (
              <Text style={{ color: '#6b7280', display: 'block', marginTop: 8 }}>暂无AI总结。</Text>
            )}
          </Col>
        </Row>
      </Card>

      <Tabs defaultActiveKey="1" type="card" items={tabItems} />
    </div>
  );
};

export default VisualizationAnalysisV2;
