import React, { useCallback, useState, useEffect, useMemo } from 'react';
import type { DragEvent } from 'react';
import ReactFlow, { type Node, type Edge, type Connection, type OnConnect, type OnNodesChange, type OnEdgesChange, type ReactFlowInstance, type Viewport, useNodesState, useEdgesState, addEdge, useReactFlow, ReactFlowProvider, Background, Controls, MiniMap, Panel, ConnectionLineType, ConnectionMode, applyNodeChanges, applyEdgeChanges, MarkerType } from 'reactflow';
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
import { Tag, Collapse, Progress, message, Modal, Input, Row, Col, Upload, Alert, Divider, List, Empty, Typography, Button as AntButton, ConfigProvider } from 'antd';
import { 
  UpOutlined, DownOutlined, ReloadOutlined, SaveOutlined, HistoryOutlined, ExportOutlined, 
  ImportOutlined, DeleteOutlined, SyncOutlined, CloudDownloadOutlined, CloudSyncOutlined, UploadOutlined,
  FileExcelOutlined, FilePdfOutlined, FileWordOutlined, PlusOutlined // <-- Add needed icons
} from '@ant-design/icons';
import { CheckpointManager } from '~/lib/checkpoints/CheckpointManager';
import { CheckpointSyncService } from '~/lib/services/checkpointSyncService';
import { useStore } from '@nanostores/react';
import { supabaseConnection } from '~/lib/stores/supabase';
import type { RcFile, UploadChangeParam } from 'antd/es/upload/interface';
import { themeStore } from '~/lib/stores/theme';
import { chatMessagesStore } from '~/lib/stores/chatMessagesStore';
import { theme } from 'antd';
import type { NodeData, ProductNodeData, ManufacturingNodeData, DistributionNodeData, BaseNodeData, UsageNodeData, DisposalNodeData, FinalProductNodeData } from '~/types/nodes';
import { useCarbonFlowStore, emitCarbonFlowData } from './CarbonFlow/CarbonFlowBridge';
import { useNavigate, useParams } from '@remix-run/react';

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

