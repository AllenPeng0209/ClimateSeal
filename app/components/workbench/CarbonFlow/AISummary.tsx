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
  // 實現模型完整性計算邏輯
  return {
    score: 0.8,
    incompleteNodes: [] as IncompleteNode[]
  };
}

function calculateMassBalance(nodes: Node<NodeData>[]) {
  // 實現質量平衡計算邏輯
  return {
    score: 0.7,
    incompleteNodes: [] as IncompleteNode[]
  };
}

function calculateDataTraceability(nodes: Node<NodeData>[]) {
  // 實現數據可追溯性計算邏輯
  return {
    score: 0.9,
    incompleteNodes: [] as IncompleteNode[]
  };
}

function calculateValidation(nodes: Node<NodeData>[]) {
  // 實現驗證狀態計算邏輯
  return {
    score: 0.85,
    incompleteNodes: [] as IncompleteNode[]
  };
}

function calculateOverallScore(scores: { score: number }[]) {
  return scores.reduce((acc, curr) => acc + curr.score, 0) / scores.length;
}

function findMissingStages(nodes: Node<NodeData>[]) {
  // 實現缺失階段檢查邏輯
  return [] as string[];
}

function findOptimizableNode(nodes: Node<NodeData>[]) {
  // 實現可優化節點檢查邏輯
  return null as OptimizableNode | null;
}

function findManualRequiredNodes(nodes: Node<NodeData>[]) {
  // 實現需要手動審查的節點檢查邏輯
  return [] as ManualNode[];
}

function findUncertainNodes(nodes: Node<NodeData>[]) {
  // 實現不確定性節點檢查邏輯
  return [] as Node<NodeData>[];
} 