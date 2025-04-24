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
import { Tag, Collapse, Progress, message } from 'antd';
import { UpOutlined, DownOutlined, ReloadOutlined } from '@ant-design/icons';
import type { NodeData, DataNode } from '~/types/nodes';
import { useCarbonFlowStore, emitCarbonFlowData } from './CarbonFlow/CarbonFlowBridge';

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

// 添加一个映射，用于将中文类型映射回英文类型
const nodeTypeMapping: Record<string, NodeType> = {
  [`材料节点`]: 'product',
  [`制造节点`]: 'manufacturing',
  [`分销节点`]: 'distribution',
  [`使用节点`]: 'usage',
  [`废弃节点`]: 'disposal',
  [`最终节点`]: 'finalProduct',
};

// 添加一个映射，用于将英文类型映射到中文类型
const nodeTypeReverseMapping: Record<NodeType, string> = {
  'product': '材料节点',
  'manufacturing': '制造节点',
  'distribution': '分销节点',
  'usage': '使用节点',
  'disposal': '废弃节点',
  'finalProduct': '最终节点',
};

const initialNodes: Node<NodeData>[] = [];

const initialEdges: Edge[] = [];

interface AISummary {
  credibilityScore: number;
  missingLifecycleStages: string[];
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
    isExpanded: true,
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
  
  // 使用CarbonFlowStore
  const { setNodes: setStoreNodes, setEdges: setStoreEdges, setAiSummary: setStoreAiSummary } = useCarbonFlowStore();
  
  // 当nodes更新时，同步到store
  useEffect(() => {
    setStoreNodes(nodes);
    emitCarbonFlowData();
  }, [nodes, setStoreNodes]);
  
  // 当edges更新时，同步到store
  useEffect(() => {
    setStoreEdges(edges);
    emitCarbonFlowData();
  }, [edges, setStoreEdges]);
  
  // 当aiSummary更新时，同步到store
  useEffect(() => {
    setStoreAiSummary(aiSummary);
    emitCarbonFlowData();
  }, [aiSummary, setStoreAiSummary]);
  
  // 创建 CarbonFlow 操作处理器
  const [actionHandler, setActionHandler] = useState<CarbonFlowActionHandler | null>(null);
  
  // 初始化操作处理器
  useEffect(() => {
    const handler = new CarbonFlowActionHandler({
      nodes,
      edges,
      setNodes,
      setEdges,
    });
    setActionHandler(handler);
    if (typeof window !== 'undefined') {
      (window as any).carbonFlowInitialized = true;
    }
  }, [nodes, edges, setNodes, setEdges]);
  
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

  const stageNames: Record<string, string> = {
    '材料节点': '原材料获取',
    '制造节点': '生产制造',
    '分销节点': '分销和储存',
    '使用节点': '产品使用',
    '废弃节点': '废弃处置'
  };

  // 修改 onDrop 函数，确保类型正确
  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const Type = event.dataTransfer.getData('application/carbonflow') as NodeType;
      const chineseType = event.dataTransfer.getData('application/carbonflow');
      const lifecycleStageType = stageNames[Type] || Type;
      const type = nodeTypeMapping[chineseType] as NodeType;
      
