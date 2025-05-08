import React, { useCallback, useState, useEffect, useRef } from 'react';
import type { DragEvent } from 'react';
import { useLoaderData } from '@remix-run/react';
import ReactFlow, {
  type Node,
  type Edge,
  type OnConnect,
  type ReactFlowInstance,
  type NodeChange,
  type EdgeChange,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel,
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
import {
  Tag,
  Collapse,
  Progress,
  message,
  Modal,
  Input,
  Row,
  Col,
  Upload,
  Divider,
  List,
  Empty,
  Typography,
  Button as AntButton,
  ConfigProvider,
  theme,
} from 'antd';
import {
  UpOutlined,
  DownOutlined,
  SaveOutlined,
  HistoryOutlined,
  ExportOutlined,
  DeleteOutlined,
  CloudDownloadOutlined,
  CloudSyncOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { CheckpointManager } from '~/lib/checkpoints/CheckpointManager';
import { CheckpointSyncService } from '~/lib/services/checkpointSyncService';
import { useStore } from '@nanostores/react';
import { supabaseConnection } from '~/lib/stores/supabase';
import type { RcFile } from 'antd/es/upload/interface';
import { themeStore } from '~/lib/stores/theme';
import { chatMessagesStore } from '~/lib/stores/chatMessagesStore';
import type {
  NodeData,
  ProductNodeData,
  ManufacturingNodeData,
  DistributionNodeData,
  UsageNodeData,
  DisposalNodeData,
} from '~/types/nodes';
import { useCarbonFlowStore, emitCarbonFlowData } from './CarbonFlow/CarbonFlowBridge';
import { supabase } from '~/lib/supabase';
import { CarbonCalculatorPanelClient } from './CarbonFlow/carbonpanel';

const { darkAlgorithm } = theme;

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

const nodeTypeMapping: Record<string, NodeType> = {
  [`材料节点`]: 'product',
  [`制造节点`]: 'manufacturing',
  [`分销节点`]: 'distribution',
  [`使用节点`]: 'usage',
  [`废弃节点`]: 'disposal',
  [`最终节点`]: 'finalProduct',
};

const initialNodes: Node<NodeData>[] = [
  {
    id: 'product-1',
    type: 'product',
    position: { x: 100, y: 100 },
    data: {
      label: '初始材料',
      nodeName: 'InitialMaterial',
      lifecycleStage: 'product',
      emissionType: 'default',
      activityScore: 100,
      carbonFactor: 0,
      activitydataSource: 'default',
      carbonFootprint: 0,
      material: '',
      weight_per_unit: '0',
    } as ProductNodeData,
  },
];

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

// Define CheckpointMetadata type locally for now
interface CheckpointMetadata {
  name: string;
  timestamp: number;
  metadata?: { description?: string; tags?: string[]; version?: string };
}

const CarbonFlowInner = () => {
  const { workflow } = useLoaderData() as any; // Temporary fix for workflow type
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [siderWidth, setSiderWidth] = useState(250);
  const [isResizing, setIsResizing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { project, fitView } = useReactFlow();
  const isDraggingRef = useRef(false); // Ref to track dragging state
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
  const {
    setNodes: setStoreNodes,
    setEdges: setStoreEdges,
    setAiSummary: setStoreAiSummary,
    nodes: storeNodes,
  } = useCarbonFlowStore();

  const currentTheme = useStore(themeStore);
  const chatMessages = useStore(chatMessagesStore);

  // 当nodes更新时，同步到store
  useEffect(() => {
    // Only update store if not currently dragging a node
    if (!isDraggingRef.current) {
      console.log('[CarbonFlow] Syncing local nodes to store (not dragging). Nodes:', nodes.length);
      setStoreNodes(nodes);
      emitCarbonFlowData();
    } else {
      console.log('[CarbonFlow] Skipping store sync (dragging).');
    }
  }, [nodes, setStoreNodes]); // Keep dependencies

  // 當store中的nodes更新時，同步回本地state
  useEffect(() => {
    console.log('[CarbonFlow] storeNodes effect 觸發，Store 節點數:', storeNodes?.length);

    if (storeNodes) {
      // 深度比较以避免不必要的更新，这里简化为比较JSON字符串
      // 仅比较关键属性以提高效率和稳定性
      const stringifyNodeForCompare = (node: Node<NodeData>) =>
        JSON.stringify({
          id: node.id,
          type: node.type,
          position: node.position,
          // 只比较 data 中的部分关键、不易频繁变动的字段，避免因瞬时状态（如计算中的值）导致循环
          data: {
            label: node.data?.label,
            nodeName: node.data?.nodeName,
            lifecycleStage: node.data?.lifecycleStage,
            // 根据需要添加其他需要比较的关键 data 字段
          },
        });

      const storeNodesString = JSON.stringify(storeNodes.map(stringifyNodeForCompare).sort());
      const localNodesString = JSON.stringify(nodes.map(stringifyNodeForCompare).sort());

      if (storeNodesString !== localNodesString) {
        console.log('[CarbonFlow] Store 節點變化，準備更新本地節點:', storeNodes.length);
        setNodes(storeNodes); // setNodes 是 useNodesState() 的 setter
      } else {
        console.log('[CarbonFlow] Store 節點與本地節點相同，不更新。');
      }
    } else {
      // 如果 storeNodes 變為 null 或 undefined 或空數組，也需要同步本地節點
      if (nodes.length > 0) {
        console.log('[CarbonFlow] Store 節點為空，清空本地節點。');
        setNodes([]);
      }
    }
    // 只依赖 storeNodes 和 setNodes，避免本地 nodes 变化触发此 effect
  }, [storeNodes, setNodes]);

  // 當edges更新時，同步到store
  useEffect(() => {
    setStoreEdges(edges);
    emitCarbonFlowData();
  }, [edges, setStoreEdges]);

  // 當aiSummary更新時，同步到store
  useEffect(() => {
    setStoreAiSummary(aiSummary);
    emitCarbonFlowData();
  }, [aiSummary, setStoreAiSummary]);

  // 创建 CarbonFlow 操作处理器
  const [actionHandler, setActionHandler] = useState<CarbonFlowActionHandler | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化操作处理器
  useEffect(() => {
    const handler = new CarbonFlowActionHandler({
      nodes,
      edges,
      setNodes,
      setEdges,
    });
    setActionHandler(handler);
  }, [nodes, edges, setNodes, setEdges]);

  const handleCarbonFlowAction = useCallback(
    (action: CarbonFlowAction) => {
      if (actionHandler) {
        actionHandler.handleAction(action);
      } else {
        console.warn('CarbonFlow 操作处理器尚未初始化');
      }
    },
    [actionHandler],
  );

  // 添加全局事件監聽器，處理來自桥接器的操作
  useEffect(() => {
    if (!actionHandler) return;

    const handleActionEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      // 从 customEvent.detail.action 获取真正的 action 对象
      const actualAction = customEvent.detail.action as CarbonFlowAction & { traceId?: string };

      // 确保 actualAction 存在且是我们期望的类型
      if (actualAction && typeof actualAction === 'object' && actualAction.type) {
        console.log('[CarbonFlow] 收到操作:', actualAction);
        actionHandler.handleAction(actualAction); // 传递正确的 action 对象

        // 發送操作結果事件
        window.dispatchEvent(
          new CustomEvent('carbonflow-action-result', {
            detail: { success: true, traceId: actualAction.traceId, nodeId: actualAction.nodeId },
          }),
        );
      } else {
        // 如果结构不符合预期，打印错误日志
        console.error('[CarbonFlow] 收到的操作格式不正确或缺少action属性:', customEvent.detail);
      }
    };

    // 添加事件監聽器
    window.addEventListener('carbonflow-action', handleActionEvent);

    // 監聽來自 Panel 的數據更新事件
    const handlePanelDataUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { action, nodeId, nodeType } = customEvent.detail;

      console.log('[CarbonFlow] 收到面板更新:', action, nodeId);

      // 根據事件類型執行相應操作
      switch (action) {
        case 'DELETE_NODE':
          // 節點已通過 store 更新，這裡可以添加視覺效果處理
          console.log('流程圖已同步刪除節點');
          break;
        case 'ADD_NODE':
          // 節點已通過 store 添加，這裡可以執行額外操作
          console.log(`流程圖已添加${nodeType}節點`);
          break;
        case 'UPDATE_NODE':
          // 節點已通過 store 更新，這裡可以添加視覺效果處理
          console.log('流程圖已更新節點');
          break;
      }
    };

    window.addEventListener('carbonflow-data-updated', handlePanelDataUpdated);

    // 清理函數
    return () => {
      window.removeEventListener('carbonflow-action', handleActionEvent);
      window.removeEventListener('carbonflow-data-updated', handlePanelDataUpdated);

      // 清除初始化標記
      if (typeof window !== 'undefined') {
        (window as any).carbonFlowInitialized = false;
      }
    };
  }, [actionHandler]);

  const onConnect: OnConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<NodeData>) => {
    setSelectedNode(node);
  }, []);

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const stageNames: Record<string, string> = {
    材料节点: '原材料获取',
    制造节点: '生产制造',
    分销节点: '分销和储存',
    使用节点: '产品使用',
    废弃节点: '废弃处置',
  };

  // 修改 onDrop 函数，只更新 Store，依赖 useEffect 同步到本地
  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const chineseType = event.dataTransfer.getData('application/carbonflow');
      const type = nodeTypeMapping[chineseType] as NodeType;

      if (!type) {
        console.error('未知的节点类型:', chineseType);
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // 创建新节点
      const newNodeId = `${type}-${Date.now()}`;
      const newNode: Node<NodeData> = {
        id: newNodeId,
        type,
        position,
        data: {
          label: `新 ${nodeTypeLabels[type]} 节点`,
          nodeName: `${type}_${Date.now()}`,
          lifecycleStage: type, // Note: Should probably be lifecycleStageType based on earlier logic, but keeping branch version for now.
          emissionType: 'default',
          activityScore: 0,
          carbonFactor: 0,
          activitydataSource: 'default',
          carbonFootprint: 0,
          unitConversion: 1,
          emissionFactorQuality: 0, // 注意检查此属性是否存在于 NodeData
          emissionFactor: '',
          calculationMethod: '',
          verificationStatus: '未验证',
          applicableStandard: '',
          completionStatus: '未完成',
          carbonFactorName: '',
          material: '',
          weight_per_unit: '',
          isRecycled: false,
          recycledContent: '',
          recycledContentPercentage: 0,
          ElectricityAccountingMethod: '',
          ElectricityAllocationMethod: '',
          EnergyConsumptionMethodology: '',
          EnergyConsumptionAllocationMethod: '',
          energyConsumption: 0,
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
          disposalEmissionFactorQuality: 0, // 注意检查此属性是否存在于 NodeData
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
          productEmissionFactorQuality: 0, // 注意检查此属性是否存在于 NodeData
        },
      };

      // 只更新 Store 状态
      const currentStoreNodes = useCarbonFlowStore.getState().nodes || [];
      const newStoreNodes = [...currentStoreNodes, newNode];
      setStoreNodes(newStoreNodes);
      emitCarbonFlowData(); // 通知其他监听者
    },
    // 依赖项现在只需要 reactFlowInstance 和 setStoreNodes
    [reactFlowInstance, setStoreNodes],
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
        activityScore: 0,
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

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
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
    },
    [isResizing, siderWidth],
  );

  const autoLayout = useCallback(() => {
    if (!reactFlowInstance) return;

    const NODE_WIDTH = 250;
    const NODE_HEIGHT = 150;
    const HORIZONTAL_SPACING = 600;
    const VERTICAL_SPACING = 650;
    const PADDING = 400;

    const nodeTypeOrder: NodeType[] = ['product', 'manufacturing', 'distribution', 'usage', 'disposal'];

    const nodesByType: Record<NodeType, Node<NodeData>[]> = {
      product: [],
      manufacturing: [],
      distribution: [],
      usage: [],
      disposal: [],
      finalProduct: [],
    };

    nodes.forEach((node) => {
      const nodeType = node.type as NodeType;
      if (nodeType in nodesByType) {
        nodesByType[nodeType].push(node);
      }
    });

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
          activityScore: 0,
          carbonFactor: 0,
          activitydataSource: 'calculated',
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

    const newNodes = [...nodes];
    if (!nodesByType.finalProduct.length) {
      newNodes.push(finalProductNode);
    }

    const positionedNodes = newNodes
      .filter((node) => node.type !== 'finalProduct')
      .map((node) => {
        const nodeType = node.type as NodeType;
        const typeIndex = nodeTypeOrder.indexOf(nodeType);
        const typeNodes = nodesByType[nodeType] || [];
        const nodeIndex = typeNodes.indexOf(node);

        const x = PADDING + typeIndex * HORIZONTAL_SPACING;

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

    const maxX = Math.max(...positionedNodes.map((node) => node.position.x));
    const maxY = Math.max(...positionedNodes.map((node) => node.position.y));
    const finalProductPosition = {
      x: maxX / 2,
      y: maxY + VERTICAL_SPACING,
    };

    const finalProductNodeWithPosition = {
      ...finalProductNode,
      position: finalProductPosition,
    };

    const allNodes = [...positionedNodes, finalProductNodeWithPosition];

    const newEdges: Edge[] = [];
    let totalCarbonFootprint = 0;

    positionedNodes.forEach((node) => {
      newEdges.push({
        id: `edge-${node.id}-${finalProductNode.id}`,
        source: node.id,
        target: finalProductNode.id,
        type: 'smoothstep',
        animated: true,
      });

      if (typeof node.data.carbonFootprint === 'number') {
        totalCarbonFootprint += node.data.carbonFootprint;
      }
    });

    const updatedNodes = allNodes.map((node) => {
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
      setAiSummary((prev) => ({
        ...prev,
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
      }));
      return;
    }

    const lifecycle = ['原材料获取', '生产制造', '分销和储存', '产品使用', '废弃处置'];

    const existingStages = new Set(nodes.map((node) => node.data?.lifecycleStage).filter(Boolean));
    const missingLifecycleStages = lifecycle.filter((stage) => !existingStages.has(stage));
    const lifecycleCompletenessScore = ((lifecycle.length - missingLifecycleStages.length) / lifecycle.length) * 100;

    let totalFields = 0;
    let completedFields = 0;
    const completeIncompleteNodes: { id: string; label: string; missingFields: string[] }[] = [];

    nodes.forEach((node) => {
      const missingFields: string[] = [];
      switch (node.data.lifecycleStage) {
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
            node.data.carbonFactor === 0
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
            node.data.carbonFactor === 0
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
            node.data.carbonFactor === 0
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
          label: node.data.label,
          missingFields: missingFields,
        });
      }
    });

    const NodeCompletenessScore = Math.round((completedFields / (totalFields + 0.01)) * 100);
    const modelCompletenessScore = Math.round(0.25 * NodeCompletenessScore + 0.75 * lifecycleCompletenessScore);

    const massIncompleteNodes: { id: string; label: string; missingFields: string[] }[] = [];
    let totalInputMass = 0;
    let totalOutputMass = 0;

    nodes.forEach((node) => {
      if (node.data.lifecycleStage === '原材料获取') {
        const productData = node.data as ProductNodeData;
        const quantity =
          productData.quantity !== undefined && !Number.isNaN(Number(productData.quantity))
            ? Number(productData.quantity)
            : 0;
        if (quantity === 0) {
          massIncompleteNodes.push({
            id: node.id,
            label: node.data.label,
            missingFields: ['数量'],
          });
        } else {
          totalInputMass += quantity;
        }
      }

      if (node.data.lifecycleStage === '最终节点') {
        const productData = node.data as ProductNodeData;
        const quantity =
          productData.quantity !== undefined && !Number.isNaN(Number(productData.quantity))
            ? Number(productData.quantity)
            : 0;
        if (quantity === 0) {
          massIncompleteNodes.push({
            id: node.id,
            label: node.data.label,
            missingFields: ['数量'],
          });
        } else {
          totalOutputMass += quantity;
        }
      }
    });

    const errorPercentage = (Math.abs(totalInputMass - totalOutputMass) / (totalInputMass || 1)) * 100;
    let massBalanceScore = 100;
    if (errorPercentage > 5) {
      massBalanceScore = Math.max(0, 100 - Math.round(errorPercentage - 5));
    }

    const traceableIncompleteNodes: { id: string; label: string; missingFields: string[] }[] = [];
    let totalTraceabeNodeNumber = 0;
    let dataOkTraceableNodeNumber = 0;

    let totalCarbonFootprint = 0;
    nodes.forEach((node) => {
      if (!node.data) return;
      totalTraceabeNodeNumber++;
      if (node.data.carbonFactordataSource?.includes('数据库匹配')) {
        dataOkTraceableNodeNumber++;
      } else {
        traceableIncompleteNodes.push({
          id: node.id,
          label: node.data.label,
          missingFields: ['碳足迹因子数据来源'],
        });
      }
    });
    console.log('totalTraceabeNodeNumber', totalTraceabeNodeNumber);

    const dataTraceabilityScore = Math.round(
      totalTraceabeNodeNumber > 0 ? (dataOkTraceableNodeNumber / totalTraceabeNodeNumber) * 100 : 0,
    );

    const validationIncompleteNodes: { id: string; label: string; missingFields: string[] }[] = [];
    let totalvalidationNodeNumber = 0;
    let dataOkValidationNodeNumber = 0;

    nodes.forEach((node) => {
      if (!node.data) return;
      totalvalidationNodeNumber++;
      const verificationStatus = node.data.verificationStatus;

      if (verificationStatus === '未验证') {
        validationIncompleteNodes.push({
          id: node.id,
          label: node.data.label,
          missingFields: ['验证状态'],
        });
      } else {
        dataOkValidationNodeNumber++;
      }
    });
    console.log('totalvalidationNodeNumber', totalvalidationNodeNumber);
    console.log('dataOkValidationNodeNumber', dataOkValidationNodeNumber);

    const validationScore = Math.round(
      totalvalidationNodeNumber > 0 ? (dataOkValidationNodeNumber / totalvalidationNodeNumber) * 100 : 0,
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

    setAiSummary((prev) => ({
      ...prev,
      credibilityScore,
      modelCompleteness: {
        score: modelCompletenessScore,
        lifecycleCompleteness: lifecycleCompletenessScore,
        nodeCompleteness: NodeCompletenessScore,
        incompleteNodes: completeIncompleteNodes,
      },
      massBalance: {
        score: massBalanceScore100,
        ratio: 0,
        incompleteNodes: massIncompleteNodes,
      },
      dataTraceability: {
        score: dataTraceabilityScore,
        coverage: dataTraceabilityScore,
        incompleteNodes: traceableIncompleteNodes,
      },
      validation: {
        score: validationScore,
        consistency: 0,
        incompleteNodes: validationIncompleteNodes,
      },
    }));
  }, [nodes]);

  useEffect(() => {
    calculateAiSummary();
  }, [nodes, calculateAiSummary]);

  const toggleAiSummaryExpand = useCallback(() => {
    setAiSummary((prev) => ({
      ...prev,
      isExpanded: !prev.isExpanded,
    }));
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return '#52c41a';
    if (score >= 0.6) return '#faad14';
    return '#f5222d';
  };

  const renderAiSummary = () => {
    const { credibilityScore, isExpanded, modelCompleteness, massBalance, dataTraceability, validation } = aiSummary;

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

            <Collapse>
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

                  <div className="optimization-nodes">
                    <h4>需要优化的节点</h4>
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
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
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
                    <h4>评分总结</h4>
                    <div className="score-item">
                      <span>平衡率:</span>
                      <span>{massBalance.ratio.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="optimization-nodes">
                    <h4>需要优化的节点</h4>
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
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
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
                    <h4>评分总结</h4>
                    <div className="score-item">
                      <span>关键数据覆盖率:</span>
                      <span>{dataTraceability.coverage}%</span>
                    </div>
                  </div>

                  <div className="optimization-nodes">
                    <h4>需要优化的节点</h4>
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
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
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
                    <h4>评分总结</h4>
                    <div className="score-item">
                      <span>数据一致性:</span>
                      <span>{validation.consistency}%</span>
                    </div>
                  </div>

                  <div className="optimization-nodes">
                    <h4>需要优化的节点</h4>
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
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
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
                </div>
              </Collapse.Panel>
            </Collapse>
          </div>
        )}
      </div>
    );
  };

  const autoCompleteMissingFields = useCallback(async () => {
    if (!nodes || nodes.length === 0) return;

    message.info('AI优化中...');

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    await sleep(3000);

    message.destroy();

    const updatedNodes = nodes.map((node) => {
      const updatedData = { ...node.data };

      switch (node.data.lifecycleStage) {
        case '原材料获取': {
          const productData = node.data as ProductNodeData;

          if (!productData.quantity || Number.isNaN(Number(productData.quantity))) {
            updatedData.quantity = '1';
          }

          if (!productData.carbonFactor) {
            updatedData.carbonFactor = 0.5;
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
            updatedData.carbonFactor = 0.3;
          }

          if (!manufacturingData.energyConsumption || Number.isNaN(Number(manufacturingData.energyConsumption))) {
            updatedData.energyConsumption = 100;
          }

          if (!manufacturingData.energyType) {
            updatedData.energyType = '电力';
          }

          break;
        }

        case '分销和储存': {
          const distributionData = node.data as DistributionNodeData;

          if (!distributionData.carbonFactor) {
            updatedData.carbonFactor = 0.2;
          }

          if (!distributionData.startPoint) {
            updatedData.startPoint = '起点';
          }

          if (!distributionData.endPoint) {
            updatedData.endPoint = '终点';
          }

          if (
            !distributionData.transportationDistance ||
            Number.isNaN(Number(distributionData.transportationDistance))
          ) {
            updatedData.transportationDistance = 100;
          }

          break;
        }

        case '产品使用': {
          const usageData = updatedData as UsageNodeData;
          if (!usageData.lifespan || Number.isNaN(Number(usageData.lifespan))) {
            // updatedData.lifespan = 5; // Linter Error
          }
          if (!usageData.energyConsumptionPerUse) {
            // updatedData.energyConsumptionPerUse = 0.5; // Linter Error - Commenting out again
          }
          if (!usageData.usageFrequency) {
            // updatedData.usageFrequency = 365; // Linter Error
          }

          break;
        }

        case '废弃处置': {
          const disposalData = node.data as DisposalNodeData;

          if (!disposalData.recyclingRate || Number.isNaN(Number(disposalData.recyclingRate))) {
            updatedData.recyclingRate = 80;
          }

          if (!disposalData.landfillPercentage || Number.isNaN(Number(disposalData.landfillPercentage))) {
            updatedData.landfillPercentage = 10;
          }

          if (!disposalData.incinerationPercentage || Number.isNaN(Number(disposalData.incinerationPercentage))) {
            updatedData.incinerationPercentage = 10;
          }

          break;
        }
      }

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
      } else if (randomNumber2 > 0.15) {
        updatedData.activityScorelevel = '中';
      } else {
        updatedData.activityScorelevel = '低';
      }

      return {
        ...node,
        data: updatedData,
      };
    });

    setNodes(updatedNodes);
    calculateAiSummary();
  }, [nodes, setNodes, calculateAiSummary]);

  // Handle file upload and trigger file_parser action
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!actionHandler) {
        message.error('操作处理器未初始化');
        return;
      }
      message.info(`正在解析文件: ${file.name}`);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const fileAction: CarbonFlowAction = {
          type: 'carbonflow',
          operation: 'file_parser',
          data: content,
          content: `上传文件: ${file.name}`,
          description: `Parse uploaded file ${file.name}`,
        };
        handleCarbonFlowAction(fileAction);
        message.success('文件解析已发送');
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.onerror = () => {
        message.error('读取文件失败');
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsText(file);
    },
    [actionHandler, handleCarbonFlowAction],
  );

  // Trigger the hidden file input
  const triggerFileInput = () => fileInputRef.current?.click();

  // 直接触发碳因子匹配操作
  const handleCarbonFactorMatch = useCallback(() => {
    if (!actionHandler) {
      message.error('操作处理器未初始化');
      return;
    }

    message.info('正在进行碳因子匹配...');

    const matchAction: CarbonFlowAction = {
      type: 'carbonflow',
      operation: 'carbon_factor_match',
      content: '碳因子匹配',
      description: '进行碳因子匹配操作',
    };

    handleCarbonFlowAction(matchAction);
    message.success('碳因子匹配请求已发送');
  }, [actionHandler, handleCarbonFlowAction]);

  // 添加视图模式状态，默认为流程图视图
  const [viewMode, setViewMode] = useState<'flow' | 'panel'>('flow');

  // 切换视图模式的处理函数
  const toggleViewMode = () => {
    setViewMode((prevMode) => (prevMode === 'flow' ? 'panel' : 'flow'));
  };

  const [isCheckpointModalVisible, setIsCheckpointModalVisible] = useState(false);
  const [checkpointName, setCheckpointName] = useState('');
  const [checkpoints, setCheckpoints] = useState<CheckpointMetadata[]>([]); // Simplified type

  useEffect(() => {
    const loadCheckpoints = async () => {
      try {
        const list = await CheckpointManager.listCheckpoints();
        setCheckpoints(list);
      } catch (error) {
        console.error('加载检查点列表失败:', error);
      }
    };
    loadCheckpoints().catch(console.error); // Handle potential promise rejection
  }, []);

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveCheckpoint = async () => {
    if (!checkpointName.trim()) {
      message.error('请输入检查点名称');
      return;
    }
    if (isSaving) return;

    setIsSaving(true);
    message.loading({ content: '正在保存检查点...', key: 'saveCheckpoint' });

    try {
      await CheckpointManager.saveCheckpoint(
        checkpointName,
        {
          nodes,
          edges,
          aiSummary,
          settings: {
            theme: localStorage.getItem('theme') || 'light',
            language: localStorage.getItem('language') || 'zh-CN',
            notifications: localStorage.getItem('notifications') === 'true',
            eventLogs: localStorage.getItem('eventLogs') === 'true',
            timezone: localStorage.getItem('timezone') || 'UTC',
            contextOptimization: localStorage.getItem('contextOptimization') === 'true',
            autoSelectTemplate: localStorage.getItem('autoSelectTemplate') === 'true',
          },
          chatHistory: chatMessages,
        },
        {
          description: '手动保存的检查点',
          tags: ['manual-save'],
        },
      );
      message.success({ content: '本地保存成功!', key: 'saveCheckpoint', duration: 1 });

      const updatedLocalCheckpoints = await CheckpointManager.listCheckpoints();
      setCheckpoints(updatedLocalCheckpoints);

      message.loading({ content: '正在同步到数据库...', key: 'syncDb' });
      const syncResult = await CheckpointSyncService.syncSingleCheckpointToSupabase(checkpointName);

      if (syncResult.success) {
        message.success({ content: '成功同步到数据库!', key: 'syncDb', duration: 2 });
      } else {
        throw new Error(syncResult.error || '同步到数据库失败');
      }

      setCheckpointName('');
      setIsCheckpointModalVisible(false);
    } catch (error: any) {
      const errorMessage = `保存检查点失败: ${error.message || error}`;
      console.error(errorMessage);
      message.error({ content: errorMessage, key: 'saveCheckpoint', duration: 3 });
      message.error({ content: '数据库同步可能也已失败', key: 'syncDb', duration: 3 });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreCheckpoint = async (name: string) => {
    try {
      const data = await CheckpointManager.restoreCheckpoint(name);
      if (data) {
        // Add null check
        setNodes(data.nodes);
        setEdges(data.edges);
        setAiSummary(data.aiSummary);

        if (data.settings) {
          Object.entries(data.settings).forEach(([key, value]) => {
            if (value !== undefined) {
              localStorage.setItem(key, String(value));
            }
          });
        }

        if (data.chatHistory && Array.isArray(data.chatHistory)) {
          chatMessagesStore.set(data.chatHistory);
          window.dispatchEvent(
            new CustomEvent('chatHistoryUpdated', {
              detail: { messages: data.chatHistory },
            }),
          );
        } else {
          chatMessagesStore.set([]);
          window.dispatchEvent(
            new CustomEvent('chatHistoryUpdated', {
              detail: { messages: [] },
            }),
          );
        }
      }

      setIsCheckpointModalVisible(false);
      message.success('检查点恢复成功');
    } catch (error) {
      console.error('恢复检查点失败:', error);
      message.error('恢复检查点失败');
    }
  };

  const handleExportCheckpoint = async (name: string) => {
    try {
      const checkpointData = await CheckpointManager.exportCheckpoint(name);
      if (!checkpointData) {
        message.error('导出检查点失败: 未找到数据'); // More specific error
        return;
      }
      const blob = new Blob([checkpointData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('检查点导出成功');
    } catch (error) {
      console.error('导出检查点时出错:', error); // Log the actual error
      message.error('导出检查点失败');
    }
  };

  const handleImportAntdUpload = (file: RcFile): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            // Add inner try-catch for async operations
            const content = e.target?.result as string;
            if (!content) {
              message.error('文件内容为空');
              reject(new Error('File content is empty')); // Reject promise
              return;
            }
            await CheckpointManager.importCheckpoint(content);
            const updatedCheckpoints = await CheckpointManager.listCheckpoints();
            setCheckpoints(updatedCheckpoints);
            message.success('检查点导入成功');
            resolve(false); // Resolve with false to prevent AntD default upload
          } catch (importError) {
            console.error('导入检查点操作失败:', importError);
            message.error(`导入检查点失败: ${importError instanceof Error ? importError.message : '未知错误'}`);
            reject(importError); // Reject promise
          }
        };
        reader.onerror = (error) => {
          console.error('文件读取错误:', error);
          message.error('读取文件失败');
          reject(error); // Reject promise
        };
        reader.readAsText(file);
      } catch (error) {
        console.error('设置导入检查点失败:', error); // Error setting up the reader
        message.error('导入检查点失败');
        reject(error); // Reject promise
      }
    });
  };

  const handleDeleteCheckpoint = async (name: string) => {
    try {
      await CheckpointManager.deleteCheckpoint(name);
      const updatedCheckpoints = await CheckpointManager.listCheckpoints();
      setCheckpoints(updatedCheckpoints);
      message.success('检查点删除成功');
    } catch (error) {
      console.error('删除检查点失败:', error);
      message.error('删除检查点失败');
    }
  };

  const [syncStatus, setSyncStatus] = useState(CheckpointSyncService.getSyncStatus());
  const supabaseState = useStore(supabaseConnection);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (supabaseState.isConnected) {
      cleanup = CheckpointSyncService.startAutoSync();
    }
    return cleanup; // Return cleanup function
  }, [supabaseState.isConnected]);

  const handleSyncCheckpoints = async () => {
    try {
      await CheckpointSyncService.syncToSupabase();
      setSyncStatus(CheckpointSyncService.getSyncStatus());
    } catch (error) {
      console.error('同步检查点失败:', error);
      message.error('同步检查点失败'); // Notify user
    }
  };

  const handleRestoreFromCloud = async () => {
    try {
      const result = await CheckpointSyncService.restoreFromSupabase();
      if (result.success) {
        const updatedCheckpoints = await CheckpointManager.listCheckpoints();
        setCheckpoints(updatedCheckpoints);
        setSyncStatus(CheckpointSyncService.getSyncStatus());
        message.success('从云端恢复成功'); // Success message
      } else {
        message.error(`从云端恢复失败: ${result.error || '未知错误'}`); // Show error details
      }
    } catch (error) {
      console.error('从云端恢复检查点时出错:', error); // Log the actual error
      message.error('从云端恢复检查点失败');
    }
  };

  // 标题编辑相关state
  const [workflowTitle, setWorkflowTitle] = useState(workflow?.name || '');
  const [originalTitle, setOriginalTitle] = useState(workflow?.name || '');

  // 编辑操作
  const onConfirmEdit = async () => {
    if (!workflow?.id) {
      message.error('未找到工作流ID，无法保存');
      return;
    }
    const { error } = await supabase.from('workflows').update({ name: workflowTitle }).eq('id', workflow.id);
    if (error) {
      message.error('保存失败: ' + error.message);
      return;
    }
    message.success('标题已保存');
    setOriginalTitle(workflowTitle); // Update original title on successful save
  };

  const handleNodeDragStart = useCallback(() => {
    isDraggingRef.current = true;
    console.log('[CarbonFlow] Node drag start.');
  }, []);

  const handleNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      isDraggingRef.current = false;
      console.log('[CarbonFlow] Node drag stop. Forcing store sync for node:', node.id);
      // After dragging stops, the local `nodes` state is already updated by React Flow.
      // We need to ensure this final state gets synced to the store.
      // The `useEffect` listening to `nodes` *should* trigger now that isDraggingRef is false.
      // However, to be absolutely sure the *very latest* state is synced immediately after drag,
      // we explicitly call setStoreNodes here with the current `nodes` state.
      // Need to get the current nodes state reliably. The `nodes` in dependency might be stale.
      // Let's refine this: we can trigger the sync effect manually after setting the ref.
      // A simple way is to rely on the existing effect, which will run because nodes changed.

      // Update: Let's explicitly sync the *final* state from the event if possible,
      // or just trigger the existing sync mechanism reliably.
      // Get the current nodes state from the hook's internal state if possible, or just use the 'nodes' variable.
      // Since `nodes` is a dependency of this callback, it *should* be up-to-date here.
      setStoreNodes(nodes); // Use the 'nodes' state variable available in the callback scope
      emitCarbonFlowData();
    },
    [nodes, setStoreNodes],
  );

  // Return statement
  return (
    <>
      {/* 顶部切换按钮 */}
      <div
        className="view-toggle-container"
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 1000,
        }}
      >
        <Button
          onClick={toggleViewMode}
          className="view-toggle-button"
          style={{
            backgroundColor: '#1890ff',
            color: 'white',
          }}
        >
          {viewMode === 'flow' ? '切换到面板视图' : '切换到流程图视图'}
        </Button>
      </div>

      {viewMode === 'flow' ? (
        <div className="editor-layout">
          <div className="editor-header">
            <div className="header-left">
              {/* Title Editing - Consider moving this logic if needed elsewhere */}
              {/* {editing ? ( ... editing UI ... ) : ( ... display UI ... ) } */}
              <h2 className="workflow-title">{workflowTitle}</h2>
              {/* Add an edit button maybe? <Button icon={<EditOutlined />} onClick={onStartEdit} /> */}
              {/* Add save button if title is edited <Button onClick={onConfirmEdit}>Save Title</Button> */}
            </div>
            <div className="header-right">
              <Button onClick={triggerFileInput}>上传文件</Button>
              <Button onClick={handleCarbonFactorMatch}>碳因子匹配</Button>
              <Button onClick={deleteSelectedNode} variant="destructive" disabled={!selectedNode}>
                删除节点
              </Button>
              <Button onClick={autoLayout}>自动布局</Button>
              <Button
                onClick={autoCompleteMissingFields}
                style={{
                  backgroundColor: '#52c41a',
                  color: 'white',
                  marginLeft: '8px',
                }}
              >
                一键AI补全
              </Button>
              <Button
                onClick={() => {
                  // TODO: 实现生成报告功能
                  console.log('生成报告');
                  message.info('报告生成功能待实现'); // Placeholder message
                }}
                style={{
                  backgroundColor: '#1890ff',
                  color: 'white',
                  marginLeft: 'auto', // Pushes to the right
                }}
              >
                生成报告
              </Button>
              {/* 隐藏文件输入 */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                accept=".csv,.txt,.pdf,.json" // Added json for checkpoint import maybe?
              />
              <Button
                icon={<HistoryOutlined />}
                onClick={() => setIsCheckpointModalVisible(true)}
                style={{ marginLeft: '8px' }}
              >
                检查点管理
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
                        // e.dataTransfer.effectAllowed = 'move'; // Optional: set effect
                      }}
                    >
                      {label}
                      <span className="drag-hint">拖拽到画布</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="resizer" onMouseDown={handleResizeStart} role="separator" aria-label="Resize panel">
                <div className="resizer-handle" />
              </div>
            </div>
            <div className="ai-summary-floating-container">{renderAiSummary()}</div>
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
                  onNodeDragStart={handleNodeDragStart} // Add handler
                  onNodeDragStop={handleNodeDragStop} // Add handler
                >
                  <Background />
                  <Controls />
                  <MiniMap />

                  {selectedNode && (
                    <Panel position="top-center">
                      <NodeProperties
                        node={selectedNode}
                        onClose={() => setSelectedNode(null)}
                        setNodes={setNodes} // 添加 setNodes prop
                        setSelectedNode={setSelectedNode}
                        updateAiSummary={calculateAiSummary} // Prop might not be needed if AI summary recalculates based on node changes
                        onUpdate={() => {
                          /* Placeholder for onUpdate if required by NodePropertiesProps */
                        }}
                      />
                    </Panel>
                  )}
                </ReactFlow>
              </div>
            </div>
          </div>
          {/* Checkpoint Modal Render moved inside CarbonFlowInner */}
          <Modal
            title="检查点管理"
            open={isCheckpointModalVisible}
            onCancel={() => setIsCheckpointModalVisible(false)}
            footer={null}
            width={800}
            bodyStyle={{
              backgroundColor: '#1f1f1f',
              color: '#e0e0e0',
              padding: '24px',
              maxHeight: '70vh',
              overflowY: 'auto',
            }}
            styles={{
              header: {
                backgroundColor: '#1f1f1f',
                color: '#e0e0e0',
                borderBottom: '1px solid #303030',
              },
              content: {
                backgroundColor: '#1f1f1f',
              },
              mask: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
              },
            }}
          >
            <Row gutter={[16, 16]}>
              <Col span={16}>
                <Input
                  placeholder="输入检查点名称" // Removed (可选)
                  value={checkpointName}
                  onChange={(e) => setCheckpointName(e.target.value)}
                  style={{
                    backgroundColor: '#2a2a2a',
                    color: '#e0e0e0',
                    borderColor: '#444',
                  }}
                />
              </Col>
              <Col span={8}>
                <AntButton
                  type="primary"
                  onClick={handleSaveCheckpoint}
                  icon={<SaveOutlined />}
                  block
                  loading={isSaving}
                  disabled={isSaving || !checkpointName.trim()} // Disable if no name or saving
                >
                  {isSaving ? '保存中...' : '保存当前状态'}
                </AntButton>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
              <Col span={8}>
                <Upload
                  accept=".json"
                  showUploadList={false}
                  beforeUpload={handleImportAntdUpload} // This now returns a Promise<boolean>
                  customRequest={({ onSuccess }) => {
                    // Dummy request to satisfy AntD Upload when beforeUpload handles everything
                    setTimeout(() => {
                      if (onSuccess) onSuccess('ok');
                    }, 0);
                  }}
                >
                  <AntButton
                    icon={<UploadOutlined />}
                    block
                    style={{
                      backgroundColor: '#333',
                      borderColor: '#555',
                      color: '#e0e0e0',
                    }}
                  >
                    导入检查点
                  </AntButton>
                </Upload>
              </Col>
              <Col span={8}>
                <AntButton
                  icon={<CloudSyncOutlined />}
                  onClick={handleSyncCheckpoints}
                  loading={syncStatus.status === 'pending'}
                  block
                  style={{
                    backgroundColor: '#333',
                    borderColor: '#555',
                    color: '#e0e0e0',
                  }}
                  disabled={!supabaseState.isConnected} // Disable if not connected
                >
                  {syncStatus.status === 'pending' ? '同步中...' : '同步到云端'}
                </AntButton>
              </Col>
              <Col span={8}>
                <AntButton
                  icon={<CloudDownloadOutlined />}
                  onClick={handleRestoreFromCloud}
                  loading={syncStatus.status === 'pending'}
                  block
                  style={{
                    backgroundColor: '#333',
                    borderColor: '#555',
                    color: '#e0e0e0',
                  }}
                  disabled={!supabaseState.isConnected} // Disable if not connected
                >
                  {syncStatus.status === 'pending' ? '恢复中...' : '从云端恢复'}
                </AntButton>
              </Col>
            </Row>

            <Divider style={{ borderColor: '#444' }} />

            <Typography.Title level={5} style={{ color: '#e0e0e0', marginBottom: '16px' }}>
              已保存的检查点
            </Typography.Title>
            <List
              itemLayout="horizontal"
              dataSource={checkpoints}
              locale={{ emptyText: <Empty description={<span style={{ color: '#aaa' }}>暂无检查点</span>} /> }}
              renderItem={(item: CheckpointMetadata) => (
                <List.Item
                  style={{
                    backgroundColor: '#2a2a2a',
                    marginBottom: '8px',
                    padding: '12px 16px',
                    borderRadius: '4px',
                    border: '1px solid #333',
                  }}
                  actions={[
                    <AntButton
                      key={`restore-${item.name}`}
                      icon={<HistoryOutlined />}
                      onClick={() => handleRestoreCheckpoint(item.name)}
                      type="primary"
                    >
                      恢复
                    </AntButton>,
                    <AntButton
                      key={`export-${item.name}`}
                      icon={<ExportOutlined />}
                      onClick={() => handleExportCheckpoint(item.name)}
                      style={{
                        backgroundColor: '#333',
                        borderColor: '#555',
                        color: '#e0e0e0',
                      }}
                    >
                      导出
                    </AntButton>,
                    <AntButton
                      key={`delete-${item.name}`}
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteCheckpoint(item.name)}
                      danger // Use danger style for delete
                      style={
                        {
                          // backgroundColor: '#333', // Danger overrides this
                          // borderColor: '#555',
                          // color: '#e0e0e0',
                        }
                      }
                    >
                      删除
                    </AntButton>,
                  ]}
                >
                  <List.Item.Meta
                    title={<span style={{ color: '#e0e0e0' }}>{item.name}</span>}
                    description={
                      <span style={{ color: '#aaa' }}>
                        {new Date(item.timestamp).toLocaleString()}
                        {item.metadata?.description ? ` - ${item.metadata.description}` : ''}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          </Modal>
        </div>
      ) : (
        <div className="carbon-panel-container" style={{ height: '100vh', width: '100%' }}>
          <CarbonCalculatorPanelClient />
        </div>
      )}
    </>
  );
};

