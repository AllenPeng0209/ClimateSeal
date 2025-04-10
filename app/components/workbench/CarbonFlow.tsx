import React, { useCallback, useState, useEffect } from 'react';
import type { DragEvent } from 'react';
import ReactFlow, {
  type Node,
  type Edge,
  type Connection,
  type ReactFlowInstance,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import type { PanelPosition } from 'reactflow';
import 'reactflow/dist/style.css';
import './CarbonFlow.css';
import './CarbonFlow/styles.css';
import { Button } from '~/components/ui/Button';
import { ProductNode } from './CarbonFlow/nodes/ProductNode';
import { ManufacturingNode } from './CarbonFlow/nodes/ManufacturingNode';
import { DistributionNode } from './CarbonFlow/nodes/DistributionNode';
import { UsageNode } from './CarbonFlow/nodes/UsageNode';
import { DisposalNode } from './CarbonFlow/nodes/DisposalNode';
import { NodeProperties } from './CarbonFlow/NodeProperties';
import { FinalProductNode } from './CarbonFlow/nodes/FinalProductNode';
import { CarbonFlowActionHandler } from './CarbonFlow/CarbonFlowActions';
import type { CarbonFlowAction } from '~/types/actions';



interface BaseNodeData {
  label: string;
  nodeName: string;
  lifecycleStage: string;
  emissionType: string;
  carbonFactor: number;
  quantity?: string;
  activitydataSource: string;
  activityScore: number;
  certificationMaterials: string;
  emissionFactor: string;
  calculationMethod: string;
  verificationStatus: string;
  applicableStandard: string;
  completionStatus: string;
  carbonFactorName: string;
  carbonFootprint: number;
  carbonFactordataSource?: string;
  unitConversion: number;
  emissionFactorQuality: number;
}

interface ProductNodeData extends BaseNodeData {
  material?: string;
  weight_per_unit?: string;
  isRecycled?: boolean;
  recycledContent?: string;
  recycledContentPercentage?: number;
  sourcingRegion?: string;
  SourceLocation?: string;
  Destination?: string;
  SupplierName?: string;
  SupplierAddress?: string;
  ProcessingPlantAddress?: string;
  RefrigeratedTransport?: boolean;
  weight?: number;
  supplier?: string;
  certaintyPercentage?: number;
}

interface ManufacturingNodeData extends BaseNodeData {
  ElectricityAccountingMethod: string;
  ElectricityAllocationMethod: string;
  EnergyConsumptionMethodology: string;
  EnergyConsumptionAllocationMethod: string;
  chemicalsMaterial: string;
  MaterialAllocationMethod: string;
  WaterUseMethodology: string;
  WaterAllocationMethod: string;
  packagingMaterial: string;
  direct_emission: string;
  WasteGasTreatment: string;
  WasteDisposalMethod: string;
  WastewaterTreatment: string;
  productionMethod?: string;
  productionMethodDataSource?: string;
  productionMethodVerificationStatus?: string;
  productionMethodApplicableStandard?: string;
  productionMethodCompletionStatus?: string;
  energyConsumption: number;
  energyType: string;
  processEfficiency: number;
  wasteGeneration: number;
  waterConsumption: number;
  recycledMaterialPercentage: number;
  productionCapacity: number;
  machineUtilization: number;
  qualityDefectRate: number;
  processTechnology: string;
  manufacturingStandard: string;
  automationLevel: string;
  manufacturingLocation: string;
  byproducts: string;
  emissionControlMeasures: string;
}

interface DistributionNodeData extends BaseNodeData {
  transportationMode: string;
  transportationDistance: number;
  startPoint: string;
  endPoint: string;
  vehicleType: string;
  fuelType: string;
  fuelEfficiency: number;
  loadFactor: number;
  refrigeration: boolean;
  packagingMaterial: string;
  packagingWeight: number;
  warehouseEnergy: number;
  storageTime: number;
  storageConditions: string;
  distributionNetwork: string;
  aiRecommendation?: string;
  returnLogistics?: boolean;
  packagingRecyclability?: number;
  lastMileDelivery?: string;
  distributionMode?: string;
  distributionDistance?: number;
  distributionStartPoint?: string;
  distributionEndPoint?: string;
  distributionTransportationMode?: string;
  distributionTransportationDistance?: number;
}

interface UsageNodeData extends BaseNodeData {
  lifespan: number;
  energyConsumptionPerUse: number;
  waterConsumptionPerUse: number;
  consumablesUsed: string;
  consumablesWeight: number;
  usageFrequency: number;
  maintenanceFrequency: number;
  repairRate: number;
  userBehaviorImpact: number;
  efficiencyDegradation: number;
  standbyEnergyConsumption: number;
  usageLocation: string;
  usagePattern: string;
  userInstructions?: string;
  upgradeability?: number;
  secondHandMarket?: boolean;
}

interface DisposalNodeData extends BaseNodeData {
  recyclingRate: number;
  landfillPercentage: number;
  incinerationPercentage: number;
  compostPercentage: number;
  reusePercentage: number;
  hazardousWasteContent: number;
  biodegradability: number;
  disposalEnergyRecovery: number;
  transportToDisposal: number;
  disposalMethod: string;
  endOfLifeTreatment: string;
  recyclingEfficiency: number;
  dismantlingDifficulty: string;
  wasteRegulations?: string;
  takeback?: boolean;
  circularEconomyPotential?: number;
}

interface FinalProductNodeData extends BaseNodeData {
  finalProductName: string;
  totalCarbonFootprint: number;
  certificationStatus: string;
  environmentalImpact: string;
  sustainabilityScore: number;
  productCategory: string;
  marketSegment: string;
  targetRegion: string;
  complianceStatus: string;
  carbonLabel: string;
}

type NodeData = ProductNodeData | ManufacturingNodeData | DistributionNodeData | UsageNodeData | DisposalNodeData | FinalProductNodeData;

const nodeTypes = {
  product: ProductNode,
  manufacturing: ManufacturingNode,
  distribution: DistributionNode,
  usage: UsageNode,
  disposal: DisposalNode,
  finalProduct: FinalProductNode,
} as const;

type NodeType = keyof typeof nodeTypes;

const nodeTypeLabels: Record<NodeType, string> = {
  product: '材料节点',
  manufacturing: '制造节点',
  distribution: '分销节点',
  usage: '使用节点',
  disposal: '废弃节点',
  finalProduct: '最终节点',
};

const initialNodes: Node<NodeData>[] = [
  {
    id: 'product-1',
    type: 'product',
    position: { x: 250, y: 100 },
    data: {
      label: 'Product Node',
      nodeName: 'product_1',
      lifecycleStage: 'product',
      emissionType: 'direct',
      carbonFactor: 0,
      activitydataSource: 'manual',
      activityScore: 0,
      carbonFootprint: 0,
      certificationMaterials: '',
      emissionFactor: '',
      calculationMethod: '',
      verificationStatus: 'pending',
      applicableStandard: '',
      completionStatus: 'incomplete',
      carbonFactorName: '',
      unitConversion: 1,
      emissionFactorQuality: 0,
    },
  },
];

const initialEdges: Edge[] = [];

interface AISummary {
  credibilityScore: number;
  missingLifecycleStages: string[];
  optimizableNode: {
    id: string;
    label: string;
    reason: string;
  } | null;
  manualRequiredNodes: {
    id: string;
    label: string;
  }[];
  uncertainAiNodes: {
    id: string;
    label: string;
    activityScore: number;
  }[];
  isExpanded: boolean;
  modelCompleteness: {
    score: number;
    lifecycleCompleteness: number;
    nodeCompleteness: number;
    incompleteNodes: {
      id: string;
      label: string;
      missingFields: string[];
    }[];
  };
  massBalance: {
    score: number;
    ratio: number;
    incompleteNodes: {
      id: string;
      label: string;
      missingFields: string[];
    }[];
  };
  dataTraceability: {
    score: number;
    coverage: number;
    incompleteNodes: {
      id: string;
      label: string;
      missingFields: string[];
    }[];
  };
  validation: {
    score: number;
    consistency: number;
    incompleteNodes: {
      id: string;
      label: string;
      missingFields: string[];
    }[];
  };
  expandedSection: 'overview' | 'details' | null;
}

const CarbonFlowInner = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [siderWidth, setSiderWidth] = useState(250);
  const [isResizing, setIsResizing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { project, fitView } = useReactFlow();
  const [aiSummary, setAiSummary] = useState<AISummary>({
    credibilityScore: 0,
    missingLifecycleStages: [],
    optimizableNode: null,
    manualRequiredNodes: [],
    uncertainAiNodes: [],
    isExpanded: false,
    modelCompleteness: {
      score: 0,
      lifecycleCompleteness: 0,
      nodeCompleteness: 0,
      incompleteNodes: [],
    },
    massBalance: {
      score: 0,
      ratio: 0,
      incompleteNodes: [],
    },
    dataTraceability: {
      score: 0,
      coverage: 0,
      incompleteNodes: [],
    },
    validation: {
      score: 0,
      consistency: 0,
      incompleteNodes: [],
    },
    expandedSection: null,
  });

  // 创建 CarbonFlow 操作处理器
  const [actionHandler, setActionHandler] = useState<CarbonFlowActionHandler | null>(null);
  
  // 初始化操作处理器
  useEffect(() => {
    const handler = new CarbonFlowActionHandler({
      nodes,
      edges,
      setNodes,
      setEdges
    });
    setActionHandler(handler);
    
    // 设置全局标识，表示CarbonFlow已初始化
    if (typeof window !== 'undefined') {
      (window as any).carbonFlowInitialized = true;
      console.log('[CarbonFlow] 组件已初始化');
    }
  }, [nodes, edges, setNodes, setEdges]);
  
  // 处理 CarbonFlow 操作
  const handleCarbonFlowAction = useCallback((action: CarbonFlowAction) => {
    if (actionHandler) {
      actionHandler.handleAction(action);
    } else {
      console.warn('CarbonFlow 操作处理器尚未初始化');
    }
  }, [actionHandler]);
  
  // 添加全局事件监听器，处理来自桥接器的操作
  useEffect(() => {
    if (!actionHandler) return;
    
    const handleActionEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      const action = customEvent.detail as CarbonFlowAction & { traceId?: string };
      
      console.log('[CarbonFlow] 收到操作:', action);
      handleCarbonFlowAction(action);
      
      // 发送操作结果事件
      window.dispatchEvent(new CustomEvent('carbonflow-action-result', { 
        detail: { success: true, traceId: action.traceId, nodeId: action.nodeId } 
      }));
    };
    
    // 添加事件监听器
    window.addEventListener('carbonflow-action', handleActionEvent);
    
    // 清理函数
    return () => {
      window.removeEventListener('carbonflow-action', handleActionEvent);
      
      // 清除初始化标记
      if (typeof window !== 'undefined') {
        (window as any).carbonFlowInitialized = false;
      }
    };
  }, [actionHandler, handleCarbonFlowAction]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<NodeData>) => {
      setSelectedNode(node);
    },
    []
  );

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const type = event.dataTransfer.getData('application/carbonflow') as NodeType;
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node<NodeData> = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
          nodeName: `${type}_${Date.now()}`,
          lifecycleStage: type,
          emissionType: 'direct',
          carbonFactor: 0,
          activitydataSource: 'manual',
          activityScore: 0,
          carbonFootprint: 0,
          certificationMaterials: '',
          emissionFactor: '',
          calculationMethod: '',
          verificationStatus: 'pending',
          applicableStandard: '',
          completionStatus: 'incomplete',
          carbonFactorName: '',
          unitConversion: 1,
          emissionFactorQuality: 0,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, setNodes]
  );

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const addNewNode = useCallback(() => {
    const newNode: Node<ProductNodeData> = {
      id: `node-${nodes.length + 1}`,
      type: 'product',
      position: project({ x: 100, y: 100 }),
      data: {
        label: 'New Product Node',
        nodeName: 'Product',
        lifecycleStage: 'production',
        emissionType: 'direct',
        carbonFactor: 0,
        activitydataSource: 'primary',
        activityScore: 0,
        certificationMaterials: '',
        emissionFactor: '',
        calculationMethod: '',
        verificationStatus: 'unverified',
        applicableStandard: '',
        completionStatus: 'incomplete',
        carbonFactorName: '',
        carbonFootprint: 0,
        unitConversion: 1,
        emissionFactorQuality: 0,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [nodes.length, project, setNodes]);

  const deleteSelectedNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
      setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
      setSelectedNode(null);
    }
  }, [selectedNode, setNodes, setEdges]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    document.body.classList.add('resizing');
    const startX = e.clientX;
    const startWidth = siderWidth;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = startWidth + (e.clientX - startX);
      setSiderWidth(Math.max(200, Math.min(400, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.classList.remove('resizing');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isResizing, siderWidth]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      // 延迟一下再调整视图，确保全屏已经完成
      setTimeout(() => {
        fitView({ duration: 800, padding: 0.2 });
      }, 100);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, [fitView]);

  const autoLayout = useCallback(() => {
    if (!reactFlowInstance) return;

    const NODE_WIDTH = 250;
    const NODE_HEIGHT = 150;
    const HORIZONTAL_SPACING = 500;
    const VERTICAL_SPACING = 400;
    const PADDING = 300;

    // 定義節點類型的順序（不包括最終產品節點）
    const nodeTypeOrder: NodeType[] = ['product', 'manufacturing', 'distribution', 'usage', 'disposal'];
    
    // 根據節點類型分組
    const nodesByType: Record<NodeType, Node<NodeData>[]> = {
      product: [],
      manufacturing: [],
      distribution: [],
      usage: [],
      disposal: [],
      finalProduct: [],
    };
    
    // 填充節點分組
    nodes.forEach(node => {
      const nodeType = node.type as NodeType;
      if (nodeType in nodesByType) {
        nodesByType[nodeType].push(node);
      }
    });

    // 確保有最終產品節點
    let finalProductNode = nodesByType.finalProduct[0];
    if (!finalProductNode) {
      finalProductNode = {
        id: 'final-product-1',
        type: 'finalProduct',
        position: { x: 0, y: 0 },
        data: {
          label: '最終產品',
          nodeName: 'final_product_1',
          lifecycleStage: 'finalProduct',
          emissionType: 'total',
          carbonFactor: 0,
          activitydataSource: 'calculated',
          activityScore: 0,
          carbonFootprint: 0,
          certificationMaterials: '',
          emissionFactor: '',
          calculationMethod: '',
          verificationStatus: 'pending',
          applicableStandard: '',
          completionStatus: 'incomplete',
          carbonFactorName: '',
          unitConversion: 1,
          emissionFactorQuality: 0,
          finalProductName: '最終產品',
          totalCarbonFootprint: 0,
          certificationStatus: 'pending',
          environmentalImpact: '待評估',
          sustainabilityScore: 0,
          productCategory: '未分類',
          marketSegment: '未指定',
          targetRegion: '未指定',
          complianceStatus: '待驗證',
          carbonLabel: '待認證',
        },
      };
      nodesByType.finalProduct.push(finalProductNode);
    }

    // 計算新的節點位置
    const newNodes = [...nodes];
    if (!nodesByType.finalProduct.length) {
      newNodes.push(finalProductNode);
    }

    // 計算所有非最終產品節點的位置
    const positionedNodes = newNodes.filter(node => node.type !== 'finalProduct').map(node => {
      const nodeType = node.type as NodeType;
      const typeIndex = nodeTypeOrder.indexOf(nodeType);
      const typeNodes = nodesByType[nodeType] || [];
      const nodeIndex = typeNodes.indexOf(node);
      
      // 計算水平位置（根據節點類型）
      const x = PADDING + typeIndex * HORIZONTAL_SPACING;
      
      // 計算垂直位置（根據同類型節點的順序）
      const y = PADDING + nodeIndex * VERTICAL_SPACING;

      return {
        ...node,
        position: { x, y },
        style: {    
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
        },  
      };
    });

    // 計算最終產品節點的位置（放在中間正下方）
    const maxX = Math.max(...positionedNodes.map(node => node.position.x));
    const maxY = Math.max(...positionedNodes.map(node => node.position.y));
    const finalProductPosition = {
      x: maxX / 2,
      y: maxY + VERTICAL_SPACING,
    };

    // 添加最終產品節點
    const finalProductNodeWithPosition = {
      ...finalProductNode,
      position: finalProductPosition,
    };

    // 合併所有節點
    const allNodes = [...positionedNodes, finalProductNodeWithPosition];

    // 創建新的邊連接
    const newEdges: Edge[] = [];
    let totalCarbonFootprint = 0;

    // 連接所有非最終產品節點到最終產品節點
    positionedNodes.forEach(node => {
      // 添加邊連接
      newEdges.push({
        id: `edge-${node.id}-${finalProductNode.id}`,
        source: node.id,
        target: finalProductNode.id,
        type: 'smoothstep',
        animated: true,
      });

      // 累加碳排放量
      if ('carbonFootprint' in node.data) {
        totalCarbonFootprint += node.data.carbonFootprint;
      }
    });

    // 更新最終產品節點的總碳排放量
    const updatedNodes = allNodes.map(node => {
      if (node.id === finalProductNode.id) {
        return {
          ...node,
          data: {
            ...node.data,
            totalCarbonFootprint,
            carbonFootprint: totalCarbonFootprint,
          },
        };
      }
      return node;
    });

    setNodes(updatedNodes);
    setEdges(newEdges);
    fitView({ duration: 800, padding: 0.2 });
  }, [nodes, reactFlowInstance, setNodes, setEdges, fitView]);

  const calculateAiSummary = useCallback(() => {
    // 計算模型完整性
    const modelCompleteness = {
      score: 0,
      lifecycleCompleteness: 0,
      nodeCompleteness: 0,
      incompleteNodes: [] as { id: string; label: string; missingFields: string[] }[],
    };

    // 計算質量平衡
    const massBalance = {
      score: 0,
      ratio: 0,
      incompleteNodes: [] as { id: string; label: string; missingFields: string[] }[],
    };

    // 計算數據可追溯性
    const dataTraceability = {
      score: 0,
      coverage: 0,
      incompleteNodes: [] as { id: string; label: string; missingFields: string[] }[],
    };

    // 計算驗證狀態
    const validation = {
      score: 0,
      consistency: 0,
      incompleteNodes: [] as { id: string; label: string; missingFields: string[] }[],
    };

    // 更新 AI Summary
    setAiSummary(prev => ({
      ...prev,
      modelCompleteness,
      massBalance,
      dataTraceability,
      validation,
      credibilityScore: (modelCompleteness.score + massBalance.score + dataTraceability.score + validation.score) / 4,
    }));
  }, [nodes]);

  const toggleAiSummaryExpand = useCallback(() => {
    setAiSummary(prev => ({
      ...prev,
      isExpanded: !prev.isExpanded,
    }));
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return '#52c41a';
    if (score >= 0.6) return '#faad14';
    return '#f5222d';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 0.8) return '良好';
    if (score >= 0.6) return '一般';
    return '需要改進';
  };

  const renderAiSummary = () => {
    if (!aiSummary.isExpanded) return null;

    return (
      <>
        <div className="ai-summary-overlay" onClick={() => toggleAiSummaryExpand()} />
        <div className="ai-summary">
          <button className="ai-summary-close" onClick={() => toggleAiSummaryExpand()}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <div className="ai-summary-header">
            <h3>AI 分析</h3>
            <div className="credibility-score">
              可信度評分：<span>{aiSummary.credibilityScore}</span>
            </div>
          </div>
          <div className="ai-summary-content">
            <div className="summary-section">
              <h4>模型完整性</h4>
              <div className="score-bar">
                <div 
                  className="score-fill" 
                  style={{ 
                    width: `${aiSummary.modelCompleteness.score * 100}%`,
                    backgroundColor: getScoreColor(aiSummary.modelCompleteness.score)
                  }}
                />
              </div>
              <div className="score-details">
                <span>生命週期完整性: {(aiSummary.modelCompleteness.lifecycleCompleteness * 100).toFixed(1)}%</span>
                <span>節點完整性: {(aiSummary.modelCompleteness.nodeCompleteness * 100).toFixed(1)}%</span>
              </div>
            </div>
            <div className="summary-section">
              <h4>質量平衡</h4>
              <div className="score-bar">
                <div 
                  className="score-fill" 
                  style={{ 
                    width: `${aiSummary.massBalance.score * 100}%`,
                    backgroundColor: getScoreColor(aiSummary.massBalance.score)
                  }}
                />
              </div>
              <div className="score-details">
                <span>平衡比率: {(aiSummary.massBalance.ratio * 100).toFixed(1)}%</span>
              </div>
            </div>
            <div className="summary-section">
              <h4>數據可追溯性</h4>
              <div className="score-bar">
                <div 
                  className="score-fill" 
                  style={{ 
                    width: `${aiSummary.dataTraceability.score * 100}%`,
                    backgroundColor: getScoreColor(aiSummary.dataTraceability.score)
                  }}
                />
              </div>
              <div className="score-details">
                <span>覆蓋率: {(aiSummary.dataTraceability.coverage * 100).toFixed(1)}%</span>
              </div>
            </div>
            <div className="summary-section">
              <h4>驗證狀態</h4>
              <div className="score-bar">
                <div 
                  className="score-fill" 
                  style={{ 
                    width: `${aiSummary.validation.score * 100}%`,
                    backgroundColor: getScoreColor(aiSummary.validation.score)
                  }}
                />
              </div>
              <div className="score-details">
                <span>一致性: {(aiSummary.validation.consistency * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="editor-layout">
      <div className="editor-header">
        <div className="header-left">
          <h2 className="workflow-title">碳足迹流程图</h2>
        </div>
        <div className="header-right">
          <Button onClick={addNewNode}>新增节点</Button>
          <Button 
            onClick={deleteSelectedNode} 
            variant="destructive"
            disabled={!selectedNode}
          >
            删除节点
          </Button>
          <Button onClick={autoLayout}>自动布局</Button>
          <Button onClick={toggleFullscreen}>
            {isFullscreen ? '退出全屏' : '全屏查看'}
          </Button>
          <Button onClick={toggleAiSummaryExpand}>
            {aiSummary.isExpanded ? '收起 AI 分析' : '展开 AI 分析'}
          </Button>
          <Button 
            onClick={() => {
              // TODO: 实现生成报告功能
              console.log('生成报告');
            }}
            style={{ 
              backgroundColor: '#1890ff',
              color: 'white',
              marginLeft: 'auto'
            }}
          >
            生成报告
          </Button>
        </div>
      </div>
      <div className="main-content">
        <div className="editor-sider" style={{ width: siderWidth }}>
          {renderAiSummary()}
          <div className="file-manager">
            <h3>节点类型</h3>
            <div className="node-types">
              {Object.entries(nodeTypeLabels).map(([type, label]) => (
                <div
                  key={type}
                  className="draggable-file"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/carbonflow', type);
                  }}
                >
                  {label}
                  <span className="drag-hint">拖拽到画布</span>
                </div>
              ))}
            </div>
          </div>
          <div className="resizer" onMouseDown={handleResizeStart}>
            <div className="resizer-handle" />
          </div>
        </div>
        <div className="editor-content">
          <div className="reactflow-wrapper">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onInit={onInit}
              onPaneClick={handlePaneClick}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.1}
              maxZoom={2}
              defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            >
              <Background />
              <Controls />
              <MiniMap />
              {selectedNode && (
                <Panel position="top-center">
                  <NodeProperties
                    node={selectedNode}
                    onClose={() => setSelectedNode(null)}
                    onUpdate={(updatedNode) => {
                      setNodes((nds) =>
                        nds.map((node) =>
                          node.id === updatedNode.id ? { ...node, data: { ...node.data, ...updatedNode } } : node
                        )
                      );
                    }}
                  />
                </Panel>
              )}
            </ReactFlow>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CarbonFlow = () => {
  return (
    <ReactFlowProvider>
      <CarbonFlowInner />
    </ReactFlowProvider>
  );
};