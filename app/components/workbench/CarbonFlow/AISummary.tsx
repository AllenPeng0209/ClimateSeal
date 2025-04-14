import { useMemo } from 'react';
import type { Node, Edge } from 'reactflow';

interface NodeData {
  label: string;
  nodeName: string;
  lifecycleStage: string;
  emissionType: string;
  carbonFactor: number;
  activitydataSource: string;
  activityScore: number;
  carbonFootprint: number;
  weight?: number;
  dataSources?: string;
  verificationStatus?: string;
  startPoint?: string;
  endPoint?: string;
  transportDistance?: number;
  energyConsumption?: number;
  energyType?: string;
  [key: string]: any;
}

interface AISummaryProps {
  nodes: Node<NodeData>[];
  edges: Edge[];
}

interface IncompleteNode {
  id: string;
  data: {
    label: string;
  };
  missingFields: string[];
}

interface OptimizableNode {
  label: string;
  reason: string;
}

interface ManualNode {
  id: string;
  label: string;
}

export const AISummary = ({ nodes, edges }: AISummaryProps) => {
  const summary = useMemo(() => {
    // 計算模型完整性
    const modelCompleteness = calculateModelCompleteness(nodes);
    
    // 計算質量平衡
    const massBalance = calculateMassBalance(nodes);
    
    // 計算數據可追溯性
    const dataTraceability = calculateDataTraceability(nodes);
    
    // 計算驗證狀態
    const validation = calculateValidation(nodes);

    return {
      credibilityScore: calculateOverallScore([
        modelCompleteness,
        massBalance,
        dataTraceability,
        validation
      ]),
      modelCompleteness,
      massBalance,
      dataTraceability,
      validation,
      missingLifecycleStages: findMissingStages(nodes),
      optimizableNode: findOptimizableNode(nodes),
      manualRequiredNodes: findManualRequiredNodes(nodes),
      uncertainAiNodes: findUncertainNodes(nodes)
    };
  }, [nodes, edges]);

  return (
    <div className="ai-summary">
      <div className="ai-summary-header">
        <h3>AI Analysis Summary</h3>
        <div className="credibility-score">
          Score: {summary.credibilityScore.toFixed(1)}
        </div>
      </div>
      
      <div className="ai-summary-content">
        <section className="model-completeness">
          <h4>Model Completeness</h4>
          <div className="score-bar">
            <div 
              className="score-fill"
              style={{ width: `${summary.modelCompleteness.score * 100}%` }}
            />
          </div>
          <div className="score-details">
            {summary.modelCompleteness.incompleteNodes.map(node => (
              <div key={node.id} className="incomplete-node">
                <span>{node.data.label}</span>
                <span className="missing-fields">
                  {node.missingFields.join(', ')}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mass-balance">
          <h4>Mass Balance</h4>
          <div className="score-bar">
            <div 
              className="score-fill"
              style={{ width: `${summary.massBalance.score * 100}%` }}
            />
          </div>
          <div className="score-details">
            {summary.massBalance.incompleteNodes.map(node => (
              <div key={node.id} className="incomplete-node">
                <span>{node.data.label}</span>
                <span className="missing-fields">
                  {node.missingFields.join(', ')}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="data-traceability">
          <h4>Data Traceability</h4>
          <div className="score-bar">
            <div 
              className="score-fill"
              style={{ width: `${summary.dataTraceability.score * 100}%` }}
            />
          </div>
          <div className="score-details">
            {summary.dataTraceability.incompleteNodes.map(node => (
              <div key={node.id} className="incomplete-node">
                <span>{node.data.label}</span>
                <span className="missing-fields">
                  {node.missingFields.join(', ')}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="validation">
          <h4>Validation</h4>
          <div className="score-bar">
            <div 
              className="score-fill"
              style={{ width: `${summary.validation.score * 100}%` }}
            />
          </div>
          <div className="score-details">
            {summary.validation.incompleteNodes.map(node => (
              <div key={node.id} className="incomplete-node">
                <span>{node.data.label}</span>
                <span className="missing-fields">
                  {node.missingFields.join(', ')}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="optimization-suggestions">
          <h4>Optimization Suggestions</h4>
          {summary.optimizableNode && (
            <div className="optimization-node">
              <span className="node-label">{summary.optimizableNode.label}</span>
              <span className="optimization-reason">{summary.optimizableNode.reason}</span>
            </div>
          )}
        </section>

        <section className="manual-required">
          <h4>Manual Review Required</h4>
          {summary.manualRequiredNodes.map(node => (
            <div key={node.id} className="manual-node">
              <span>{node.label}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

// 輔助函數
function calculateModelCompleteness(nodes: Node<NodeData>[]) {
  // 1. 计算模型完整性
  const lifecycle = ['原材料', '生产制造', '分销和储存', '产品使用', '废弃处置'];
  const existingStages = new Set(nodes.map(node => node.data?.lifecycleStage).filter(Boolean));
  const missingLifecycleStages = lifecycle.filter(stage => !existingStages.has(stage));
  const lifecycleCompletenessScore = ((lifecycle.length - missingLifecycleStages.length) / lifecycle.length) * 100;
  
  let completedFields = 0;
  let totalFields = 0;
  const incompleteNodes: IncompleteNode[] = [];

  nodes.forEach(node => {
    const missingFields: string[] = [];
    
    // 根据节点类型检查不同字段
    switch (node.data.lifecycleStage) {
      case '原材料':
        if (!node.data.weight || node.data.weight === 0) {
          totalFields++;
          missingFields.push('重量');
        } else {
          completedFields++;
          totalFields++;
        }
        if (!node.data.carbonFactor || node.data.carbonFactor === 0) {
          totalFields++;
          missingFields.push('碳足跡因子');
        } else {
          completedFields++;
          totalFields++;
        }
        if (!node.data.carbonFactordataSource) {
          totalFields++;
          missingFields.push('碳足跡因子來源');
        } else {
          completedFields++;
          totalFields++;
        }
        break;
        
      case '生产制造':
        if (!node.data.carbonFactor || node.data.carbonFactor === 0) {
          totalFields++;
          missingFields.push('碳足跡因子');
        } else {
          completedFields++;
          totalFields++;
        }
        if (!node.data.energyConsumption || node.data.energyConsumption === 0) {
          totalFields++;
          missingFields.push('能源消耗');
        } else {
          completedFields++;
          totalFields++;
        }
        if (!node.data.energyType) {
          totalFields++;
          missingFields.push('能源类型');
        } else {
          completedFields++;
          totalFields++;
        }
        break;
        
      case '分销和储存':
        if (!node.data.carbonFactor || node.data.carbonFactor === 0) {
          totalFields++;
          missingFields.push('碳足跡因子');
        } else {
          completedFields++;
          totalFields++;
        }
        if (!node.data.startPoint) {
          totalFields++;
          missingFields.push('起点');
        } else {
          completedFields++;
          totalFields++;
        }
        if (!node.data.endPoint) {
          totalFields++;
          missingFields.push('终点');
        } else {
          completedFields++;
          totalFields++;
        }
        if (!node.data.transportDistance || node.data.transportDistance === 0) {
          totalFields++;
          missingFields.push('运输距离');
        } else {
          completedFields++;
          totalFields++;
        }
        break;
    }
    
    // 只有当有缺失字段时才添加到 incompleteNodes
    if (missingFields.length > 0) {
      incompleteNodes.push({
        id: node.id,
        data: {
          label: node.data.label
        },
        missingFields: missingFields
      });
    }
  });

  // 計算模型完整度
  const nodeCompletenessScore = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  const modelCompletenessScore = Math.round(0.25 * nodeCompletenessScore + 0.75 * lifecycleCompletenessScore) / 100;

  return {
    score: modelCompletenessScore,
    lifecycleCompleteness: lifecycleCompletenessScore / 100,
    nodeCompleteness: nodeCompletenessScore / 100,
    incompleteNodes
  };
}

function calculateMassBalance(nodes: Node<NodeData>[]) {
  // 2. 计算质量平衡, 質量的百分比誤差為分數
  const incompleteNodes: IncompleteNode[] = [];

  // 遍歷所有節點, 找到原材料節點, 獲取重量, 並且相加
  let totalInputMass = 0;
  let totalOutputMass = 0;
  
  nodes.forEach(node => {
    if (node.data.lifecycleStage === '原材料') {
      //需要判定重量是否存在
      if (!node.data.weight || node.data.weight === 0) {
        incompleteNodes.push({
          id: node.id,
          data: {
            label: node.data.label
          },
          missingFields: ['重量']
        });
      } else {
        totalInputMass += node.data.weight || 0;
      }
    }
    
    if (node.data.lifecycleStage === '最终产品') {
      //需要判定重量是否存在
      if (!node.data.weight || node.data.weight === 0) {
        incompleteNodes.push({
          id: node.id,
          data: {
            label: node.data.label
          },
          missingFields: ['重量']
        });
      } else {
        totalOutputMass += node.data.weight || 0;
      }
    }
  });

  // 計算質量平衡分數  算百分比误差
  const errorPercentage = totalInputMass > 0 ? Math.abs(totalInputMass - totalOutputMass) / totalInputMass * 100 : 0;
  
  // 误差在5%范围内给100分，否则根据误差程度减分
  let massBalanceScore = 100;
  if (errorPercentage > 5) {
    // 误差超过5%时，分数随着误差增加而减少
    massBalanceScore = Math.max(0, 100 - Math.round(errorPercentage - 5));
  }
  
  return {
    score: massBalanceScore / 100,
    ratio: totalInputMass > 0 ? totalOutputMass / totalInputMass : 0,
    incompleteNodes
  };
}

function calculateDataTraceability(nodes: Node<NodeData>[]) {
  // 3. 计算数据可追溯性
  const incompleteNodes: IncompleteNode[] = [];
  let totalTraceableNodeNumber = 0;
  let dataOkTraceableNodeNumber = 0;

  let totalCarbonFootprint = 0;
  nodes.forEach(node => {
    if (!node.data) return;
    totalCarbonFootprint += node.data.carbonFootprint || 0;
  });
  
  // 检查每个排放源的数据来源
  nodes.forEach(node => {
    if (!node.data) return;
    const nodeCarbonFootprintRatio = totalCarbonFootprint > 0 ? node.data.carbonFootprint / totalCarbonFootprint : 0;
    
    if (nodeCarbonFootprintRatio > 0.1) {
      totalTraceableNodeNumber++;
      
      // 检查每个排放源的数据来源, 如果dataSources里面有数据库匹配
      if (node.data.dataSources?.includes('数据库匹配')) {
        dataOkTraceableNodeNumber++;
      } else {
        incompleteNodes.push({
          id: node.id,
          data: {
            label: node.data.label
          },
          missingFields: ['数据来源']
        });
      }
    }
  });
  
  const dataTraceabilityScore = totalTraceableNodeNumber > 0 ? 
    (dataOkTraceableNodeNumber / totalTraceableNodeNumber) : 0;

  return {
    score: dataTraceabilityScore,
    coverage: dataTraceabilityScore,
    incompleteNodes
  };
}

function calculateValidation(nodes: Node<NodeData>[]) {
  // 4. 计算数据准确性
  const incompleteNodes: IncompleteNode[] = [];
  let totalValidationNodeNumber = 0;
  let dataOkValidationNodeNumber = 0;

  nodes.forEach(node => {
    if (!node.data) return;
    totalValidationNodeNumber++;
    
    // 检查每个排放源的数据验证程度, 有三种状态 未验证, 内部验证, 第三方验证
    const verificationStatus = node.data.verificationStatus;
    
    if (verificationStatus === '未验证') {
      incompleteNodes.push({
        id: node.id,
        data: {
          label: node.data.label
        },
        missingFields: ['验证状态']
      });
    } else {
      dataOkValidationNodeNumber++;
    }
  });
  
  const validationScore = totalValidationNodeNumber > 0 ? 
    (dataOkValidationNodeNumber / totalValidationNodeNumber) : 0;

  return {
    score: validationScore,
    consistency: validationScore,
    incompleteNodes
  };
}

function calculateOverallScore(scores: { score: number }[]) {
  // 把所有值都约束到0～100之间
  const normalizedScores = scores.map(score => Math.max(0, Math.min(1, score.score)));
  
  // 根据权重计算总分
  const weights = [0.1, 0.3, 0.35, 0.15]; // 生命周期完整性、节点完整性、数据可追溯性、验证状态的权重
  let weightedSum = 0;
  let totalWeight = 0;
  
  normalizedScores.forEach((score, index) => {
    if (index < weights.length) {
      weightedSum += score * weights[index];
      totalWeight += weights[index];
    }
  });
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

function findMissingStages(nodes: Node<NodeData>[]) {
  // 实现缺失阶段检查逻辑
  const lifecycle = ['原材料', '生产制造', '分销和储存', '产品使用', '废弃处置'];
  const existingStages = new Set(nodes.map(node => node.data?.lifecycleStage).filter(Boolean));
  return lifecycle.filter(stage => !existingStages.has(stage));
}

function findOptimizableNode(nodes: Node<NodeData>[]) {
  // 实现可优化节点检查逻辑
  // 查找碳排放量高但数据质量低的节点
  let maxCarbonFootprint = 0;
  let optimizableNode: OptimizableNode | null = null;
  
  nodes.forEach(node => {
    if (node.data.carbonFootprint > maxCarbonFootprint) {
      maxCarbonFootprint = node.data.carbonFootprint;
      
      // 如果碳排放高但数据质量低，标记为可优化
      if (node.data.activityScore < 0.7) {
        optimizableNode = {
          label: node.data.label,
          reason: `碳排放量高 (${node.data.carbonFootprint.toFixed(2)})，但数据质量低 (${(node.data.activityScore * 100).toFixed(0)}%)`
        };
      }
    }
  });
  
  return optimizableNode;
}

function findManualRequiredNodes(nodes: Node<NodeData>[]) {
  // 实现需要手动审查的节点检查逻辑
  const manualNodes: ManualNode[] = [];
  
  nodes.forEach(node => {
    // 如果节点数据不完整或验证状态为未验证，需要手动审查
    if (
      !node.data.carbonFactor || 
      node.data.carbonFactor === 0 || 
      node.data.verificationStatus === '未验证' ||
      node.data.activityScore < 0.5
    ) {
      manualNodes.push({
        id: node.id,
        label: node.data.label
      });
    }
  });
  
  return manualNodes;
}

function findUncertainNodes(nodes: Node<NodeData>[]) {
  // 实现不确定性节点检查逻辑
  return nodes.filter(node => 
    node.data.activityScore < 0.6 || 
    node.data.verificationStatus === '未验证'
  );
} 