import React from 'react';
import { Form, Input, Select, InputNumber, Upload, Button, Row, Col } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { Node } from 'reactflow';
import type { NodeData } from '../CarbonFlow';

const { Option, OptGroup } = Select;

interface NodePropertiesProps {
  node: Node<NodeData>;
  onClose: () => void;
  onUpdate: (data: Partial<NodeData>) => void;
}

export const NodeProperties: React.FC<NodePropertiesProps> = ({ node, onClose, onUpdate }) => {
  const updateNodeData = (key: keyof NodeData, value: any) => {
    onUpdate({ [key]: value });
  };

  const renderLifecycleSpecificProperties = () => {
    switch (node.type) {
      case 'product':
        return (
          <Col span={24}>
            <h4 className="workflow-section-title">材料属性</h4>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="材料">
                  <Input
                    value={(node.data as any).material}
                    onChange={(e) => updateNodeData('material', e.target.value)}
                  />
                </Form.Item>
                <Form.Item label="单位重量">
                  <Input
                    value={(node.data as any).weight_per_unit}
                    onChange={(e) => updateNodeData('weight_per_unit', e.target.value)}
                  />
                </Form.Item>
                <Form.Item label="是否回收材料">
                  <Select
                    value={(node.data as any).isRecycled}
                    onChange={(value) => updateNodeData('isRecycled', value)}
                  >
                    <Option value={true}>是</Option>
                    <Option value={false}>否</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="回收材料含量">
                  <InputNumber
                    value={(node.data as any).recycledContentPercentage}
                    onChange={(value) => updateNodeData('recycledContentPercentage', value)}
                    min={0}
                    max={100}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="来源地区">
                  <Input
                    value={(node.data as any).sourcingRegion}
                    onChange={(e) => updateNodeData('sourcingRegion', e.target.value)}
                  />
                </Form.Item>
                <Form.Item label="供应商">
                  <Input
                    value={(node.data as any).supplier}
                    onChange={(e) => updateNodeData('supplier', e.target.value)}
                  />
                </Form.Item>
                <Form.Item label="确定度">
                  <InputNumber
                    value={(node.data as any).certaintyPercentage}
                    onChange={(value) => updateNodeData('certaintyPercentage', value)}
                    min={0}
                    max={100}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Col>
        );

      case 'manufacturing':
        return (
          <Col span={24}>
            <h4 className="workflow-section-title">制造属性</h4>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="电力核算方法">
                  <Select
                    value={(node.data as any).ElectricityAccountingMethod}
                    onChange={(value) => updateNodeData('ElectricityAccountingMethod', value)}
                  >
                    <Option value="direct">直接测量</Option>
                    <Option value="allocated">分配计算</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="能源消耗">
                  <InputNumber
                    value={(node.data as any).energyConsumption}
                    onChange={(value) => updateNodeData('energyConsumption', value)}
                    min={0}
                  />
                </Form.Item>
                <Form.Item label="能源类型">
                  <Select
                    value={(node.data as any).energyType}
                    onChange={(value) => updateNodeData('energyType', value)}
                  >
                    <Option value="electricity">电力</Option>
                    <Option value="gas">天然气</Option>
                    <Option value="coal">煤炭</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="工艺效率">
                  <InputNumber
                    value={(node.data as any).processEfficiency}
                    onChange={(value) => updateNodeData('processEfficiency', value)}
                    min={0}
                    max={100}
                  />
                </Form.Item>
                <Form.Item label="生产产能">
                  <InputNumber
                    value={(node.data as any).productionCapacity}
                    onChange={(value) => updateNodeData('productionCapacity', value)}
                    min={0}
                  />
                </Form.Item>
                <Form.Item label="自动化水平">
                  <Select
                    value={(node.data as any).automationLevel}
                    onChange={(value) => updateNodeData('automationLevel', value)}
                  >
                    <Option value="high">高</Option>
                    <Option value="medium">中</Option>
                    <Option value="low">低</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Col>
        );

      case 'distribution':
        return (
          <Col span={24}>
            <h4 className="workflow-section-title">分销属性</h4>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="运输方式">
                  <Select
                    value={(node.data as any).transportationMode}
                    onChange={(value) => updateNodeData('transportationMode', value)}
                  >
                    <Option value="road">公路</Option>
                    <Option value="rail">铁路</Option>
                    <Option value="sea">海运</Option>
                    <Option value="air">空运</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="运输距离">
                  <InputNumber
                    value={(node.data as any).transportationDistance}
                    onChange={(value) => updateNodeData('transportationDistance', value)}
                    min={0}
                  />
                </Form.Item>
                <Form.Item label="车辆类型">
                  <Input
                    value={(node.data as any).vehicleType}
                    onChange={(e) => updateNodeData('vehicleType', e.target.value)}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="燃料类型">
                  <Select
                    value={(node.data as any).fuelType}
                    onChange={(value) => updateNodeData('fuelType', value)}
                  >
                    <Option value="diesel">柴油</Option>
                    <Option value="gasoline">汽油</Option>
                    <Option value="electric">电力</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="燃油效率">
                  <InputNumber
                    value={(node.data as any).fuelEfficiency}
                    onChange={(value) => updateNodeData('fuelEfficiency', value)}
                    min={0}
                  />
                </Form.Item>
                <Form.Item label="装载因子">
                  <InputNumber
                    value={(node.data as any).loadFactor}
                    onChange={(value) => updateNodeData('loadFactor', value)}
                    min={0}
                    max={100}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Col>
        );

      case 'usage':
        return (
          <Col span={24}>
            <h4 className="workflow-section-title">使用属性</h4>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="产品寿命">
                  <InputNumber
                    value={(node.data as any).lifespan}
                    onChange={(value) => updateNodeData('lifespan', value)}
                    min={0}
                  />
                </Form.Item>
                <Form.Item label="使用频率">
                  <InputNumber
                    value={(node.data as any).usageFrequency}
                    onChange={(value) => updateNodeData('usageFrequency', value)}
                    min={0}
                  />
                </Form.Item>
                <Form.Item label="维护频率">
                  <InputNumber
                    value={(node.data as any).maintenanceFrequency}
                    onChange={(value) => updateNodeData('maintenanceFrequency', value)}
                    min={0}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="待机能耗">
                  <InputNumber
                    value={(node.data as any).standbyEnergyConsumption}
                    onChange={(value) => updateNodeData('standbyEnergyConsumption', value)}
                    min={0}
                  />
                </Form.Item>
                <Form.Item label="使用地点">
                  <Select
                    value={(node.data as any).usageLocation}
                    onChange={(value) => updateNodeData('usageLocation', value)}
                  >
                    <Option value="indoor">室内</Option>
                    <Option value="outdoor">室外</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="使用模式">
                  <Input
                    value={(node.data as any).usagePattern}
                    onChange={(e) => updateNodeData('usagePattern', e.target.value)}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Col>
        );

      case 'disposal':
        return (
          <Col span={24}>
            <h4 className="workflow-section-title">处置属性</h4>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="回收率">
                  <InputNumber
                    value={(node.data as any).recyclingRate}
                    onChange={(value) => updateNodeData('recyclingRate', value)}
                    min={0}
                    max={100}
                  />
                </Form.Item>
                <Form.Item label="填埋比例">
                  <InputNumber
                    value={(node.data as any).landfillPercentage}
                    onChange={(value) => updateNodeData('landfillPercentage', value)}
                    min={0}
                    max={100}
                  />
                </Form.Item>
                <Form.Item label="焚烧比例">
                  <InputNumber
                    value={(node.data as any).incinerationPercentage}
                    onChange={(value) => updateNodeData('incinerationPercentage', value)}
                    min={0}
                    max={100}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="堆肥比例">
                  <InputNumber
                    value={(node.data as any).compostPercentage}
                    onChange={(value) => updateNodeData('compostPercentage', value)}
                    min={0}
                    max={100}
                  />
                </Form.Item>
                <Form.Item label="重复使用比例">
                  <InputNumber
                    value={(node.data as any).reusePercentage}
                    onChange={(value) => updateNodeData('reusePercentage', value)}
                    min={0}
                    max={100}
                  />
                </Form.Item>
                <Form.Item label="生物降解性">
                  <InputNumber
                    value={(node.data as any).biodegradability}
                    onChange={(value) => updateNodeData('biodegradability', value)}
                    min={0}
                    max={100}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Col>
        );

      case 'finalProduct':
        return (
          <Col span={24}>
            <h4 className="workflow-section-title">最终产品属性</h4>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="产品类别">
                  <Input
                    value={(node.data as any).productCategory}
                    onChange={(e) => updateNodeData('productCategory', e.target.value)}
                  />
                </Form.Item>
                <Form.Item label="市场细分">
                  <Input
                    value={(node.data as any).marketSegment}
                    onChange={(e) => updateNodeData('marketSegment', e.target.value)}
                  />
                </Form.Item>
                <Form.Item label="目标地区">
                  <Input
                    value={(node.data as any).targetRegion}
                    onChange={(e) => updateNodeData('targetRegion', e.target.value)}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="认证状态">
                  <Select
                    value={(node.data as any).certificationStatus}
                    onChange={(value) => updateNodeData('certificationStatus', value)}
                  >
                    <Option value="pending">待认证</Option>
                    <Option value="certified">已认证</Option>
                    <Option value="rejected">未通过</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="环境影响">
                  <Input
                    value={(node.data as any).environmentalImpact}
                    onChange={(e) => updateNodeData('environmentalImpact', e.target.value)}
                  />
                </Form.Item>
                <Form.Item label="可持续性评分">
                  <InputNumber
                    value={(node.data as any).sustainabilityScore}
                    onChange={(value) => updateNodeData('sustainabilityScore', value)}
                    min={0}
                    max={100}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Col>
        );

      default:
        return null;
    }
  };

  return (
    <div className="node-properties">
      <div className="node-properties-header">
        <h3>节点属性</h3>
        <Button type="text" onClick={onClose}>关闭</Button>
      </div>
      <div className="node-properties-content">
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <h4 className="workflow-section-title">活动属性</h4>
              <Form.Item label="节点名称">
                <Input 
                  value={node.data.nodeName}
                  onChange={(e) => updateNodeData('nodeName', e.target.value)}
                  placeholder="请输入节点名称"
                  style={{ 
                    width: '100%',
                    borderColor: '#1890ff',
                    boxShadow: '0 0 0 2px rgba(24,144,255,0.2)'
                  }}
                />
              </Form.Item>
              <Form.Item label="生命周期阶段">
                <Select
                  value={node.data.lifecycleStage}
                  style={{ width: '100%' }}
                  onChange={(value) => updateNodeData('lifecycleStage', value)}
                >
                  <Option value="product">原材料</Option>
                  <Option value="manufacturing">生产制造</Option>
                  <Option value="distribution">分销和储存</Option>
                  <Option value="usage">产品使用</Option>
                  <Option value="disposal">废弃处置</Option>
                  <Option value="finalProduct">最终产品</Option>
                </Select>
              </Form.Item>
              <Form.Item label="排放类型">
                <Select
                  value={node.data.emissionType}
                  style={{ width: '100%' }}
                  onChange={(value) => updateNodeData('emissionType', value)}
                >
                  <Option value="direct">直接排放</Option>
                  <Option value="indirect">间接排放</Option>
                  <Option value="total">总排放</Option>
                </Select>
              </Form.Item>
              <Form.Item label="活动来源">
                <Select
                  value={node.data.activitydataSource}
                  style={{ width: '100%' }}
                  onChange={(value) => updateNodeData('activitydataSource', value)}
                >
                  <Option value="manual">手动输入</Option>
                  <Option value="calculated">计算数据</Option>
                  <Option value="ai">AI 推理</Option>
                </Select>
              </Form.Item>
              <Form.Item label="活动数据质量">
                <InputNumber
                  value={node.data.activityScore}
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  onChange={(value) => updateNodeData('activityScore', value)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <h4 className="workflow-section-title">排放信息</h4>
              <Form.Item 
                label="碳排放量 (kgCO2e)" 
                tooltip="此值由重量和碳排放因子自动计算得出，不可手动修改"
              >
                <InputNumber
                  value={node.data.carbonFootprint}
                  style={{ width: '100%' }}
                  precision={2}
                  min={0}
                  disabled={true}
                  readOnly={true}
                  className="readonly-input"
                />
              </Form.Item>
              <Form.Item label="数量">
                <InputNumber
                  value={node.data.quantity}
                  style={{ width: '100%' }}
                  onChange={(value) => updateNodeData('quantity', value)}
                />
              </Form.Item>
              <Form.Item label="碳排放因子">
                <InputNumber
                  value={node.data.carbonFactor}
                  style={{ width: '100%' }}
                  precision={2}
                  min={0}
                  onChange={(value) => updateNodeData('carbonFactor', value)}
                />
              </Form.Item>
              <Form.Item label="碳排放因子名称">
                <Input
                  value={node.data.carbonFactorName}
                  onChange={(e) => updateNodeData('carbonFactorName', e.target.value)}
                />
              </Form.Item>
              <Form.Item label="单位转换">
                <InputNumber
                  value={node.data.unitConversion}
                  style={{ width: '100%' }}
                  onChange={(value) => updateNodeData('unitConversion', value)}
                />
              </Form.Item>
            </Col>
          </Row>
          {renderLifecycleSpecificProperties()}
        </Form>
      </div>
    </div>
  );
}; 