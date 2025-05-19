import React, { useCallback, useState, useEffect } from 'react';
import type { Node } from 'reactflow';
import { Tag, Collapse, Progress, Empty, Typography } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';
import { useCarbonFlowStore } from '~/components/workbench/CarbonFlow/CarbonFlowStore';
import './AISummary.css';
import type { AISummaryReport } from '~/types/aiSummary';
import { initialAiSummaryReport } from '~/types/aiSummary';
import type {
  NodeData,
  ProductNodeData,
  ManufacturingNodeData,
  DistributionNodeData,
} from '~/types/nodes';


interface CarbonFlowAISummaryProps {
  setSelectedNode: (node: Node<NodeData> | null) => void;
}


export const CarbonFlowAISummary = ({ setSelectedNode }: CarbonFlowAISummaryProps) => {
  const nodes = useCarbonFlowStore(state => state.nodes);
  const [aiReport, setAiReport] = useState<AISummaryReport>(initialAiSummaryReport);
  const { setAiSummary: setStoreAiSummary } = useCarbonFlowStore();

  const calculateAiSummaryInternal = useCallback((currentNodes: Node<NodeData>[]): AISummaryReport => {
    // Define mapping from English stage keys (used in node data) to Chinese names (used in this calculation logic)
    const stageNameMapping: Record<string, string> = {
      'product': '原材料获取',
      'manufacturing': '生产制造',
      'distribution': '分销和储存',
      'usage': '产品使用',
      'disposal': '废弃处置',
      // 'finalProduct' is not typically part of this specific lifecycle completeness check
    };

    if (!currentNodes || currentNodes.length === 0) {
      return {
        ...initialAiSummaryReport,
        isExpanded: aiReport.isExpanded, 
      };
    }

    const lifecycle = ['原材料获取', '生产制造', '分销和储存', '产品使用', '废弃处置'];
    // Use mapped stage names for calculating existing stages
    const existingStages = new Set(
      currentNodes.map(node => node.data?.lifecycleStage ? stageNameMapping[node.data.lifecycleStage] : undefined).filter(Boolean)
    );
    const missingLifecycleStages = lifecycle.filter((stage) => !existingStages.has(stage));
    let lifecycleCompletenessScore = 0;
    if (lifecycle.length > 0) {
        lifecycleCompletenessScore = ((lifecycle.length - missingLifecycleStages.length) / lifecycle.length) * 100;
    }


    let totalFields = 0;
    let completedFields = 0;
    const completeIncompleteNodes: AISummaryReport['modelCompleteness']['incompleteNodes'] = [];

    currentNodes.forEach((node) => {
      const missingFields: string[] = [];
      if (!node.data) return;

      // Use mapped stage name for the switch statement
      const mappedStage = node.data?.lifecycleStage ? stageNameMapping[node.data.lifecycleStage] : undefined;

      switch (mappedStage) {
        case '原材料获取': {
          const productData = node.data as ProductNodeData;
          const quantity =
            productData.quantity !== undefined && !Number.isNaN(Number(productData.quantity))
              ? Number(productData.quantity)
              : 0;
          if (quantity === 0) {
            totalFields++;
            missingFields.push('数量');
          } else {
            completedFields++;
            totalFields++;
          }
          if (
            typeof node.data.carbonFactor === 'undefined' ||
            node.data.carbonFactor === null ||
            Number(node.data.carbonFactor) === 0 
          ) {
            totalFields++;
            missingFields.push('碳足迹因子');
          } else {
            completedFields++;
            totalFields++;
          }
          if (typeof node.data.carbonFactorName === 'undefined' || node.data.carbonFactorName === '') {
            totalFields++;
            missingFields.push('碳足迹因子名称');
          } else {
            completedFields++;
            totalFields++;
          }
          if (!node.data.carbonFactordataSource) {
            totalFields++;
            missingFields.push('碳足迹因子数据来源');
          } else {
            completedFields++;
            totalFields++;
          }
          break;
        }
        case '生产制造': {
          const manufacturingData = node.data as ManufacturingNodeData;
          if (
            typeof node.data.carbonFactor === 'undefined' ||
            node.data.carbonFactor === null ||
            Number(node.data.carbonFactor) === 0
          ) {
            totalFields++;
            missingFields.push('碳足迹因子');
          } else {
            completedFields++;
            totalFields++;
          }
          if (
            typeof manufacturingData.energyConsumption === 'undefined' ||
            manufacturingData.energyConsumption === null ||
            manufacturingData.energyConsumption === 0
          ) {
            totalFields++;
            missingFields.push('能源消耗');
          } else {
            completedFields++;
            totalFields++;
          }
          if (typeof manufacturingData.energyType === 'undefined' || manufacturingData.energyType === '') {
            totalFields++;
            missingFields.push('能源类型');
          } else {
            completedFields++;
            totalFields++;
          }
          break;
        }
        case '分销和储存': {
          const distributionData = node.data as DistributionNodeData;
          if (
            typeof node.data.carbonFactor === 'undefined' ||
            node.data.carbonFactor === null ||
            Number(node.data.carbonFactor) === 0
          ) {
            totalFields++;
            missingFields.push('碳足迹因子');
          } else {
            completedFields++;
            totalFields++;
          }
          if (typeof distributionData.startPoint === 'undefined' || distributionData.startPoint === '') {
            totalFields++;
            missingFields.push('起点');
          } else {
            completedFields++;
            totalFields++;
          }
          if (typeof distributionData.endPoint === 'undefined' || distributionData.endPoint === '') {
            totalFields++;
            missingFields.push('终点');
          } else {
            completedFields++;
            totalFields++;
          }
          if (
            typeof distributionData.transportationDistance === 'undefined' ||
            distributionData.transportationDistance === null ||
            distributionData.transportationDistance === 0
          ) {
            totalFields++;
            missingFields.push('运输距离');
          } else {
            completedFields++;
            totalFields++;
          }
          break;
        }
      }

      if (missingFields.length > 0) {
        completeIncompleteNodes.push({
          id: node.id,
          label: node.data.label || `Node ${node.id}`,
          missingFields: missingFields,
        });
      }
    });

    const NodeCompletenessScore = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : (currentNodes.length > 0 ? 100 : 0);
    const modelCompletenessScore = Math.round(0.25 * NodeCompletenessScore + 0.75 * lifecycleCompletenessScore);

    const massIncompleteNodes: AISummaryReport['massBalance']['incompleteNodes'] = [];
    let totalInputMass = 0;
    let totalOutputMass = 0;

    currentNodes.forEach((node) => {
      if (!node.data) return;
      if (node.data.lifecycleStage === '原材料获取') {
        const productData = node.data as ProductNodeData;
        const quantity =
          productData.quantity !== undefined && !Number.isNaN(Number(productData.quantity))
            ? Number(productData.quantity)
            : 0;
        if (quantity === 0) {
          massIncompleteNodes.push({
            id: node.id,
            label: node.data.label || `Node ${node.id}`,
            missingFields: ['数量'],
          });
        } else {
          totalInputMass += quantity;
        }
      }

      if (node.data.lifecycleStage === '最终节点') { 
        const finalProductData = node.data; 
        const quantity =
          (finalProductData as ProductNodeData).quantity !== undefined && !Number.isNaN(Number((finalProductData as ProductNodeData).quantity))
            ? Number((finalProductData as ProductNodeData).quantity)
            : 0;
        if (quantity === 0) {
          massIncompleteNodes.push({
            id: node.id,
            label: node.data.label || `Node ${node.id}`,
            missingFields: ['数量'],
          });
        } else {
          totalOutputMass += quantity;
        }
      }
    });

    const errorPercentage = totalInputMass > 0 ? (Math.abs(totalInputMass - totalOutputMass) / totalInputMass) * 100 : (totalOutputMass > 0 ? 100 : 0) ;
    let massBalanceScore = 100;
    if (errorPercentage > 5) {
      massBalanceScore = Math.max(0, 100 - Math.round(errorPercentage - 5));
    }

    const traceableIncompleteNodes: AISummaryReport['dataTraceability']['incompleteNodes'] = [];
    let totalTraceableNodeNumber = 0;
    let dataOkTraceableNodeNumber = 0;

    currentNodes.forEach((node) => {
      if (!node.data) return;
      totalTraceableNodeNumber++;
      if (node.data.carbonFactordataSource?.includes('ecoinvent')) {
        dataOkTraceableNodeNumber++;
      } else {
        traceableIncompleteNodes.push({
          id: node.id,
          label: node.data.label || `Node ${node.id}`,
          missingFields: ['碳足迹因子数据来源'],
        });
      }
    });

    const dataTraceabilityScore = Math.round(
      totalTraceableNodeNumber > 0 ? (dataOkTraceableNodeNumber / totalTraceableNodeNumber) * 100 : (currentNodes.length > 0 ? 100 : 0),
    );

    const validationIncompleteNodes: AISummaryReport['validation']['incompleteNodes'] = [];
    let totalValidationNodeNumber = 0;
    let dataOkValidationNodeNumber = 0;

    currentNodes.forEach((node) => {
      if (!node.data) return;
      totalValidationNodeNumber++;
      
      // 修改验证状态检查逻辑，使用evidenceFiles数组而不是直接使用
      // const evidenceFiles = node.data.evidenceFiles;
      // let isVerified = false;
      
      // if (Array.isArray(evidenceFiles) && evidenceFiles.length > 0) {
      //   // 检查是否有已验证的证据文件
      //   isVerified = evidenceFiles.some(file => 
      //     file && ['verified', 'approved'].includes(file.status)
      //   );
      // }
      
      
      //先改成有东西上传 就认为验证通过
      let isVerified = false;  // 默认设置为false
      
      if (node.data.evidenceFiles && Array.isArray(node.data.evidenceFiles) && node.data.evidenceFiles.length > 0) {
        isVerified = true;  // 只有当evidenceFiles存在且不为空时才设置为true
      }

      if (!isVerified) {
        validationIncompleteNodes.push({
          id: node.id,
          label: node.data.label || `Node ${node.id}`,
          missingFields: ['验证状态'],
        });
      } else {
        dataOkValidationNodeNumber++;
      }
    });

    const validationScore = Math.round(
      totalValidationNodeNumber > 0 ? (dataOkValidationNodeNumber / totalValidationNodeNumber) * 100 : (currentNodes.length > 0 ? 100 : 0),
    );

    const lifecycleCompletenessScore100 = Math.round(Math.max(0, Math.min(100, lifecycleCompletenessScore)));
    const NodeCompletenessScore100 = Math.round(Math.max(0, Math.min(100, NodeCompletenessScore)));
    const massBalanceScore100 = Math.round(Math.max(0, Math.min(100, massBalanceScore)));
    const dataTraceabilityScore100 = Math.round(Math.max(0, Math.min(100, dataTraceabilityScore)));
    const validationScore100 = Math.round(Math.max(0, Math.min(100, validationScore)));

    const credibilityScore = Math.round(
      0.1 * lifecycleCompletenessScore100 +
        0.3 * NodeCompletenessScore100 +
        0.1 * massBalanceScore100 +
        0.35 * dataTraceabilityScore100 +
        0.15 * validationScore100,
    );

    return {
      credibilityScore,
      missingLifecycleStages,
      isExpanded: aiReport.isExpanded, 
      modelCompleteness: {
        score: modelCompletenessScore,
        lifecycleCompleteness: lifecycleCompletenessScore,
        nodeCompleteness: NodeCompletenessScore,
        incompleteNodes: completeIncompleteNodes,
      },
      massBalance: {
        score: massBalanceScore100,
        ratio: totalInputMass > 0 ? totalOutputMass / totalInputMass : 0, 
        incompleteNodes: massIncompleteNodes,
      },
      dataTraceability: {
        score: dataTraceabilityScore100, 
        coverage: dataTraceabilityScore100, 
        incompleteNodes: traceableIncompleteNodes,
      },
      validation: {
        score: validationScore100, 
        consistency: validationScore100, 
        incompleteNodes: validationIncompleteNodes,
      },
      expandedSection: aiReport.expandedSection, 
    };
  }, [aiReport.isExpanded, aiReport.expandedSection]); 

  // 监听强制刷新事件
  useEffect(() => {
    console.log('[AISummary] 设置事件监听器: force-refresh-ai-summary');
    
    const handleForceRefresh = () => {
      console.log('[AISummary] 收到强制刷新事件');
      const summary = calculateAiSummaryInternal(nodes);
      setAiReport(summary);
      setStoreAiSummary(summary);
    };
    
    window.addEventListener('force-refresh-ai-summary', handleForceRefresh);
    
    return () => {
      window.removeEventListener('force-refresh-ai-summary', handleForceRefresh);
    };
  }, [nodes, calculateAiSummaryInternal, setStoreAiSummary]);
  
  // 标准的节点变化监听
  useEffect(() => {
    console.log('[AISummary] 节点变化，重新计算评分');
    const summary = calculateAiSummaryInternal(nodes);
    setAiReport(summary);
    setStoreAiSummary(summary);
  }, [nodes, calculateAiSummaryInternal, setStoreAiSummary]);

  const toggleAiSummaryExpand = useCallback(() => {
    setAiReport((prev) => ({
      ...prev,
      isExpanded: !prev.isExpanded,
    }));
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#52c41a'; 
    if (score >= 75) return '#1890ff'; 
    if (score >= 60) return '#faad14'; 
    return '#f5222d'; 
  };

  const getScoreStatus = (score: number) => {
    if (score >= 90) return '优';
    if (score >= 75) return '良';
    if (score >= 60) return '中';
    return '差';
  };
  
  const { credibilityScore, isExpanded, modelCompleteness, massBalance, dataTraceability, validation } = aiReport;
  const credibilityScorePercent = Math.round(credibilityScore);

  // Avoid rendering if nodes are not yet populated to prevent errors with empty summary
  if (!nodes) {
      return null; 
  }

  return (
    <div className={`ai-summary-module ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="ai-summary-header" onClick={toggleAiSummaryExpand}>
        <Typography.Title level={4} style={{ margin: 0 }}>AI工作流分析</Typography.Title>
        {isExpanded ? <UpOutlined /> : <DownOutlined />}
      </div>

      {isExpanded && (
        <div className="ai-summary-content">
          <div className="summary-score-section">
            <div className="total-score">
              <div className="score-circle" style={{ color: getScoreColor(credibilityScorePercent) }}>
                {credibilityScorePercent}
                <span className="score-unit">分</span>
              </div>
              <div className="score-label">总体可信度</div>
              <Tag color={getScoreColor(credibilityScorePercent)}>{getScoreStatus(credibilityScorePercent)}</Tag>
            </div>
          </div>

          <Collapse defaultActiveKey={['modelCompleteness']}>
            <Collapse.Panel
              header={
                <div className="score-panel-header">
                  <span>模型完整度</span>
                  <span className="score-value" style={{ color: getScoreColor(modelCompleteness.score) }}>
                    {modelCompleteness.score}分
                  </span>
                </div>
              }
              key="modelCompleteness"
            >
              <div className="score-detail-content">
                <Progress
                  percent={modelCompleteness.score}
                  strokeColor={getScoreColor(modelCompleteness.score)}
                  size="small"
                />
                <div className="score-summary">
                  <Typography.Title level={5}>评分总结</Typography.Title>
                  <div className="score-item">
                    <span>生命周期完整性:</span>
                    <span>{modelCompleteness.lifecycleCompleteness.toFixed(0)}%</span>
                  </div>
                  <div className="score-item">
                    <span>节点完整性:</span>
                    <span>{modelCompleteness.nodeCompleteness.toFixed(0)}%</span>
                  </div>
                </div>
                {modelCompleteness.incompleteNodes.length > 0 ? (
                  <div className="optimization-nodes">
                    <Typography.Title level={5}>需要优化的节点</Typography.Title>
                    {modelCompleteness.incompleteNodes.map((node) => (
                      <div
                        key={node.id}
                        className="node-item"
                        onClick={() => {
                          const targetNode = nodes.find((n) => n.id === node.id);
                          if (targetNode) {
                            setSelectedNode(targetNode);
                          }
                        }}
                      >
                        <div className="node-header">
                          <Tag color="warning">{node.label}</Tag>
                        </div>
                        <div className="node-details">
                          <div>缺失字段:</div>
                          <div className="missing-fields">
                            {node.missingFields.map((field) => (
                              <Tag key={field} color="error">
                                {field}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (<Empty description="模型完整度良好" />)}
              </div>
            </Collapse.Panel>

            <Collapse.Panel
              header={
                <div className="score-panel-header">
                  <span>质量平衡</span>
                  <span className="score-value" style={{ color: getScoreColor(massBalance.score) }}>
                    {massBalance.score}分
                  </span>
                </div>
              }
              key="massBalance"
            >
              <div className="score-detail-content">
                <Progress percent={massBalance.score} strokeColor={getScoreColor(massBalance.score)} size="small" />
                <div className="score-summary">
                  <Typography.Title level={5}>评分总结</Typography.Title>
                  <div className="score-item">
                    <span>平衡率 (输出/输入):</span>
                    <span>{massBalance.ratio.toFixed(2)}</span>
                  </div>
                </div>
                {massBalance.incompleteNodes.length > 0 ? (
                  <div className="optimization-nodes">
                    <Typography.Title level={5}>需要优化的节点 (缺失数量信息)</Typography.Title>
                    {massBalance.incompleteNodes.map((node) => (
                     <div
                        key={node.id}
                        className="node-item"
                        onClick={() => {
                          const targetNode = nodes.find((n) => n.id === node.id);
                          if (targetNode) {
                            setSelectedNode(targetNode);
                          }
                        }}
                      >
                        <div className="node-header">
                          <Tag color="warning">{node.label}</Tag>
                        </div>
                        <div className="node-details">
                          <div>缺失字段:</div>
                          <div className="missing-fields">
                            {node.missingFields.map((field) => (
                              <Tag key={field} color="error">
                                {field}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ): (<Empty description="质量平衡良好或无需检查" />)}
              </div>
            </Collapse.Panel>

            <Collapse.Panel
              header={
                <div className="score-panel-header">
                  <span>数据可追溯性</span>
                  <span className="score-value" style={{ color: getScoreColor(dataTraceability.score) }}>
                    {dataTraceability.score}分
                  </span>
                </div>
              }
              key="dataTraceability"
            >
              <div className="score-detail-content">
                <Progress
                  percent={dataTraceability.score}
                  strokeColor={getScoreColor(dataTraceability.score)}
                  size="small"
                />
                <div className="score-summary">
                  <Typography.Title level={5}>评分总结</Typography.Title>
                  <div className="score-item">
                    <span>关键数据覆盖率:</span>
                    <span>{dataTraceability.coverage.toFixed(0)}%</span>
                  </div>
                </div>
                 {dataTraceability.incompleteNodes.length > 0 ? (
                  <div className="optimization-nodes">
                    <Typography.Title level={5}>需要优化的节点 (缺少有效证据文件或非数据库来源)</Typography.Title>
                    {dataTraceability.incompleteNodes.map((node) => (
                      <div
                        key={node.id}
                        className="node-item"
                        onClick={() => {
                          const targetNode = nodes.find((n) => n.id === node.id);
                          if (targetNode) {
                            setSelectedNode(targetNode);
                          }
                        }}
                      >
                        <div className="node-header">
                          <Tag color="warning">{node.label}</Tag>
                        </div>
                        <div className="node-details">
                          <div>建议操作:</div>
                          <div className="missing-fields">
                            {node.missingFields.map((field) => (
                              <Tag key={field} color="error">
                                {field}
                              </Tag>
                            ))}
                            <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
                              请上传活动数据证据文件，或配置数据库匹配的碳足迹因子
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                 ) : (<Empty description="数据可追溯性良好" />)}
              </div>
            </Collapse.Panel>

            <Collapse.Panel
              header={
                <div className="score-panel-header">
                  <span>数据验证</span>
                  <span className="score-value" style={{ color: getScoreColor(validation.score) }}>
                    {validation.score}分
                  </span>
                </div>
              }
              key="validation"
            >
              <div className="score-detail-content">
                <Progress percent={validation.score} strokeColor={getScoreColor(validation.score)} size="small" />
                <div className="score-summary">
                  <Typography.Title level={5}>评分总结</Typography.Title>
                  <div className="score-item">
                    <span>已验证节点占比:</span> 
                    <span>{validation.consistency.toFixed(0)}%</span>
                  </div>
                </div>
                {validation.incompleteNodes.length > 0 ? (
                  <div className="optimization-nodes">
                    <Typography.Title level={5}>需要优化的节点 (缺少已验证证据文件)</Typography.Title>
                    {validation.incompleteNodes.map((node) => (
                      <div
                        key={node.id}
                        className="node-item"
                        onClick={() => {
                          const targetNode = nodes.find((n) => n.id === node.id);
                          if (targetNode) {
                            setSelectedNode(targetNode);
                          }
                        }}
                      >
                        <div className="node-header">
                          <Tag color="warning">{node.label}</Tag>
                        </div>
                        <div className="node-details">
                          <div>建议操作:</div>
                          <div className="missing-fields">
                            {node.missingFields.map((field) => (
                              <Tag key={field} color="error">
                                {field}
                              </Tag>
                            ))}
                            <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
                              请确保上传的证据文件已经通过验证或审批流程
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (<Empty description="数据验证状态良好" />)}
              </div>
            </Collapse.Panel>
          </Collapse>
        </div>
      )}
    </div>
  );
};