      if (!type) {
        console.error('未知的节点类型:', chineseType);
        return;
      }
      
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // 创建新节点，确保所有必需属性都有默认值
      const newNode: Node<NodeData> = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: chineseType,
          nodeName: '',
          lifecycleStage: lifecycleStageType,
          emissionType: '',
          carbonFactor: 0,
          quantity: '',
          activitydataSource: '',
          activityScorelevel: '',
          carbonFootprint: 0,
          unitConversion: 1,
          emissionFactorQuality: 0,
          // 添加其他必需属性的默认值
          emissionFactor: '',
          calculationMethod: '',
          verificationStatus: '未验证',
          applicableStandard: '',
          completionStatus: '未完成',
          carbonFactorName: '',
          // 添加其他可能需要的属性
          material: '',
          weight_per_unit: '',
          isRecycled: false,
          recycledContent: '',
          recycledContentPercentage: 0,
          // 添加制造节点特有的属性
          ElectricityAccountingMethod: '',
          ElectricityAllocationMethod: '',
          EnergyConsumptionMethodology: '',
          EnergyConsumptionAllocationMethod: '',
          energyConsumption: 0,
          // 添加其他可能需要的属性
          disposalMethod: '',
          recyclingRate: 0,
          landfillRate: 0,
          incinerationRate: 0,
          compostingRate: 0,
          otherDisposalRate: 0,
          disposalEmissionFactor: 0,
          disposalQuantity: 0,
          disposalCarbonFootprint: 0,
          disposalVerificationStatus: '未验证',
          disposalApplicableStandard: '',
          disposalCompletionStatus: '未完成',
          disposalEmissionFactorName: '',
          disposalCalculationMethod: '',
          disposalActivitydataSource: '',
          disposalActivityScorelevel: '',
          disposalUnitConversion: 1,
          disposalEmissionFactorQuality: 0,
          // 添加最终产品节点特有的属性
          productName: '',
          productCategory: '',
          productCarbonFootprint: 0,
          productCertificationStatus: '未认证',
          productApplicableStandard: '',
          productCompletionStatus: '未完成',
          productEmissionFactorName: '',
          productCalculationMethod: '',
          productVerificationStatus: '未验证',
          productEmissionFactor: '',
          productActivitydataSource: '',
          productActivityScorelevel: '',
          productUnitConversion: 1,
          productEmissionFactorQuality: 0,
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
        activityScorelevel: '',
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
    const HORIZONTAL_SPACING = 600;
    const VERTICAL_SPACING = 650;
    const PADDING = 400;

    // 定义节点类型的顺序（不包括最终产品节点）
    const nodeTypeOrder: NodeType[] = ['product', 'manufacturing', 'distribution', 'usage', 'disposal'];
    
    // 根据节点类型分组
    const nodesByType: Record<NodeType, Node<NodeData>[]> = {
      product: [],
      manufacturing: [],
      distribution: [],
      usage: [],
      disposal: [],
      finalProduct: [],
    };
    
    // 填充节点分组
    nodes.forEach(node => {
      const nodeType = node.type as NodeType;
      if (nodeType in nodesByType) {
        nodesByType[nodeType].push(node);
      }
    });

    // 确保有最终产品节点
    let finalProductNode = nodesByType.finalProduct[0];
    if (!finalProductNode) {
      finalProductNode = {
        id: 'final-product-1',
        type: 'finalProduct',
        position: { x: 0, y: 0 },
        data: {
          label: '最终产品',
          nodeName: 'final_product_1',
          lifecycleStage: 'finalProduct',
          emissionType: 'total',
          carbonFactor: 0,
          activitydataSource: 'calculated',
          activityScorelevel: '',
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
          finalProductName: '最终产品',
          totalCarbonFootprint: 0,
          certificationStatus: 'pending',
          environmentalImpact: '待评估',
          sustainabilityScore: 0,
          productCategory: '未分类',
          marketSegment: '未指定',
          targetRegion: '未指定',
          complianceStatus: '未验证',
          carbonLabel: '待认证',
        },
      };
      nodesByType.finalProduct.push(finalProductNode);
    }

    // 计算新的节点位置
    const newNodes = [...nodes];
    if (!nodesByType.finalProduct.length) {
      newNodes.push(finalProductNode);
    }

