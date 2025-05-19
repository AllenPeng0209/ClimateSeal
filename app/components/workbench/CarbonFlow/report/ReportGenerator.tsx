import React from 'react';
import { useCarbonFlowStore } from '~/components/workbench/CarbonFlow/CarbonFlowStore';
import { Button, Card, Col, Descriptions, Divider, Row, Space, Table, Typography } from 'antd';
import type { Node } from 'reactflow';
import type {
  NodeData,
  FinalProductNodeData,
  ProductNodeData,
  ManufacturingNodeData,
  DistributionNodeData,
  UsageNodeData,
  DisposalNodeData,
} from '~/types/nodes';

const { Title, Text, Paragraph } = Typography;

const ReportGenerator: React.FC = () => {
  const { nodes, aiSummary } = useCarbonFlowStore();

  const finalProductNode = nodes.find((node) => node.type === 'finalProduct') as Node<FinalProductNodeData> | undefined;
  const productNodes = nodes.filter((node) => node.type === 'product') as Node<ProductNodeData>[];
  const manufacturingNodes = nodes.filter((node) => node.type === 'manufacturing') as Node<ManufacturingNodeData>[];
  const distributionNodes = nodes.filter((node) => node.type === 'distribution') as Node<DistributionNodeData>[];
  const usageNodes = nodes.filter((node) => node.type === 'usage') as Node<UsageNodeData>[];
  const disposalNodes = nodes.filter((node) => node.type === 'disposal') as Node<DisposalNodeData>[];

  const handlePrint = () => {
    window.print();
  };

  const commonNodeColumns = [
    { title: 'Node Name', dataIndex: ['data', 'nodeName'], key: 'nodeName' },
    { title: 'Lifecycle Stage', dataIndex: ['data', 'lifecycleStage'], key: 'lifecycleStage' },
    { title: 'Carbon Footprint (kg CO2e)', dataIndex: ['data', 'carbonFootprint'], key: 'carbonFootprint' },
    { title: 'Data Source', dataIndex: ['data', 'activitydataSource'], key: 'activitydataSource' },
    { title: 'Verification Status', dataIndex: ['data', 'verificationStatus'], key: 'verificationStatus' },
  ];

  // Placeholder for more detailed LCI data rendering
  const renderDetailedLciTable = (nodeCollection: Node<NodeData>[], title: string, specificColumns: any[] = []) => {
    if (!nodeCollection || nodeCollection.length === 0) {
      return null;
    }

    return (
      <>
        <Divider orientation="left">
          <Title level={4} style={{ color: '#e0e0e0' }}>
            {title}
          </Title>
        </Divider>
        <Table
          dataSource={nodeCollection}
          columns={[...commonNodeColumns, ...specificColumns]}
          rowKey="id"
          pagination={false}
          bordered
          size="small"
          expandable={{
            expandedRowRender: (record) => (
              <Descriptions title="Node Details" bordered column={1} size="small">
                {Object.entries(record.data).map(([key, value]) => {
                  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                    return (
                      <Descriptions.Item
                        key={key}
                        label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                      >
                        {String(value)}
                      </Descriptions.Item>
                    );
                  }

                  return null;
                })}
              </Descriptions>
            ),
            rowExpandable: (_record) => true,
          }}
        />
      </>
    );
  };

  return (
    <div
      style={{
        padding: '24px',
        background: '#2a2a2a',
        color: '#e0e0e0',
        height: '100%',
        overflowY: 'auto',
      }}
      id="report-content"
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #report-content,
          #report-content * {
            visibility: visible;
          }
          #report-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #fff !important;
            color: #000 !important;
          }
          .no-print {
            display: none !important;
          }
          #report-content .ant-card {
            background: #fff !important;
            color: #000 !important;
            border: 1px solid #f0f0f0 !important;
          }
          #report-content .ant-descriptions-item-label,
          #report-content .ant-descriptions-item-content,
          #report-content .ant-typography,
          #report-content .ant-table,
          #report-content .ant-table-thead > tr > th,
          #report-content .ant-table-tbody > tr > td,
          #report-content .ant-divider-inner-text {
            color: #000 !important;
          }
           #report-content .ant-table-bordered .ant-table-thead > tr > th,
           #report-content .ant-table-bordered .ant-table-tbody > tr > td {
            border-color: #f0f0f0 !important;
          }
        }
      `}</style>
      <Space direction="vertical" size="large" style={{ width: '100%', paddingBottom: '48px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ color: '#e0e0e0' }}>
              Product Carbon Footprint Report
            </Title>
            <Text type="secondary">In accordance with ISO 14067:2018 (Placeholder)</Text>
          </Col>
          <Col className="no-print">
            <Button type="primary" onClick={handlePrint}>
              Print Report
            </Button>
          </Col>
        </Row>

        <Card title={<span style={{ color: '#e0e0e0' }}>1. General Information</span>}>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Report Title">Product Carbon Footprint of [Product Name]</Descriptions.Item>
            <Descriptions.Item label="Date of Report">{new Date().toLocaleDateString()}</Descriptions.Item>
            <Descriptions.Item label="Report Version">1.0 (Draft)</Descriptions.Item>
            <Descriptions.Item label="Organization Commissioning Study">[Your Company Name]</Descriptions.Item>
            <Descriptions.Item label="Product Under Assessment">
              {finalProductNode?.data.finalProductName || '[Final Product Name Not Set]'}
            </Descriptions.Item>
            <Descriptions.Item label="Reporting Period">[e.g., Calendar Year 2023]</Descriptions.Item>
            <Descriptions.Item label="Standard Conformity">ISO 14067:2018 (Intended)</Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title={<span style={{ color: '#e0e0e0' }}>2. Goal and Scope Definition</span>}>
          <Title level={4} style={{ color: '#e0e0e0' }}>
            2.1 Goal of the Study
          </Title>
          <Paragraph>
            The goal of this study is to quantify the carbon footprint of the product "
            {finalProductNode?.data.finalProductName || '[Final Product Name]'}" in accordance with ISO 14067:2018. This
            report is intended for [e.g., internal improvement, external communication, TÜV verification submission].
          </Paragraph>
          <Title level={4} style={{ color: '#e0e0e0' }}>
            2.2 Functional Unit
          </Title>
          <Paragraph>
            The functional unit is defined as: "The production and delivery of 1 kg of{' '}
            {finalProductNode?.data.finalProductName || '[Final Product Name]'}', packaged and ready for shipment to the
            customer."
          </Paragraph>
          <Title level={4} style={{ color: '#e0e0e0' }}>
            2.3 System Boundary
          </Title>
          <Paragraph>
            The system boundary for this study is cradle-to-gate, encompassing the following life cycle stages:
            <ul>
              <li>Raw Material Acquisition</li>
              <li>Manufacturing</li>
              <li>Distribution (to factory gate)</li>
            </ul>
            The following stages are excluded: Product Use, End-of-Life. Capital goods (machinery, buildings) and
            employee commuting are also excluded from the system boundary, which is a common practice.
          </Paragraph>
          <Title level={4} style={{ color: '#e0e0e0' }}>
            2.4 Allocation Procedures
          </Title>
          <Paragraph>
            [Describe allocation procedures if any, e.g., mass allocation for shared processes or utilities. If no
            allocation is needed, state so.]
          </Paragraph>
          <Title level={4} style={{ color: '#e0e0e0' }}>
            2.5 Cut-off Criteria
          </Title>
          <Paragraph>
            Inputs and outputs contributing to less than [e.g., 1%] of the total mass, energy, or environmental
            significance are excluded, provided their exclusion does not significantly alter the overall conclusions.
            All known hazardous substances are included regardless of mass/energy contribution.
          </Paragraph>
        </Card>

        <Card title={<span style={{ color: '#e0e0e0' }}>3. Life Cycle Inventory Analysis (LCI)</span>}>
          <Paragraph>
            The following tables detail the data collected for the different life cycle stages of the product. All data
            refers to the functional unit.
          </Paragraph>

          {renderDetailedLciTable(productNodes, '3.1 Raw Material Acquisition Stage', [
            { title: 'Material', dataIndex: ['data', 'material'], key: 'material' },
            { title: 'Weight per Unit', dataIndex: ['data', 'weight_per_unit'], key: 'weight_per_unit' },
            { title: 'Quantity', dataIndex: ['data', 'quantity'], key: 'quantity' },
          ])}

          {renderDetailedLciTable(manufacturingNodes, '3.2 Manufacturing Stage', [
            { title: 'Energy Consumption (kWh)', dataIndex: ['data', 'energyConsumption'], key: 'energyConsumption' },
            { title: 'Energy Type', dataIndex: ['data', 'energyType'], key: 'energyType' },
          ])}

          {renderDetailedLciTable(distributionNodes, '3.3 Distribution Stage', [
            { title: 'Transportation Mode', dataIndex: ['data', 'transportation_mode'], key: 'transportation_mode' },
            { title: 'Distance (km)', dataIndex: ['data', 'transportation_distance'], key: 'transportation_distance' },
          ])}

          {usageNodes.length > 0 &&
            renderDetailedLciTable(usageNodes, '3.4 Usage Stage (If Applicable)', [
              { title: 'Lifespan (years)', dataIndex: ['data', 'lifespan'], key: 'lifespan' },
              {
                title: 'Energy Consumption per Use (kWh)',
                dataIndex: ['data', 'energyConsumptionPerUse'],
                key: 'energyConsumptionPerUse',
              },
            ])}

          {disposalNodes.length > 0 &&
            renderDetailedLciTable(disposalNodes, '3.5 End-of-Life Stage (If Applicable)', [
              { title: 'Disposal Method', dataIndex: ['data', 'disposal_method'], key: 'disposal_method' },
              { title: 'Recycling Rate (%)', dataIndex: ['data', 'recycling_rate'], key: 'recycling_rate' },
            ])}
        </Card>

        <Card title={<span style={{ color: '#e0e0e0' }}>4. Life Cycle Impact Assessment (LCIA) Results</span>}>
          <Title level={4} style={{ color: '#e0e0e0' }}>
            4.1 Carbon Footprint Result
          </Title>
          <Paragraph>
            The total carbon footprint for the defined functional unit of the product "
            {finalProductNode?.data.finalProductName || '[Final Product Name]'}" is:
            <Text strong> {finalProductNode?.data.totalCarbonFootprint ?? 'N/A'} kg CO2e</Text>.
          </Paragraph>
          <Paragraph>
            This result is based on the GWP100 characterization factors from [e.g., IPCC AR6, or specify other].
          </Paragraph>
          <Title level={4} style={{ color: '#e0e0e0' }}>
            4.2 Contribution Analysis
          </Title>
          <Paragraph>
            The contribution of each life cycle stage to the total carbon footprint is as follows (placeholder - a chart
            would be better here):
            <ul>
              {nodes
                .filter((n) => n.type !== 'finalProduct' && parseFloat(n.data.carbonFootprint || '0') > 0)
                .map((node) => (
                  <li key={node.id}>
                    {node.data.lifecycleStage} ({node.data.nodeName}): {node.data.carbonFootprint} kg CO2e
                  </li>
                ))}
            </ul>
          </Paragraph>
        </Card>

        <Card title={<span style={{ color: '#e0e0e0' }}>5. Interpretation</span>}>
          <Title level={4} style={{ color: '#e0e0e0' }}>
            5.1 Identification of Significant Issues (Hotspots)
          </Title>
          <Paragraph>
            [Identify hotspots based on contribution analysis. E.g., The manufacturing stage and specific raw material X
            are major contributors.]
          </Paragraph>
          <Title level={4} style={{ color: '#e0e0e0' }}>
            5.2 Data Quality Assessment & Sensitivity
          </Title>
          <Paragraph>
            [Discuss data quality, representativeness, and potential impact of uncertainties or key assumptions. E.g.,
            Primary data was used for manufacturing, secondary for raw materials. Sensitivity to electricity grid mix
            changes could be X%.]
          </Paragraph>
          <Title level={4} style={{ color: '#e0e0e0' }}>
            5.3 Conclusions
          </Title>
          <Paragraph>[Summarize the main findings of the study in relation to the goal.]</Paragraph>
          <Title level={4} style={{ color: '#e0e0e0' }}>
            5.4 Limitations
          </Title>
          <Paragraph>
            [Detail any limitations, e.g., exclusion of certain minor inputs, use of generic data for some processes,
            etc.]
          </Paragraph>
          <Title level={4} style={{ color: '#e0e0e0' }}>
            5.5 Recommendations
          </Title>
          <Paragraph>
            [Provide recommendations for reducing the carbon footprint based on the findings. E.g., Explore alternative
            material Y, improve energy efficiency in process Z.]
          </Paragraph>
        </Card>

        {aiSummary && (
          <Card title={<span style={{ color: '#e0e0e0' }}>6. AI-Generated Summary & Insights (Informative)</span>}>
            <Paragraph>
              <Text strong>Note:</Text> This section provides insights generated by an AI assistant based on the
              available data. It is for informative purposes and should be critically reviewed.
            </Paragraph>
            <Paragraph>
              {typeof aiSummary === 'string' ? aiSummary : <pre>{JSON.stringify(aiSummary, null, 2)}</pre>}
            </Paragraph>
          </Card>
        )}

        <Card title={<span style={{ color: '#e0e0e0' }}>7. Annexes (Placeholder)</span>}>
          <Paragraph>
            A.1 Critical Review Statement (if applicable)
            <br />
            A.2 Detailed LCI Data Tables (if not fully covered above)
            <br />
            A.3 References
          </Paragraph>
        </Card>
      </Space>
    </div>
  );
};

export default ReportGenerator; 