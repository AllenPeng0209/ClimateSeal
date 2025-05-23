import React, { useCallback, useState, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import type { DragEvent } from 'react';
import { useLoaderData, useNavigate } from '@remix-run/react';
import ReactFlow, {
  type Node,
  type Edge,
  type OnConnect,
  type ReactFlowInstance,
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
import { Button as MyButton } from '~/components/ui/Button';
import { ProductNode } from './CarbonFlow/nodes/ProductNode';
import { ManufacturingNode } from './CarbonFlow/nodes/ManufacturingNode';
import { DistributionNode } from './CarbonFlow/nodes/DistributionNode';
import { UsageNode } from './CarbonFlow/nodes/UsageNode';
import { DisposalNode } from './CarbonFlow/nodes/DisposalNode';
import { NodeProperties } from './CarbonFlow/nodes/NodeProperties';
import { FinalProductNode } from './CarbonFlow/nodes/FinalProductNode';
import { CarbonFlowActionHandler } from './CarbonFlow/action/CarbonFlowActions';
import type { CarbonFlowAction } from '~/types/actions';
import {
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
  Tooltip,
} from 'antd';
import {
  SaveOutlined,
  HistoryOutlined,
  ExportOutlined,
  DeleteOutlined,
  CloudDownloadOutlined,
  CloudSyncOutlined,
  UploadOutlined,
  EditOutlined,
  CheckOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { CheckpointManager } from '~/lib/checkpoints/CheckpointManager';
import { CheckpointSyncService } from '~/lib/services/checkpointSyncService';
import { useStore } from '@nanostores/react';
import { supabaseConnection } from '~/lib/stores/supabase';
import type { RcFile } from 'antd/es/upload/interface';
import { chatMessagesStore } from '~/lib/stores/chatMessagesStore';
import type {
  NodeData,
  ProductNodeData,
  ManufacturingNodeData,
  DistributionNodeData,
  UsageNodeData,
  DisposalNodeData,
  FinalProductNodeData,
} from '~/types/nodes';
import { useCarbonFlowStore, emitCarbonFlowData } from './CarbonFlow/CarbonFlowStore';
import { supabase } from '~/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
// import { CarbonCalculatorPanelClient } from './CarbonFlow/panel';
import { CarbonCalculatorPanelClient } from './CarbonFlow/carbonpanel';
import { CarbonFlowAISummary } from './CarbonFlow/score/AISummary';
import { DataCheckPanel } from './CarbonFlow/checkboard/DataCheckPanel';
import ReportGenerator from './CarbonFlow/report/ReportGenerator';
import { VisualizationAnalysis } from './CarbonFlow/visualization/VisualizationAnalysisv1';

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

const initialNodes: Node<NodeData>[] = [];

const initialEdges: Edge[] = [];

interface CheckpointMetadata {
  name: string;
  timestamp: number;
  metadata?: { description?: string; tags?: string[]; version?: string };
}

const CarbonFlowInner = () => {
  const { workflow } = useLoaderData() as any;
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [siderWidth, setSiderWidth] = useState(250);
  const [isResizing, setIsResizing] = useState(false);

  const { project, fitView } = useReactFlow();
  const isDraggingRef = useRef(false);

  const [viewMode, setViewMode] = useState<'panel' | 'flow' | 'check' | 'analysis' | 'report'>('panel');

  const [isCheckpointModalVisible, setIsCheckpointModalVisible] = useState(false);
  const [checkpointName, setCheckpointName] = useState('');
  const [checkpoints, setCheckpoints] = useState<CheckpointMetadata[]>([]);

  const { setNodes: setStoreNodes, setEdges: setStoreEdges, nodes: storeNodes, aiSummary } = useCarbonFlowStore();

  const supabaseState = useStore(supabaseConnection);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(workflow?.name || '');
  const [workflowName, setWorkflowName] = useState(workflow?.name || '');

  const saveWorkflowName = async () => {
    if (!editingName.trim()) {
      message.error('名称不能为空');
      return;
    }
    if (editingName === workflowName) {
      setIsEditingName(false);
      return;
    }
    const { error } = await supabase
      .from('workflows')
      .update({ name: editingName, updated_at: new Date().toISOString() })
      .eq('id', workflow.id);
    if (error) {
      message.error('修改失败: ' + error.message);
      return;
    }
    setWorkflowName(editingName);
    setIsEditingName(false);
    message.success('名称已更新');
  };

  useEffect(() => {
    if (storeNodes) {
      const stringifyNodeForCompare = (node: Node<NodeData>) =>
        JSON.stringify({
          id: node.id,
          type: node.type,
          position: node.position,
          data: {
            label: node.data?.label,
            nodeName: node.data?.nodeName,
            lifecycleStage: node.data?.lifecycleStage,
          },
        });

      const storeNodesString = JSON.stringify(storeNodes.map(stringifyNodeForCompare).sort());
      const localNodesString = JSON.stringify(nodes.map(stringifyNodeForCompare).sort());

      if (storeNodesString !== localNodesString) {
        setNodes(storeNodes);
      }
    } else {
      if (nodes.length > 0) {
        setNodes([]);
      }
    }
  }, [storeNodes, setNodes]);

  useEffect(() => {
    if (!isDraggingRef.current) {
      setStoreNodes(nodes);
      setStoreEdges(edges);
      emitCarbonFlowData();
    }
  }, [nodes, edges, aiSummary, setStoreNodes, setStoreEdges]);

  const [actionHandler, setActionHandler] = useState<CarbonFlowActionHandler | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = new CarbonFlowActionHandler({
      nodes,
      edges,
      setNodes,
      setEdges,
      carbonFlowStore: useCarbonFlowStore,
    });
    setActionHandler(handler);
  }, [nodes, edges, setNodes, setEdges, useCarbonFlowStore]);

  useEffect(() => {
    console.log('[CarbonFlow.tsx] Setting up event listeners for carbonflow-action events');
    if (!actionHandler) {
      return;
    }

    const handleActionEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      const eventDetail = customEvent.detail; // Store for clarity and checking

      // Log the raw detail to confirm its structure
      console.log('[CarbonFlow.tsx] Received raw event.detail:', JSON.stringify(eventDetail, null, 2));

      // Check if eventDetail and eventDetail.action exist
      if (eventDetail && typeof eventDetail === 'object' && 'action' in eventDetail) {
        const actualAction = eventDetail.action as CarbonFlowAction & { traceId?: string };
        
        console.log('[CarbonFlow.tsx] Extracted actualAction:', JSON.stringify(actualAction, null, 2));
        console.log('[CarbonFlow.tsx] actualAction.type:', actualAction.type); // Should now be "carbonflow"

        if (actualAction && actualAction.type === 'carbonflow') {
          console.log('[CarbonFlow.tsx] Processing CarbonFlowAction:', JSON.stringify(actualAction, null, 2));
          if (actualAction.data) {
            try {
              const parsedData = JSON.parse(actualAction.data);
              console.log('[CarbonFlow.tsx] Parsed data from CarbonFlowAction:', JSON.stringify(parsedData, null, 2));
            } catch (e) {
              console.error('[CarbonFlow.tsx] Failed to parse data from CarbonFlowAction:', actualAction.data, e);
            }
          }

          if (actionHandler) {
            console.log('[CarbonFlow.tsx] Calling actionHandler.handleAction for operation:', actualAction.operation);
            actionHandler.handleAction(actualAction);
            console.log('[CarbonFlow.tsx] Returned from actionHandler.handleAction for operation:', actualAction.operation);
          } else {
            console.warn('[CarbonFlow.tsx] actionHandler is not initialized.');
          }

          window.dispatchEvent(
            new CustomEvent('carbonflow-action-result', {
              detail: { success: true, traceId: actualAction.traceId, nodeId: actualAction.nodeId },
            })
          );
        } else {
          // This case would catch if actualAction is null/undefined or if actualAction.type is not 'carbonflow'
          console.warn(`[CarbonFlow.tsx] actualAction is invalid or type is not 'carbonflow'. actualAction.type: ${actualAction?.type}, actualAction: ${JSON.stringify(actualAction, null, 2)}`);
        }
      } else {
        // This case means the event.detail was not structured as { action: ... }
        console.error('[CarbonFlow.tsx] Event detail is missing the "action" property or is not an object. Received detail:', JSON.stringify(eventDetail, null, 2));
      }
    };
    window.addEventListener('carbonflow-action', handleActionEvent);

    const handlePanelDataUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { action } = customEvent.detail;

      switch (action) {
        case 'DELETE_NODE':
          break;
        case 'ADD_NODE':
          break;
        case 'UPDATE_NODE':
          break;
      }
    };

    window.addEventListener('carbonflow-data-updated', handlePanelDataUpdated);

    return () => {
      window.removeEventListener('carbonflow-action', handleActionEvent);
      window.removeEventListener('carbonflow-data-updated', handlePanelDataUpdated);

      if (typeof window !== 'undefined') {
        (window as any).carbonFlowInitialized = false;
      }
    };
  }, [actionHandler, useCarbonFlowStore]);

  const onConnect: OnConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<NodeData>) => {
    setSelectedNode(node);
  }, []);

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!reactFlowInstance) {
        return;
      }

      const chineseType = event.dataTransfer.getData('application/carbonflow');
      const type = nodeTypeMapping[chineseType] as NodeType;

      if (!type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNodeId = `${type}-${Date.now()}`;
      const dbNodeId = uuidv4(); // Generate a UUID for the database ID
      const currentWorkflowId = useCarbonFlowStore.getState().workflowId || '';
      const baseData: Partial<NodeData> &
        Pick<
          NodeData,
          // id, workflowId, nodeId are directly initialized below, not part of this Pick
          | 'label'
          | 'nodeName'
          | 'lifecycleStage'
          | 'emissionType'
          | 'activityScore'
          | 'carbonFactor'
          | 'activitydataSource'
          | 'carbonFootprint'
          | 'unitConversion'
          | 'verificationStatus'
          | 'carbonFactorName'
          | 'activityScorelevel'
          | 'carbonFactordataSource'
        > = {
        id: dbNodeId, // Database primary key
        workflowId: currentWorkflowId, // Foreign key to workflow
        nodeId: newNodeId, // React Flow node ID
        label: `新 ${nodeTypeLabels[type]} 节点`,
        nodeName: `${type}_${Date.now()}`,
        lifecycleStage: type,
        emissionType: 'default',
        activityScore: 0,
        carbonFactor: '0',
        activitydataSource: 'default',
        carbonFootprint: '0',
        unitConversion: '1',
        verificationStatus: '未验证',
        carbonFactorName: '',
        activityScorelevel: '',
        carbonFactordataSource: '',
      };

      let specificData: NodeData;

      if (type === 'product') {
        specificData = {
          ...baseData,
          nodeType: 'product',
          material: '',
          weight_per_unit: '',
          quantity: '0',
          isRecycled: false,
          recycledContent: '',
          recycledContentPercentage: 0,
        } as ProductNodeData;
      } else if (type === 'manufacturing') {
        specificData = {
          ...baseData,
          nodeType: 'manufacturing',
          energyConsumption: 0,
          energyType: '',
          ElectricityAccountingMethod: '',
          ElectricityAllocationMethod: '',
          EnergyConsumptionMethodology: '',
          EnergyConsumptionAllocationMethod: '',
        } as ManufacturingNodeData;
      } else if (type === 'distribution') {
        specificData = {
          ...baseData,
          nodeType: 'distribution',
          transportationMode: '', // Corrected name
          transportationDistance: 0, // Corrected type to number
          // Removed distribution_start_point, distribution_end_point as they don't exist in DistributionNodeData
          // Add other valid DistributionNodeData fields as needed with default values
          vehicleType: '',
          fuelType: '',
          fuelEfficiency: 0,
          loadFactor: 0,
          refrigeration: false,
          packagingMaterial: '',
          packagingWeight: 0,
          warehouseEnergy: 0,
          storageTime: 0,
          storageConditions: '',
          distributionNetwork: ''
        } as DistributionNodeData;
      } else if (type === 'usage') {
        specificData = {
          ...baseData,
          nodeType: 'usage',
          lifespan: 0,
          usageFrequency: 0,
          energyConsumptionPerUse: 0,
        } as UsageNodeData;
      } else if (type === 'disposal') {
        specificData = {
          ...baseData,
          nodeType: 'disposal',
          disposalMethod: '', // Corrected name
          recyclingRate: 0, // Corrected name and type
          // Corrected fields based on DisposalNodeData definition in nodes.ts
          landfillPercentage: 0,
          incinerationPercentage: 0,
          compostPercentage: 0,
          reusePercentage: 0,
          hazardousWasteContent: 0,
          biodegradability: 0,
          disposalEnergyRecovery: 0,
          transportToDisposal: 0,
          endOfLifeTreatment: '',
          recyclingEfficiency: 0,
          dismantlingDifficulty: ''
          // Removed fields not present in DisposalNodeData like landfill_gas_recovery_rate, incineration_with_energy_recovery_rate etc.
        } as DisposalNodeData;
      } else if (type === 'finalProduct') {
        specificData = {
          ...baseData,
          nodeType: 'finalProduct',
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
        } as FinalProductNodeData;
      } else {
        specificData = baseData as NodeData;
      }

      const newNode: Node<NodeData> = {
        id: newNodeId,
        type,
        position,
        data: specificData,
      };

      const currentStoreNodes = useCarbonFlowStore.getState().nodes || [];
      const newStoreNodes = [...currentStoreNodes, newNode];
      setStoreNodes(newStoreNodes);
    },
    [reactFlowInstance, setStoreNodes],
  );

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

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
    if (!reactFlowInstance) {
      return;
    }

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
          carbonFactor: '0',
          activitydataSource: 'calculated',
          carbonFootprint: '0',
          certificationMaterials: '',
          emissionFactor: '',
          calculationMethod: '',
          verificationStatus: 'pending',
          applicableStandard: '',
          completionStatus: 'incomplete',
          carbonFactorName: '',
          unitConversion: '1',
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
          nodeType: 'finalProduct',
          quantity: '0',
        } as FinalProductNodeData,
      };
      nodesByType.finalProduct.push(finalProductNode);
    }


    const layoutNodes = [...nodes];
    if (!layoutNodes.find((n) => n.type === 'finalProduct')) {
      layoutNodes.push(finalProductNode);
    }

    const positionedNodes = layoutNodes
      .filter((node) => node.type !== 'finalProduct')
      .map((node) => {
        const nodeType = node.type as NodeType;
        const typeIndex = nodeTypeOrder.indexOf(nodeType);
        const typeNodes = nodesByType[nodeType] || [];
        const nodeIndex = typeNodes.findIndex((n) => n.id === node.id);

        const x = PADDING + typeIndex * HORIZONTAL_SPACING;
        const y = PADDING + (nodeIndex >= 0 ? nodeIndex : 0) * VERTICAL_SPACING;

        return {
          ...node,
          position: { x, y },
          style: {
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
          },
        };
      });

    const maxX = positionedNodes.length > 0 ? Math.max(...positionedNodes.map((node) => node.position.x)) : PADDING;
    const maxY = positionedNodes.length > 0 ? Math.max(...positionedNodes.map((node) => node.position.y)) : PADDING;
    const finalProductPosition = {
      x: maxX / 2,
      y: maxY + VERTICAL_SPACING,
    };

    const finalProductNodeRef = layoutNodes.find((n) => n.id === finalProductNode.id);
    if (!finalProductNodeRef) {
      return;
    }

    const finalProductNodeWithPosition = {
      ...finalProductNodeRef,
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

      const footprint = parseFloat(node.data.carbonFootprint || '0');
      if (!isNaN(footprint)) {
        totalCarbonFootprint += footprint;
      }
    });

    const updatedNodes = allNodes.map((node) => {
      if (node.id === finalProductNode.id) {
        const finalData = node.data as FinalProductNodeData;
        return {
          ...node,
          data: {
            ...finalData,
            totalCarbonFootprint,
            carbonFootprint: String(totalCarbonFootprint),
          },
        };
      }
      return node;
    });

    setNodes(updatedNodes as Node<NodeData>[]);
    setEdges(newEdges);
    fitView({ duration: 800, padding: 0.2 });
  }, [nodes, reactFlowInstance, setNodes, setEdges, fitView]);

  const handleNodeDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handleNodeDragStop = useCallback((_event: React.MouseEvent, _node: Node) => {
    isDraggingRef.current = false;
  }, []);

  const autoCompleteMissingFields = useCallback(async () => {
    if (!nodes || nodes.length === 0) {
      return;
    }

    message.info('AI优化中...');
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    await sleep(3000);
    message.destroy();

    const updatedNodes = nodes.map((node) => {
      const updatedData = { ...node.data };

      const updateNumericStringField = (obj: any, field: string, defaultValue: string) => {
        if (!obj[field] || Number.isNaN(Number(obj[field]))) {
          obj[field] = defaultValue;
        }
      };

      const updateNumericField = (obj: any, field: string, defaultValue: number) => {
        if (typeof obj[field] !== 'number' || Number.isNaN(obj[field])) {
          obj[field] = defaultValue;
        }
      };

      switch (node.data.lifecycleStage) {
        case 'product':
        case '原材料获取': {
          const productData = updatedData as ProductNodeData;
          updateNumericStringField(productData, 'quantity', '1');
          updateNumericStringField(productData, 'carbonFactor', '0.5');
          if (!productData.carbonFactorName) productData.carbonFactorName = '默认碳因子';
          if (!productData.carbonFactordataSource) productData.carbonFactordataSource = '数据库匹配';
          break;
        }
        case 'manufacturing':
        case '生产制造': {
          const manufacturingData = updatedData as ManufacturingNodeData;
          updateNumericStringField(manufacturingData, 'carbonFactor', '0.3');
          updateNumericField(manufacturingData, 'energyConsumption', 100);
          if (!manufacturingData.energyType) manufacturingData.energyType = '电力';
          break;
        }
        case 'distribution':
        case '分销和储存': {
          const distributionData = updatedData as DistributionNodeData;
          updateNumericStringField(distributionData, 'carbonFactor', '0.2');
          if (!distributionData.distribution_start_point) distributionData.distribution_start_point = '起点';
          if (!distributionData.distribution_end_point) distributionData.distribution_end_point = '终点';
          updateNumericStringField(distributionData, 'transportation_distance', '100');
          break;
        }
        case 'usage':
        case '产品使用': {
          const usageData = updatedData as UsageNodeData;
          updateNumericField(usageData, 'lifespan', 5);
          updateNumericField(usageData, 'energyConsumptionPerUse', 0.5);
          updateNumericField(usageData, 'usageFrequency', 365);
          break;
        }
        case 'disposal':
        case '废弃处置': {
          const disposalData = updatedData as DisposalNodeData;
          updateNumericField(disposalData, 'recycling_rate', 80);
          updateNumericField(disposalData, 'landfill_gas_recovery_rate', 10);
          updateNumericField(disposalData, 'incineration_with_energy_recovery_rate', 10);
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
  }, [nodes, setNodes]);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

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
        if (actionHandler) {
          actionHandler.handleAction(fileAction);
        }
        message.success('文件解析已发送');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };

      reader.onerror = () => {
        message.error('读取文件失败');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.readAsText(file);
    },
    [actionHandler],
  );

  const triggerFileInput = () => fileInputRef.current?.click();

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
    actionHandler.handleAction(matchAction);
    message.success('碳因子匹配请求已发送');
  }, [actionHandler]);

  const [isSaving, setIsSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState(CheckpointSyncService.getSyncStatus());

  useEffect(() => {
    const loadCheckpoints = async () => {
      try {
        const list = await CheckpointManager.listCheckpoints();
        setCheckpoints(list);
      } catch (error) {
        console.error('加载检查点列表失败:', error);
      }
    };
    loadCheckpoints().catch(console.error);
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (supabaseState.isConnected) {
      cleanup = CheckpointSyncService.startAutoSync();
    }

    return cleanup;
  }, [supabaseState.isConnected]);

  const handleSaveCheckpoint = async () => {
    if (!checkpointName.trim()) {
      message.error('请输入检查点名称');
      return;
    }
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    message.loading({ content: '正在保存检查点...', key: 'saveCheckpoint' });

    try {
      const currentAiSummary = useCarbonFlowStore.getState().aiSummary;
      await CheckpointManager.saveCheckpoint(
        checkpointName,
        {
          nodes,
          edges,
          aiSummary: currentAiSummary,
          settings: {
            theme: localStorage.getItem('theme') || 'light',
            language: localStorage.getItem('language') || 'zh-CN',
            notifications: localStorage.getItem('notifications') === 'true',
            eventLogs: localStorage.getItem('eventLogs') === 'true',
            timezone: localStorage.getItem('timezone') || 'UTC',
            contextOptimization: localStorage.getItem('contextOptimization') === 'true',
            autoSelectTemplate: localStorage.getItem('autoSelectTemplate') === 'true',
          },
          chatHistory: chatMessagesStore.get(),
        },
        {
          description: '手动保存的检查点',
          tags: ['manual-save'],
        },
      );
      message.success({ content: '本地保存成功!', key: 'saveCheckpoint', duration: 1 });

      const updatedLocalCheckpoints = await CheckpointManager.listCheckpoints();
      setCheckpoints(updatedLocalCheckpoints);

      const newlySavedCheckpointMeta = updatedLocalCheckpoints.find((cp) => cp.name === checkpointName);
      if (!newlySavedCheckpointMeta) {
        message.error({ content: `本地元数据错误，无法同步检查点 '${checkpointName}'`, key: 'syncDb', duration: 5 });
        setIsSaving(false);
        return;
      }

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
        setNodes(data.nodes);
        setEdges(data.edges);
        if (data.aiSummary) {
          const store = useCarbonFlowStore.getState();
          if (store.setAiSummary) {
            store.setAiSummary(data.aiSummary);
          }
        }
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
        message.error('导出检查点失败: 未找到数据');
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
      console.error('导出检查点时出错:', error);
      message.error('导出检查点失败');
    }
  };

  const handleImportAntdUpload = (file: RcFile): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const content = e.target?.result as string;
            if (!content) {
              message.error('文件内容为空');
              reject(new Error('File content is empty'));
              return;
            }

            await CheckpointManager.importCheckpoint(content);
            const updatedCheckpoints = await CheckpointManager.listCheckpoints();
            setCheckpoints(updatedCheckpoints);
            message.success('检查点导入成功');
            resolve(false);
          } catch (importError) {
            console.error('导入检查点操作失败:', importError);
            message.error(`导入检查点失败: ${importError instanceof Error ? importError.message : '未知错误'}`);
            reject(importError);
          }
        };
        reader.onerror = (error) => {
          console.error('文件读取错误:', error);
          message.error('读取文件失败');
          reject(error);
        };
        reader.readAsText(file);
      } catch (error) {
        console.error('设置导入检查点失败:', error);
        message.error('导入检查点失败');
        reject(error);
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

  const handleSyncCheckpoints = async () => {
    try {
      await CheckpointSyncService.syncToSupabase();
      setSyncStatus(CheckpointSyncService.getSyncStatus());
    } catch (error) {
      console.error('同步检查点失败:', error);
      message.error('同步检查点失败');
    }
  };

  const handleRestoreFromCloud = async () => {
    try {
      const result = await CheckpointSyncService.restoreFromSupabase();
      if (result.success) {
        const updatedCheckpoints = await CheckpointManager.listCheckpoints();
        setCheckpoints(updatedCheckpoints);
        setSyncStatus(CheckpointSyncService.getSyncStatus());
        message.success('从云端恢复成功');
      } else {
        message.error(`从云端恢复失败: ${result.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('从云端恢复检查点时出错:', error);
      message.error('从云端恢复检查点失败');
    }
  };

  return (
    <>
      <div className="carbonflow-inner-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div
          className="view-toggle-container"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
            padding: '12px 32px',
            background: 'rgba(16,32,61,0.8)',
            borderBottom: '1px solid #222',
            boxSizing: 'border-box',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isEditingName ? (
              <Input
                value={editingName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingName(e.target.value)}
                onPressEnter={saveWorkflowName}
                style={{ width: 220 }}
                size="small"
                autoFocus
                maxLength={50}
              />
            ) : (
              <span style={{ fontSize: 18, fontWeight: 500, color: '#fff' }}>{workflowName}</span>
            )}
            {isEditingName ? (
              <AntButton icon={<CheckOutlined />} size="small" type="primary" onClick={saveWorkflowName} />
            ) : (
              <AntButton
                icon={<EditOutlined />}
                size="small"
                onClick={() => {
                  setEditingName(workflowName);
                  setIsEditingName(true);
                }}
              />
            )}
          </div>
          <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MyButton
                onClick={() => setViewMode('panel')}
                className="view-toggle-button view-toggle-button-hover"
                style={{
                  backgroundColor: viewMode === 'panel' ? '#1890ff' : '#333',
                  color: '#fff',
                  borderColor: '#555',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
              >
                数据操作台面板
              </MyButton>
              <MyButton
                onClick={() => setViewMode('flow')}
                className="view-toggle-button view-toggle-button-hover"
                style={{
                  backgroundColor: viewMode === 'flow' ? '#1890ff' : '#333',
                  color: '#fff',
                  borderColor: '#555',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
              >
                流程图面板
              </MyButton>
              <MyButton
                onClick={() => setViewMode('check')}
                className="view-toggle-button view-toggle-button-hover"
                style={{
                  backgroundColor: viewMode === 'check' ? '#1890ff' : '#333',
                  color: '#fff',
                  borderColor: '#555',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
              >
                数据查验面板
              </MyButton>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MyButton
                onClick={() => setViewMode('analysis')}
                className="view-toggle-button view-toggle-button-hover"
                style={{
                  backgroundColor: viewMode === 'analysis' ? '#1890ff' : '#333',
                  color: '#fff',
                  borderColor: '#555',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
              >
                可视化分析
              </MyButton>
              <MyButton
                onClick={() => setViewMode('report')}
                className="view-toggle-button view-toggle-button-hover"
                style={{
                  backgroundColor: viewMode === 'report' ? '#1890ff' : '#333',
                  color: '#fff',
                  borderColor: '#555',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
              >
                生成报告
              </MyButton>
              <Tooltip title="退出工作台">
                <AntButton
                  icon={<LogoutOutlined />}
                  onClick={() => navigate('/dashboard/workbench')}
                  style={{
                    color: '#fff',
                    borderColor: '#555',
                    backgroundColor: '#333',
                  }}
                  className="view-toggle-button-hover"
                />
              </Tooltip>
            </div>
          </div>
        </div>

        <div style={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {viewMode === 'panel' && (
            <div className="carbon-panel-container" style={{ height: '100%', width: '100%' }}>
              <CarbonCalculatorPanelClient />
            </div>
          )}
          {viewMode === 'flow' && (
            <div
              className="editor-layout"
              style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <div className="editor-header">
                <div className="header-left" />
                <div className="header-right">
  
                  {/* <MyButton onClick={deleteSelectedNode} variant="destructive" disabled={!selectedNode}>
                    删除节点
                  </MyButton> */}
                  <MyButton onClick={autoLayout}>自动布局</MyButton>
           

     
                </div>
              </div>
              <div className="main-content" style={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
                <div className="editor-sider" style={{ width: siderWidth, flexShrink: 0 }}>
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
                  <div className="resizer" onMouseDown={handleResizeStart} role="separator" aria-label="Resize panel">
                    <div className="resizer-handle" />
                  </div>
                </div>
                <div className="ai-summary-floating-container">
                  <CarbonFlowAISummary setSelectedNode={setSelectedNode} />
                </div>
                <div className="editor-content" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <div className="reactflow-wrapper" style={{ flexGrow: 1, position: 'relative' }}>
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
                      onNodeDragStart={handleNodeDragStart}
                      onNodeDragStop={handleNodeDragStop}
                    >
                      <Background />
                      <Controls />
                      <MiniMap />

                      {selectedNode && (
                        <Panel position="top-center">
                          <NodeProperties
                            node={selectedNode}
                            selectedNode={selectedNode}
                            onClose={() => setSelectedNode(null)}
                            setNodes={setNodes as Dispatch<SetStateAction<Node<NodeData>[]>>}
                            setSelectedNode={setSelectedNode}
                            updateAiSummary={() => {
                              /* Define or pass actual update function if needed */
                            }}
                            onUpdate={() => {
                              /* Placeholder */
                            }}
                          />
                        </Panel>
                      )}
                    </ReactFlow>
                  </div>
                </div>
              </div>
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
                      placeholder="输入检查点名称"
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
                      disabled={isSaving || !checkpointName.trim()}
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
                      beforeUpload={handleImportAntdUpload}
                      customRequest={({ onSuccess }: { onSuccess?: (body: any, xhr?: XMLHttpRequest) => void }) => {
                        setTimeout(() => {
                          if (onSuccess) {
                            onSuccess('ok');
                          }
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
                      disabled={!supabaseState.isConnected}
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
                      disabled={!supabaseState.isConnected}
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
                          danger
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
          )}
          {viewMode === 'check' && <DataCheckPanel />}
          {viewMode === 'analysis' && <VisualizationAnalysis onBack={() => setViewMode('flow')} />}
          {viewMode === 'report' && <ReportGenerator />}
        </div>
      </div>
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
            contentBg: '#1f1f1f',
            headerBg: '#1f1f1f',
            colorTextHeading: '#e0e0e0',
            colorIcon: '#e0e0e0',
            colorIconHover: '#ffffff',
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
        .ant-modal-close-x {
            color: #aaa !important;
        }
        .ant-modal-close-x:hover {
            color: #fff !important;
        }
        .view-toggle-button-hover:hover {
          background-color: #333;
        }
      `}</style>
      <ReactFlowProvider>
        <CarbonFlowInner />
      </ReactFlowProvider>
    </ConfigProvider>
  );
};