const nodeTypeReverseMapping: Record<NodeType, string> = {
  'product': '材料节点',
  'manufacturing': '制造节点',
  'distribution': '分销节点',
  'usage': '使用节点',
  'disposal': '废弃节点',
  'finalProduct': '最终节点',
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
      weight_per_unit: '0'
    } as ProductNodeData
  }
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
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [siderWidth, setSiderWidth] = useState(250);
  const [isResizing, setIsResizing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
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
  
  const [isCheckpointModalVisible, setIsCheckpointModalVisible] = useState(false);
  const [checkpointName, setCheckpointName] = useState('');
  const [checkpoints, setCheckpoints] = useState<CheckpointMetadata[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState(CheckpointSyncService.getSyncStatus());
  const [isChecklistModalVisible, setIsChecklistModalVisible] = useState(false);

  const { project, fitView } = useReactFlow();
  const navigate = useNavigate();
  const { id: workflowId } = useParams();
  const theme = useStore(themeStore);
  const chatMessages = useStore(chatMessagesStore);
  const supabaseState = useStore(supabaseConnection);

  const connectionLineStyle = { stroke: theme === 'dark' ? '#ccc' : '#333' };
  const defaultEdgeOptions = { animated: true, style: { stroke: theme === 'dark' ? '#ccc' : '#333' } };

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
  
  const actionHandler = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new CarbonFlowActionHandler({ nodes, edges, setNodes: setNodes as React.Dispatch<React.SetStateAction<Node<NodeType>[]>>, setEdges });
    }
    return null;
  }, [nodes, edges, setNodes, setEdges]);

  const handleActionEvent = useCallback((event: Event) => {
    if (event instanceof CustomEvent) {
      const action = event.detail as CarbonFlowAction & { traceId?: string };
      if (!actionHandler) return;
      
      console.log('[CarbonFlow] 收到操作:', action);
      actionHandler.handleAction(action);
      
      window.dispatchEvent(new CustomEvent('carbonflow-action-result', { 
        detail: { success: true, traceId: action.traceId, nodeId: action.nodeId } 
      }));
    }
  }, [actionHandler]);

  useEffect(() => {
    window.addEventListener('carbonflow-action', handleActionEvent);
    return () => {
      window.removeEventListener('carbonflow-action', handleActionEvent);
      if (typeof window !== 'undefined') {
        (window as any).carbonFlowInitialized = false;
      }
    };
  }, [actionHandler, handleActionEvent]);

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
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

      const newNode: Node<NodeData> = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: `新 ${nodeTypeLabels[type]} 节点`,
          nodeName: `${type}_${Date.now()}`,
          lifecycleStage: type,
          emissionType: 'default',
          activityScore: 0,
          carbonFactor: 0,
          activitydataSource: 'default',
          carbonFootprint: 0,
          unitConversion: 1,
          emissionFactorQuality: 0,
          ...(type === 'product' && { material: '', weight_per_unit: '0' }),
          ...(type === 'manufacturing' && { 
            energyConsumption: 0,
            ElectricityAccountingMethod: '',
            ElectricityAllocationMethod: '',
            EnergyConsumptionMethodology: '',
            EnergyConsumptionAllocationMethod: '',
            chemicalsMaterial: '',
            MaterialAllocationMethod: '',
            WaterUseMethodology: '',
            WaterAllocationMethod: '',
            packagingMaterial: '',
            direct_emission: '',
            WasteGasTreatment: '',
            WasteDisposalMethod: '',
            WastewaterTreatment: '',
          }),
          ...(type === 'disposal' && { recyclingRate: 0, landfillPercentage: 0, incinerationPercentage: 0, compostPercentage: 0 }),
        } as NodeData,
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

    const nodeTypeOrder: NodeType[] = ['product', 'manufacturing', 'distribution', 'usage', 'disposal'];
    
    const nodesByType: Record<NodeType, Node<NodeData>[]> = {
      product: [],
      manufacturing: [],
      distribution: [],
      usage: [],
      disposal: [],
      finalProduct: [],
    };
    
    nodes.forEach(node => {
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

    const positionedNodes = newNodes.filter(node => node.type !== 'finalProduct').map(node => {
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

    const maxX = Math.max(...positionedNodes.map(node => node.position.x));
    const maxY = Math.max(...positionedNodes.map(node => node.position.y));
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

    positionedNodes.forEach(node => {
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

    const lifecycle = ['原材料获取', '生产制造', '分销和储存', '产品使用', '废弃处置'];
    
    const existingStages = new Set(nodes.map(node => node.data?.lifecycleStage).filter(Boolean));
    const missingLifecycleStages = lifecycle.filter(stage => !existingStages.has(stage));
    const lifecycleCompletenessScore = ((lifecycle.length - missingLifecycleStages.length) / lifecycle.length) * 100;
    
    let totalFields = 0;
    let completedFields = 0;
    const complete_incompleteNodes: { id: string; label: string; missingFields: string[]; }[] = [];

    nodes.forEach(node => {
      const missingFields: string[] = [];
      switch (node.data.lifecycleStage) {
        case '原材料获取': {
          const productData = node.data as ProductNodeData;
          const quantity = productData.quantity !== undefined && !Number.isNaN(Number(productData.quantity)) ? Number(productData.quantity) : 0;
          if (quantity === 0) {
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
      
      if (missingFields.length > 0) {
        complete_incompleteNodes.push({
          id: node.id,
          label: node.data.label,
          missingFields: missingFields
        });
      }
    });

    const NodeCompletenessScore = Math.round(((completedFields) / (totalFields+0.01)) * 100)
    const modelCompletenessScore = Math.round(0.25 * NodeCompletenessScore + 0.75 * lifecycleCompletenessScore);

    const mass_incompleteNodes: { id: string; label: string; missingFields: string[]; }[] = [];
    let totalInputMass = 0;
    let totalOutputMass = 0;

    nodes.forEach(node => {
      if (node.data.lifecycleStage === '原材料获取') {
        const productData = node.data as ProductNodeData;
        const quantity = productData.quantity !== undefined && !Number.isNaN(Number(productData.quantity)) ? Number(productData.quantity) : 0;
        if (quantity === 0) {
          mass_incompleteNodes.push({
            id: node.id,
            label: node.data.label,
            missingFields: ['数量']
          });
        } else {
          totalInputMass += quantity;
        }
      }
      
      if (node.data.lifecycleStage === '最终节点') {
        const productData = node.data as ProductNodeData;
        const quantity = productData.quantity !== undefined && !Number.isNaN(Number(productData.quantity)) ? Number(productData.quantity) : 0;
        if (quantity === 0) {
          mass_incompleteNodes.push({
            id: node.id,
            label: node.data.label,
            missingFields: ['数量']
          });
        } else {
          totalOutputMass += quantity;
        }
      }
    });

    const errorPercentage = Math.abs(totalInputMass - totalOutputMass) / (totalInputMass || 1) * 100;
    let massBalanceScore = 100;
    if (errorPercentage > 5) {
      massBalanceScore = Math.max(0, 100 - Math.round(errorPercentage - 5));
    }

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
      0.15 * validationScore100
    );

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
                  
                  <div className="score-summary">
                    <h4>评分总结</h4>
                    <div className="score-item">
                      <span>平衡率:</span>
                      <span>{massBalance.ratio.toFixed(2)}</span>
                    </div>
                  </div>
                  
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
                  <Progress 
                    percent={validation.score} 
                    strokeColor={getScoreColor(validation.score)}
                    size="small"
                  />
                  
                  <div className="score-summary">
                    <h4>评分总结</h4>
                    <div className="score-item">
                      <span>数据一致性:</span>
                      <span>{validation.consistency}%</span>
                    </div>
                  </div>
                  
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

  const autoCompleteMissingFields = useCallback(async () => {
    if (!nodes || nodes.length === 0) return;

    message.info('AI优化中...');

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    await sleep(3000);

    message.destroy();

    const updatedNodes = nodes.map(node => {
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

          if (!distributionData.transportationDistance || Number.isNaN(Number(distributionData.transportationDistance))) {
            updatedData.transportationDistance = 100;
          }

          break;
        }

        case '产品使用': {
          const usageData = node.data as UsageNodeData;

          if (!usageData.lifespan || Number.isNaN(Number(usageData.lifespan))) {
            updatedData.lifespan = 5;
          }

          if (!usageData.energyConsumptionPerUse) {
            updatedData.energyConsumptionPerUse = 0.5;
          }

          if (!usageData.usageFrequency) {
            updatedData.usageFrequency = 365;
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
    calculateAiSummary();
  }, [nodes, setNodes, calculateAiSummary]);

  useEffect(() => {
    const loadCheckpoints = async () => {
      try {
        const list = await CheckpointManager.listCheckpoints();
        setCheckpoints(list);
      } catch (error) {
        console.error('加载检查点列表失败:', error);
      }
    };
    loadCheckpoints();
  }, []);

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
          chatHistory: chatMessages
        },
        {
          description: '手动保存的检查点',
          tags: ['manual-save'],
        }
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
        window.dispatchEvent(new CustomEvent('chatHistoryUpdated', {
          detail: { messages: data.chatHistory }
        }));
      } else {
        chatMessagesStore.set([]);
        window.dispatchEvent(new CustomEvent('chatHistoryUpdated', {
          detail: { messages: [] }
        }));
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
        message.error('导出检查点失败');
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
      message.error('导出检查点失败');
    }
  };

  const handleImportAntdUpload = (file: RcFile): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const content = e.target?.result as string;
          await CheckpointManager.importCheckpoint(content);
          const updatedCheckpoints = await CheckpointManager.listCheckpoints();
          setCheckpoints(updatedCheckpoints);
          message.success('检查点导入成功');
          resolve(false); // Prevent default upload behavior
        };
        reader.onerror = (error) => {
          console.error('文件读取错误:', error);
          message.error('读取文件失败');
          reject(false);
        };
        reader.readAsText(file);
      } catch (error) {
        console.error('导入检查点失败:', error);
        message.error('导入检查点失败');
        reject(false);
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

  useEffect(() => {
    if (supabaseState.isConnected) {
      const cleanup = CheckpointSyncService.startAutoSync();
      return cleanup;
    }
  }, [supabaseState.isConnected]);

  const handleSyncCheckpoints = async () => {
    try {
      await CheckpointSyncService.syncToSupabase();
      setSyncStatus(CheckpointSyncService.getSyncStatus());
    } catch (error) {
      console.error('同步检查点失败:', error);
    }
  };

  const handleRestoreFromCloud = async () => {
    try {
      const result = await CheckpointSyncService.restoreFromSupabase();
      if (result.success) {
        const updatedCheckpoints = await CheckpointManager.listCheckpoints();
        setCheckpoints(updatedCheckpoints);
        setSyncStatus(CheckpointSyncService.getSyncStatus());
      }
    } catch (error) {
      message.error('从云端恢复检查点失败');
    }
  };

  const renderCheckpointModal = () => (
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
        overflowY: 'auto' 
      }}
      styles={{
        header: { 
          backgroundColor: '#1f1f1f',
          color: '#e0e0e0',
          borderBottom: '1px solid #303030'
        },
        content: { 
          backgroundColor: '#1f1f1f',
        },
        mask: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)'
        }
      }}
    >
      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Input
            placeholder="输入检查点名称 (可选)"
            value={checkpointName}
            onChange={(e) => setCheckpointName(e.target.value)}
            style={{ 
              backgroundColor: '#2a2a2a',
              color: '#e0e0e0',
              borderColor: '#444'
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
            disabled={isSaving}
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
            >
              <AntButton 
                icon={<UploadOutlined />} 
                block
                style={{
                  backgroundColor: '#333',
                  borderColor: '#555',
                  color: '#e0e0e0'
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
              color: '#e0e0e0' 
            }}
          >
            {syncStatus.status === 'pending' ? '恢复中...' : '从云端恢复'}
          </AntButton>
        </Col>
      </Row>

      <Divider style={{ borderColor: '#444' }} />

      <Typography.Title level={5} style={{ color: '#e0e0e0', marginBottom: '16px' }}>已保存的检查点</Typography.Title>
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
              border: '1px solid #333'
            }}
            actions={[
              <AntButton 
                icon={<HistoryOutlined />} 
                onClick={() => handleRestoreCheckpoint(item.name)}
                type="primary"
              >
                恢复
              </AntButton>,
              <AntButton 
                icon={<ExportOutlined />} 
                onClick={() => handleExportCheckpoint(item.name)}
                style={{
                  backgroundColor: '#333',
                  borderColor: '#555',
                  color: '#e0e0e0'
                }}
              >
                导出
              </AntButton>,
              <AntButton 
                icon={<DeleteOutlined />} 
                onClick={() => handleDeleteCheckpoint(item.name)}
                style={{
                  backgroundColor: '#333',
                  borderColor: '#555', 
                  color: '#e0e0e0' 
                }}
              >
                删除
              </AntButton>
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
  );

  const renderChecklistModal = () => {
    // TODO: Fetch actual product info, standard, and materials based on workflowId
    const productInfo = {
      name: '有机米粽 (示例)',
      model: 'ZC-OMS-2024',
      description: '采用有机糯米、精选猪肉及天然粽叶制成的端午节令食品。'
    };
    const disclosureStandard = 'ISO 14067:2018 产品碳足迹量化要求及指南';
    const materials = [
      { id: 'bom', name: '有机米粽BOM清单.xlsx', type: 'Excel', status: '已上传', icon: <FileExcelOutlined style={{ color: '#1DA57A', fontSize: '20px' }} /> },
      { id: 'electricity', name: '2023全年电费发票汇总.pdf', type: 'PDF', status: '已上传', icon: <FilePdfOutlined style={{ color: '#FF5555', fontSize: '20px' }} /> },
      { id: 'capacity', name: '车间人均产能报告_Q4.docx', type: 'Word', status: '已上传', icon: <FileWordOutlined style={{ color: '#2B579A', fontSize: '20px' }} /> },
    ];

    return (
      <Modal
        wrapClassName="glow-modal"
        open={isChecklistModalVisible}
        onCancel={() => setIsChecklistModalVisible(false)}
        width={700}
        style={{
          boxShadow: theme === 'dark'
            ? '0 0 20px 5px rgba(112, 161, 255, 0.3)'
            : '0 0 15px 3px rgba(112, 161, 255, 0.4)',
          borderRadius: '8px',
        }}
        maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
        bodyStyle={{
          backgroundColor: theme === 'dark' ? '#1f1f1f' : '#f9f9f9',
          color: theme === 'dark' ? '#e0e0e0' : '#333',
          padding: '24px',
          borderRadius: '8px',
          maxHeight: '70vh',
          overflowY: 'auto'
        }}
        footer={[
          <AntButton key="close" onClick={() => setIsChecklistModalVisible(false)}>
            关闭
          </AntButton>,
          <AntButton
            key="confirm"
            type="primary"
            onClick={() => {
              message.success('提交成功');
              setIsChecklistModalVisible(false);
            }}
          >
            确认并提交认证
          </AntButton>,
        ]}
        closable={false}
      >
        <Typography.Title 
          level={4} 
          style={{ 
            color: theme === 'dark' ? '#e0e0e0' : '#333', 
            marginBottom: '24px',
            textAlign: 'center',
            paddingBottom: '16px',
            borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#e8e8e8'}`
          }}
        >
          产品碳足迹认证 - 待提交材料核验
        </Typography.Title>
        
        <div style={{ marginBottom: '24px' }}>
          <Typography.Text strong style={{ color: theme === 'dark' ? '#ccc' : '#555' }}>工作流 ID: </Typography.Text>
          <Typography.Text style={{ color: theme === 'dark' ? '#e0e0e0' : '#333' }}>{workflowId}</Typography.Text>
        </div>

        <Divider style={{ borderColor: theme === 'dark' ? '#444' : '#e8e8e8' }} />

        <Row gutter={24} style={{ marginBottom: '24px' }}>
          <Col span={12}>
            <Typography.Title level={5} style={{ color: theme === 'dark' ? '#d0d0d0' : '#444', marginBottom: '12px' }}>产品信息</Typography.Title>
            <p style={{ margin: '4px 0', color: theme === 'dark' ? '#bbb' : '#666' }}><Typography.Text strong>名称:</Typography.Text> {productInfo.name}</p>
            <p style={{ margin: '4px 0', color: theme === 'dark' ? '#bbb' : '#666' }}><Typography.Text strong>型号:</Typography.Text> {productInfo.model}</p>
            <p style={{ margin: '4px 0', color: theme === 'dark' ? '#bbb' : '#666' }}><Typography.Text strong>描述:</Typography.Text> {productInfo.description}</p>
          </Col>
          <Col span={12}>
            <Typography.Title level={5} style={{ color: theme === 'dark' ? '#d0d0d0' : '#444', marginBottom: '12px' }}>遵循标准</Typography.Title>
            <p style={{ color: theme === 'dark' ? '#bbb' : '#666' }}>{disclosureStandard}</p>
          </Col>
        </Row>

        <Divider style={{ borderColor: theme === 'dark' ? '#444' : '#e8e8e8' }} />

        <Typography.Title level={5} style={{ color: theme === 'dark' ? '#d0d0d0' : '#444', marginBottom: '16px' }}>核验清单</Typography.Title>
        {materials.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={materials}
            renderItem={(item) => (
              <List.Item
                style={{
                  backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
                  marginBottom: '8px',
                  padding: '12px 16px',
                  borderRadius: '4px',
                  border: theme === 'dark' ? '1px solid #333' : '1px solid #e8e8e8'
                }}
                actions={[
                  <AntButton type="link" size="small" onClick={() => message.info(`查看 ${item.name} 功能待实现`)}>
                    查看
                  </AntButton>
                ]}
              >
                <List.Item.Meta
                  avatar={item.icon}
                  title={<span style={{ color: theme === 'dark' ? '#e0e0e0' : '#333' }}>{item.name}</span>}
                  description={<span style={{ color: theme === 'dark' ? '#aaa' : '#777' }}>状态: {item.status}</span>}
                />
              </List.Item>
            )}
            style={{ border: 'none', background: 'transparent' }}
          />
        ) : (
          <Empty description={<span style={{ color: theme === 'dark' ? '#aaa' : '#555' }}>暂无待核验的材料文件</span>} />
        )}
      </Modal>
    );
  };

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<NodeData>) => {
    const updateNodes = (nds: Node<NodeData>[]) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const nodeType = node.type as NodeType;
          let updatedData: NodeData;

          switch (nodeType) {
            case 'manufacturing': {
              const manufacturingData = node.data as ManufacturingNodeData;
              const manufacturingUpdates = updates as Partial<ManufacturingNodeData>;
              updatedData = {
                ...manufacturingData,
                ...manufacturingUpdates,
                label: manufacturingUpdates.label || manufacturingData.label,
                nodeName: manufacturingUpdates.nodeName || manufacturingData.nodeName,
                lifecycleStage: manufacturingUpdates.lifecycleStage || manufacturingData.lifecycleStage,
                emissionType: manufacturingUpdates.emissionType || manufacturingData.emissionType,
                activityScore: manufacturingUpdates.activityScore || manufacturingData.activityScore,
                carbonFactor: manufacturingUpdates.carbonFactor || manufacturingData.carbonFactor,
                activitydataSource: manufacturingUpdates.activitydataSource || manufacturingData.activitydataSource,
                carbonFootprint: manufacturingUpdates.carbonFootprint || manufacturingData.carbonFootprint,
                energyConsumption: typeof manufacturingUpdates.energyConsumption === 'number' ? manufacturingUpdates.energyConsumption : manufacturingData.energyConsumption,
                energyType: manufacturingUpdates.energyType || manufacturingData.energyType,
                ElectricityAccountingMethod: manufacturingUpdates.ElectricityAccountingMethod || manufacturingData.ElectricityAccountingMethod,
                ElectricityAllocationMethod: manufacturingUpdates.ElectricityAllocationMethod || manufacturingData.ElectricityAllocationMethod,
                EnergyConsumptionMethodology: manufacturingUpdates.EnergyConsumptionMethodology || manufacturingData.EnergyConsumptionMethodology,
                EnergyConsumptionAllocationMethod: manufacturingUpdates.EnergyConsumptionAllocationMethod || manufacturingData.EnergyConsumptionAllocationMethod,
                chemicalsMaterial: manufacturingUpdates.chemicalsMaterial || manufacturingData.chemicalsMaterial,
                MaterialAllocationMethod: manufacturingUpdates.MaterialAllocationMethod || manufacturingData.MaterialAllocationMethod,
                WaterUseMethodology: manufacturingUpdates.WaterUseMethodology || manufacturingData.WaterUseMethodology,
                WaterAllocationMethod: manufacturingUpdates.WaterAllocationMethod || manufacturingData.WaterAllocationMethod,
                packagingMaterial: manufacturingUpdates.packagingMaterial || manufacturingData.packagingMaterial,
                direct_emission: manufacturingUpdates.direct_emission || manufacturingData.direct_emission,
                WasteGasTreatment: manufacturingUpdates.WasteGasTreatment || manufacturingData.WasteGasTreatment,
                WasteDisposalMethod: manufacturingUpdates.WasteDisposalMethod || manufacturingData.WasteDisposalMethod,
                WastewaterTreatment: manufacturingUpdates.WastewaterTreatment || manufacturingData.WastewaterTreatment,
                processEfficiency: manufacturingUpdates.processEfficiency || manufacturingData.processEfficiency,
                wasteGeneration: manufacturingUpdates.wasteGeneration || manufacturingData.wasteGeneration,
                waterConsumption: manufacturingUpdates.waterConsumption || manufacturingData.waterConsumption,
                recycledMaterialPercentage: manufacturingUpdates.recycledMaterialPercentage || manufacturingData.recycledMaterialPercentage,
                productionCapacity: manufacturingUpdates.productionCapacity || manufacturingData.productionCapacity,
                machineUtilization: manufacturingUpdates.machineUtilization || manufacturingData.machineUtilization,
                qualityDefectRate: manufacturingUpdates.qualityDefectRate || manufacturingData.qualityDefectRate,
                processTechnology: manufacturingUpdates.processTechnology || manufacturingData.processTechnology,
                manufacturingStandard: manufacturingUpdates.manufacturingStandard || manufacturingData.manufacturingStandard,
                automationLevel: manufacturingUpdates.automationLevel || manufacturingData.automationLevel,
                manufacturingLocation: manufacturingUpdates.manufacturingLocation || manufacturingData.manufacturingLocation,
                byproducts: manufacturingUpdates.byproducts || manufacturingData.byproducts,
                emissionControlMeasures: manufacturingUpdates.emissionControlMeasures || manufacturingData.emissionControlMeasures
              } as ManufacturingNodeData;
              break;
            }
            case 'distribution': {
              const distributionData = node.data as DistributionNodeData;
              const distributionUpdates = updates as Partial<DistributionNodeData>;
              updatedData = {
                ...distributionData,
                ...distributionUpdates,
                label: distributionUpdates.label || distributionData.label,
                nodeName: distributionUpdates.nodeName || distributionData.nodeName,
                lifecycleStage: distributionUpdates.lifecycleStage || distributionData.lifecycleStage,
                emissionType: distributionUpdates.emissionType || distributionData.emissionType,
                activityScore: distributionUpdates.activityScore || distributionData.activityScore,
                carbonFactor: distributionUpdates.carbonFactor || distributionData.carbonFactor,
                activitydataSource: distributionUpdates.activitydataSource || distributionData.activitydataSource,
                carbonFootprint: distributionUpdates.carbonFootprint || distributionData.carbonFootprint,
                startPoint: distributionUpdates.startPoint || distributionData.startPoint,
                endPoint: distributionUpdates.endPoint || distributionData.endPoint,
                transportationDistance: typeof distributionUpdates.transportationDistance === 'number' ? distributionUpdates.transportationDistance : distributionData.transportationDistance,
                transportationMode: distributionUpdates.transportationMode || distributionData.transportationMode,
                vehicleType: distributionUpdates.vehicleType || distributionData.vehicleType,
                fuelType: distributionUpdates.fuelType || distributionData.fuelType,
                fuelEfficiency: distributionUpdates.fuelEfficiency || distributionData.fuelEfficiency,
                loadFactor: distributionUpdates.loadFactor || distributionData.loadFactor,
                refrigeration: distributionUpdates.refrigeration || distributionData.refrigeration,
                packagingMaterial: distributionUpdates.packagingMaterial || distributionData.packagingMaterial,
                packagingWeight: distributionUpdates.packagingWeight || distributionData.packagingWeight,
                warehouseEnergy: distributionUpdates.warehouseEnergy || distributionData.warehouseEnergy,
                storageTime: distributionUpdates.storageTime || distributionData.storageTime,
                storageConditions: distributionUpdates.storageConditions || distributionData.storageConditions,
                distributionNetwork: distributionUpdates.distributionNetwork || distributionData.distributionNetwork
              } as DistributionNodeData;
              break;
            }
            default: {
              const productData = node.data as ProductNodeData;
              const productUpdates = updates as Partial<ProductNodeData>;
              updatedData = {
                ...productData,
                ...productUpdates,
                label: productUpdates.label || productData.label,
                nodeName: productUpdates.nodeName || productData.nodeName,
                lifecycleStage: productUpdates.lifecycleStage || productData.lifecycleStage,
                emissionType: productUpdates.emissionType || productData.emissionType,
                activityScore: productUpdates.activityScore || productData.activityScore,
                carbonFactor: productUpdates.carbonFactor || productData.carbonFactor,
                activitydataSource: productUpdates.activitydataSource || productData.activitydataSource,
                carbonFootprint: productUpdates.carbonFootprint || productData.carbonFootprint,
                material: productUpdates.material || productData.material,
                weight_per_unit: productUpdates.weight_per_unit || productData.weight_per_unit,
                isRecycled: productUpdates.isRecycled || productData.isRecycled,
                recycledContent: productUpdates.recycledContent || productData.recycledContent,
                recycledContentPercentage: productUpdates.recycledContentPercentage || productData.recycledContentPercentage,
                sourcingRegion: productUpdates.sourcingRegion || productData.sourcingRegion,
                SourceLocation: productUpdates.SourceLocation || productData.SourceLocation,
                Destination: productUpdates.Destination || productData.Destination,
                SupplierName: productUpdates.SupplierName || productData.SupplierName,
                SupplierAddress: productUpdates.SupplierAddress || productData.SupplierAddress,
                ProcessingPlantAddress: productUpdates.ProcessingPlantAddress || productData.ProcessingPlantAddress,
                RefrigeratedTransport: productUpdates.RefrigeratedTransport || productData.RefrigeratedTransport,
                weight: productUpdates.weight || productData.weight,
                supplier: productUpdates.supplier || productData.supplier,
                certaintyPercentage: productUpdates.certaintyPercentage || productData.certaintyPercentage
              } as ProductNodeData;
            }
          }

          return {
            ...node,
            data: updatedData
          };
        }
        return node;
      });

    setNodes(updateNodes);
    calculateAiSummary();
  }, [nodes, setNodes, calculateAiSummary]);

  return (
    <div className="editor-layout">
      <div className="editor-header">
        <div className="header-left">
          <h2 className="workflow-title">碳足迹流程图</h2>
        </div>
        <div className="header-right">
          {workflowId && (
            <Button
              onClick={() => setIsChecklistModalVisible(true)}
              style={{ marginRight: '8px' }}
            >
              发起认证
            </Button>
          )}
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
          <Button onClick={() => setIsCheckpointModalVisible(true)}>
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
              style={{ background: theme === 'dark' ? '#1a1a1a' : '#ffffff' }}
              connectionLineStyle={connectionLineStyle}
              defaultEdgeOptions={defaultEdgeOptions}
              connectionLineType={ConnectionLineType.SmoothStep}
              attributionPosition="bottom-left"
              connectionMode={ConnectionMode.Loose}
              deleteKeyCode={['Backspace', 'Delete']}
              elevateNodesOnSelect={true}
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
                    selectedNode={selectedNode}
                    onUpdate={handleNodeUpdate}
                    updateAiSummary={calculateAiSummary}
                  />
                </Panel>
              )}
              
            </ReactFlow>
          </div>
        </div>
        
      </div>
      {renderCheckpointModal()}
      {renderChecklistModal()}
    </div>
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
      `}</style>
      <ReactFlowProvider>
        <CarbonFlowInner />
      </ReactFlowProvider>
    </ConfigProvider>
  );
};