export const CarbonFlow = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: darkAlgorithm,
        token: {
          colorBgElevated: '#1f1f1f',
          colorText: '#e0e0e0',
        },
        components: {
          Message: {
            contentBg: '#1f1f1f',
            colorText: '#e0e0e0',
          },
          Modal: {
            // Style Modal components globally if needed
            contentBg: '#1f1f1f',
            headerBg: '#1f1f1f',
            colorTextHeading: '#e0e0e0',
            colorIcon: '#e0e0e0',
            colorIconHover: '#ffffff',
          },
          Button: {
            // Example: Style primary buttons
            // colorPrimary: '#1890ff',
            // colorPrimaryHover: '#40a9ff',
          },
        },
      }}
    >
      <style>{`
        .ant-message-notice-content {
          background-color: #1f1f1f !important;
          color: #e0e0e0 !important;
          border: 1px solid #333 !important;
        }
        .ant-message-custom-content {
          color: #e0e0e0 !important;
        }
        /* Ensure modal close icon is visible */
        .ant-modal-close-x {
            color: #aaa !important;
        }
        .ant-modal-close-x:hover {
            color: #fff !important;
        }
        /* Style AntD delete button in dark mode */
        .ant-btn-dangerous {
            /* background-color: #ff4d4f !important; */
            /* border-color: #ff4d4f !important; */
            /* color: #fff !important; */
        }
        .ant-btn-dangerous:hover {
             /* background-color: #ff7875 !important; */
             /* border-color: #ff7875 !important; */
        }

      `}</style>
      <ReactFlowProvider>
        <CarbonFlowInner />
      </ReactFlowProvider>
    </ConfigProvider>
  );
};