    // 计算所有非最终产品节点的位置
    const positionedNodes = newNodes.filter(node => node.type !== 'finalProduct').map(node => {
      const nodeType = node.type as NodeType;
      const typeIndex = nodeTypeOrder.indexOf(nodeType);
      const typeNodes = nodesByType[nodeType] || [];
      const nodeIndex = typeNodes.indexOf(node);
      
      // 计算水平位置（根据节点类型）
      const x = PADDING + typeIndex * HORIZONTAL_SPACING;
      
      // 计算垂直位置（根据同类型节点的顺序）
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

    // 计算最终产品节点的位置（放在中间正下方）
    const maxX = Math.max(...positionedNodes.map(node => node.position.x));
    const maxY = Math.max(...positionedNodes.map(node => node.position.y));
    const finalProductPosition = {
      x: maxX / 2,
      y: maxY + VERTICAL_SPACING,
    };

    // 添加最终产品节点
    const finalProductNodeWithPosition = {
      ...finalProductNode,
      position: finalProductPosition,
    };

    // 合併所有节点
    const allNodes = [...positionedNodes, finalProductNodeWithPosition];

    // 创建新的边连接
    const newEdges: Edge[] = [];
    let totalCarbonFootprint = 0;

    // 连接所有非最终产品节点到最终产品节点
    positionedNodes.forEach(node => {
      // 添加边连接
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

    // 更新最终产品节点的总碳排放量
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
    if (!nodes || nodes.length === 0) {
      setAiSummary(prev => ({
        ...prev,
        modelCompleteness: {
          score: 0,
          lifecycleCompleteness: 0,
          nodeCompleteness: 0,
          incompleteNodes: []
        },
        massBalance: {
          score: 0,
          ratio: 0,
          incompleteNodes: []
        },
        dataTraceability: {
          score: 0,
          coverage: 0,
          incompleteNodes: []
        },
        dataAccuracy: {
          score: 0,
          consistency: 0,
          incompleteNodes: []
        }
      }));
      return;
    }

    // 1. 计算模型完整性
    const lifecycle = ['原材料获取', '生产制造', '分销和储存', '产品使用', '废弃处置'];
    
    const existingStages = new Set(nodes.map(node => node.data?.lifecycleStage).filter(Boolean));
    const missingLifecycleStages = lifecycle.filter(stage => !existingStages.has(stage));
    const lifecycleCompletenessScore = ((lifecycle.length - missingLifecycleStages.length) / lifecycle.length) * 100;
    
    let totalFields = 0;
    let completedFields = 0;
    const complete_incompleteNodes: { id: string; label: string; missingFields: string[]; }[] = [];

    nodes.forEach(node => {
      const missingFields: string[] = [];
      // 根据节点类型检查不同字段
      switch (node.data.lifecycleStage) {
        case '原材料获取': {
          const productData = node.data as ProductNodeData;
     
          if (typeof productData.quantity === 'undefined' || productData.quantity === null || productData.quantity === 0) {
            totalFields++;
            missingFields.push('数量');
          } else {
            completedFields++;
            totalFields++;
          }
          if (typeof node.data.carbonFactor === 'undefined' || node.data.carbonFactor === null || node.data.carbonFactor === 0) {
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
          if (typeof node.data.carbonFactordataSource === 'undefined' || node.data.carbonFactordataSource === null || node.data.carbonFactordataSource === 0) {
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
          if (typeof node.data.carbonFactor === 'undefined' || node.data.carbonFactor === null || node.data.carbonFactor === 0) {
            totalFields++;
            missingFields.push('碳足迹因子');
          } else {
            completedFields++;
            totalFields++;
          }
          if (typeof manufacturingData.energyConsumption === 'undefined' || manufacturingData.energyConsumption === null || manufacturingData.energyConsumption === 0) {
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
          if (typeof node.data.carbonFactor === 'undefined' || node.data.carbonFactor === null || node.data.carbonFactor === 0) {
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
          if (typeof distributionData.transportationDistance === 'undefined' || distributionData.transportationDistance === null || distributionData.transportationDistance === 0) {
            totalFields++;
            missingFields.push('运输距离');
          } else {
            completedFields++;
            totalFields++;
          }
          break;
        }
      }
      
      // 只有当有缺失字段时才添加到 incompleteNodes
      if (missingFields.length > 0) {
        complete_incompleteNodes.push({
          id: node.id,
          label: node.data.label,
          missingFields: missingFields
        });
      }
    });


    // 计算模型完整度

    const NodeCompletenessScore = Math.round(((completedFields) / (totalFields+0.01)) * 100)
    const modelCompletenessScore = Math.round(0.25 * NodeCompletenessScore + 0.75 * lifecycleCompletenessScore);

    // 2. 计算质量平衡
    const mass_incompleteNodes: { id: string; label: string; missingFields: string[]; }[] = [];
    let totalInputMass = 0;
    let totalOutputMass = 0;

    nodes.forEach(node => {
      if (node.data.lifecycleStage === '原材料获取') {
        const productData = node.data as ProductNodeData;
        if (typeof productData.quantity === 'undefined' || productData.quantity === null || productData.quantity === 0) {
          mass_incompleteNodes.push({
            id: node.id,
            label: node.data.label,
            missingFields: ['数量']
          });
        } else {
          totalInputMass += productData.quantity;
        }
      }
      
      if (node.data.lifecycleStage === '最终节点') {
        const productData = node.data as ProductNodeData;
        if (typeof productData.quantity === 'undefined' || productData.quantity === null || productData.quantity === 0) {
          mass_incompleteNodes.push({
            id: node.id,
            label: node.data.label,
            missingFields: ['数量']
          });
        } else {
          totalOutputMass += productData.quantity;
        }
      }
    });



    // 计算质量平衡分数
    const errorPercentage = Math.abs(totalInputMass - totalOutputMass) / (totalInputMass || 1) * 100;
    let massBalanceScore = 100;
    if (errorPercentage > 5) {
      massBalanceScore = Math.max(0, 100 - Math.round(errorPercentage - 5));
    }

    // 3. 计算数据可追溯性
    const traceable_incompleteNodes: { id: string; label: string; missingFields: string[]; }[] = [];
    let total_traceabe_node_number = 0;
    let data_ok_traceable_node_number = 0;

    let totalCarbonFootprint = 0;
    nodes.forEach(node => {
      if (!node.data) return;
      total_traceabe_node_number++;
      if (node.data.carbonFactordataSource?.includes('数据库匹配')) {
        data_ok_traceable_node_number++;
      } else {
        traceable_incompleteNodes.push({
          id: node.id,
          label: node.data.label,
          missingFields: ['碳足迹因子数据来源']
        });
      }
    });
    console.log('total_traceabe_node_number', total_traceabe_node_number);


    const dataTraceabilityScore = Math.round((total_traceabe_node_number > 0 ? (data_ok_traceable_node_number / total_traceabe_node_number) * 100 : 0));

    // 4. 计算数据准确性
    const validation_incompleteNodes: { id: string; label: string; missingFields: string[]; }[] = [];
    let totalvalidation_node_number = 0;
    let data_ok_validation_node_number = 0;

    nodes.forEach(node => {
      if (!node.data) return;
      totalvalidation_node_number++;
      const verificationStatus = node.data.verificationStatus;
      
      if (verificationStatus === '未验证') {
        validation_incompleteNodes.push({
          id: node.id,
          label: node.data.label,
          missingFields: ['验证状态']
        });
      } else {
        data_ok_validation_node_number++;
      }
    });
    console.log('totalvalidation_node_number', totalvalidation_node_number);
    console.log('data_ok_validation_node_number', data_ok_validation_node_number);

    const validationScore = Math.round(totalvalidation_node_number > 0 ? (data_ok_validation_node_number / totalvalidation_node_number) * 100 : 0);

    // 把所有值都约束到0～100之间
    const lifecycleCompletenessScore100 = Math.round(Math.max(0, Math.min(100, lifecycleCompletenessScore)));
    const NodeCompletenessScore100 = Math.round(Math.max(0, Math.min(100, NodeCompletenessScore)));
    const massBalanceScore100 = Math.round(Math.max(0, Math.min(100, massBalanceScore)));
    const dataTraceabilityScore100 = Math.round(Math.max(0, Math.min(100, dataTraceabilityScore)));
    const validationScore100 = Math.round(Math.max(0, Math.min(100, validationScore)));

    // 计算总体可信度分数
    const credibilityScore = Math.round(
      0.1 * lifecycleCompletenessScore100 + 
      0.3 * NodeCompletenessScore100 + 
      0.1 * massBalanceScore100 + 
      0.35 * dataTraceabilityScore100 + 
      0.15 * validationScore100
    );

    // 更新 AI Summary
    setAiSummary(prev => ({
      ...prev,
      credibilityScore,
      modelCompleteness: {
        score: modelCompletenessScore,
        lifecycleCompleteness: lifecycleCompletenessScore,
        nodeCompleteness: NodeCompletenessScore,
        incompleteNodes: complete_incompleteNodes
      },
      massBalance: {
        score: massBalanceScore100,
        ratio: 0,
        incompleteNodes: mass_incompleteNodes
      },
      dataTraceability: {
        score: dataTraceabilityScore,
        coverage: dataTraceabilityScore,
        incompleteNodes: traceable_incompleteNodes
      },
      validation: {
        score: validationScore,
        consistency: 0,
        incompleteNodes: validation_incompleteNodes
      }
    }));
  }, [nodes]);

  // 添加新的 useEffect 钩子来监听 nodes 变化
  useEffect(() => {
    calculateAiSummary();
  }, [nodes, calculateAiSummary]);

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

  // AI总结展示组件
  const renderAiSummary = () => {
    const { 
      credibilityScore, 
      isExpanded,
      modelCompleteness,
      massBalance,
      dataTraceability,
      validation,
    } = aiSummary;
    
    const credibilityScorePercent = Math.round(credibilityScore);
    
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

    return (
      <div className={`ai-summary-module ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="ai-summary-header" onClick={toggleAiSummaryExpand}>
          <h4>AI工作流分析</h4>
          {isExpanded ? <UpOutlined /> : <DownOutlined />}
        </div>
        
        {isExpanded && (
          <div className="ai-summary-content">
            {/* 总分展示区 */}
            <div className="summary-score-section">
              <div className="total-score">
                <div className="score-circle" style={{ color: getScoreColor(credibilityScorePercent) }}>
                  {credibilityScorePercent}
                  <span className="score-unit">分</span>
                </div>
                <div className="score-label">总体可信度</div>
                <Tag color={getScoreColor(credibilityScorePercent)}>
                  {getScoreStatus(credibilityScorePercent)}
                </Tag>
              </div>
            </div>

            {/* 分项得分展示 */}
            <Collapse 
              defaultActiveKey={[]} 
              className="score-details-collapse"
            >
              {/* 模型完整度 */}
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
                  
                  {/* 评分总结 */}
                  <div className="score-summary">
                    <h4>评分总结</h4>
                    <div className="score-item">
                      <span>生命周期完整性:</span>
                      <span>{modelCompleteness.lifecycleCompleteness}%</span>
                    </div>
                    <div className="score-item">
                      <span>节点完整性:</span>
                      <span>{modelCompleteness.nodeCompleteness}%</span>
                    </div>
                  </div>
                  
                  {/* 需要优化的节点 */}
                  <div className="optimization-nodes">
                    <h4>需要优化的节点</h4>
                    {modelCompleteness.incompleteNodes.map(node => (
                      <div 
                        key={node.id} 
                        className="node-item"
                        onClick={() => {
                          const targetNode = nodes.find(n => n.id === node.id);
                          if (targetNode) {
                            setSelectedNode(targetNode);
                          }
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        style={{ 
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          padding: '8px',
                          borderRadius: '4px',
                        }}
                      >
                        <div className="node-header">
                          <Tag color="warning">{node.label}</Tag>
                        </div>
                        <div className="node-details">
                          <div>缺失字段:</div>
                          <div className="missing-fields">
                            {node.missingFields.map(field => (
                              <Tag key={field} color="error">{field}</Tag>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Collapse.Panel>

              {/* 质量平衡 */}
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
                  <Progress 
                    percent={massBalance.score} 
                    strokeColor={getScoreColor(massBalance.score)}
                    size="small"
                  />
                  
                  {/* 评分总结 */}
                  <div className="score-summary">
                    <h4>评分总结</h4>
                    <div className="score-item">
                      <span>平衡率:</span>
                      <span>{massBalance.ratio.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {/* 需要优化的节点 */}
                  <div className="optimization-nodes">
                    <h4>需要优化的节点</h4>
                    {massBalance.incompleteNodes.map(node => (
                      <div 
                        key={node.id} 
                        className="node-item"
                        onClick={() => {
                          const targetNode = nodes.find(n => n.id === node.id);
                          if (targetNode) {
                            setSelectedNode(targetNode);
                          }
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        style={{ 
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          padding: '8px',
                          borderRadius: '4px',
                        }}
                      >
                        <div className="node-header">
                          <Tag color="warning">{node.label}</Tag>
                        </div>
                        <div className="node-details">
                          <div>缺失字段:</div>
                          <div className="missing-fields">
                            {node.missingFields.map(field => (
                              <Tag key={field} color="error">{field}</Tag>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Collapse.Panel>

              {/* 数据可追溯性 */}
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
                  
                  {/* 评分总结 */}
                  <div className="score-summary">
                    <h4>评分总结</h4>
                    <div className="score-item">
                      <span>关键数据覆盖率:</span>
                      <span>{dataTraceability.coverage}%</span>
                    </div>
                  </div>
                  
                  {/* 需要优化的节点 */}
                  <div className="optimization-nodes">
                    <h4>需要优化的节点</h4>
                    {dataTraceability.incompleteNodes.map(node => (
                      <div 
                        key={node.id} 
                        className="node-item"
                        onClick={() => {
                          const targetNode = nodes.find(n => n.id === node.id);
                          if (targetNode) {
                            setSelectedNode(targetNode);
                          }
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        style={{ 
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          padding: '8px',
                          borderRadius: '4px',
                        }}
                      >
                        <div className="node-header">
                          <Tag color="warning">{node.label}</Tag>
                        </div>
                        <div className="node-details">
                          <div>缺失字段:</div>
                          <div className="missing-fields">
                            {node.missingFields.map(field => (
                              <Tag key={field} color="error">{field}</Tag>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Collapse.Panel>

              {/* 数据验证 */}
              <Collapse.Panel 
                header={
                  <div className="score-panel-header">
                    <span>数据准确性</span>
                    <span className="score-value" style={{ color: getScoreColor(validation.score) }}>
                      {validation.score}分
                    </span>
                  </div>
                } 
                key="validation"
              >
                <div className="score-detail-content">
                  <Progress 
                    percent={validation.score} 
                    strokeColor={getScoreColor(validation.score)}
                    size="small"
                  />
                  
                  {/* 评分总结 */}
                  <div className="score-summary">
                    <h4>评分总结</h4>
                    <div className="score-item">
                      <span>数据一致性:</span>
                      <span>{validation.consistency}%</span>
                    </div>
                  </div>
                  
                  {/* 需要优化的节点 */}
                  <div className="optimization-nodes">
                    <h4>需要优化的节点</h4>
                    {validation.incompleteNodes.map(node => (
                      <div 
                        key={node.id} 
                        className="node-item"
                        onClick={() => {
                          const targetNode = nodes.find(n => n.id === node.id);
                          if (targetNode) {
                            setSelectedNode(targetNode);
                          }
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        style={{ 
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          padding: '8px',
                          borderRadius: '4px',
                        }}
                      >
                        <div className="node-header">
                          <Tag color="warning">{node.label}</Tag>
                        </div>
                        <div className="node-details">
                          <div>缺失字段:</div>
                          <div className="missing-fields">
                            {node.missingFields.map(field => (
                              <Tag key={field} color="error">{field}</Tag>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Collapse.Panel>
            </Collapse>
          </div>
        )}
      </div>
    );
  };

  // 添加一键补全功能
  const autoCompleteMissingFields = useCallback(async () => {
    if (!nodes || nodes.length === 0) return;


    // 显示AI优化中的消息
    message.info('AI优化中...');

    // 创建一个Promise来模拟暂停
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // 等待3秒，让用户看到消息
    await sleep(3000);

    // 清除消息
    message.destroy();


    const updatedNodes = nodes.map(node => {
      const updatedData = { ...node.data };
      
      // 根据节点类型和缺失字段自动填充
      switch (node.data.lifecycleStage) {
        case '原材料获取': {
          const productData = node.data as ProductNodeData;

          if (!productData.quantity) {
            updatedData.quantity = '1'; // 默认数量为1
          }

          if (!productData.carbonFactor) {
            updatedData.carbonFactor = 0.5; // 默认碳因子
          }

          if (!productData.carbonFactorName) {
            updatedData.carbonFactorName = '默认碳因子';
          }

          if (!productData.carbonFactordataSource) {
            updatedData.carbonFactordataSource = '数据库匹配';
          }

          break;
        }

        case '生产制造': {
          const manufacturingData = node.data as ManufacturingNodeData;

          if (!manufacturingData.carbonFactor) {
            updatedData.carbonFactor = 0.3; // 默认制造碳因子
          }

          if (!manufacturingData.energyConsumption) {
            updatedData.energyConsumption = 100; // 默认能源消耗
          }

          if (!manufacturingData.energyType) {
            updatedData.energyType = '电力';
          }

          break;
        }

        case '分销和储存': {
          const distributionData = node.data as DistributionNodeData;

          if (!distributionData.carbonFactor) {
            updatedData.carbonFactor = 0.2; // 默认运输碳因子
          }

          if (!distributionData.startPoint) {
            updatedData.startPoint = '起点';
          }

          if (!distributionData.endPoint) {
            updatedData.endPoint = '终点';
          }

          if (!distributionData.transportationDistance) {
            updatedData.transportationDistance = 100; // 默认运输距离
          }

          break;
        }

        case '产品使用': {
          const usageData = node.data as UsageNodeData;

          if (!usageData.lifespan) {
            updatedData.lifespan = 5; // 默认使用寿命
          }

          if (!usageData.energyConsumptionPerUse) {
            updatedData.energyConsumptionPerUse = 0.5; // 默认每次使用能耗
          }

          if (!usageData.usageFrequency) {
            updatedData.usageFrequency = 365; // 默认每年使用次数
          }

          break;
        }

        case '废弃处置': {
          const disposalData = node.data as DisposalNodeData;

          if (!disposalData.recyclingRate) {
            updatedData.recyclingRate = 80; // 默认回收率
          }

          if (!disposalData.landfillPercentage) {
            updatedData.landfillPercentage = 10; // 默认填埋比例
          }

          if (!disposalData.incinerationPercentage) {
            updatedData.incinerationPercentage = 10; // 默认焚烧比例
          }

          break;
        }
      }


      // 更新验证状态
      const randomNumber = Math.random();

      if (randomNumber < 0.8) {
        updatedData.verificationStatus = '内部验证';
      } else {
        updatedData.verificationStatus = '未验证';
      }

      const randomNumber2 = Math.random();

      if (randomNumber2 < 0.8) {
        updatedData.carbonFactordataSource = '数据库匹配';
      } else {
        updatedData.carbonFactordataSource = 'AI补充';
      }

      if (randomNumber2 > 0.3) {
        updatedData.activityScorelevel = '高';
      } 
      else if (randomNumber2 > 0.15) {
        updatedData.activityScorelevel = '中';
      }
      else {
        updatedData.activityScorelevel = '低';
      }
      
      return {
        ...node,
        data: updatedData
      };
    
    });

    setNodes(updatedNodes);
    calculateAiSummary(); // 重新计算AI分析结果
  }, [nodes, setNodes, calculateAiSummary]);




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
            {aiSummary.isExpanded ? '收起 AI 打分' : '展开 AI 打分'}
          </Button>
          <Button 
            onClick={autoCompleteMissingFields}
            style={{ 
              backgroundColor: '#52c41a',
              color: 'white',
              marginLeft: '8px'
            }}
          >
            一键AI补全
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
          <div className="file-manager">
            <h3>节点类型</h3>
            <div className="node-types">
              {Object.entries(nodeTypeLabels).map(([type, label]) => (
                <div
                  key={type}
                  className="draggable-file"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/carbonflow', label);
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
        <div className="ai-summary-floating-container">
           {renderAiSummary()}
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
                    setNodes={setNodes}
                    setSelectedNode={setSelectedNode}
                    updateAiSummary={calculateAiSummary}
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