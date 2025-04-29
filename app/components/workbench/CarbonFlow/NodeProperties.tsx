import React from 'react';
import { Form, Input, Select, InputNumber, Upload, Button, Row, Col, message } from 'antd';
import { UploadOutlined, CloseOutlined } from '@ant-design/icons';
import type { Node } from 'reactflow';
import type { NodeData } from '~/app/types/nodes';

const { Option } = Select;

interface NodePropertiesProps {
  node: Node<NodeData>;
  onClose: () => void;
  onUpdate: (data: Partial<NodeData>) => void;
  setNodes: (callback: (nodes: any[]) => any[]) => void;
  selectedNode: any;
  setSelectedNode: (node: any) => void;
  updateAiSummary: () => void;
}

export const NodeProperties: React.FC<NodePropertiesProps> = ({ node, onClose, onUpdate, setNodes, selectedNode, setSelectedNode, updateAiSummary}) => {
  const updateNodeData = (key: keyof NodeData, value: any) => {
    console.log('更新前数据:', node.data);
    console.log('正在更新属性:', key, '值为:', value);
    
    // 创建更新后的数据对象
    const updatedData = {
      ...node.data,
      [key]: value,
    };
    
    // 如果修改的是nodeName，同时更新label
    if (key === 'nodeName' && typeof value === 'string') {
      updatedData.label = value;
      updatedData.nodeName = value;
      console.log('更新 nodeName 和 label:', value);
    }
    
    // 如果修改的是label，同时更新nodeName
    if (key === 'label' && typeof value === 'string') {
      updatedData.nodeName = value;
      updatedData.label = value;
      console.log('更新 label 和 nodeName:', value);
    }
    
    console.log('更新后数据:', updatedData);
    
    // 先更新选中节点状态，确保属性面板实时更新
    setSelectedNode((prev) => ({
      ...prev,
      data: updatedData
    }));
    
    // 然后更新节点列表中的对应节点
    setNodes((nds) => {
      const newNodes = nds.map((n) => {
        if (n.id === node.id) {
          console.log('找到要更新的节点:', n.id);
          return {
            ...n,
            data: updatedData,
          };
        }
        return n;
      });
      console.log('更新后的节点列表:', newNodes);
      return newNodes;
    });

    // 数据来源或碳足迹相关时，更新AI总结
    if (['completionStatus', 'dataSource', 'carbonFootprint', 'weight', 'carbonFactor', 
      'certaintyPercentage', 'lifecycleStage', 'completionStatus'].includes(String(key))) {
      setTimeout(() => updateAiSummary(), 100);
    }
  };

  const renderLifecycleSpecificProperties = () => {
    switch (node.type) {
      case 'product':
        return (
          <Col span={24}>
            <h4 className="workflow-section-title">其他属性</h4>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="材料" className="form-item">
                  <Input
                    className="node-properties-input"
                    value={(node.data as any).material}
                    onChange={(e) => updateNodeData('material', e.target.value)}
                  />
                </Form.Item>
                <Form.Item label="单位重量" className="form-item">
                  <Input
                    className="node-properties-input"
                    value={(node.data as any).weight_per_unit}
                    onChange={(e) => updateNodeData('weight_per_unit', e.target.value)}
                  />
                </Form.Item>
                <Form.Item label="是否回收材料" className="form-item">
                  <Select
                    className="node-properties-select"
                    value={(node.data as any).isRecycled}
                    onChange={(value) => updateNodeData('isRecycled', value)}
                  >
                    <Option value={true}>是</Option>
                    <Option value={false}>否</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="回收材料含量" className="form-item">
                  <InputNumber
                    className="node-properties-input"
                    value={(node.data as any).recycledContentPercentage}
                    onChange={(value) => updateNodeData('recycledContentPercentage', value)}
                    min={0}
                    max={100}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="来源地区" className="form-item">
                  <Input
                    className="node-properties-input"
                    value={(node.data as any).sourcingRegion}
                    onChange={(e) => updateNodeData('sourcingRegion', e.target.value)}
                  />
                </Form.Item>
                <Form.Item label="供应商" className="form-item">
                  <Input
                    className="node-properties-input"
                    value={(node.data as any).supplier}
                    onChange={(e) => updateNodeData('supplier', e.target.value)}
                  />
                </Form.Item>
                <Form.Item label="确定度" className="form-item">
                  <InputNumber
                    className="node-properties-input"
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
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="电力核算方法" className="form-item">
                  <Select
                    className="node-properties-select"
                    value={(node.data as any).ElectricityAccountingMethod}
                    onChange={(value) => updateNodeData('ElectricityAccountingMethod', value)}
                  >
                    <Option value="direct">直接测量</Option>
                    <Option value="allocated">分配计算</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="能源消耗" className="form-item">
                  <InputNumber
                    className="node-properties-input"
                    value={(node.data as any).energyConsumption}
                    onChange={(value) => updateNodeData('energyConsumption', value)}
                    min={0}
                  />
                </Form.Item>
                <Form.Item label="能源类型" className="form-item">
                  <Select
                    className="node-properties-select"
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
                <Form.Item label="设备类型" className="form-item">
                  <Input
                    className="node-properties-input"
                    value={(node.data as any).equipmentType}
                    onChange={(e) => updateNodeData('equipmentType', e.target.value)}
                  />
                </Form.Item>
                <Form.Item label="生产批次" className="form-item">
                  <InputNumber
                    className="node-properties-input"
                    value={(node.data as any).productionBatch}
                    onChange={(value) => updateNodeData('productionBatch', value)}
                    min={0}
                  />
                </Form.Item>
                <Form.Item label="生产时间" className="form-item">
                  <Input
                    className="node-properties-input"
                    type="datetime-local"
                    value={(node.data as any).productionTime}
                    onChange={(e) => updateNodeData('productionTime', e.target.value)}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Col>
        );

      case 'distribution':
        return (
          <Col span={24}>
            <h4 className="workflow-section-title">分销属性</h4>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="运输方式" className="form-item">
                  <Select
                    className="node-properties-select"
                    value={(node.data as any).transportationMode}
                    onChange={(value) => updateNodeData('transportationMode', value)}
                  >
                    <Option value="road">公路</Option>
                    <Option value="rail">铁路</Option>
                    <Option value="sea">海运</Option>
                    <Option value="air">空运</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="运输距离" className="form-item">
                  <InputNumber
                    className="node-properties-input"
                    value={(node.data as any).transportationDistance}
                    onChange={(value) => updateNodeData('transportationDistance', value)}
                    min={0}
                  />
                </Form.Item>
                <Form.Item label="车辆类型" className="form-item">
                  <Input
                    className="node-properties-input"
                    value={(node.data as any).vehicleType}
                    onChange={(e) => updateNodeData('vehicleType', e.target.value)}
                  />
                </Form.Item>
                <Form.Item label="起点" className="form-item">
                  <Input
                    className="node-properties-input"
                    value={(node.data as any).startPoint}
                    onChange={(e) => updateNodeData('startPoint', e.target.value)}
                  />
                </Form.Item>

              </Col>
              <Col span={12}>
                <Form.Item label="燃料类型" className="form-item">
                  <Select
                    className="node-properties-select"
                    value={(node.data as any).fuelType}
                    onChange={(value) => updateNodeData('fuelType', value)}
                  >
                    <Option value="diesel">柴油</Option>
                    <Option value="gasoline">汽油</Option>
                    <Option value="electric">电力</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="燃油效率" className="form-item">
                  <InputNumber
                    className="node-properties-input"
                    value={(node.data as any).fuelEfficiency}
                    onChange={(value) => updateNodeData('fuelEfficiency', value)}
                    min={0}
                  />
                </Form.Item>
                <Form.Item label="装载因子" className="form-item">
                  <InputNumber
                    className="node-properties-input"
                    value={(node.data as any).loadFactor}
                    onChange={(value) => updateNodeData('loadFactor', value)}
                    min={0}
                    max={100}
                  />
                </Form.Item>
                <Form.Item label="终点" className="form-item">
                  <Input
                    className="node-properties-input"
                    value={(node.data as any).endPoint}
                    onChange={(e) => updateNodeData('endPoint', e.target.value)}
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
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="产品寿命" className="form-item">
                  <InputNumber
                    className="node-properties-input"
                    value={(node.data as any).lifespan}
                    onChange={(value) => updateNodeData('lifespan', value)}
                    min={0}
                  />
                </Form.Item>
                <Form.Item label="使用频率" className="form-item">
                  <InputNumber
                    className="node-properties-input"
                    value={(node.data as any).usageFrequency}
                    onChange={(value) => updateNodeData('usageFrequency', value)}
                    min={0}
                  />
                </Form.Item>
                <Form.Item label="维护频率" className="form-item">
                  <InputNumber
                    className="node-properties-input"
                    value={(node.data as any).maintenanceFrequency}
                    onChange={(value) => updateNodeData('maintenanceFrequency', value)}
                    min={0}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="待机能耗" className="form-item">
                  <InputNumber
                    className="node-properties-input"
                    value={(node.data as any).standbyEnergyConsumption}
                    onChange={(value) => updateNodeData('standbyEnergyConsumption', value)}
                    min={0}
                  />
                </Form.Item>
                <Form.Item label="使用地点" className="form-item">
                  <Select
                    className="node-properties-select"
                    value={(node.data as any).usageLocation}
                    onChange={(value) => updateNodeData('usageLocation', value)}
                  >
                    <Option value="indoor">室内</Option>
                    <Option value="outdoor">室外</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="使用模式" className="form-item">
                  <Input
                    className="node-properties-input"
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
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="处置方式" className="form-item">
                  <Select
                    className="node-properties-select"
                    value={(node.data as any).disposalMethod}
                    onChange={(value) => updateNodeData('disposalMethod', value)}
                  >
                    <Option value="landfill">填埋</Option>
                    <Option value="incineration">焚烧</Option>
                    <Option value="recycling">回收</Option>
                    <Option value="composting">堆肥</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="回收率" className="form-item">
                  <InputNumber
                    className="node-properties-input"
                    value={(node.data as any).recyclingRate}
                    onChange={(value) => updateNodeData('recyclingRate', value)}
                    min={0}
                    max={100}
                  />
                </Form.Item>
                <Form.Item label="处置地点" className="form-item">
                  <Input
                    className="node-properties-input"
                    value={(node.data as any).disposalLocation}
                    onChange={(e) => updateNodeData('disposalLocation', e.target.value)}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="运输距离" className="form-item">
                  <InputNumber
                    className="node-properties-input"
                    value={(node.data as any).disposalTransportDistance}
                    onChange={(value) => updateNodeData('disposalTransportDistance', value)}
                    min={0}
                  />
                </Form.Item>
                <Form.Item label="处置时间" className="form-item">
                  <Input
                    className="node-properties-input"
                    type="datetime-local"
                    value={(node.data as any).disposalTime}
                    onChange={(e) => updateNodeData('disposalTime', e.target.value)}
                  />
                </Form.Item>
                <Form.Item label="环境影响" className="form-item">
                  <Input.TextArea
                    className="node-properties-textarea"
                    value={(node.data as any).environmentalImpact}
                    onChange={(e) => updateNodeData('environmentalImpact', e.target.value)}
                    rows={4}
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
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="产品类别" className="form-item">
                  <Input
                    className="node-properties-input"
                    value={(node.data as any).productCategory}
                    onChange={(e) => updateNodeData('productCategory', e.target.value)}
                  />
                </Form.Item>
                <Form.Item label="市场细分" className="form-item">
                  <Input
                    className="node-properties-input"
                    value={(node.data as any).marketSegment}
                    onChange={(e) => updateNodeData('marketSegment', e.target.value)}
                  />
                </Form.Item>
                <Form.Item label="目标地区" className="form-item">
                  <Input
                    className="node-properties-input"
                    value={(node.data as any).targetRegion}
                    onChange={(e) => updateNodeData('targetRegion', e.target.value)}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="认证状态" className="form-item">
                  <Select
                    className="node-properties-select"
                    value={(node.data as any).certificationStatus}
                    onChange={(value) => updateNodeData('certificationStatus', value)}
                  >
                    <Option value="pending">待认证</Option>
                    <Option value="certified">已认证</Option>
                    <Option value="rejected">未通过</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="可持续性评分" className="form-item">
                  <InputNumber
                    className="node-properties-input"
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
        <h3 className="node-properties-title">节点属性</h3>
        <Button 
          type="text" 
          icon={<CloseOutlined />} 
          onClick={onClose}
          className="node-properties-close"
        />
      </div>

      
      <div className="node-properties-content">
        <Form layout="vertical" className="node-properties-form">
          <Row gutter={24}>
            <Col span={12}>
              <h4 className="workflow-section-title">活动属性</h4>
              <Form.Item label="节点名称" className="form-item">
                <Input 
                  className="node-properties-input"
                  value={node?.data.nodeName}
                  onChange={(e) => updateNodeData('nodeName', e.target.value)}
                  placeholder="请输入节点名称"
                />
              </Form.Item>
              <Form.Item label="生命周期阶段" className="form-item">
                <Select
                  className="node-properties-select"
                  value={node.data.lifecycleStage}
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
              <Form.Item label="排放类型" className="form-item">
                <Select
                  className="node-properties-select"
                  value={node.data.emissionType}
                  onChange={(value) => updateNodeData('emissionType', value)}
                >
                    <Option value="原材料">原材料</Option>
                    <Option value="原材料运输">原材料运输</Option>
                    <Option value="生产能耗">生产能耗</Option>
                    <Option value="辅材&添加剂">辅材&添加剂</Option>
                    <Option value="水资源">水资源</Option>
                    <Option value="包装材料">包装材料</Option>
                    <Option value="生产过程-温室气体直接排放">生产过程-温室气体直接排放</Option>
                    <Option value="废气">废气</Option>
                    <Option value="固体废弃物">固体废弃物</Option>
                    <Option value="废水">废水</Option>
                    <Option value="燃料消耗">燃料消耗</Option>
                    <Option value="成品运输">成品运输</Option>
                    <Option value="耗材">耗材</Option>
                    <Option value="使用阶段排放">使用阶段排放</Option>
                    <Option value="填埋活焚烧排放">填埋活焚烧排放</Option>
                    <Option value="回收材料">回收材料</Option>
                    <Option value="不可回收材料">不可回收材料</Option>
                </Select>
              </Form.Item>
              <Form.Item label="数据来源" className="form-item">
                <Select
                  className="node-properties-select"
                  value={node.data.activitydataSource}
                  onChange={(value) => updateNodeData('activitydataSource', value)}
                >
                  <Option value="实测数据">实测数据</Option>
                  <Option value="计算数据">计算数据</Option>
                  <Option value="AI推理数据">AI推理数据</Option>
                  <Option value="文献数据">文献数据</Option>
                  <Option value="空数据">空数据</Option>
                </Select>
              </Form.Item>
              <Form.Item label="活动评分等级" className="form-item">
                <Select
                  className="node-properties-select"
                  value={node.data.activityScorelevel}
                  onChange={(value) => updateNodeData('activityScorelevel', value)}
                >
                  <Option value="高">高</Option>
                  <Option value="中">中</Option>
                  <Option value="低">低</Option>
                  <Option value="空">空</Option>
                </Select>
              </Form.Item>
              <Form.Item label="认证状态" className="form-item">
                      <Select
                        className="node-properties-select"
                        value={node?.data.verificationStatus}
                        onChange={(value) => updateNodeData('verificationStatus', value)}
                      >
                        <Option value="未认证">未认证</Option>
                        <Option value="内部认证">内部认证</Option>
                        <Option value="第三方认证">第三方认证</Option>
                      </Select>
              </Form.Item>
                                 
              <Form.Item label="认证材料" className="form-item"> 
                      <Upload
                        action="/api/upload"
                        listType="picture-card"
                      >
                        <Button icon={<UploadOutlined />}>上传</Button>
                      </Upload>
                    </Form.Item>
            </Col>
            <Col span={12}>
            <h4 className="workflow-section-title">碳足跡属性</h4>
              <Form.Item 
                label="碳排放量 (kgCO2e)" 
                tooltip="此值由重量和碳排放因子自动计算得出，不可手动修改"
                className="form-item"
              >
                <InputNumber
                  className="node-properties-input"
                  value={node?.data.carbonFootprint}
                  precision={2}
                  min={0}
      
                />
              </Form.Item>
              <Form.Item label="数量" className="form-item">
                      <Input
                        className="node-properties-input"
                        value={node?.data.quantity}

                        onChange={(value) => {
                          updateNodeData('quantity', value);
                        }}
                      />
                    </Form.Item>
              
              <Form.Item label="碳排放因子" className="form-item">
                <InputNumber
                  className="node-properties-input"
                  value={node.data.carbonFactor}
                  onChange={(value) => updateNodeData('carbonFactor', value)}
                  min={0}
                />
              </Form.Item>
              <Form.Item label="碳排放因子名称">
                      <Input
                        className="node-properties-input"
                        value={node?.data.carbonFactorName}
                        onChange={(e) => updateNodeData('carbonFactorName', e.target.value)}
                      />
              </Form.Item>
              <Form.Item label="单位转换" className="form-item">
                      <InputNumber
                        className="node-properties-input"
                        value={node?.data.unitConversion}
                        onChange={(value) => updateNodeData('unitConversion', value)}
                      />
              </Form.Item>
    

              
              <Form.Item label="因子来源" className="form-item">
                  <Select
                    className="node-properties-input"
                    value={node?.data.carbonFactordataSource}
                    style={{ width: '100%' }}
                    onChange={(value) => updateNodeData('carbonFactordataSource', value)}
                  >
                    
                    
                      <Option value="数据库匹配 - 原材料库">数据库匹配 - 原材料库</Option>
                      <Option value="数据库匹配 - 生产工艺库">数据库匹配 - 生产工艺库</Option>
                      <Option value="数据库匹配 - 分销库">数据库匹配 - 分销库</Option>
                      <Option value="数据库匹配 - 使用阶段库">数据库匹配 - 使用阶段库</Option>
                      <Option value="数据库匹配 - 处置库">数据库匹配 - 处置库</Option>
                    
                      <Option value="AI生成 - DeepSeek查询">AI生成 - DeepSeek查询</Option>
                      <Option valuex="AI生成 - DeepSeek (专家估算)">AI生成 - DeepSeek (专家估算)</Option>
                      <Option value="AI生成 - DeepSeek (文本提取)">AI生成 - DeepSeek (文本提取)</Option>
                      <Option value="AI生成 - DeepSeek (行业报告)">AI生成 - DeepSeek (行业报告)</Option>
                      <Option value="AI生成 - DeepSeek (学术文献)">AI生成 - DeepSeek (学术文献)</Option>
                      <Option value="AI生成 - DeepSeek (政府数据)">AI生成 - DeepSeek (政府数据)</Option>
                    
                      </Select>
                    </Form.Item>
            </Col>
          </Row>
          {renderLifecycleSpecificProperties()}

        </Form>
      </div>
    </div>
  );
}; 