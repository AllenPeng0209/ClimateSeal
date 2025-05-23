import React, { useState, useEffect, useCallback } from 'react';
import { useAutoSaveOnIdle } from '~/hooks/useAutoSaveOnIdle'; // 新增：導入自動保存 Hook
import {
  Button,
  Card,
  Col,
  Row,
  Space,
  Table,
  Input,
  Select,
  Modal,
  Drawer,
  Form,
  message,
  Popconfirm,
  Upload,
  Tooltip,
  Spin,
  Empty,
  List,
  Tabs, // <-- Import Tabs
  Typography, // <-- Import Typography
  Radio, // <-- Import Radio
  Checkbox, // <-- Import Checkbox
  DatePicker, // <-- Import DatePicker
  Divider,
  Tag, // <-- Import Tag
} from 'antd';
import type { FormInstance } from 'antd';
import {
  SettingOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
  EyeOutlined,
  DeleteOutlined,
  ExperimentOutlined,
  EditOutlined,
  InboxOutlined,
  ClearOutlined,
  FileOutlined,
  FunctionOutlined, // For AI数据补全
  CloudDownloadOutlined, // For AI数据收集
  SecurityScanOutlined, // For AI风险评测
  CheckOutlined,
} from '@ant-design/icons';
import { ClientOnly } from 'remix-utils/client-only';
import type { UploadFile, UploadProps, RcFile } from 'antd/es/upload/interface'; // Added RcFile here
import { useCarbonFlowStore, emitCarbonFlowData } from './CarbonFlowStore';
import type { Node, Edge as ReactFlowEdge } from 'reactflow'; // Edge is kept for now, aliased to avoid conflict

// Helper function to dispatch chat trigger events
const dispatchChatTriggerEvent = (type: string, payload: any) => {
  const event = new CustomEvent('carbonflow-trigger-chat', {
    detail: {
      type,
      payload,
    },
  });
  window.dispatchEvent(event);
  console.log(`[CarbonPanel] Dispatched event: ${type}`, payload);
};
import type { NodeData, ProductNodeData, FinalProductNodeData, DistributionNodeData } from '~/types/nodes';
import type { TableProps, ColumnType } from 'antd/es/table';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import { data, useLoaderData } from '@remix-run/react';
import type { CarbonFlowAction } from '~/types/actions';
import { supabase } from '~/lib/supabase';
import type { UploadChangeParam } from 'antd/es/upload';
// import type { RcFile } from 'antd/es/upload'; // Moved to line with UploadFile

// Import newly created type files
import type { SceneInfoType } from '~/types/scene';
import type { AIScoreType, ModelScoreType } from '~/types/scores';
import type {
  UploadedFile,
  ParsedEmissionSource,
  ModalUploadFile,
  // FileRecord, // FileRecord is defined but never used
  WorkflowFileRecord,
} from '~/types/files'; // Restored FileRecord, WorkflowFileRecord
import type { Workflow } from '~/types/workflow';
import moment from 'moment';
import { convertKeysToSnakeCase } from '~/utils/caseConverter';
import { CarbonFlowAISummary } from './score/AISummary';
import { TaskProgressCard } from './panel/components/TaskProgressCard';

// File types enum based on PRD
const RawFileTypes = [
  'BOM',
  '能耗数据',
  '运输数据',
  '废弃物',
  '原材料运输',
  '成品运输',
  '产品使用数据',
  '成品废弃数据',
];

const lifecycleStages = [
  '全部',
  '原材料获取阶段',
  '生产阶段',
  '分销运输阶段',
  '使用阶段',
  '寿命终止阶段',
];

const emissionCategories = ['原材料', '包装材料', '能耗', '运输', '废弃物'];

// --- 映射关系 ---
const lifecycleStageToNodeTypeMap: Record<string, string> = {
  '原材料获取阶段': 'product',
  '生产阶段': 'manufacturing',
  '分销运输阶段': 'distribution',
  '使用阶段': 'usage',
  '寿命终止阶段': 'disposal',
};

const nodeTypeToLifecycleStageMap: Record<string, string> = Object.fromEntries(
  Object.entries(lifecycleStageToNodeTypeMap).map(([key, value]) => [value, key])
);
// --- 结束映射关系 ---

// Add workflowId to props
export function CarbonCalculatorPanel({ workflowId, workflowName: initialWorkflowName, workFlow }: { workflowId: string, workflowName: string, workFlow: Workflow }) {
  const [settingsForm] = Form.useForm(); // Added for the settings modal form instance
  const [sceneInfo, setSceneInfo] = useState<SceneInfoType>({}); // Placeholder state
  const [modelScore, setModelScore] = useState<ModelScoreType>({}); // Placeholder state
  const [selectedStage, setSelectedStage] = useState<string>(lifecycleStages[0]);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isEmissionDrawerVisible, setIsEmissionDrawerVisible] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null); // New state to track editing node ID
  const [drawerInitialValues, setDrawerInitialValues] = useState<Partial<NodeData & { lifecycleStage: string }>>(
    {},
  ); // 用于传递初始值
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false); // State for the upload modal visibility
  const [modalFileList, setModalFileList] = useState<ModalUploadFile[]>([]); // State for files in the modal upload list
  const [isFactorMatchModalVisible, setIsFactorMatchModalVisible] = useState(false); // 新增：因子匹配弹窗状态
  const [selectedFactorMatchSources, setSelectedFactorMatchSources] = useState<React.Key[]>([]); // 新增：因子匹配弹窗中选中的排放源 (IDs)
  const [factorMatchModalSources, setFactorMatchModalSources] = useState<Node<NodeData>[]>([]); // New state for factor match modal data
  const [matchResults, setMatchResults] = useState<{
    success: string[];
    failed: string[];
    logs: string[];
  }>({
    success: [],
    failed: [],
    logs: [],
  }); // 新增：存储匹配结果的状态
  const [showMatchResultsModal, setShowMatchResultsModal] = useState(false); // 新增：匹配结果弹窗显示状态
  const [backgroundDataActiveTabKey, setBackgroundDataActiveTabKey] = useState<string>('database'); // Re-add state for active background data tab
  const [isUploading, setIsUploading] = useState(false); // State for upload loading

  const [aiAutofillLoading, setAiAutofillLoading] = useState(false);
  const [isManualSaving, setIsManualSaving] = useState(false); // 新增：手動保存加載狀態

  // --- 自動保存 --- 
  const saveCurrentWorkflow = useCarbonFlowStore(state => state.saveCurrentWorkflow);

  useAutoSaveOnIdle({
    onIdle: () => {
      if (saveCurrentWorkflow) {
        console.log('用戶閒置，嘗試自動保存...');
        saveCurrentWorkflow()
          .then(() => {
            message.info('工作流已自動保存！', 2); // 提示持續2秒
            console.log('自動保存成功。');
          })
          .catch((error: any) => {
            message.error('自動保存失敗，請手動保存。', 3);
            console.error('自動保存失敗:', error);
          });
      } else {
        console.warn('saveCurrentWorkflow 函數在 store 中不可用，無法自動保存。');
      }
    },
    idleTimeout: 10 * 60 * 1000, // 10 分鐘閒置超時
  });
  // --- 結束自動保存 --- 

  // --- 手動保存處理函數 ---
  const handleManualSave = async () => {
    if (saveCurrentWorkflow) {
      setIsManualSaving(true);
      console.log('手動保存觸發...');
      try {
        await saveCurrentWorkflow();
        message.success('工作流已成功保存！', 2);
        console.log('手動保存成功。');
      } catch (error) {
        message.error('手動保存失敗，請稍後再試或檢查控制台。', 3);
        console.error('手動保存失敗:', error);
      } finally {
        setIsManualSaving(false);
      }
    } else {
      message.warning('保存功能當前不可用。', 3);
      console.warn('saveCurrentWorkflow 函數在 store 中不可用，無法手動保存。');
    }
  };
  // --- 結束手動保存處理函數 --- // State for upload loading

  // States for the new Parse File Modal
  const [parsedEmissionSources, setParsedEmissionSources] = useState<ParsedEmissionSource[]>([]);
  const [isAIAutoFillModalVisible, setIsAIAutoFillModalVisible] = useState(false); // AI补全弹窗状态
  const [aiFilterStage, setAiFilterStage] = useState<string | undefined>();
  const [aiFilterName, setAiFilterName] = useState<string>('');
  const [aiFilterCategory, setAiFilterCategory] = useState<string | undefined>();
  const [aiFilterMissingActivity, setAiFilterMissingActivity] = useState(false);
  const [aiFilterMissingConversion, setAiFilterMissingConversion] = useState(false);
  const [aiFilterShowType, setAiFilterShowType] = useState<'all' | 'ai' | 'manual'>('all');
  const [aiAutoFillSelectedRowKeys, setAiAutoFillSelectedRowKeys] = useState<React.Key[]>([]);
  const [aiAutoFillConfirmType, setAiAutoFillConfirmType] = useState<'conversion' | 'transport' | null>(null);
  const [aiAutoFillResult, setAiAutoFillResult] = useState<
    {
      success: string[];
      failed: { id: string; reason: string }[];
    } | null
  >(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false); // <-- Add this line
  const [isAIFileParseModalVisible, setIsAIFileParseModalVisible] = useState(false); // <-- New state for AI File Parse Modal
  const [selectedFileForParse, setSelectedFileForParse] = useState<UploadedFile | null>(null); // <-- New state for selected file in AI Parse Modal

  // ===== State for Current Task Progress =====
  // Removed local task state and table definitions

  // ===== End State for Current Task Progress =====

  // ===== State for dynamic card height =====
  const [modelScoreCardHeight, setModelScoreCardHeight] = useState<string | number>('auto');

  // Effect to sync Model Score card height with Target Scope card height
  useEffect(() => {
    const targetScopeCardElement = document.getElementById('targetScopeCard');
    if (targetScopeCardElement) {
      const height = targetScopeCardElement.offsetHeight;
      setModelScoreCardHeight(height);
    }
    // Optional: ResizeObserver to handle dynamic changes if targetScopeCard changes height
    // This might be overly complex if the height is relatively static after initial render
    // For now, we set it once on mount/workflowId change (if relevant)
  }, [sceneInfo]); // Re-run if sceneInfo changes, as it might affect targetScopeCard height

  // ===== 辅助函数：记录工作流操作 =====
  const logWorkflowAction = async (actionDetails: {
    action_type: string;
    operation_name: string;
    triggered_by_node_ids?: string[];
    parameters?: any;
    status: string;
    results_summary?: any;
    detailed_logs?: string;
    user_prompt?: string;
    ai_response_summary?: string;
  }) => {
    try {
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      let validTriggeredByNodeIds: string[] | undefined = undefined;

      if (actionDetails.triggered_by_node_ids && Array.isArray(actionDetails.triggered_by_node_ids)) {
        const allValid = actionDetails.triggered_by_node_ids.every(id => uuidRegex.test(id));
        if (allValid) {
          validTriggeredByNodeIds = actionDetails.triggered_by_node_ids;
        } else {
          console.warn('Some triggered_by_node_ids are not valid UUIDs. Omitting from log.');
          // Optionally, you could log the non-UUIDs to a different field or handle them differently.
        }
      }

      const { error } = await supabase.from('workflow_action_logs').insert([
        {
          workflow_id: workflowId, // Assumes workflowId is available in this scope
          ...actionDetails,
          triggered_by_node_ids: validTriggeredByNodeIds, // Use validated or undefined IDs
        },
      ]);
      if (error) {
        console.error('Error logging workflow action:', error.message);
        // message.warning(`操作日志记录失败: ${error.message}`); // Optional: notify user
      }
    } catch (err: any) {
      console.error('Exception while logging workflow action:', err.message);
    }
  };
  // ===== 结束辅助函数 =====

  const saveWorkflowSceneInfo = async (sceneInfo: SceneInfoType) => {
    const { error } = await supabase
      .from('workflows')
      .update({ scene_info: sceneInfo })
      .eq('id', workflowId);
  }

  const saveWorkflowNodes = async (nodeDataList: NodeData[]) => {
    // First, delete all nodes that are about to be updated/inserted to avoid conflicts
    // This assumes nodeDataList contains all nodes for the current save operation that might already exist.
    // If it only contains new nodes, this delete operation might be too broad or unnecessary for those.
    // If it contains a mix, we need to be careful.
    // For an upsert-like behavior, deleting first is common.
    const deletePromises = nodeDataList.map(node => {
      return supabase.from('workflow_nodes').delete()
        .eq('workflow_id', node.workflowId)
        .eq('node_id', node.nodeId);
    });

    const deleteResults = await Promise.all(deletePromises);
    deleteResults.forEach(result => {
      if (result.error) {
        // It's often okay if a delete fails because the node didn't exist, but log other errors.
        // Supabase delete doesn't error if rows don't exist by default, but good to be aware.
        console.warn('Warning during node deletion phase (might be ok if node was new):', result.error?.message);
      }
    });

    // Now, prepare and insert the new node data
    const newNodeDataList = nodeDataList.map(node => {
      let newNode = convertKeysToSnakeCase(node)
      newNode['activity_data_source'] = newNode['activitydata_source'] || '';
      delete newNode['activitydata_source'];
      newNode['carbon_factor_data_source'] = newNode['carbon_factordata_source'] || ''; // 确保 carbon_factor 有默认值
      delete newNode['carbon_factordata_source'];
      delete newNode['end_point'];
      delete newNode['start_point'];
      delete newNode['supplier'];
      delete newNode['evidence_files']; // <-- Key fix for runtime error
      console.log('Preparing to save node data:', newNode);
      return newNode;
    });

    if (newNodeDataList.length === 0) {
      console.log('No node data to save.');
      return true; // Or false, depending on desired behavior for empty list
    }

    const { data, error } = await supabase.from('workflow_nodes').insert(newNodeDataList);
    if (error) {
      console.error('Error saving workflow nodes:', error.message);
      message.error(`保存节点失败: ${error.message}`);
      return false;
    } else {
      console.log('Workflow nodes saved successfully:', data);
      return true;
    }

  }

  const deleteWorkflowNodes = async (nodeIds: string[], workflowId: string) => {
    await supabase.from('workflow_nodes').delete().eq('workflow_id', workflowId).in('node_id', nodeIds);
  }

  const convertDbRecordsToNodeData = (records: any[]): NodeData[] => {
    return records.map(record => {
      // Base object, assume it could be any NodeData type initially
      const baseNodeData: Partial<NodeData> = {
        nodeId: record.node_id,
        nodeType: record.node_type,
        workflowId: record.workflow_id,
        label: record.label || record.node_name,
        quantity: String(record.quantity ?? ''),
        activityUnit: record.activity_unit || '',
        carbonFactor: String(record.carbon_factor ?? ''),
        carbonFactorName: record.carbon_factor_name || '',
        carbonFactorUnit: record.carbon_factor_unit || '',
        emissionType: record.emission_type || '',
        supplementaryInfo: record.supplementary_info || '',
        activitydataSource: record.activity_data_source || '',
        carbonFactordataSource: record.carbon_factor_data_source || '',
        emissionFactorGeographicalRepresentativeness: record.emission_factor_geographical_representativeness || '',
        emissionFactorTemporalRepresentativeness: record.emission_factor_temporal_representativeness || '',
        activityUUID: record.activity_uuid || '',
        unitConversion: String(record.unit_conversion ?? ''),
      };

      // Handle evidence files
      if (record.evidence_files && Array.isArray(record.evidence_files) && record.evidence_files.length > 0) {
        baseNodeData.hasEvidenceFiles = true;
        baseNodeData.evidenceFiles = record.evidence_files;
        baseNodeData.evidenceVerificationStatus = record.evidence_verification_status || '待解析';
      } else {
        baseNodeData.hasEvidenceFiles = false;
        baseNodeData.evidenceFiles = [];
        baseNodeData.evidenceVerificationStatus = record.evidence_verification_status || '无需验证';
      }

      let finalNodeData: NodeData = baseNodeData as NodeData;

      // Handle transport-specific fields only if nodeType is 'distribution'
      if (record.node_type === 'distribution') {
        const distNodeSpecificData: Partial<DistributionNodeData> = {
            ...baseNodeData, // Spread common fields
            nodeType: 'distribution', // Set the literal type
            startPoint: record.start_point || '',
            endPoint: record.end_point || '',
            transportationMode: record.transportation_mode || '',
            transportationDistance: record.transportation_distance || 0,
            // distributionDistance: record.transportation_distance || 0, // Already covered by transportationDistance conceptually
        };
        finalNodeData = distNodeSpecificData as DistributionNodeData;
      } else if (record.node_type === 'product') {
        finalNodeData = baseNodeData as ProductNodeData;
      } else if (record.node_type === 'finalProduct') {
        finalNodeData = baseNodeData as FinalProductNodeData;
      }
      // Add other else if blocks for other specific node types if they have unique required fields beyond baseNodeData

      // Add common fields that might not have been set if not a specific type yet
      finalNodeData.dataRisk = record.data_risk || undefined;
      finalNodeData.backgroundDataSourceTab = record.background_data_source_tab || 'database';

      return finalNodeData;
    });
  };

  const getWorkflowNodes = async (workflowId: string): Promise<NodeData[]> => {
    if (!workflowId) {
      console.warn('getWorkflowNodes called without workflowId');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('workflow_nodes')
        .select("*")
        .eq('workflow_id', workflowId);

      if (error) {
        console.error('Error fetching workflow nodes:', error);
        throw error;
      }

      if (!data || !Array.isArray(data)) {
        console.warn('No data returned from workflow_nodes query');
        return [];
      }

      console.log('Raw workflow nodes data:', data);
      const convertedData = convertDbRecordsToNodeData(data);
      console.log('Converted workflow nodes:', convertedData);

      return convertedData;
    } catch (err) {
      console.error('Exception in getWorkflowNodes:', err);
      throw err;
    }
  }

  // ===== 证据文件（Drawer 内 Upload）状态 =====
  const [drawerEvidenceFiles, setDrawerEvidenceFiles] = useState<UploadedFile[]>([]);
  // Pending uploads when node not yet created
  const [pendingEvidenceFiles, setPendingEvidenceFiles] = useState<File[]>([]);

  const uploadModalFormRef = React.useRef<FormInstance>(null);
  const loadingMessageRef = React.useRef<(() => void) | null>(null); // Ref for loading message

  // 从CarbonFlowStore获取数据 - 重要：这必须在所有使用nodes的函数之前定义
  const { nodes, aiSummary, setNodes: setStoreNodes, setSceneInfo: setStoreSceneInfo } = useCarbonFlowStore();

  const halfLifecycleSelectedStages = ['原材料获取', '生产'];
  const fullLifecycleSelectedStages = ['原材料获取', '生产', '分销与运输', '使用', '寿命终止'];
  const allLifecycleStagesForCheckboxes = [
    { label: '原材料获取', value: '原材料获取' },
    { label: '生产', value: '生产' },
    { label: '分销与运输', value: '分销与运输' },
    { label: '使用', value: '使用' },
    { label: '寿命终止', value: '寿命终止' },
  ];

  const [workflowName, setWorkflowName] = useState(initialWorkflowName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');

  // Effect to initialize settings form when modal becomes visible or sceneInfo changes
  useEffect(() => {
    if (isSettingsModalVisible) {
      let derivedLifecycleType = sceneInfo.lifecycleType;
      let initialHalfStages = sceneInfo.calculationBoundaryHalfLifecycle || [];
      let initialFullStages = sceneInfo.calculationBoundaryFullLifecycle || [];

      if (!derivedLifecycleType) {
        if (initialFullStages.length > 0 && initialFullStages.every(stage => fullLifecycleSelectedStages.includes(stage)) && initialFullStages.length === fullLifecycleSelectedStages.length) {
          derivedLifecycleType = 'full';
        } else if (initialHalfStages.length > 0 && initialHalfStages.every(stage => halfLifecycleSelectedStages.includes(stage)) && initialHalfStages.length === halfLifecycleSelectedStages.length) {
          derivedLifecycleType = 'half';
        }
      }

      settingsForm.resetFields();
      settingsForm.setFieldsValue({
        ...sceneInfo,
        lifecycleType: derivedLifecycleType,
        calculationBoundaryHalfLifecycle: derivedLifecycleType === 'half'
          ? halfLifecycleSelectedStages
          : (derivedLifecycleType === 'full' ? [] : initialHalfStages),
        calculationBoundaryFullLifecycle: derivedLifecycleType === 'full'
          ? fullLifecycleSelectedStages
          : (derivedLifecycleType === 'half' ? [] : initialFullStages),
        dataCollectionStartDate: sceneInfo.dataCollectionStartDate && moment(sceneInfo.dataCollectionStartDate),
        dataCollectionEndDate: sceneInfo.dataCollectionEndDate && moment(sceneInfo.dataCollectionEndDate),
      });
    }
  }, [isSettingsModalVisible, sceneInfo, settingsForm]); // Added sceneInfo and settingsForm

  /*
   * It's good practice to define these hooks near other component-level hooks/state.
   * Ensure useCarbonFlowStore is imported, e.g. import { useCarbonFlowStore } from './CarbonFlowStore';
   */
  const loadWorkflowIntoStore = useCarbonFlowStore((store) => store.loadWorkflow);
  const setNodesInStore = useCarbonFlowStore((store) => store.setNodes); // Assuming your original setStoreNodes maps to this store action
  const currentWorkflowIdInStore = useCarbonFlowStore((state) => state.workflowId);

  useEffect(() => {
    // Assuming workFlow prop uses snake_case for some fields as observed from errors
    if (workFlow && workFlow.id && workFlow.id !== currentWorkflowIdInStore) {
      console.log(
        `CarbonCalculatorPanel: Condition MET. Initializing/loading workflow ID: ${workFlow.id} into store. Previous store workflow ID: ${currentWorkflowIdInStore || 'none'}.`,
      );

      // Map from the prop's snake_case to the store's expected camelCase Workflow type
      const workflowToLoad: Workflow = {
        workflowId: workFlow.id, // map from workFlow.id (snake_case from prop)
        name: workFlow.name || '',
        description: workFlow.description || '',
        isPublic: workFlow.is_public !== undefined ? workFlow.is_public : (workFlow.isPublic || false), // Prioritize snake_case, fallback to camelCase then default
        userId: workFlow.user_id || workFlow.userId || '', // Prioritize snake_case
        organizationId: workFlow.organization_id || workFlow.organizationId || null, // Prioritize snake_case
        sceneInfo: workFlow.scene_info || workFlow.sceneInfo || { // Prioritize snake_case
          productName: '',
          productDesc: '',
          productSpecs: '',
          taskName: '',
          verificationLevel: 'unverified',
          standard: 'ISO 14067',
          lifecycleType: 'half',
          calculationBoundaryHalfLifecycle: [],
          calculationBoundaryFullLifecycle: [],
          dataCollectionStartDate: new Date().toISOString(),
          dataCollectionEndDate: new Date().toISOString(),
          boundary: ''
        },
        nodes: [], 
        edges: workFlow.edges || [],
        modelScore: workFlow.model_score || workFlow.modelScore || undefined, // Prioritize snake_case
        createdAt: workFlow.created_at || workFlow.createdAt || new Date().toISOString(), // Prioritize snake_case
        updatedAt: workFlow.updated_at || workFlow.updatedAt || new Date().toISOString(), // Prioritize snake_case
        tags: workFlow.tags || [],
        version: workFlow.version || 1,
      };

      loadWorkflowIntoStore(workflowToLoad);

      console.log('workFlow changed in CarbonCalculatorPanel:', workFlow);
      const _sceneInfo = workFlow.scene_info || workFlow.sceneInfo || {}; // Prioritize snake_case
      setSceneInfo(_sceneInfo);

      getWorkflowNodes(workFlow.id) 
        .then((fetchedNodes) => {
          console.log(`Fetched nodes from workFlow (useEffect initial load for ID ${workFlow.id}):`, fetchedNodes);
          const nodeList = fetchedNodes.map((node) => ({
            id: node.nodeId,
            type: node.nodeType,
            position: { x: node.positionX || 0, y: node.positionY || 0 }, // Assuming positionX and positionY exist on node from fetchedNodes
            data: node as NodeData, // Ensure data field matches NodeData type
          } as Node<NodeData>));

          setNodesInStore(nodeList); // Update nodes in the Zustand store
        })
        .catch((error) => {
          console.error(`Error fetching nodes for workFlow ID ${workFlow.id}:`, error);
          message.error(`获取工作流 ${workFlow.id} 的节点时出错，请稍后重试。`);
        });
    } else if (workFlow && workFlow.id && workFlow.id === currentWorkflowIdInStore) {
      console.log(`CarbonCalculatorPanel: Condition NOT MET. Workflow ID ${workFlow.id} is already current in store. Skipping data refresh logic.`);
    } else {
      console.log('CarbonCalculatorPanel: Condition NOT MET. workFlow or workFlow.id is falsy, or some other reason.');
      if (!workFlow) {
        console.log('Reason: workFlow prop is falsy.');
      } else if (!workFlow.id) {
        console.log('Reason: workFlow.id is falsy.');
      }
    }

  }, [workFlow, loadWorkflowIntoStore, setNodesInStore, currentWorkflowIdInStore, getWorkflowNodes]);

  // Helper function to filter nodes for the main table based on selectedStage
  const getFilteredNodesForTable = useCallback((): Node<NodeData>[] => {
    if (!nodes) {
      return [];
    }
    let stageType = '';
    if (selectedStage !== '全部') {
      stageType = lifecycleStageToNodeTypeMap[selectedStage] || '';
    }
    return nodes.filter((node) => (stageType === '' || node.type === stageType) && node.data);
  }, [nodes, selectedStage]);

  // Helper: upload a single evidence file to Supabase and return UploadedFile metadata
  const uploadEvidenceFile = async (file: File, nodeId?: string): Promise<UploadedFile | null> => {
    try {
      const originalName = file.name;
      const extension = originalName.split('.').pop() || 'dat';
      const safeFileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${extension}`;
      const filePath = `${workflowId}/${safeFileName}`;

      // 1) upload to storage
      const { error: storageErr } = await supabase.storage.from('files').upload(filePath, file);
      if (storageErr) {
        message.error(`上传失败: ${storageErr.message}`);
        return null;
      }

      // 2) insert into files table
      const { data: fileRow, error: fileTblErr } = await supabase
        .from('files')
        .insert({
          name: originalName,
          path: filePath,
          size: file.size,
          mime_type: file.type || 'application/octet-stream',
        })
        .select()
        .single();
      if (fileTblErr) {
        message.error(`写入文件表失败: ${fileTblErr.message}`);
        return null;
      }

      // 3) insert into workflow_files 表，只有当 nodeId 是合法 uuid 时才写入
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      const nodeUuid = nodeId && uuidRegex.test(nodeId) ? nodeId : null;
      const { error: wfErr } = await supabase
        .from('workflow_files')
        .insert({ workflow_id: workflowId, file_id: fileRow.id, workflow_node_id: nodeUuid });
      if (wfErr) {
        message.error(`写入关联表失败: ${wfErr.message}`);
      }

      const uploaded: UploadedFile = {
        id: fileRow.id,
        name: originalName,
        type: '证据文件',
        uploadTime: new Date().toISOString(),
        url: filePath,
        status: 'pending', // 状态代码为'pending'，但会在UI中显示为"待审核"
        size: file.size,
        mimeType: file.type,
      };

      // 重要：立即更新 nodes 以触发 aiSummary 重新计算
      if (nodeId && nodes) {
        const targetNode = nodes.find(n => n.id === nodeId);
        if (targetNode) {
          // 更新节点的 evidenceFiles 数组
          (targetNode.data as any).evidenceFiles = [
            ...((targetNode.data as any).evidenceFiles || []),
            uploaded
          ];

          // 设置证明材料验证状态为"待解析"
          (targetNode.data as any).evidenceVerificationStatus = '待解析';

          // 标记有证据文件
          (targetNode.data as any).hasEvidenceFiles = true;

          // 更新全局节点状态，会触发 aiSummary 更新
          setStoreNodes([...nodes]);
          emitCarbonFlowData(); // <--- 添加此行

          // 立即派发评分刷新事件，确保AI评分面板刷新
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('force-refresh-ai-summary'));
          }, 100);

          // 触发事件，通知其他组件数据已更新
          window.dispatchEvent(new CustomEvent('carbonflow-data-updated', {
            detail: { action: 'UPDATE_NODE', nodeId: nodeId }
          }));
        }
      }

      return uploaded;
    } catch (err: any) {
      console.error('uploadEvidenceFile error', err);
      message.error(`上传失败: ${err.message || err}`);
      return null;
    }
  };

  // 当编辑排放源变化时，同步证据文件到本地 state
  useEffect(() => {
    if (editingNodeId) {
      const nodeToEdit = nodes.find(node => node.id === editingNodeId);
      if (nodeToEdit) {
        // 添加类型转换，确保数据符合UploadedFile[]类型
        const evidenceFiles = (nodeToEdit.data as any).evidenceFiles || [];
        setDrawerEvidenceFiles(evidenceFiles as UploadedFile[]);
      } else {
        setDrawerEvidenceFiles([]);
      }
    } else {
      setDrawerEvidenceFiles([]);
    }
  }, [editingNodeId, nodes]);

  // 当aiSummary更新时，更新modelScore
  useEffect(() => {
    if (aiSummary) {
      setModelScore({
        credibilityScore: aiSummary.credibilityScore,
        completeness: { score: aiSummary.modelCompleteness?.score || 0 },
        traceability: { score: aiSummary.dataTraceability?.score || 0 },
        massBalance: { score: aiSummary.massBalance?.score || 0 },
        validation: { score: aiSummary.validation?.score || 0 }
      });
    }
  }, [aiSummary]);

  // 更新后的背景数据匹配按钮点击处理函数
  const handleCarbonFactorMatch = () => {
    console.log('背景数据匹配 clicked');
    // Directly use all nodes from the store for the modal
    setFactorMatchModalSources(nodes || []); // Populate state for the modal table
    setIsFactorMatchModalVisible(true);
  };

  const handleCheckpointManage = () => {
    console.log('检查点管理 clicked');
    alert('功能待实现');
  };

  const handleOpenSettings = () => setIsSettingsModalVisible(true);
  const handleCloseSettings = () => setIsSettingsModalVisible(false);
  const handleSaveSettings = async (values: any) => {
    console.log('Saving settings:', values);
    let finalHalfStages: string[] = [];
    let finalFullStages: string[] = [];

    if (values.lifecycleType === 'half') {
      finalHalfStages = halfLifecycleSelectedStages;
    } else if (values.lifecycleType === 'full') {
      finalFullStages = fullLifecycleSelectedStages;
    }
    const _sceneInfo: SceneInfoType = { // Renamed to avoid conflict with global sceneInfo if any
      ...values, 
      lifecycleType: values.lifecycleType, 
      calculationBoundaryHalfLifecycle: finalHalfStages,
      calculationBoundaryFullLifecycle: finalFullStages,
      productSpecs: sceneInfo.productSpecs, // Preserve existing values from component's state
      productDesc: sceneInfo.productDesc,   // Preserve existing values from component's state
    };
    setSceneInfo(_sceneInfo); // Update local state for immediate UI reflection if needed

    // This updates a Zustand store, ensure it's what you intend.
    setStoreSceneInfo({
      verificationLevel: values.verificationLevel,
      standard: values.standard,
      productName: values.productName,
    });

    try {
      await saveWorkflowSceneInfo(_sceneInfo);

    message.success('目标与范围已保存');

    // Dispatch event to trigger chat response for scene info saved
    const sceneInfoEvent = new CustomEvent('carbonflow-sceneinfo-saved-trigger-chat', {
      detail: { sceneInfo: _sceneInfo }
    });
    window.dispatchEvent(sceneInfoEvent);

    handleCloseSettings();

      logWorkflowAction({
        action_type: 'USER_SETTINGS_SAVE',
        operation_name: 'save_scene_info',
        parameters: {
          savedValues: {
            ...values,
            calculationBoundaryHalfLifecycle: finalHalfStages,
            calculationBoundaryFullLifecycle: finalFullStages
          }
        },
        status: 'COMPLETED_SUCCESS',
        results_summary: { message: 'Scene info saved successfully' }
      });

      dispatchChatTriggerEvent('goal_scope_saved', {
        status: 'success',
        message: '“目标与范围”设置已成功保存。',
        data: {
          productName: _sceneInfo.productName,
          standard: _sceneInfo.standard,
          lifecycleType: _sceneInfo.lifecycleType,
          taskName: _sceneInfo.taskName,
          verificationLevel: _sceneInfo.verificationLevel,
          // Add other relevant summary fields from _sceneInfo as needed
        }
      });

    } catch (error: any) {
      console.error('保存目标与范围失败:', error);
      message.error(`保存目标与范围失败: ${error.message}`);
      
      dispatchChatTriggerEvent('goal_scope_saved', {
        status: 'failure',
        message: `"目标与范围"设置保存失败: ${error.message}`,
      });

      logWorkflowAction({
        action_type: 'USER_SETTINGS_SAVE',
        operation_name: 'save_scene_info',
        parameters: {
            originalValues: values // Log original values on failure for debugging
        },
        status: 'COMPLETED_FAILURE',
        results_summary: { 
          message: 'Scene info save failed',
          error: error.message,
          stack: error.stack // Storing stack might be too verbose for some logging systems, consider if needed
        }
      });
    }
  };


  const handleStageSelect = (stage: string) => {
    setSelectedStage(stage);
    // No longer need to manually set emissionSources, table will react to selectedStage change via getFilteredNodesForTable
    console.log('Selected stage:', stage);
  };

  const handleAddEmissionSource = () => {
    // setEditingEmissionSource(null); // Replaced with ID logic
    setEditingNodeId(null);
    // 新增时，设置默认生命周期为当前选中的阶段
    setDrawerInitialValues({ lifecycleStage: selectedStage }); // Keep this part
    setIsEmissionDrawerVisible(true);
  };

  // --- handleEditEmissionSource needs refactoring later to use Node ID ---
  const handleEditEmissionSource = (nodeId: string) => { // Takes nodeId now
    const nodeToEdit = nodes.find(n => n.id === nodeId);
    if (!nodeToEdit) {
      message.error('未找到要编辑的节点');
      return;
    }
    setEditingNodeId(nodeId); // Store the ID
    const stage = nodeToEdit ? nodeTypeToLifecycleStageMap[nodeToEdit.type || ''] || selectedStage : selectedStage;
    const activeTab = (nodeToEdit.data as any).backgroundDataSourceTab || 'database';
    setBackgroundDataActiveTabKey(activeTab);

    // 确保使用label字段作为排放源名称
    const nodeName = nodeToEdit.data.label || (nodeToEdit.data as any).name || '';

    // Construct initial values directly from node data
    setDrawerInitialValues({
      ...(nodeToEdit.data as any),
      label: nodeName, // 确保表单中使用label字段
      lifecycleStage: stage,
      backgroundDataSourceTab: activeTab
    });
    setIsEmissionDrawerVisible(true);
  };


  const handleDeleteEmissionSource = async (id: string) => {
    console.log('Deleting emission source (node):', id);
    console.log('Before deletion - store nodes count:', nodes?.length || 0);

    // --- Removed local emissionSources update ---
    // setEmissionSources(prev => prev.filter(item => item.id !== id));

    // 同步更新 store 中的節點 (Keep this part)
    if (nodes && setStoreNodes) {
      const nodeExists = nodes.some(node => node.id === id);
      console.log('Node exists in store:', nodeExists);

      if (!nodeExists) {
        console.warn('嘗試刪除的節點在 store 中不存在，ID:', id);
        message.warning('節點不存在於流程圖中');
        return;
      }

      await deleteWorkflowNodes([id], workflowId); // Delete from database

      const updatedNodes = nodes.filter(node => node.id !== id);
      console.log('After filter - updated nodes count:', updatedNodes.length);

      setStoreNodes(updatedNodes);
      emitCarbonFlowData(); // <--- 添加此行

      window.dispatchEvent(new CustomEvent('carbonflow-data-updated', {
        detail: { action: 'DELETE_NODE', nodeId: id }
      }));

      message.success('排放源已刪除');
    } else {
      console.warn('Store 或 setStoreNodes 未定義');
      message.error('删除失败：无法访问数据存储'); // More informative error
    }
  };

  const handleCloseEmissionDrawer = () => {
    setIsEmissionDrawerVisible(false);
    // setEditingEmissionSource(null); // Replaced with ID logic
    setEditingNodeId(null);
    setDrawerInitialValues({}); // 关闭时清空初始值
    setDrawerEvidenceFiles([]);
  };

  // --- handleSaveEmissionSource needs major refactoring later ---
  const handleSaveEmissionSource = async (values: any) => {
    console.log('Saving emission source (node data):', values);
    const selectedStageName = values.lifecycleStage;
    const selectedNodeType = lifecycleStageToNodeTypeMap[selectedStageName] || 'product'; // 默认为 product

    if (editingNodeId) { // Use editingNodeId now
      // --- 更新已有節點 ---
      console.log(`Updating node: ${editingNodeId}`);
      // --- Removed local emissionSources update ---

      // 同步更新 store 中的節點 (Logic needs review/adjustment based on new NodeData structure)
      if (nodes && setStoreNodes) {
        const updatedNodes = nodes.map(node => {
          if (node.id === editingNodeId) {
            const currentNodeData = { ...node.data };
            const originalNodeType = node.type;

            // --- Simplified data update logic (needs verification against NodeData types) ---
            const dataToUpdate: Partial<NodeData> = { // Use Partial<NodeData> for safety
              label: values.label,
              nodeName: values.label,
              emissionType: values.emissionType,
              quantity: String(values.quantity ?? ''), // 修改这里：使用values.quantity替代values.activityData
              activityUnit: values.activityUnit || '',
              // Keep existing carbon factor or default? Needs clarification. Assuming keep for now.
              carbonFactor: String(currentNodeData.carbonFactor ?? 0),
              carbonFactorName: values.carbonFactorName || '',
              carbonFactorUnit: values.carbonFactorUnit || '',
              carbonFactordataSource: values.carbonFactordataSource || '',
              emissionFactorGeographicalRepresentativeness: values.emissionFactorGeographicalRepresentativeness || '',
              emissionFactorTemporalRepresentativeness: values.emissionFactorTemporalRepresentativeness || '',
              activitydataSource: values.activitydataSource || '',
              activityUUID: values.activityUUID || '',
              lifecycleStage: selectedStageName,
              supplementaryInfo: values.supplementaryInfo || '',
              unitConversion: String(values.unitConversion ?? 1),
              hasEvidenceFiles: (currentNodeData as any).hasEvidenceFiles || false, // Retain existing value
              dataRisk: (currentNodeData as any).dataRisk, // Retain existing value
              backgroundDataSourceTab: backgroundDataActiveTabKey as ('database' | 'manual'),
              // Transport fields - Add if they exist in NodeData, otherwise remove
              startPoint: values.startPoint || '',
              endPoint: values.endPoint || '',
              transportationMode: values.transportationMode || '', // 直接使用 values.transportationMode
              transportationDistance: values.distance ?? 0,    // 修改为transportationDistance
              distributionDistance: values.distance ?? 0,      // 同时添加distributionDistance
            };

            // 如果有transportType字段，映射到正确的属性名
            if (values.transportType) {
              (dataToUpdate as any).transportationMode = values.transportType;
            }

            // 如果有distance字段，映射到正确的属性名
            if (values.distance !== undefined) {
              (dataToUpdate as any).transportationDistance = values.distance;
              (dataToUpdate as any).distributionDistance = values.distance;
            }

            let finalNodeData = { ...currentNodeData, ...dataToUpdate, nodeType: selectedNodeType, nodeId: editingNodeId }; // Merge updates

            // Rebuild data if node type changes (Keep this logic, but verify NodeData fields)
            if (originalNodeType !== selectedNodeType) {
              console.log(`节点 ${editingNodeId} 类型从 ${originalNodeType} 变为 ${selectedNodeType}，重新构建数据结构。`);
              // ... (existing logic to rebuild based on commonData and selectedNodeType)
              // !!! IMPORTANT: This rebuild logic needs to be carefully verified against the actual fields defined in `~/types/nodes.ts` for each node type !!!
              // For now, assuming the existing switch case is mostly correct but needs field validation.
              const commonData = { ...dataToUpdate }; // Base common data on the updated fields
              switch (selectedNodeType) {
                // ... existing cases ...
                // Example adjustment for 'product': ensure fields match ProductNodeData
                case 'product':
                  finalNodeData = {
                    ...commonData,
                    label: commonData.label || values.label, // Ensure label is string
                    material: values.category, // Example: map category to material
                    // Ensure all required fields from ProductNodeData are present
                    weight_per_unit: (finalNodeData as ProductNodeData)?.weight_per_unit ?? '',
                    isRecycled: (finalNodeData as ProductNodeData)?.isRecycled ?? false,
                    recycledContent: (finalNodeData as ProductNodeData)?.recycledContent ?? '',
                    recycledContentPercentage: (finalNodeData as ProductNodeData)?.recycledContentPercentage ?? 0,
                    sourcingRegion: (finalNodeData as ProductNodeData)?.sourcingRegion ?? '',
                    SourceLocation: (finalNodeData as ProductNodeData)?.SourceLocation ?? '',
                    weight: (finalNodeData as ProductNodeData)?.weight ?? 0,
                    supplier: (finalNodeData as ProductNodeData)?.supplier ?? ''
                  } as ProductNodeData; // Assert specific type
                  break;
                // ... other cases need similar review ...
                default:
                  // Example for finalProduct
                  finalNodeData = {
                    ...commonData,
                    label: commonData.label || values.label, // Ensure label is string
                    finalProductName: values.label,
                    // Ensure all required fields from FinalProductNodeData are present
                    totalCarbonFootprint: (finalNodeData as FinalProductNodeData)?.totalCarbonFootprint ?? 0,
                    certificationStatus: (finalNodeData as FinalProductNodeData)?.certificationStatus ?? '未認證',
                    // Add optional fields if needed
                    environmentalImpact: (finalNodeData as FinalProductNodeData)?.environmentalImpact ?? '',
                    sustainabilityScore: (finalNodeData as FinalProductNodeData)?.sustainabilityScore ?? 0,
                    productCategory: values.category,
                    marketSegment: (finalNodeData as FinalProductNodeData)?.marketSegment ?? '',
                    targetRegion: (finalNodeData as FinalProductNodeData)?.targetRegion ?? '',
                    complianceStatus: (finalNodeData as FinalProductNodeData)?.complianceStatus ?? '',
                    carbonLabel: (finalNodeData as FinalProductNodeData)?.carbonLabel ?? ''
                  } as FinalProductNodeData; // Assert the final type
                  break;
              }
            }

            return {
              ...node,
              type: selectedNodeType,
              data: finalNodeData as NodeData // Assert type after merging/rebuilding
            };
          }
          return node;
        });

        await saveWorkflowNodes(updatedNodes.map(node => {
          let nodeData = node.data
          nodeData.positionX = node.position.x;
          nodeData.positionY = node.position.y;
          nodeData.workflowId = workflowId;
          return nodeData;
        })) // Save only the data part

        setStoreNodes(updatedNodes);
        emitCarbonFlowData(); // <--- 添加此行

        window.dispatchEvent(new CustomEvent('carbonflow-data-updated', {
          detail: { action: 'UPDATE_NODE', nodeId: editingNodeId }
        }));

        message.success('排放源已更新');

        // Log this action
        logWorkflowAction({
          action_type: 'USER_NODE_UPDATE',
          operation_name: 'update_emission_source_node',
          triggered_by_node_ids: [editingNodeId],
          parameters: { savedValues: values, nodeType: selectedNodeType },
          status: 'COMPLETED_SUCCESS',
          results_summary: { message: `Node ${editingNodeId} updated successfully.` }
        });

      } else {
        message.error('更新失败：无法访问数据存储');
      }
    } else {
      // --- 添加新節點 ---
      const nodeType = selectedNodeType;
      const newSourceId = `node_${Date.now()}`; // Ensure unique ID format if needed

      // --- Removed local emissionSources update ---

      if (setStoreNodes) {
        let position = { x: 100, y: 100 };
        const existingNodesOfSameType = nodes?.filter(n => n.type === nodeType) || [];
        if (existingNodesOfSameType.length > 0) {
          const lastNode = existingNodesOfSameType[existingNodesOfSameType.length - 1];
          position = {
            x: lastNode.position.x + 200, // Increased spacing
            y: lastNode.position.y
          };
        }

        // --- Simplified nodeData creation (needs verification against NodeData types) ---
        const commonData: Partial<NodeData> = {
          label: values.label,
          nodeName: values.label,
          lifecycleStage: selectedStageName,
          emissionType: values.emissionType,
          activitydataSource: values.activitydataSource || '',
          carbonFactordataSource: values.carbonFactordataSource || '',
          activityScore: 0,
          verificationStatus: '未驗證',
          carbonFootprint: String(0),
          quantity: String(values.quantity ?? ''),
          activityUnit: values.activityUnit || '',
          carbonFactor: String(0),
          carbonFactorName: values.carbonFactorName || '',
          carbonFactorUnit: values.carbonFactorUnit || '',
          emissionFactorGeographicalRepresentativeness: values.emissionFactorGeographicalRepresentativeness || '',
          emissionFactorTemporalRepresentativeness: values.emissionFactorTemporalRepresentativeness || '',
          unitConversion: String(values.unitConversion ?? 1),
          supplementaryInfo: values.supplementaryInfo || '',
          hasEvidenceFiles: false,
          dataRisk: undefined,
          backgroundDataSourceTab: backgroundDataActiveTabKey as ('database' | 'manual'),
          // 运输字段 - 只使用基础结构
          startPoint: values.startPoint || '',
          endPoint: values.endPoint || '',
          transportationMode: values.transportationMode || '', // 直接使用 values.transportationMode
          transportationDistance: values.distance ?? 0,
          distributionDistance: values.distance ?? 0,
        };

        // 如果有待处理的证据文件，将状态设置为待解析
        if (pendingEvidenceFiles.length > 0) {
          (commonData as any).hasEvidenceFiles = true;
          (commonData as any).evidenceVerificationStatus = '待解析';
        }

        // 如果有transportType字段，映射到正确的属性名
        if (values.transportType) {
          (commonData as any).transportationMode = values.transportType;
        }

        // 如果有distance字段，映射到正确的属性名
        if (values.distance !== undefined) {
          (commonData as any).transportationDistance = values.distance;
          (commonData as any).distributionDistance = values.distance;
        }

        // 如果是手动填写背景数据模式，更新相关字段
        if (backgroundDataActiveTabKey === 'manual') {
          commonData.carbonFactorName = values.carbonFactorName || '';
          commonData.carbonFactor = String(values.carbonFactor ?? 0);
          commonData.carbonFactorUnit = values.carbonFactorUnit || '';
          commonData.emissionFactorGeographicalRepresentativeness = values.emissionFactorGeographicalRepresentativeness || '';
          commonData.emissionFactorTemporalRepresentativeness = values.emissionFactorTemporalRepresentativeness || '';
          commonData.activitydataSource = values.activitydataSource || '';
          commonData.activityUUID = values.activityUUID || '';
          commonData.carbonFactordataSource = values.carbonFactordataSource || '';
        }

        let nodeData: NodeData;
        // Rebuild data based on node type (Keep this logic, but verify NodeData fields)
        switch (nodeType) {
          // ... existing cases ...
          // Example adjustment for 'product': ensure fields match ProductNodeData
          case 'product':
            nodeData = {
              ...commonData, // Spread common data first
              label: commonData.label || values.label, // Ensure label is string
              material: values.category, // Map category
              // Provide defaults for all other *required* fields in ProductNodeData
              weight_per_unit: '',
              isRecycled: false,
              recycledContent: '',
              recycledContentPercentage: 0,
              sourcingRegion: '',
              SourceLocation: '',
              weight: 0,
              supplier: ''
              // Add other optional fields if needed, or let them be undefined
            } as ProductNodeData; // Assert the final type
            break;
          case 'distribution': // Added case for distribution
            nodeData = {
              ...commonData,
              nodeType: 'distribution',
              label: commonData.label || values.label,
              startPoint: values.startPoint || '',
              endPoint: values.endPoint || '',
              transportationMode: values.transportationMode || '', // 直接使用 values.transportationMode
              transportationDistance: values.distance ?? 0,
              distributionDistance: values.distance ?? 0,
            } as DistributionNodeData;
            break;
          // ... other cases need similar review ...
          default: // Example for finalProduct
            nodeData = {
              ...commonData,
              label: commonData.label || values.label, // Ensure label is string
              finalProductName: values.label,
              // Provide defaults for required fields
              totalCarbonFootprint: 0,
              certificationStatus: '未認證',
              // Add optional fields if needed
              environmentalImpact: '',
              sustainabilityScore: 0,
              productCategory: values.category,
              marketSegment: '',
              targetRegion: '',
              complianceStatus: '',
              carbonLabel: ''
            } as FinalProductNodeData; // Assert the final type
            break;
        }


        const newNode: Node<NodeData> = {
          id: newSourceId,
          type: nodeType,
          position,
          data: nodeData, // Use the constructed nodeData
          width: 180, // Default width/height might need adjustment based on type
          height: 40,
          selected: false,
          positionAbsolute: position,
          dragging: false
        };

        console.log('NodeData:', nodeData);
        nodeData.nodeId = newSourceId; // Ensure nodeId is set
        nodeData.nodeType = selectedNodeType; // Ensure nodeType is set

        nodeData.positionX = position.x;
        nodeData.positionY = position.y;
        nodeData.workflowId = workflowId; // Ensure workflowId is set
        await saveWorkflowNodes([nodeData])

        setStoreNodes([...(nodes || []), newNode]);
        emitCarbonFlowData(); // <--- 添加此行

        window.dispatchEvent(new CustomEvent('carbonflow-data-updated', {
          detail: { action: 'ADD_NODE', nodeId: newSourceId, nodeType }
        }));



        message.success('排放源已添加');

        // Log this action
        logWorkflowAction({
          action_type: 'USER_NODE_CREATE',
          operation_name: 'create_emission_source_node',
          triggered_by_node_ids: [newSourceId], // Log the ID of the newly created node
          parameters: { savedValues: values, nodeType: nodeType, position: newNode.position },
          status: 'COMPLETED_SUCCESS',
          results_summary: { message: `Node ${newSourceId} created successfully.` }
        });

        // 如果有待处理的证据文件，则在新节点创建后立即上传它们
        if (pendingEvidenceFiles.length > 0) {
          // const newFiles = pendingEvidenceFiles.map(file => uploadEvidenceFile(file, newSourceId));
          // setPendingEvidenceFiles([]);
          // setUploadedFiles(prev => [...prev, ...newFiles]); // This line caused the error

          const uploadPromises = pendingEvidenceFiles.map(file => uploadEvidenceFile(file, newSourceId));
          Promise.all(uploadPromises).then(results => {
            const successfullyUploadedFiles = results.filter(Boolean) as UploadedFile[];
            if (successfullyUploadedFiles.length > 0) {
              setUploadedFiles(prev => [...prev, ...successfullyUploadedFiles]);
            }
            setPendingEvidenceFiles([]); // Clear pending files after all attempts
          }).catch(uploadError => {
            console.error("Error uploading pending evidence files:", uploadError);
            message.error("部分待上传证据文件失败，请检查控制台。");
            setPendingEvidenceFiles([]); // Still clear pending files
          });
        }
      } else {
        message.error('添加失败：无法访问数据存储');
      }
    }

    handleCloseEmissionDrawer();
  };


  // 修改文件删除函数
  const handleDeleteFile = async (id: string) => {
    try {
      // 获取文件信息
      const { data: workflowFile, error: fetchError } = await supabase
        .from('workflow_files')
        .select(`
          file_id,
          files (
            id,
            path
          )
        `)
        .eq('file_id', id)
        .single<WorkflowFileRecord>(); // Add type assertion for single record

      if (fetchError) {
        throw new Error(`Failed to fetch file info: ${fetchError.message}`);
      }

      // Check if workflowFile and workflowFile.files exist and if files.path is a string
      if (!workflowFile?.files?.path || typeof workflowFile.files.path !== 'string') {
        throw new Error('File path not found or invalid');
      }

      // From Storage 中删除文件
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([workflowFile.files.path]); // Now files.path should be a string

      if (storageError) {
        throw storageError;
      }

      // 删除 workflow_files 表中的记录
      const { error: workflowFileError } = await supabase
        .from('workflow_files')
        .delete()
        .eq('file_id', id);

      if (workflowFileError) {
        throw new Error(`Failed to delete workflow file record: ${workflowFileError.message}`);
      }

      // 删除 files 表中的记录
      const { error: fileError } = await supabase
        .from('files')
        .delete()
        .eq('id', id);

      if (fileError) {
        throw new Error(`Failed to delete file record: ${fileError.message}`);
      }

      // 更新本地状态
      setUploadedFiles(prev => prev.filter(f => f.id !== id));
      message.success('文件删除成功');
    } catch (error) {
      console.error('Error deleting file:', error);
      message.error(`删除文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 修改文件上传函数
  const handleUploadModalOk = async () => {
    try {
      if (!modalFileList.length) {
        message.error('请选择要上传的文件');
        return;
      }

      const formData = await uploadModalFormRef.current?.validateFields();
      if (!formData) return;

      setIsUploading(true);

      for (const file of modalFileList) {
        const fileObj = file.originFileObj;
        if (!fileObj) continue;

        // 读取文件内容
        const content = await fileObj.text();

        // 上传到 Storage
        // Original filePath: const filePath = `${workflowId}/${Date.now()}_${fileObj.name}`;

        // New robust filePath construction
        const originalName = fileObj.name;
        const nameParts = originalName.split('.');
        const extension = nameParts.length > 1 ? nameParts.pop() : 'dat'; // Default to .dat if no extension

        const safeFileNameInPath = `${Date.now()}_${file.uid}.${extension}`;
        const filePath = `${workflowId}/${safeFileNameInPath}`;

        const { error: uploadError } = await supabase.storage
          .from('files')
          .upload(filePath, fileObj);

        if (uploadError) {
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        }

        // 创建文件记录
        const { data: fileData, error: fileError } = await supabase
          .from('files')
          .insert({
            name: fileObj.name,
            path: filePath,
            type: formData.fileType,
            size: fileObj.size,
            mime_type: fileObj.type
          })
          .select()
          .single();

        if (fileError) {
          throw new Error(`Failed to create file record: ${fileError.message}`);
        }

        // 创建工作流文件关联
        const { error: workflowFileError } = await supabase
          .from('workflow_files')
          .insert({
            workflow_id: workflowId,
            file_id: fileData.id
          });

        if (workflowFileError) {
          throw new Error(`Failed to create workflow file association: ${workflowFileError.message}`);
        }

        // 添加到已上传文件列表，包含文件内容
        setUploadedFiles(prev => [...prev, {
          id: fileData.id,
          name: fileObj.name,
          type: formData.fileType, // 使用表单中用户选择的文件类型
          uploadTime: new Date().toLocaleString(),
          url: filePath, // 保存的是 storage path
          status: 'pending', // 初始状态为'pending' (在UI中将显示为"待审核")
          size: fileObj.size,
          mimeType: fileObj.type,
          content: content // 缓存文件内容
        }]);
      }

      message.success('文件上传成功');
      setIsUploadModalVisible(false);
      setModalFileList([]);
      uploadModalFormRef.current?.resetFields();
    } catch (error) {
      console.error('Upload error:', error);
      message.error(`上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // 修改文件预览函数
  const handlePreviewFile = async (file: UploadedFile) => {
    if (!file.url) {
      message.error('文件路径不存在');
      return;
    }

    try {
      // 获取文件的公开访问URL
      const { data: { publicUrl } } = supabase.storage
        .from('files')  // 修改为正确的 bucket 名称
        .getPublicUrl(file.url);

      // 在新窗口打开文件
      window.open(publicUrl, '_blank');
    } catch (error) {
      console.error('Error previewing file:', error);
      message.error('预览文件失败');
    }
  };

  const handleParseFile = async (file: UploadedFile) => {
    if (!file) {
      message.error('文件信息缺失，无法解析');
      return;
    }

    // 修改点 2：立即将文件状态设置为 'parsing' (解析中)
    setUploadedFiles((prevFiles) =>
      prevFiles.map((f) =>
        f.id === file.id ? { ...f, status: 'parsing' } : f
      )
    );
    message.loading({ content: `正在解析文件: ${file.name}...`, key: 'parsingFile' });

    try {
      // 从 Storage 获取文件内容
      if (!file.url) {
        throw new Error('文件URL未定义，无法下载');
      }

      const { data: fileData, error: downloadError } = await supabase.storage
        .from('files')
        .download(file.url);

      if (downloadError) {
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }

      if (!fileData) {
        throw new Error('No file data received');
      }

      // 将文件内容转换为文本
      const fileContent = await fileData.text();

      if (!fileContent) {
        throw new Error('File content is empty');
      }

      // 修改点 2：立即将文件状态设置为 'parsing' (解析中)
      setUploadedFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === file.id ? { ...f, status: 'parsing' } : f
        )
      );
      message.loading({ content: `正在解析文件: ${file.name}...`, key: 'parsingFile' });

      // 构建与 CarbonFlow.tsx 一致的 action，并通过事件分发
      const fileActionForEvent: CarbonFlowAction = {
        type: 'carbonflow',
        operation: 'file_parser',
        data: fileContent,
        content: `面板发起解析: ${file.name}`,
        description: `File parsing initiated from panel for ${file.name}`,
        fileName: file.name, // 关键：带上文件名，供节点 parse_from_file_name 字段使用
      };

      console.log('[carbonpanel.tsx] Dispatching carbonflow-action for file parsing:', fileActionForEvent);
      window.dispatchEvent(
        new CustomEvent('carbonflow-action', {
          detail: { action: fileActionForEvent }, 
        }),
      );

      // 修改点 2：移除乐观的 'completed' 状态设置和相关的 message.success
      // message.success({ content: '文件解析请求已发送至主流程处理!', key: 'parsingFile' });
      // 文件状态的最终确认 (completed/failed) 应由 CarbonFlow.tsx 处理后的反馈决定

    } catch (error: any) {
      // 这个 catch 块可能不会捕捉到主流程中的解析错误，因为事件分发是异步的。
      console.error('在面板中准备文件解析并分发事件时出错:', error);
      message.error({ content: `文件解析准备失败: ${error.message}`, key: 'parsingFile' });
      setUploadedFiles((prevFiles) =>
        prevFiles.map((f) => (f.id === file.id ? { ...f, status: 'failed' } : f)),
      );
    }
  };


  // Handler to open the new upload modal
  const handleOpenUploadModal = () => {
    setIsUploadModalVisible(true);
  };

  // Handler to close the new upload modal
  const handleCloseUploadModal = () => {
    setIsUploadModalVisible(false);
    setModalFileList([]); // Clear file list on cancel
    uploadModalFormRef.current?.resetFields(); // Reset form fields
  };

  // Handler for Upload component changes in the modal
  const handleModalUploadChange: UploadProps['onChange'] = ({ fileList: newFileListFromAntd }) => {
    const updatedModalFileList = newFileListFromAntd.map(fileFromAntd => {
      const existingFileInOurList = modalFileList.find(mf => mf.uid === fileFromAntd.uid);
      return {
        ...fileFromAntd,
        selectedType: existingFileInOurList?.selectedType || undefined // Initialize with undefined or a default
      };
    });
    setModalFileList(updatedModalFileList);
  };

  // Handler for changing a single file's type in the modal table
  const handleModalFileTypeChange = (fileUid: string, type: string) => {
    setModalFileList(prevList =>
      prevList.map(file =>
        file.uid === fileUid ? { ...file, selectedType: type } : file
      )
    );
  };

  // Handler for removing a file from the modal list (via table delete button)
  const handleRemoveFileFromModalList = (fileUid: string) => {
    setModalFileList(prevList => prevList.filter(file => file.uid !== fileUid));
  };

  // Handler for clearing the file list in the modal
  const handleClearModalList = () => {
    setModalFileList([]);
  };





  // Helper function to get Chinese status message for UploadedFile status
  const getChineseFileStatusMessage = (status: UploadedFile['status'] | ('未开始' | '解析中' | '解析成功' | '解析失败')): string => {
    switch (status) {
      case 'pending':
      case '未开始': // Also handle the internal state if it's already in a preliminary Chinese form
        return '待审核';
      case 'parsing':
      case '解析中':
        return '解析中';
      case 'completed':
      case '解析成功':
        return '解析完成';
      case 'failed':
      case '解析失败':
        return '解析失败';
      default:
        return status; // Fallback, though should not happen
    }
  };

  // --- Render functions ---

  // Updated renderScore to return the score value (0-100, rounded) or 0 if invalid/missing/zero
  const renderScore = (scoreData?: AIScoreType): number => {
    if (!scoreData || typeof scoreData.score !== 'number' || isNaN(scoreData.score)) {
      return 0; // Return 0 if data is missing/invalid
    }
    // Convert 0-1 score to 0-100 score, rounded. Handles score === 0 correctly.
    return Math.round(scoreData.score);
  };

  // --- NEW: Define columns based on Node<NodeData> ---

  // CSS样式定义为内联样式对象
  const statusStyles = {
    complete: {
      color: '#00ff7f',
      backgroundColor: 'rgba(0, 255, 127, 0.15)',
      padding: '2px 10px',
      borderRadius: '12px',
      fontSize: '12px',
      display: 'inline-block',
      border: '1px solid rgba(0, 255, 127, 0.3)',
      boxShadow: '0 0 6px rgba(0, 255, 127, 0.4)',
      textShadow: '0 0 5px rgba(0, 255, 127, 0.5)'
    },
    missing: {
      color: '#ff4d4f',
      backgroundColor: 'rgba(255, 77, 79, 0.15)',
      padding: '2px 10px',
      borderRadius: '12px',
      fontSize: '12px',
      display: 'inline-block',
      border: '1px solid rgba(255, 77, 79, 0.3)',
      boxShadow: '0 0 6px rgba(255, 77, 79, 0.4)',
      textShadow: '0 0 5px rgba(255, 77, 79, 0.5)'
    },
    pending: {
      color: '#faad14',
      backgroundColor: 'rgba(250, 173, 20, 0.15)',
      padding: '2px 10px',
      borderRadius: '12px',
      fontSize: '12px',
      display: 'inline-block',
      border: '1px solid rgba(250, 173, 20, 0.3)',
      boxShadow: '0 0 6px rgba(250, 173, 20, 0.4)',
      textShadow: '0 0 5px rgba(250, 173, 20, 0.5)'
    }
  };

  const nodeTableColumns: TableProps<Node<NodeData>>['columns'] = [
    {
      title: '序号',
      key: 'index',
      render: (_: any, __: any, index: number) => index + 1,
      width: 60
    },
    {
      title: '排放源名称',
      dataIndex: ['data', 'label'], // Access nested data
      key: 'label', // 修改这里，将key从'name'改为'label'，保持一致性
      filterDropdown: (props: FilterDropdownProps) => {
        // ... (keep existing filter dropdown logic, but adapt record access if needed) ...
        const { setSelectedKeys, selectedKeys, confirm, clearFilters } = props;
        return (
          <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
            <Input
              placeholder={`搜索名称`}
              value={String(selectedKeys[0] ?? '')}
              onChange={e => {
                const value = e.target.value;
                setSelectedKeys(value ? [value] : []);
                if (!value && clearFilters) {
                  clearFilters();
                }
                confirm({ closeDropdown: false });
              }}
              onPressEnter={() => confirm({ closeDropdown: true })}
              onBlur={() => confirm({ closeDropdown: false })}
              style={{ marginBottom: 8, width: '100%' }}
              allowClear
            />
          </div>
        );
      },
      filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
      onFilter: (value, record) =>
        (record.data?.label ?? '').toString().toLowerCase().includes((value as string).toLowerCase()), // 确保使用label字段进行过滤
    },
    {
      title: '活动水平数据状态',
      key: 'activityDataStatus',
      render: (_: any, record: Node<NodeData>) => {
        const data = record.data as any; // Use 'as any' for now to access potentially dynamic fields
        const hasActivityDataValue = data && typeof data.quantity === 'string' && data.quantity.trim() !== '' && !isNaN(parseFloat(data.quantity));
        const hasActivityUnit = data && typeof data.activityUnit === 'string' && data.activityUnit.trim() !== '';
        if (hasActivityDataValue && hasActivityUnit) {
          return <span style={statusStyles.complete}>完整</span>;
        }
        return <span style={statusStyles.missing}>缺失</span>;
      },
    },
    {
      title: '证明材料',
      key: 'evidenceMaterialStatus',
      render: (_: any, record: Node<NodeData>) => {
        const data = record.data as any;
        // 检查验证状态
        if (data?.evidenceVerificationStatus === '已验证') {
          return <span style={statusStyles.complete}>完整</span>;
        }
        // 有evidenceFiles但未完成验证，显示为"待解析"
        if (data?.evidenceFiles && data.evidenceFiles.length > 0) {
          return <span style={statusStyles.pending}>待解析</span>;
        }
        return <span style={statusStyles.missing}>缺失</span>;
      },
    },
    {
      title: '背景数据状态',
      key: 'backgroundDataStatus',
      render: (_: any, record: Node<NodeData>) => {
        const data = record.data as any;
        // Infer status based on carbonFactor fields in node data
        const hasManualFactor = data?.carbonFactor && parseFloat(data.carbonFactor) !== 0; // Check if factor exists and is not zero
        const factorName = data?.carbonFactorName || '';
        // TODO: Add logic to check for AI matched status if available in node data
        // let factorMatchStatus = '未知'; // Default
        // if (data?.aiMatchStatus === 'success') factorMatchStatus = '完整，AI匹配';
        // else if (data?.aiMatchStatus === 'failed') factorMatchStatus = '缺失';
        // else if (hasManualFactor) factorMatchStatus = '完整，手动选择';
        // else if (!factorName || factorName.trim() === '') factorMatchStatus = '缺失';

        // Simplified logic for now:
        if (hasManualFactor) {
          return <span style={statusStyles.complete}>完整</span>; // Treat any non-zero factor as complete for now
        }
        // Add check for AI success status if/when available in node.data
        // else if (data.aiFactorMatchStatus === 'success') {
        //     return <span className="status-complete">完整，AI匹配</span>;
        // }
        else {
          return <span style={statusStyles.missing}>缺失</span>;
        }
      },
    },
    {
      title: '数据风险',
      dataIndex: ['data', 'dataRisk'],
      key: 'dataRisk',
      render: (text?: string) => text || '无',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Node<NodeData>) => ( // Use Node<NodeData> here
        <Space size="small">
          <Tooltip title="查看">
            <Button type="link" icon={<EyeOutlined />} onClick={() => { console.log('Viewing node:', record); message.info('查看功能待实现'); }} />
          </Tooltip>
          <Tooltip title="编辑">
            {/* Pass node ID to the handler */}
            <Button type="link" icon={<EditOutlined />} onClick={() => handleEditEmissionSource(record.id)} />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm title="确定删除吗?" onConfirm={() => handleDeleteEmissionSource(record.id)}>
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Columns for the File Upload table - Updated based on PRD
  const fileTableColumns = [
    { title: '文件名称', dataIndex: 'name', key: 'name' },
    { title: '文件类型', dataIndex: 'type', key: 'type', width: 120 }, // Renamed header as per PRD
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: UploadedFile['status']) => {
        switch (status) {
          case 'pending':
            return '待审核';
          case 'parsing':
            return '解析中';
          case 'completed':
            return '解析完成';
          case 'failed':
            return '解析失败';
          default:
            return status; // Fallback, though should not happen
        }
      }
    }, // Added Status column
    {
      title: '操作',
      key: 'action',
      width: 120, // Increased width for more icons
      render: (_: any, record: UploadedFile) => (
        <Space size="small"> {/* Reduced space slightly */}
          <Tooltip title="解析">
            <Button type="link" icon={<ExperimentOutlined />} onClick={() => handleParseFile(record)} />
          </Tooltip>
          {/* <Tooltip title="编辑">
                       <Button type="link" icon={<EditOutlined />} onClick={() => handleEditFile(record)} />
                  </Tooltip>
                  <Tooltip title="预览">
                      <Button type="link" icon={<EyeOutlined />} onClick={() => handlePreviewFile(record)} />
                  </Tooltip> */}
          <Tooltip title="删除">
            <Popconfirm title="确定删除吗?" onConfirm={() => handleDeleteFile(record.id)}>
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // --- Factor Match Modal columns need updating later ---
  const factorMatchTableColumns: TableProps<Node<NodeData>>['columns'] = [ // Update type to Node<NodeData>
    { title: '序号', key: 'index', render: (_: any, __: any, index: number) => index + 1, width: 60 },
    { title: '生命周期阶段', key: 'lifecycleStage', render: (_: any, record: Node<NodeData>) => nodeTypeToLifecycleStageMap[record.type || ''] || '未知' },
    { title: '排放源名称', dataIndex: ['data', 'label'], key: 'name' },
    { title: '排放源类别', dataIndex: ['data', 'emissionType'], key: 'category', render: (text: any, record: Node<NodeData>) => record.type === 'distribution' ? '运输' : text || '未分类' },
    { title: '排放源补充信息', dataIndex: ['data', 'supplementaryInfo'], key: 'supplementaryInfo', render: (text?: string) => text || '-' },
    { title: '活动数据数值', dataIndex: ['data', 'quantity'], key: 'activityData', render: (text?: string) => text || '-' },
    { title: '活动数据单位', dataIndex: ['data', 'activityUnit'], key: 'activityUnit', render: (text?: string) => text || '-' },
    { title: '因子名称', dataIndex: ['data', 'carbonFactorName'], key: 'carbonFactorName', render: (text?: string) => text || '-' },
    { title: '因子数值', dataIndex: ['data', 'carbonFactor'], key: 'carbonFactor', render: (text?: string) => text || '-' },
    { title: '因子单位', dataIndex: ['data', 'carbonFactorUnit'], key: 'carbonFactorUnit', render: (text?: string) => text || '-' },
    { title: '地理代表性', dataIndex: ['data', 'emissionFactorGeographicalRepresentativeness'], key: 'emissionFactorGeographicalRepresentativeness', render: (text?: string) => text || '-' },
    { title: '时间代表性', dataIndex: ['data', 'emissionFactorTemporalRepresentativeness'], key: 'emissionFactorTemporalRepresentativeness', render: (text?: string) => text || '-' },
    { title: '单位转换系数', dataIndex: ['data', 'unitConversion'], key: 'unitConversion', render: (text?: string) => text || '-' },
    {
      title: '匹配状态',
      key: 'factorMatchStatus',
      render: (_: any, record: Node<NodeData>) => {
        const data = record.data as any;
        const hasFactor = data?.carbonFactor && parseFloat(data.carbonFactor) !== 0;
        // TODO: Incorporate actual AI match status from data if available
        // const aiStatus = data?.aiFactorMatchStatus;
        let statusText = '未配置因子';
        let color = 'grey';
        // if (aiStatus === 'success') { statusText = 'AI匹配成功'; color = 'green'; }
        // else if (aiStatus === 'failed') { statusText = 'AI匹配失败'; color = 'red'; }
        // else if (hasFactor) { statusText = '已手动配置因子'; color = 'green'; } // Assuming any factor is manual if no AI status
        if (hasFactor) { statusText = '已配置因子'; color = 'green'; } // Simplified

        return <span style={{ color }}>{statusText}</span>;
      }
    },
    {
      title: '操作',
      key: 'manualFactorSelect',
      width: 120,
      render: (_: any, record: Node<NodeData>) => ( // Use Node<NodeData>
        <Button type="link" onClick={() => message.info(`手动选择因子功能待实现: ${record.data?.label}`)}>
          选择因子
        </Button>
      ),
    },
  ];

  // --- AI Autofill Columns need updating later ---
  const columnsAIAutoFill: TableProps<Node<NodeData>>['columns'] = [ // Update type to Node<NodeData>
    {
      title: '序号',
      key: 'index',
      width: 60,
      fixed: 'left',
      align: 'center',
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: <div>基本信息</div>,
      children: [
        { title: '生命周期阶段', key: 'lifecycleStage', width: 110, align: 'center', render: (_: any, record: Node<NodeData>) => nodeTypeToLifecycleStageMap[record.type || ''] || '未知' },
        { title: '排放源名称', dataIndex: ['data', 'label'], key: 'name', width: 120, align: 'center' },
        { title: '排放源类别', dataIndex: ['data', 'emissionType'], key: 'category', width: 100, align: 'center', render: (text: any, record: Node<NodeData>) => record.type === 'distribution' ? '运输' : text || '未分类' },
        { title: '补充信息', dataIndex: ['data', 'supplementaryInfo'], key: 'supplementaryInfo', width: 120, align: 'center', render: (text: any) => text || '-' },
      ]
    },
    {
      title: <div>活动水平数据</div>,
      children: [
        { title: '数值', dataIndex: ['data', 'quantity'], key: 'activityData', width: 90, align: 'center', render: (v: any, r: Node<NodeData>) => v ? <span>{v}{(r.data as any).activityData_aiGenerated && <span style={{ color: '#1890ff', marginLeft: 4, fontSize: 12 }}>AI</span>}</span> : '-' },
        { title: '单位', dataIndex: ['data', 'activityUnit'], key: 'activityUnit', width: 80, align: 'center', render: (v: any, r: Node<NodeData>) => v ? <span>{v}{(r.data as any).activityUnit_aiGenerated && <span style={{ color: '#1890ff', marginLeft: 4, fontSize: 12 }}>AI</span>}</span> : '-' },
        { title: '运输-起点', dataIndex: ['data', 'startPoint'], key: 'startPoint', width: 120, align: 'center', render: (text: any) => text || '-' },
        { title: '运输-终点', dataIndex: ['data', 'endPoint'], key: 'endPoint', width: 120, align: 'center', render: (text: any) => text || '-' },
        { title: '运输方式', dataIndex: ['data', 'transportationMode'], key: 'transportationMode', width: 90, align: 'center', render: (text: any) => text || '-' },
        { title: '运输距离', dataIndex: ['data', 'transportationDistance'], key: 'transportationDistance', width: 90, align: 'center', render: (text: any) => text || '-' },
        { title: '运输距离单位', dataIndex: ['data', 'transportationDistanceUnit'], key: 'transportationDistanceUnit', width: 90, align: 'center', render: (text: any) => text || '-' },
        { title: '运输备注', dataIndex: ['data', 'notes'], key: 'notes', width: 120, align: 'center', render: (text: any) => text || '-' },
        { title: '证据文件', key: 'evidenceFiles', width: 90, align: 'center', render: (_: any, r: Node<NodeData>) => (r.data as any).hasEvidenceFiles ? '有' : '无' },
      ]
    },
    {
      title: <div>背景数据</div>,
      children: [
        { title: '名称', dataIndex: ['data', 'carbonFactorName'], key: 'carbonFactorName', width: 120, align: 'center', render: (v: any) => v || '-' },
        { title: '数值(kgCO2e)', dataIndex: ['data', 'carbonFactor'], key: 'carbonFactor', width: 110, align: 'center', render: (v: any) => v || '-' },
        { title: '单位', dataIndex: ['data', 'carbonFactorUnit'], key: 'carbonFactorUnit', width: 80, align: 'center', render: (v: any) => v || '-' },
        { title: '地理代表性', dataIndex: ['data', 'emissionFactorGeographicalRepresentativeness'], key: 'emissionFactorGeographicalRepresentativeness', width: 100, align: 'center', render: (v: any) => v || '-' },
        { title: '时间代表性', dataIndex: ['data', 'emissionFactorTemporalRepresentativeness'], key: 'emissionFactorTemporalRepresentativeness', width: 90, align: 'center', render: (v: any) => v || '-' },
        { title: '数据库名称', dataIndex: ['data', 'carbonFactordataSource'], key: 'carbonFactordataSource', width: 110, align: 'center', render: (v: any) => v || '-' },
        // { title: 'UUID', dataIndex: ['data', 'factorUUID'], key: 'factorUUID', width: 120, align: 'center', render: (v: any) => v || '-' }, // Assuming UUID is not directly in NodeData yet
        { title: 'UUID', dataIndex: ['data', 'activityUUID'], key: 'activityUUID', width: 120, align: 'center', render: (v: any) => v || '-' },
      ]
    },
    {
      title: <div>单位转换</div>,
      children: [
        {
          title: '系数',
          dataIndex: ['data', 'unitConversion'],
          key: 'unitConversion',
          width: 80,
          align: 'center',
          render: (v: any, r: Node<NodeData>) => v ?
            <span>
              {v}
              {(r.data as any).unitConversion_aiGenerated &&
                <span style={{ color: '#1890ff', marginLeft: 4, fontSize: 12 }}>AI</span>
              }
            </span> : '-'
        },
      ]
    },
    {
      title: <div>排放结果</div>,
      children: [
        // Assuming emission result is calculated elsewhere or stored differently
        { title: '排放量(kgCO2e)', key: 'emissionResult', width: 120, align: 'center', render: () => '-' },
      ]
    },
  ];

  // --- AI Autofill Filtering logic needs updating ---
  // Calculate filtered data for AI modal directly from nodes
  const filteredNodesForAIModal = (nodes || []).filter(node => {
    const data = node.data as any; // Use 'as any' carefully
    // 生命周期阶段筛选
    if (aiFilterStage && (nodeTypeToLifecycleStageMap[node.type || ''] || '未知') !== aiFilterStage) return false;
    // 名称筛选
    if (aiFilterName && !(data.label || '').includes(aiFilterName)) return false;
    // 类别筛选
    const category = node.type === 'distribution' ? '运输' : (data.emissionType || '未分类');
    if (aiFilterCategory && category !== aiFilterCategory) return false;
    // 缺失数据筛选
    if (aiFilterMissingActivity) {
      const hasActivity = data.quantity && data.activityUnit;
      if (hasActivity) return false; // If data exists, filter out
    }
    if (aiFilterMissingConversion) {
      const hasConversion = data.unitConversion !== undefined && data.unitConversion !== null && data.unitConversion !== '';
      if (hasConversion) return false; // If data exists, filter out
    }
    // 数据展示范围 (Assuming AI generated flags are boolean fields like 'quantity_aiGenerated')
    if (aiFilterShowType === 'ai') {
      if (!(data.quantity_aiGenerated || data.activityUnit_aiGenerated || data.unitConversion_aiGenerated)) return false;
    }
    if (aiFilterShowType === 'manual') {
      if (data.quantity_aiGenerated || data.activityUnit_aiGenerated || data.unitConversion_aiGenerated) return false;
    }
    return true;
  });

  // Columns for the Parse File Modal Table
  const parsedEmissionSourceTableColumns: TableProps<ParsedEmissionSource>['columns'] = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (text: number) => text,
    },
    {
      title: '生命周期阶段',
      dataIndex: 'lifecycleStage',
      key: 'lifecycleStage',
      width: 150,
    },
    {
      title: '排放源名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '排放源类别',
      dataIndex: 'category',
      key: 'category',
      width: 120,
    },
    {
      title: '活动数据数值',
      dataIndex: 'activityData',
      key: 'activityData',
      width: 120,
    },
    {
      title: '活动数据单位',
      dataIndex: 'activityUnit',
      key: 'activityUnit',
      width: 120,
    },
    {
      title: '数据状态',
      dataIndex: 'dataStatus',
      key: 'dataStatus',
      width: 100,
      render: (status: string) => {
        let color = 'default';
        if (status === '已生效') {
          color = 'success';
        } else if (status === '已删除') {
          color = 'error';
        }
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: '补充信息',
      dataIndex: 'supplementaryInfo',
      key: 'supplementaryInfo',
      ellipsis: true,
    },
  ];

  // 添加获取文件列表的函数
  const fetchWorkflowFiles = async () => {
    try {
      setIsLoadingFiles(true);
      const { data, error } = await supabase
        .from('workflow_files')
        .select(`
          file_id,
          files (
            id,
            name,
            path,
            type,
            size,
            mime_type,
            created_at
          )
        `)
        .eq('workflow_id', workflowId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // 转换数据格式
      const mappedFiles = (data as unknown as WorkflowFileRecord[]).map(item => {
        const fileDetail = item.files;

        if (!fileDetail) {
          console.warn('Skipping item due to missing file details:', item);
          return null;
        }

        return {
          id: item.file_id,
          name: fileDetail.name,
          type: fileDetail.type,
          uploadTime: new Date(fileDetail.created_at).toLocaleString(),
          url: fileDetail.path, // path is likely always a string from db
          status: 'completed' as const, // Explicitly 'completed' for fetched files initially
          size: fileDetail.size,
          mimeType: fileDetail.mime_type,
          content: undefined, // Explicitly add content as undefined
        };
      });

      const filteredFiles = mappedFiles.filter(Boolean);
      setUploadedFiles(filteredFiles as UploadedFile[]);

    } catch (error) {
      console.error('Error fetching files:', error);
      message.error('获取文件列表失败');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // 在组件加载时获取文件列表
  useEffect(() => {
    fetchWorkflowFiles();
  }, [workflowId]);

  // 修改文件列表渲染部分
  const renderFileList = () => {
    if (isLoadingFiles) { // Check loading state
      return <Spin tip="加载文件中..." />;
    }
    if (uploadedFiles.length === 0) {
      return <Empty description="暂无文件" />;
    }
    // Keep the List rendering logic as is, using 'uploadedFiles' state
    return (
      <List
        itemLayout="horizontal"
        dataSource={uploadedFiles}
        renderItem={(file) => (
          <List.Item
            actions={[
              <Button
                key="preview"
                type="link"
                onClick={() => handlePreviewFile(file)}
                disabled={!file.url}
              >
                预览
              </Button>,
              <Button
                key="delete"
                type="link"
                danger
                onClick={() => handleDeleteFile(file.id)}
              >
                删除
              </Button>
            ]}
          >
            <List.Item.Meta
              avatar={<FileOutlined />}
              title={
                <Tooltip title={file.name}>
                  <span style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </span>
                </Tooltip>
              }
              description={
                <>
                  <div>类型: {file.type}</div>
                  <div>上传时间: {file.uploadTime}</div>
                  <div>状态: {file.status}</div>
                </>
              }
            />
          </List.Item>
        )}
      />
    );
  };

  const handleFactorMatchAI = async () => {
    console.log('AI匹配 invoked for sources:', selectedFactorMatchSources);

    if (!selectedFactorMatchSources || selectedFactorMatchSources.length === 0) {
      message.warning('请选择至少一个排放源进行匹配');
      return;
    }

    if (loadingMessageRef.current) {
      loadingMessageRef.current();
      loadingMessageRef.current = null;
    }

    try {
      loadingMessageRef.current = message.loading('正在进行碳因子匹配，请稍候...', 0);
      const action: CarbonFlowAction = {
        type: 'carbonflow',
        operation: 'carbon_factor_match',
        content: '使用Climatiq和Climateseal API进行碳因子匹配',
        nodeId: selectedFactorMatchSources.map(id => String(id)).join(',')
      };

      window.dispatchEvent(new CustomEvent('carbonflow-action', {
        detail: { action }
      }));

      // 请求已发送，等待 handleMatchResults 中的最终提示
      console.log("碳因子匹配请求已发送，等待事件回调...");

      // 加载消息会在 handleMatchResults 中处理结果后，或在下面的catch块中关闭
      // 这里不再需要 setTimeout 来关闭 loadingMessage

    } catch (error) {
      if (loadingMessageRef.current) {
        loadingMessageRef.current();
        loadingMessageRef.current = null;
      }
      console.error('执行碳因子匹配请求派发时出错:', error);
      message.error('发送碳因子匹配请求失败，请查看控制台');
    }
  };

  // 用于因子匹配弹窗的列定义 - 确保在组件作用域内定义
  const handleCloseFactorMatchModal = () => {
    setIsFactorMatchModalVisible(false);
    setSelectedFactorMatchSources([]); // 关闭时清空选项
  };

  // 添加事件监听器，接收匹配结果
  useEffect(() => {
    const handleMatchResults = (event: CustomEvent) => {
      if (loadingMessageRef.current) {
        loadingMessageRef.current();
        loadingMessageRef.current = null;
      }
      console.log('收到匹配结果事件:', event.detail);

      // 更新匹配结果状态
      const { success, failed, logs } = event.detail;
      setMatchResults({
        success: success || [],
        failed: failed || [],
        logs: logs || []
      });

      // 显示结果弹窗
      setShowMatchResultsModal(true);

      // 清空选择的排放源
      setSelectedFactorMatchSources([]);

      // 在结果处理完成后显示最终提示信息
      if (success?.length > 0 && failed?.length === 0) {
        message.success('所有选定排放源均匹配成功！');
      } else if (success?.length > 0 && failed?.length > 0) {
        message.warning(`部分排放源匹配成功 (${success.length}个成功, ${failed.length}个失败)，请查看结果详情。`);
      } else if (success?.length === 0 && failed?.length > 0) {
        message.error('所有选定排放源均匹配失败，请查看日志和结果详情。');
      } else {
        // 如果 success 和 failed 都为空 (例如没有节点需要匹配或出现意外情况)
        message.info('碳因子匹配处理完成，未发现需要更新的排放源。');
      }
    };

    // 注册自定义事件监听器
    window.addEventListener('carbonflow-match-results', handleMatchResults as EventListener);

    // 清理函数
    return () => {
      window.removeEventListener('carbonflow-match-results', handleMatchResults as EventListener);
    };
  }, [selectedStage]); // Removed refreshEmissionSourcesForStage from dependencies

  // 新增：AI一键补全碳因子匹配的处理函数
  const handleAIAutofillCarbonFactorMatch = async () => {
    console.log('AI Autofill Carbon Factor Match invoked for sources:', aiAutoFillSelectedRowKeys);

    if (!aiAutoFillSelectedRowKeys || aiAutoFillSelectedRowKeys.length === 0) {
      message.warning('请选择至少一个排放源进行匹配');
      return;
    }

    if (loadingMessageRef.current) {
      loadingMessageRef.current();
      loadingMessageRef.current = null;
    }

    try {
      loadingMessageRef.current = message.loading('正在进行碳因子匹配，请稍候...', 0);
      const action: CarbonFlowAction = {
        type: 'carbonflow',
        operation: 'carbon_factor_match',
        content: 'AI一键补全碳因子匹配',
        nodeId: aiAutoFillSelectedRowKeys.map(id => String(id)).join(',')
      };

      window.dispatchEvent(new CustomEvent('carbonflow-action', {
        detail: { action }
      }));

      console.log("AI Autofill 碳因子匹配请求已发送，等待事件回调...");
      // Loading message will be handled by 'carbonflow-match-results' event listener or catch block.

    } catch (error) {
      if (loadingMessageRef.current) {
        loadingMessageRef.current();
        loadingMessageRef.current = null;
      }
      console.error('执行 AI Autofill 碳因子匹配请求派发时出错:', error);
      message.error('发送 AI Autofill 碳因子匹配请求失败，请查看控制台');
    }
  };

  // 在组件内部添加 useEffect 监听 AI 补全结果
  useEffect(() => {
    const handler = (event: any) => {
      const { success, failed, logs } = event.detail;
      setAiAutoFillResult({
        success,
        failed: failed.map((id: string) => ({ // Add type for id
          id,
          reason: logs?.find((l: string) => l.includes(id)) || '补全失败' // Add type for l
        }))
      });
      // 可选：这里可以刷新 emissionSources 或 nodes
    };
    window.addEventListener('carbonflow-autofill-results', handler);
    return () => window.removeEventListener('carbonflow-autofill-results', handler);
  }, []);

  // ADD THIS useEffect to handle parse results
  useEffect(() => {
    const handleFileParseResult = (event: CustomEvent) => {
      const { fileId, sources, summary, status, error } = event.detail;

      // Update the status in the main uploadedFiles list
      setUploadedFiles(prevFiles =>
        prevFiles.map(f =>
          f.id === fileId ? { ...f, status: status, content: summary || f.content } : f
        )
      );

      // If this is the file currently selected in the AI Parse Modal, update modal-specific states
      if (selectedFileForParse?.id === fileId) {
        let chatTriggerPayload: any = { fileName: selectedFileForParse.name, status, error }; // Ensure selectedFileForParse is not null
        if (status === 'completed') {
          setParsedEmissionSources(sources || []);
          message.success(`文件 ${selectedFileForParse.name} 解析成功。`); // Ensure selectedFileForParse is not null
          chatTriggerPayload.sourceCount = (sources || []).length;
        } else if (status === 'failed') {
          setParsedEmissionSources([]);
          message.error(`文件 ${selectedFileForParse.name} 解析失败: ${error || '未知错误'}`); // Ensure selectedFileForParse is not null
        }

        // Dispatch event to trigger chat response for file parsing
        const fileParseEvent = new CustomEvent('carbonflow-fileparsed-trigger-chat', {
          detail: chatTriggerPayload
        });
        window.dispatchEvent(fileParseEvent);
      }
    };

    window.addEventListener('carbonflow-file-parse-result', handleFileParseResult as EventListener);
    return () => {
      window.removeEventListener('carbonflow-file-parse-result', handleFileParseResult as EventListener);
    };
  }, [selectedFileForParse, setUploadedFiles, setParsedEmissionSources]); // Removed setParseResultSummary

  // Drawer 内 Upload 组件的变更处理
  const handleEvidenceUploadChange: UploadProps['onChange'] = (info: UploadChangeParam<UploadFile>) => {
    // 文件被删除的处理 - 保持不变
    if (info.file.status === 'removed') {
      setDrawerEvidenceFiles(prev => {
        const updated = prev.filter(f => f.id !== info.file.uid);
        console.log('[Upload] 文件被移除, drawerEvidenceFiles', updated);
        return updated;
      });
      return;
    }

    // 所有其他状态（上传中、上传完成等）- 这里不再添加文件
    // 因为 beforeUpload 已经处理了所有上传逻辑并添加了文件到 drawerEvidenceFiles
    console.log('[Upload] onChange status', info.file.status, info.file);

    // 不再执行以下代码，避免重复添加文件：
    /*
    if (info.file.status !== 'removed') {
      const newFile: UploadedFile = {
        id: info.file.uid,
        name: info.file.name,
        type: info.file.type || '证据文件',
        uploadTime: new Date().toISOString(),
        status: 'completed',
        size: info.file.size,
        mimeType: info.file.type,
      };
      console.log('[Upload] 新文件完成上传', newFile);
      setDrawerEvidenceFiles(prev => {
        if (prev.find(f => f.id === newFile.id)) return prev; // 去重
        const updated = [...prev, newFile];
        console.log('[Upload] 更新 drawerEvidenceFiles', updated);
        return updated;
      });
      // 更新节点 evidenceFiles 并刷新
      if (editingNodeId) {
        const targetNode = nodes.find(node => node.id === editingNodeId);
        if (targetNode) {
          (targetNode.data as any).evidenceFiles = [
            ...((targetNode.data as any).evidenceFiles ?? []),
            newFile,
          ];
          console.log('[Upload] 写回 node.data.evidenceFiles', (targetNode.data as any).evidenceFiles);
          setStoreNodes([...nodes]);
        }
      }
      refreshEmissionSourcesForStage(selectedStage);
    }
    */
  };

  // 抽取方法: beforeUpload (用于 Upload 组件的 beforeUpload 属性)
  const beforeUpload = async (file: RcFile): Promise<false> => {
    console.log('[BeforeUpload] 开始处理文件:', file.name);

    // 如果有节点ID（在 drawer 中编辑时）
    if (editingNodeId) {
      try {
        console.log('[BeforeUpload] 正在为节点上传文件:', editingNodeId);
        const result = await uploadEvidenceFile(file, editingNodeId);
        console.log('[BeforeUpload] 上传结果:', result);

        if (result) {
          message.success(`上传成功: ${file.name}`);
          // 手动更新 drawerEvidenceFiles 状态，触发重新渲染
          setDrawerEvidenceFiles(prev => {
            // 检查是否已存在，避免重复
            if (prev.find(f => f.id === result.id)) {
              console.log('[BeforeUpload] 文件已存在，不添加');
              return prev;
            }
            console.log('[BeforeUpload] 添加文件到 drawerEvidenceFiles');
            return [...prev, result];
          });

          // 立即刷新分数 - 强制触发一个事件，确保 AISummary 重新计算
          setTimeout(() => {
            console.log('[BeforeUpload] 手动派发更新事件以刷新评分');
            window.dispatchEvent(new CustomEvent('force-refresh-ai-summary'));
          }, 500);
        }
      } catch (err) {
        console.error('[BeforeUpload] 上传错误:', err);
        message.error(`上传失败: ${err}`);
      }
    } else {
      // 在创建新节点时，将文件添加到 pendingEvidenceFiles，等待节点创建后再上传
      console.log('[BeforeUpload] 添加到待处理文件（新节点）');
      setPendingEvidenceFiles(prev => [...prev, file]);
      // 显示通知
      message.info(`文件 ${file.name} 已添加到待处理列表，将在节点创建后上传`);
    }

    // 返回 false 阻止默认上传行为，因为我们使用自定义上传逻辑
    return false;
  };

  // Handlers for the new AI File Parse Modal
  const handleOpenAIFileParseModal = () => {
    setIsAIFileParseModalVisible(true);
  };

  const handleCloseAIFileParseModal = () => {
    setIsAIFileParseModalVisible(false);
    setSelectedFileForParse(null); // Reset selected file on modal close
  };

  // 保存工作流名称
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
      .update({ name: editingName })
      .eq('id', workflowId);
    if (error) {
      message.error('修改失败: ' + error.message);
      return;
    }
    setWorkflowName(editingName);
    setIsEditingName(false);
    message.success('名称已更新');
  };

  // 解析结果数据：根据当前选中文件名过滤 nodes
  const [selectedParsedSourceKeys, setSelectedParsedSourceKeys] = useState<React.Key[]>([]);
  const parsedNodes = React.useMemo(() => {
    if (!selectedFileForParse?.name) return [];
    return (nodes || [])
      .filter(node => node.data?.parse_from_file_name === selectedFileForParse.name)
      .map((node, idx) => ({
        ...node,
        key: node.id || idx, // 确保唯一 key
        index: idx + 1,
        lifecycleStage: node.data.lifecycleStage || '',
        name: node.data.label || '',
        category: node.data.emissionType || '',
        activityData: node.data.quantity || '',
        activityUnit: node.data.activityUnit || '',
        dataStatus: '未生效', // 如有业务逻辑可调整
        supplementaryInfo: node.data.supplementaryInfo || '',
      }));
  }, [nodes, selectedFileForParse]);

  // --- Columns for Current Task Progress Table ---
  // Removed local task state and table definitions

  // --- End Columns for Current Task Progress Table ---

  return (
    <div className="flex flex-row h-screen p-4 space-x-4 bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary"> {/* MODIFIED: flex-row, space-x-4 for new layout */}
      {/* Left Column: Task Progress */}
      <div className="w-80 flex-shrink-0 h-full"> {/* Width for TaskProgressCard, e.g., w-80 (320px). Adjust as needed. */}
        <TaskProgressCard className="h-full flex flex-col" /> {/* TaskProgressCard moved here, takes full height */}
      </div>
      {/* Right Column: Main Content Wrapper (Original content from next line will form this panel) */}
      <div className="flex-grow flex flex-col space-y-4 min-h-0">

        {/* 2. Upper Row - Fixed proportional height (e.g., 30%) */}
        <Row gutter={16} className="h-[30%] flex-shrink-0"> {/* Changed height to 30% */}
          {/* New Col to stack Scene Info and File Upload */}
          <Col span={14} className="flex flex-col h-full space-y-4"> {/* Changed span to 14 */}
            {/* Scene Info Card */}
            <Card
              title="目标与范围"
              size="small"
              extra={<Button type="link" icon={<SettingOutlined />} onClick={handleOpenSettings}>设置</Button>}
              className="flex-shrink-0 bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor" // Added flex-shrink-0
              bodyStyle={{ overflow: 'auto', padding: '16px' }}
              id="targetScopeCard" // Added ID for height reference
            >
              <Row gutter={24} className="w-full">
                {/* Left Column */}
                <Col span={5} className="border-r border-bolt-elements-borderColor pr-4"> {/* Adjusted span to 5 */}
                  <div className="text-sm font-semibold text-bolt-elements-textSecondary mb-1">核算产品:</div>
                  <Tooltip title={sceneInfo?.productName || '未设置'}>
                    <div className="text-sm text-bolt-elements-textPrimary truncate">
                      {sceneInfo?.productName || '未设置'}
                    </div>
                  </Tooltip>
                </Col>

                {/* Middle Column */}
                <Col span={9} className="border-r border-bolt-elements-borderColor pr-4 pl-4"> {/* Adjusted span to 9 */}
                  <Tooltip title={sceneInfo?.dataCollectionStartDate && sceneInfo?.dataCollectionEndDate
                    ? `${new Date(sceneInfo.dataCollectionStartDate).toLocaleDateString()} - ${new Date(sceneInfo.dataCollectionEndDate).toLocaleDateString()}`
                    : '未设置'}>
                    <div className="text-sm text-bolt-elements-textPrimary mb-2 truncate">
                      数据收集时间范围:
                      {sceneInfo?.dataCollectionStartDate && sceneInfo?.dataCollectionEndDate
                        ? `${new Date(sceneInfo.dataCollectionStartDate).toLocaleDateString()} - ${new Date(sceneInfo.dataCollectionEndDate).toLocaleDateString()}`
                        : '未设置'}
                    </div>
                  </Tooltip>
                  <Tooltip title={sceneInfo?.totalOutputValue && sceneInfo?.totalOutputUnit
                    ? `${sceneInfo.totalOutputValue} ${sceneInfo.totalOutputUnit}`
                    : '未设置'}>
                    <div className="text-sm text-bolt-elements-textPrimary mb-2 truncate">
                      总产量:
                      {sceneInfo?.totalOutputValue && sceneInfo?.totalOutputUnit
                        ? `${sceneInfo.totalOutputValue} ${sceneInfo.totalOutputUnit}`
                        : '未设置'}
                    </div>
                  </Tooltip>
                  <Tooltip title={sceneInfo?.benchmarkValue && sceneInfo?.benchmarkUnit
                    ? `${sceneInfo.benchmarkValue} ${sceneInfo.benchmarkUnit}`
                    : '未设置'}>
                    <div className="text-sm text-bolt-elements-textPrimary truncate">
                      核算基准:
                      {sceneInfo?.benchmarkValue && sceneInfo?.benchmarkUnit
                        ? `${sceneInfo.benchmarkValue} ${sceneInfo.benchmarkUnit}`
                        : '未设置'}
                    </div>
                  </Tooltip>
                </Col>

                {/* Right Column */}
                <Col span={10} className="pl-4"> {/* Adjusted span to 10 */}
                  <Tooltip title={sceneInfo?.verificationLevel || '未设置'}>
                    <div className="text-sm text-bolt-elements-textPrimary mb-2 truncate">
                      预期核验级别: {sceneInfo?.verificationLevel || '未设置'}
                    </div>
                  </Tooltip>
                  <Tooltip title={sceneInfo?.standard || '未设置'}>
                    <div className="text-sm text-bolt-elements-textPrimary mb-2 truncate">
                      满足标准: {sceneInfo?.standard || '未设置'}
                    </div>
                  </Tooltip>
                  <Tooltip title={sceneInfo?.lifecycleType === 'full' ? '全生命周期 (摇篮到坟墓)'
                    : sceneInfo?.lifecycleType === 'half' ? '半生命周期 (摇篮到大门)'
                      : '未设置'}>
                    <div className="text-sm text-bolt-elements-textPrimary truncate">
                      生命周期范围:
                      {sceneInfo?.lifecycleType === 'full' ? '全生命周期 (摇篮到坟墓)'
                        : sceneInfo?.lifecycleType === 'half' ? '半生命周期 (摇篮到大门)'
                          : '未设置'}
                    </div>
                  </Tooltip>
                </Col>
              </Row>
            </Card>

            {/* AI Toolbox Card (formerly File Upload Card) */}
            <Card
              title="AI工具箱"
              size="small"
              className="flex-grow min-h-0 bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor flex flex-col"
              bodyStyle={{ flexGrow: 1, display: 'flex', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', padding: '16px' }}
            >
              <Space size="large" wrap>
                <Button icon={<ExperimentOutlined />} onClick={handleOpenAIFileParseModal} type="default">
                  AI文件解析
                </Button>
                <Button icon={<FunctionOutlined />} onClick={() => setIsAIAutoFillModalVisible(true)} type="default">
                  AI数据补全
                </Button>
                <Button icon={<CloudDownloadOutlined />} onClick={() => message.info('AI数据收集功能待实现')} type="default">
                  AI数据收集
                </Button>
                <Button icon={<SecurityScanOutlined />} onClick={() => message.info('AI风险评测功能待实现')} type="default">
                  AI风险评测
                </Button>
              </Space>
            </Card>
          </Col>

          {/* Model Score and Task Progress Column */}
          <Col span={10} className="flex flex-col h-full"> {/* TaskProgressCard moved, adjusted class for Model Score column */}
            {/* Model Score Card - REVISED STRUCTURE */}
            <Card
              title="模型评分"
              size="small"
              className="flex-grow flex flex-col bg-bolt-elements-background-depth-1 border border-bolt-primary/30"
              style={{ minHeight: modelScoreCardHeight }} // Apply dynamic height
              bodyStyle={{ display: 'flex', padding: '12px' }} // Removed minHeight from here
            >
              <Row gutter={0} align="middle" className="w-full h-full"> {/* gutter={0} to use padding on Cols for spacing */}
                {/* Left Column: Overall Score */}
                <Col span={10} className="text-center flex flex-col justify-center items-center border-r border-bolt-elements-borderColor h-full pr-3"> {/* Added h-full and adjusted padding */}
                  <div className="text-6xl font-bold text-bolt-elements-textPrimary leading-none mb-1">
                    {typeof modelScore.credibilityScore === 'number' && !isNaN(modelScore.credibilityScore)
                      ? Math.round(modelScore.credibilityScore)
                      : 0}
                  </div>
                  <div className="text-sm text-bolt-elements-textSecondary whitespace-nowrap mt-1">
                    当前可信总分
                  </div>
                </Col>

                {/* Right Column: Sub Scores - Arranged in two rows */}
                <Col span={14} className="flex flex-col justify-center h-full pl-3"> {/* Added h-full and adjusted padding */}
                  <Row gutter={[8, 4]}> {/* Adjusted vertical gutter to 4 */}
                    <Col span={12} className="text-sm text-bolt-elements-textSecondary">
                      模型完整度: {renderScore(modelScore.completeness)}/100
                    </Col>
                    <Col span={12} className="text-sm text-bolt-elements-textSecondary">
                      因子可追溯性: {renderScore(modelScore.traceability)}/100
                    </Col>
                  </Row>
                  <Row gutter={[8, 4]} className="mt-1"> {/* Adjusted vertical gutter and margin-top */}
                    <Col span={12} className="text-sm text-bolt-elements-textSecondary">
                      质量平衡: {renderScore(modelScore.massBalance)}/100
                    </Col>
                    <Col span={12} className="text-sm text-bolt-elements-textSecondary">
                      数据验证性: {renderScore(modelScore.validation)}/100
                    </Col>
                  </Row>
                </Col>
                
              </Row>
            </Card>

            {/* Key Missing Items Card */}
            <Card
              title="关键优化建议"
              size="small"
              className="mt-4 flex-shrink-0 bg-bolt-elements-background-depth-1 border border-bolt-primary/30 h-[200px]"
              bodyStyle={{ padding: '12px' }}
            >
              {(() => {
                const incompleteModelNodes = aiSummary?.modelCompleteness?.incompleteNodes || [];
                const incompleteTraceabilityNodes = aiSummary?.dataTraceability?.incompleteNodes || [];
                
                // Combine and deduplicate nodes by ID, merging missing fields
                const allIncompleteMap = new Map<string, { label: string; missingFields: Set<string> }>();

                incompleteModelNodes.forEach(node => {
                  if (!allIncompleteMap.has(node.id)) {
                    allIncompleteMap.set(node.id, { label: node.label, missingFields: new Set() });
                  }
                  node.missingFields.forEach(field => allIncompleteMap.get(node.id)?.missingFields.add(field));
                });

                incompleteTraceabilityNodes.forEach(node => {
                  if (!allIncompleteMap.has(node.id)) {
                    allIncompleteMap.set(node.id, { label: node.label, missingFields: new Set() });
                  }
                  node.missingFields.forEach(field => allIncompleteMap.get(node.id)?.missingFields.add(field));
                });

                const combinedIncompleteNodes = Array.from(allIncompleteMap.entries()).map(([id, data]) => ({
                  id,
                  label: data.label,
                  missingFields: Array.from(data.missingFields)
                }));

                if (combinedIncompleteNodes.length === 0) {
                  return <Empty description="暂无关键优化建议，各项指标良好！" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
                }

                return (
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {combinedIncompleteNodes.map((node) => (
                      <div key={node.id} className="mb-3 p-2 border border-dashed border-bolt-elements-borderColor rounded">
                        <Typography.Text strong className="text-bolt-elements-textPrimary">
                          节点: <Tag color="blue">{node.label}</Tag>
                        </Typography.Text>
                        {node.missingFields.length > 0 && (
                          <div className="mt-1">
                            <Typography.Text type="secondary" className="text-xs">缺失字段:</Typography.Text>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {node.missingFields.map((field) => (
                                <Tag key={field} color="error">
                                  {field}
                                </Tag>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </Card>
          </Col>
        </Row>

        {/* 3. Lower Row - Takes remaining height */}
        <Row gutter={16} className="flex-grow min-h-0"> {/* Keep flex-grow min-h-0 */}
          {/* 3.1 Lifecycle Navigation (Bottom Left) - Adjusted span to 5 */}
          <Col span={5} className="flex flex-col h-full">
            <Card title="生命周期阶段" size="small" className="flex-grow flex flex-col min-h-0 bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor">
              <div className="flex-grow overflow-y-auto">
                <Space direction="vertical" className="w-full lifecycle-nav-bar">
                  {lifecycleStages.map(stage => (
                    <Button
                      key={stage}
                      type={selectedStage === stage ? 'primary' : 'text'}
                      onClick={() => handleStageSelect(stage)}
                      block
                      className={`text-left ${stage === '全部' ? 'lifecycle-all-button' : ''}`}
                    >
                      {stage}
                    </Button>
                  ))}
                </Space>
              </div>
            </Card>
          </Col>

          {/* 3.2 Emission Source List (Bottom Right) - Adjusted span to 19 */}
          <Col span={19} className="flex flex-col h-full">
            <Card
              title={`排放源清单${selectedStage === '全部' ? '' : ` - ${selectedStage}`}`}
              size="small"
              className="flex-grow flex flex-col min-h-0 bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor emission-source-table"
              extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAddEmissionSource}>新增排放源</Button>} // Moved button here
            >
              {/* The filter-controls div below will be removed or its content (if any other than the button) will be moved */}
              <div className="mb-4 flex-shrink-0 filter-controls flex justify-between items-center">
                <Space> {/* Buttons for the left side - kept if other buttons exist, otherwise this Space can be removed */}
                  {/* <Button icon={<DatabaseOutlined />} onClick={handleCarbonFactorMatch}>碳因子匹配</Button> */} {/* Removed old button */}
                  {/* The AI补全数据 button that was here is now moved to AI工具箱 */}
                </Space>
                {/* Button was here, now moved to Card's extra prop */}
              </div>
              <div className="flex-grow overflow-auto emission-source-table-scroll-container">
                {/* --- Use new columns and filtered nodes --- */}
                <Table
                  className="emission-source-table"
                  columns={nodeTableColumns}
                  dataSource={getFilteredNodesForTable()} // Use the helper function
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 10 }}
                  scroll={{ y: 'calc(100vh - 500px)' }}
                />
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Modals and Drawers */}
      <Modal
        title="目标与范围" // Changed title
        open={isSettingsModalVisible}
        onCancel={handleCloseSettings}
        footer={null} // Use Form's footer
        width={900} // Increased width further
        style={{ top: 50 }} // Move modal closer to the top
        centered={false} // Ensure top style is applied
      >
        <Form form={settingsForm} layout="vertical" onFinish={handleSaveSettings} /* Removed initialValues, using setFieldsValue in useEffect */ >
          <Typography.Title level={5} style={{ marginBottom: '16px' }}>基本信息</Typography.Title>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="taskName"
                label="核算任务名称"
                rules={[{ required: true, message: '请输入核算任务名称' }]}
              >
                <Input placeholder="请填写" />
              </Form.Item>
              <Form.Item
                name="productName"
                label="核算产品"
              // rules={[{ required: false }]} // PRD: 非必选
              >
                <Select placeholder="选择产品" allowClear>
                  {/* Replace with actual product list from your data source */}
                  <Select.Option value="电冰箱">电冰箱</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Card size="small" title="产品信息">
                <p><strong>产品规格:</strong> {sceneInfo.productSpecs || '反显值'}</p>
                <p><strong>产品描述:</strong> {sceneInfo.productDesc || '反显值'}</p>
              </Card>
            </Col>
          </Row>

          <Typography.Title level={5} style={{ marginTop: '24px', marginBottom: '16px' }}>核算目标范围</Typography.Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="数据收集时间范围"
              // rules={[{ required: false }]} // PRD: 非必选
              >
                <Space>
                  <Form.Item name="dataCollectionStartDate" noStyle>
                    <DatePicker placeholder="开始时间" style={{ width: '100%' }} />
                  </Form.Item>
                  <span>-</span>
                  <Form.Item name="dataCollectionEndDate" noStyle>
                    <DatePicker placeholder="结束时间" style={{ width: '100%' }} />
                  </Form.Item>
                </Space>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="产品总产量"
                required
              // No direct Form.Item rule, combined field
              >
                <Space>
                  <Form.Item
                    name="totalOutputValue"
                    noStyle
                    rules={[{ required: true, message: '请输入总产量数值' }]}
                  >
                    <Input type="number" placeholder="数值" />
                  </Form.Item>
                  <Form.Item
                    name="totalOutputUnit"
                    noStyle
                    rules={[{ required: true, message: '请输入总产量单位' }]}
                  >
                    <Input placeholder="单位" />
                  </Form.Item>
                </Space>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="核算基准"
                required
              // No direct Form.Item rule, combined field
              >
                <Space>
                  <Form.Item
                    name="benchmarkValue"
                    noStyle
                    rules={[{ required: true, message: '请输入核算基准数值' }]}
                  >
                    <Input type="number" placeholder="数值" />
                  </Form.Item>
                  <Form.Item
                    name="benchmarkUnit"
                    noStyle
                    rules={[{ required: true, message: '请输入核算基准单位' }]}
                  >
                    <Input placeholder="单位" />
                  </Form.Item>
                </Space>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="conversionFactor"
                label="总产量单位转换系数"
                rules={[{ required: true, message: '请输入转换系数值' }]}
              >
                <Input type="number" placeholder="数值" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="功能单位">
                <Input placeholder="请填写" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="standard"
                label="核算标准" // Changed label from "满足标准" to "核算标准"
              // rules={[{ required: false }]} // PRD: 非必选
              >
                <Select placeholder="选择满足标准" className="custom-modal-select-small" allowClear>
                  <Select.Option value="ISO14067">ISO14067</Select.Option>
                  <Select.Option value="欧盟电池法">欧盟电池法</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="verificationLevel"
                label="预期核验级别"
              // rules={[{ required: false }]} // PRD: 非必选
              >
                <Select placeholder="选择核验等级" className="custom-modal-select-small" allowClear>
                  <Select.Option value="准核验级别">准核验级别</Select.Option>
                  <Select.Option value="披露级别">披露级别</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Typography.Title level={5} style={{ marginTop: '24px', marginBottom: '16px' }}>核算边界</Typography.Title>
          <Form.Item name="lifecycleType" label="选择核算边界类型">
            <Radio.Group onChange={(e) => {
              const type = e.target.value;
              if (type === 'half') {
                settingsForm.setFieldsValue({
                  calculationBoundaryHalfLifecycle: halfLifecycleSelectedStages,
                  calculationBoundaryFullLifecycle: [],
                });
              } else if (type === 'full') {
                settingsForm.setFieldsValue({
                  calculationBoundaryHalfLifecycle: [],
                  calculationBoundaryFullLifecycle: fullLifecycleSelectedStages,
                });
              } else { // Should not happen with current radio setup
                settingsForm.setFieldsValue({
                  calculationBoundaryHalfLifecycle: [],
                  calculationBoundaryFullLifecycle: [],
                });
              }
            }}>
              <Radio value="half">半生命周期 (摇篮到大门)</Radio>
              <Radio value="full">全生命周期 (摇篮到坟墓)</Radio>
            </Radio.Group>
          </Form.Item>

          <Row gutter={16} style={{ marginTop: '16px' }}>
            <Col span={12}>
              <Form.Item label="半生命周期阶段 (自动选择)">
                <Form.Item name="calculationBoundaryHalfLifecycle" noStyle>
                  <Checkbox.Group
                    options={allLifecycleStagesForCheckboxes}
                    disabled // Always disabled
                  />
                </Form.Item>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="全生命周期阶段 (自动选择)">
                <Form.Item name="calculationBoundaryFullLifecycle" noStyle>
                  <Checkbox.Group
                    options={allLifecycleStagesForCheckboxes}
                    disabled // Always disabled
                  />
                </Form.Item>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item className="text-right" style={{ marginTop: '32px' }}>
            <Space>
              <Button onClick={handleCloseSettings}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={editingNodeId ? "编辑排放源" : "新增排放源"}
        width={1000} // <-- Increased width
        onClose={handleCloseEmissionDrawer}
        open={isEmissionDrawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
        footer={null} // Using Form footer
        destroyOnClose // Ensure form state is reset each time
      >
        <Form layout="vertical" onFinish={handleSaveEmissionSource} initialValues={drawerInitialValues} key={editingNodeId || 'new'}>
          {/* 基本信息 */}
          <Typography.Title level={5} style={{ paddingLeft: '8px' }}>基本信息</Typography.Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="lifecycleStage" label="生命周期阶段" rules={[{ required: true, message: '请选择生命周期阶段' }]}>
                <Select placeholder="请选择生命周期阶段" className="panel-sider-select">
                  {lifecycleStages.map(stage => <Select.Option key={stage} value={stage}>{stage}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="emissionType" label="排放源类别" rules={[{ required: true, message: '请选择排放源类别' }]}>
                <Select placeholder="请选择排放源类别" className="panel-sider-select">
                  {emissionCategories.map(cat => <Select.Option key={cat} value={cat}>{cat}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="label" label="排放源名称" rules={[{ required: true, message: '请输入排放源名称' }]}>
                <Input placeholder="请输入排放源名称" className="panel-sider-input" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="supplementaryInfo" label="排放源补充信息">
            <Input.TextArea placeholder="请输入排放源补充信息" rows={3} className="panel-sider-textarea" />
          </Form.Item>

          {/* 活动水平数据 */}
          <Typography.Title level={5} style={{ marginTop: '24px', marginBottom: '16px', paddingLeft: '8px' }}>活动水平数据</Typography.Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="活动数据数值"
                rules={[
                  // { required: true, message: '请输入活动数据数值' }, // Already not required
                  {
                    transform: value => {
                      const trimmedValue = String(value).trim();
                      if (trimmedValue === '' || value === null || value === undefined) return undefined;
                      return Number(trimmedValue);
                    },
                    type: 'number',
                    message: '活动数据数值必须为有效的数字'
                  },
                  {
                    validator: (_, value) => { // Corrected: validator is a property of this rule object
                      if (value === undefined || value === null || String(value).trim() === '') return Promise.resolve();
                      return Number(value) > 0 ? Promise.resolve() : Promise.reject(new Error('活动数据数值必须为正数'));
                    }
                  }
                ]}
              >
                <Input type="number" step="any" placeholder="请输入活动数据数值" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="activityUnit"
                label="活动数据单位"
                rules={[
                  // { required: true, message: '请输入活动数据单位' } // Changed to not required
                ]}
              >
                <Input placeholder="请输入活动数据单位，例如：kg" className="panel-sider-input" />
              </Form.Item>
            </Col>
          </Row>

          {/* 新增运输相关字段 */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startPoint" label="运输-起点">
                <Input placeholder="请输入运输起点" className="panel-sider-input" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endPoint" label="运输-终点">
                <Input placeholder="请输入运输终点" className="panel-sider-input" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="transportationMode" label="运输方式">
                <Input placeholder="请输入运输方式" className="panel-sider-input" />
              </Form.Item>
            </Col>
            {/* 可以在这里为另一半 Col 添加其他相关字段，如果需要的话 */}
          </Row>

          <Form.Item label="关联证据文件">
            <Upload
              name="evidenceFiles"
              listType="text"
              maxCount={5}
              multiple
              beforeUpload={beforeUpload}
              onRemove={(file) => {
                console.log('[Upload] onRemove', file);
                setDrawerEvidenceFiles(prev => {
                  const updated = prev.filter(f => f.id !== file.uid);
                  console.log('[Upload] drawerEvidenceFiles after remove', updated);
                  return updated;
                });
                return true;
              }}
              onChange={(info) => {
                console.log('[Upload] onChange status', info.file.status, info.file);
                handleEvidenceUploadChange(info);
              }}
              fileList={drawerEvidenceFiles.map(f => ({
                uid: f.id,
                name: f.name,
                status: 'done',
                url: f.url,
              }))}
            >
              <Button icon={<UploadOutlined />} className="panel-sider-upload">上传</Button>
            </Upload>
            <div style={{ marginTop: 4, fontSize: 12, color: '#888' }}>最多可上传5个证据文件</div>
          </Form.Item>

          {/* 背景数据 */}
          <Typography.Title level={5} style={{ marginTop: '24px', marginBottom: '16px', paddingLeft: '8px' }}>背景数据</Typography.Title>
          <Tabs activeKey={backgroundDataActiveTabKey} onChange={setBackgroundDataActiveTabKey}> {/* Re-add onChange to update state, and set activeKey */}
            <Tabs.TabPane tab="数据库" key="database">
              <Row gutter={16} align="bottom">
                <Col span={18}>
                  <Form.Item label="排放因子名称">
                    <Input placeholder="请点击右侧按钮选择排放因子" disabled className="panel-sider-input" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label=" "> {/* Empty label for alignment */}
                    <Button type="primary" onClick={() => message.info('数据库检索功能待实现')} block className="panel-sider">选择排放因子</Button>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="排放因子数值 (kgCO2e)">
                    <Input placeholder="从数据库选择" disabled className="panel-sider-input" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="排放因子分母单位">
                    <Input placeholder="从数据库选择" disabled className="panel-sider-input" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="地理代表性">
                    <Input placeholder="从数据库选择" disabled className="panel-sider-input" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="发布时间">
                    <Input placeholder="从数据库选择" disabled className="panel-sider-input" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="数据库名称">
                    <Input placeholder="从数据库选择" disabled className="panel-sider-input" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="因子UUID">
                    <Input placeholder="从数据库选择" disabled className="panel-sider-input" />
                  </Form.Item>
                </Col>
              </Row>
            </Tabs.TabPane>
            <Tabs.TabPane tab="手动填写" key="manual">
              <Form.Item
                name="carbonFactorName"
                label="排放因子名称"
                rules={[{
                  required: backgroundDataActiveTabKey === 'manual',
                  message: '请输入排放因子名称'
                }]}
              >
                <Input placeholder="请输入排放因子名称" className="panel-sider-input" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="carbonFactor"
                    label="排放因子数值 (kgCO2e)"
                    rules={[
                      {
                        required: backgroundDataActiveTabKey === 'manual',
                        message: '请输入排放因子数值'
                      },
                      {
                        type: 'number',
                        transform: value => String(value).trim() === '' ? undefined : Number(value),
                        message: '请输入有效的数字'
                      }
                    ]}
                  >
                    <Input type="number" step="any" placeholder="请输入排放因子数值，保留小数点后10位，可正可负" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="carbonFactorUnit"
                    label="排放因子分母单位"
                    rules={[{
                      required: backgroundDataActiveTabKey === 'manual',
                      message: '请输入排放因子分母单位'
                    }]}
                  >
                    <Input placeholder="请输入排放因子分母单位，例如：kg" className="panel-sider-input" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="emissionFactorGeographicalRepresentativeness"
                    label="地理代表性"
                    rules={[{
                      required: backgroundDataActiveTabKey === 'manual',
                      message: '请输入地理代表性'
                    }]}
                  >
                    <Input placeholder="请输入地理代表性，例如：GLO" className="panel-sider-input" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="emissionFactorTemporalRepresentativeness"
                    label="发布时间"
                    rules={[{
                      required: backgroundDataActiveTabKey === 'manual',
                      message: '请输入发布时间'
                    }]}
                  >
                    <Input placeholder="请输入发布时间，例如：2022" className="panel-sider-input" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="carbonFactordataSource"
                    label="数据库名称"
                    rules={[{
                      required: backgroundDataActiveTabKey === 'manual',
                      message: '请输入数据库名称'
                    }]}
                  >
                    <Input placeholder="请输入数据库名称，例如：Ecoinvent" className="panel-sider-input" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="activityUUID"
                    label="因子UUID"
                    rules={[{
                      required: backgroundDataActiveTabKey === 'manual',
                      message: '请输入因子UUID'
                    }]}
                  >
                    <Input placeholder="请输入因子UUID" className="panel-sider-input" />
                  </Form.Item>
                </Col>
              </Row>
            </Tabs.TabPane>
          </Tabs>

          {/* 单位转换 */}
          <Typography.Title level={5} style={{ marginTop: '24px', marginBottom: '16px', paddingLeft: '8px' }}>单位转换</Typography.Title>
          <Form.Item
            label={<Typography.Text>将活动水平数据单位与排放因子单位进行转换：</Typography.Text>}
            labelCol={{ span: 24 }} // Ensure label takes full width if needed
            wrapperCol={{ span: 24 }}
          >
            <Space align="baseline" wrap>
              <Typography.Text>
                1
                {/* TODO: Replace with dynamic values from form using Form.useWatch or similar */}
                <span style={{ fontWeight: 'bold', marginLeft: 4, marginRight: 4 }}>kg 水溶液</span>
                对应
              </Typography.Text>
              <Form.Item
                name="unitConversion"
                rules={[
                  {
                    transform: value => {
                      const trimmedValue = String(value).trim();
                      if (trimmedValue === '' || value === null || value === undefined) return undefined;
                      return Number(trimmedValue);
                    },
                    type: 'number',
                    message: '单位转换系数必须为有效的数字'
                  }
                ]}
                noStyle
              >
                <Input type="number" step="any" placeholder="系数" style={{ width: 120, textAlign: 'center', marginLeft: 8, marginRight: 8 }} className="panel-sider" />
              </Form.Item>
              <Typography.Text>
                {/* TODO: Replace with dynamic values from form */}
                <span style={{ fontWeight: 'bold' }}>kg 水</span>
              </Typography.Text>
            </Space>
          </Form.Item>

          <Form.Item className="text-right" style={{ marginTop: 24, paddingTop: 10, borderTop: '1px solid var(--bolt-elements-borderColor, #333)' }}>
            <Space>
              <Button onClick={handleCloseEmissionDrawer}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Upload File Modal (New - Implementing Content) */}
      <Modal
        title="上传原始文件"
        open={isUploadModalVisible}
        onOk={handleUploadModalOk} // Connect OK handler
        onCancel={handleCloseUploadModal} // Connect Cancel handler
        width={600} // Increased width
        okText="确认" // Customize button text
        cancelText="取消" // Customize button text
        destroyOnClose // Reset state when modal is closed
        confirmLoading={isUploading} // Add confirmLoading state
      >
        <Form layout="vertical" ref={uploadModalFormRef}>
          <Form.Item label="添加文件:" className="upload-modal-upload-item">
            <Upload.Dragger
              name="files"
              multiple={true}
              onChange={handleModalUploadChange}
              fileList={modalFileList}
              showUploadList={false} // Hide default list, we use our table
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持单次或批量上传。
              </p>
            </Upload.Dragger>
          </Form.Item>

          {modalFileList.length > 0 && (
            <Form.Item label="已选文件列表:">
              <Table
                dataSource={modalFileList}
                columns={[
                  { title: '文件名称', dataIndex: 'name', key: 'name', ellipsis: true },
                  {
                    title: '文件类型',
                    dataIndex: 'uid',
                    key: 'type',
                    width: 180,
                    render: (uid: string, record: ModalUploadFile) => (
                      <Select
                        value={record.selectedType}
                        onChange={(value) => handleModalFileTypeChange(uid, value)}
                        placeholder="选择类型"
                        allowClear
                      >
                        {RawFileTypes.map(type => (
                          <Select.Option key={type} value={type}>{type}</Select.Option>
                        ))}
                      </Select>
                    ),
                  },
                  {
                    title: '操作',
                    key: 'action',
                    width: 80,
                    render: (text: any, record: ModalUploadFile) => (
                      <Tooltip title="删除">
                        <Button
                          danger
                          type="link"
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveFileFromModalList(record.uid)}
                        />
                      </Tooltip>
                    ),
                  },
                ]}
                rowKey="uid"
                size="small"
                pagination={false} // Or configure pagination if needed for many files
                scroll={{ y: 200 }} // Add scroll if list can be long
                className="upload-modal-file-table" // For potential styling
              />
              <div style={{ marginTop: '10px', textAlign: 'right' }}>
                <Button icon={<ClearOutlined />} onClick={handleClearModalList} disabled={modalFileList.length === 0}>
                  清空列表
                </Button>
              </div>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* 新增：因子匹配弹窗 */}
      <Modal
        title="背景数据匹配"
        open={isFactorMatchModalVisible}
        onCancel={handleCloseFactorMatchModal}
        width="80%"
        footer={[

          <Button key="aiMatch" type="primary" onClick={handleFactorMatchAI} disabled={selectedFactorMatchSources.length === 0}>
            AI匹配
          </Button>, // 按钮移到筛选行
          <Button key="cancel" onClick={handleCloseFactorMatchModal}>取消</Button>,

        ]}
      >
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Input placeholder="排放源名称" style={{ width: 200 }} className="background-data-match-input" />
            <Select placeholder="生命周期阶段 (全部)" style={{ width: 150 }} allowClear className="background-data-match-select">
              {lifecycleStages.map(stage => <Select.Option key={stage} value={stage}>{stage}</Select.Option>)}
            </Select>

            <Select placeholder="排放源类别 (全部)" style={{ width: 200 }} allowClear className="background-data-match-select">
              {emissionCategories.map(cat => <Select.Option key={cat} value={cat}>{cat}</Select.Option>)}
            </Select>
            {/* 新增：因子匹配状态筛选框 */}
            <Select placeholder="因子匹配状态 (全部)" style={{ width: 200 }} allowClear className="background-data-match-select">
              {(['未配置因子', 'AI匹配失败', 'AI匹配成功', '已手动配置因子'] as const).map(status => <Select.Option key={status} value={status}>{status}</Select.Option>)}
            </Select>
            {/* TODO: 实现筛选逻辑 */}
          </Space>

        </div>
        <Table
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedFactorMatchSources,
            onChange: (selectedRowKeys: React.Key[]) => {
              setSelectedFactorMatchSources(selectedRowKeys);
            },
          }}
          columns={factorMatchTableColumns.map((col: ColumnType<Node<NodeData>>) => { // 现在应该能找到了
            if (col.key === 'lifecycleStage') {
              return {
                ...col,
                render: (text: any, record: Node<NodeData>) => {
                  const node = nodes.find(n => n.id === record.id);
                  const stageType = node?.type || '';
                  return nodeTypeToLifecycleStageMap[stageType] || '未知';
                }
              };
            }
            return col;
          })}
          dataSource={factorMatchModalSources.map((node, index) => ({ ...node, key: node.id, index }))} // Use nodes from state
          rowKey="id"
          size="small"
          scroll={{ y: 'calc(60vh - 150px)' }}
        />
      </Modal>

      {/* 匹配结果弹窗 */}
      <Modal
        title="碳因子匹配结果"
        open={showMatchResultsModal}
        onCancel={() => setShowMatchResultsModal(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setShowMatchResultsModal(false)}>
            关闭
          </Button>
        ]}
      >
        <div className="mb-4"> {/* Parent of "匹配结果摘要" */}
          <div className="font-bold text-lg mb-3 text-white">匹配结果摘要</div> {/* 修改在这里 */}
          <div className="flex space-x-4 text-white">
            <div className="border p-3 rounded flex-1 bg-green-40 text-center text-white">
              <div className="text-2xl text-white">{matchResults.success.length}</div>
              <div className="text-white">匹配成功</div>
            </div>
            <div className="border p-3 rounded flex-1 bg-red-40 text-center text-white">
              <div className="text-2xl text-white">{matchResults.failed.length}</div>
              <div className="text-white">匹配失败</div>
            </div>
          </div>
        </div>

        <div className="mb-4"> {/* Parent of "API匹配日志" */}
          <div className="font-bold text-lg mb-2 text-white">API匹配日志</div> {/* 修改在这里 */}
          <div className="border rounded p-2 bg-gray-30 h-40 overflow-auto text-white">
            {matchResults.logs.length > 0 ? (
              <ul className="list-disc pl-5">
                {matchResults.logs.map((log, index) => (
                  <li key={index} className="text-sm text-white mb-1">{log}</li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-white py-4">无匹配日志信息</div>
            )}
          </div>
        </div>

        <div>
          <div className="font-bold text-lg mb-2 text-white">详细匹配结果</div>
          <Tabs defaultActiveKey="success" className="text-white">
            <Tabs.TabPane tab="成功匹配" key="success">
              {matchResults.success.length > 0 ? (
                <ul className="list-disc pl-5">
                  {matchResults.success.map(id => {
                    const node = nodes.find(n => n.id === id); // Find node by ID
                    const data = node?.data as any;
                    return (
                      <li key={id} className="mb-1 text-white">
                        <span className="font-semibold">{node?.data?.label || id}</span>:
                        {data ? ` 碳因子值=${data.carbonFactor || '未知'}` : ' 匹配成功'}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-center text-white py-4">无成功匹配的排放源</div>
              )}
            </Tabs.TabPane>
            <Tabs.TabPane tab="失败匹配" key="failed">
              {matchResults.failed.length > 0 ? (
                <ul className="list-disc pl-5">
                  {matchResults.failed.map(id => {
                    const node = nodes.find(n => n.id === id); // Find node by ID
                    return <li key={id} className="mb-1 text-white">{node?.data?.label || id}</li>;
                  })}
                </ul>
              ) : (
                <div className="text-center text-white py-4">无失败匹配的排放源</div>
              )}
            </Tabs.TabPane>
          </Tabs>
        </div>
      </Modal>

      {/* AI一键补全数据弹窗 */}
      <Modal
        title="AI一键补全数据"
        open={isAIAutoFillModalVisible}
        onCancel={() => setIsAIAutoFillModalVisible(false)}
        footer={null}
        width={1400}
        className="ai-autofill-modal" // Added className
        style={{ top: 20 }} // Added style to adjust top position
      >
        {/* Consolidated Filter Panel - Placed above the table */}
        <div style={{ marginBottom: 20, padding: 16, borderRadius: 4 }}> {/* Removed border style */}
          <Row gutter={[12, 8]}> {/* Vertical gutter between filter items, changed from [16,16] */}
            {/* Row 1: 生命周期阶段 */}
            <Col span={24}>
              <Row align="middle" gutter={[8, 0]}> {/* gutter between title and control */}
                <Col flex="0 0 140px"><Typography.Text strong>生命周期阶段:</Typography.Text></Col>
                <Col flex="auto">
                  <Radio.Group
                    value={aiFilterStage}
                    onChange={(e) => setAiFilterStage(e.target.value)}
                    optionType="button"
                    buttonStyle="solid"
                    style={{ flexWrap: 'nowrap' }}
                  >
                    <Radio value={undefined}>全部</Radio>
                    {lifecycleStages.filter(s => s !== '全部').map(stage => (
                      <Radio key={stage} value={stage}>{stage}</Radio>
                    ))}
                  </Radio.Group>
                </Col>
              </Row>
            </Col>

            {/* Row 2: 排放源名称 */}
            <Col span={24}>
              <Row align="middle" gutter={[8, 0]}>
                <Col flex="0 0 140px"><Typography.Text strong>排放源名称:</Typography.Text></Col>
                <Col flex="auto">
                  <Input
                    placeholder="请输入排放源名称"
                    style={{ maxWidth: 300 }} // Use maxWidth to prevent overly wide input
                    allowClear
                    value={aiFilterName}
                    onChange={e => setAiFilterName(e.target.value)}
                  />
                </Col>
              </Row>
            </Col>

            {/* Row 3: 排放源类别 */}
            <Col span={24}>
              <Row align="middle" gutter={[8, 0]}>
                <Col flex="0 0 140px"><Typography.Text strong>排放源类别:</Typography.Text></Col>
                <Col flex="auto">
                  <Radio.Group
                    value={aiFilterCategory}
                    onChange={(e) => setAiFilterCategory(e.target.value)}
                    optionType="button"
                    buttonStyle="solid"
                    style={{ flexWrap: 'nowrap' }}
                  >
                    <Radio value={undefined}>全部</Radio>
                    {emissionCategories.map(cat => (
                      <Radio key={cat} value={cat}>{cat}</Radio>
                    ))}
                  </Radio.Group>
                </Col>
              </Row>
            </Col>

            {/* Row 4: 缺失数据 */}
            <Col span={24}>
              <Row align="middle" gutter={[8, 0]}>
                <Col flex="0 0 140px"><Typography.Text strong>缺失数据:</Typography.Text></Col>
                <Col flex="auto">
                  <Space wrap>
                    <Button
                      type={aiFilterMissingActivity ? 'primary' : 'default'}
                      onClick={() => setAiFilterMissingActivity(v => !v)}
                    >
                      活动数据数值及单位
                    </Button>
                    <Button
                      type={aiFilterMissingConversion ? 'primary' : 'default'}
                      onClick={() => setAiFilterMissingConversion(v => !v)}
                    >
                      单位转换系数
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Col>

            {/* Row 5: 是否含AI数据 */}
            <Col span={24}>
              <Row align="middle" gutter={[8, 0]}>
                <Col flex="0 0 140px"><Typography.Text strong>是否含AI数据:</Typography.Text></Col>
                <Col flex="auto">
                  <Radio.Group
                    options={[
                      { label: '全部', value: 'all' },
                      { label: '含AI生成数据', value: 'ai' },
                      { label: '不含AI生成数据', value: 'manual' },
                    ]}
                    onChange={(e) => setAiFilterShowType(e.target.value)}
                    value={aiFilterShowType}
                    optionType="button"
                    buttonStyle="solid"
                    style={{ flexWrap: 'nowrap' }}
                  />
                </Col>
              </Row>
            </Col>
          </Row>
        </div>

        <Table
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: aiAutoFillSelectedRowKeys,
            onChange: setAiAutoFillSelectedRowKeys,
          }}
          bordered
          dataSource={filteredNodesForAIModal.map((node, idx) => ({ ...node, key: node.id, index: idx + 1 }))} // Use filtered nodes
          pagination={false}
          scroll={{ x: 'max-content', y: 550 }} // Increased scroll height from 400
          size="small"
          columns={columnsAIAutoFill} // Use updated columns
        />
        {/* 底部操作按钮 */}
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Button
            type="primary"
            disabled={aiAutoFillSelectedRowKeys.length === 0}
            style={{ marginRight: 12 }}
            onClick={() => setAiAutoFillConfirmType('conversion')}
          >
            一键补全单位转换系数
          </Button>
          <Button
            type="primary"
            disabled={aiAutoFillSelectedRowKeys.length === 0}
            onClick={() => setAiAutoFillConfirmType('transport')}
          >
            一键补全运输数据
          </Button>
          <Button
            type="primary"
            disabled={aiAutoFillSelectedRowKeys.length === 0}
            style={{ marginLeft: 12 }}
            onClick={handleAIAutofillCarbonFactorMatch} // Call the new handler
          >
            一键补全碳因子匹配
          </Button>
        </div>
        {/* 二次确认弹窗 */}
        <Modal
          open={!!aiAutoFillConfirmType}
          title={aiAutoFillConfirmType === 'conversion' ? '确认补全单位转换系数' : '确认补全运输数据'}
          onCancel={() => setAiAutoFillConfirmType(null)}
          onOk={async () => {
            if (aiAutoFillConfirmType === 'transport') {
              const selected = filteredNodesForAIModal.filter(item => aiAutoFillSelectedRowKeys.includes(item.id));
              // category 包含"运输"或 nodeType 为 distribution
              const transportNodes = selected.filter(item =>
                (item.data.emissionType && item.data.emissionType.includes('运输')) || item.type === 'distribution'
              );
              if (transportNodes.length === 0) {
                message.warning('请选择运输类型的排放源');
                setAiAutoFillConfirmType(null);
                return;
              }
              const nodeIds = transportNodes.map(item => item.id).join(',');
              const action: CarbonFlowAction = {
                type: 'carbonflow',
                operation: 'ai_autofill_transport_data',
                nodeId: nodeIds,
                content: 'AI一键补全运输数据',
              };
              window.dispatchEvent(new CustomEvent('carbonflow-action', {
                detail: { action }
              }));
              setAiAutoFillConfirmType(null);
            } else if (aiAutoFillConfirmType === 'conversion') {
              if (!aiAutoFillSelectedRowKeys || aiAutoFillSelectedRowKeys.length === 0) {
                message.warning('请选择至少一个排放源进行单位转换系数补全');
                setAiAutoFillConfirmType(null);
                return;
              }
              const nodeIds = aiAutoFillSelectedRowKeys.map(id => String(id)).join(',');
              const action: CarbonFlowAction = {
                type: 'carbonflow',
                operation: 'ai_autofill_conversion_data', // 新的操作类型
                nodeId: nodeIds,
                content: 'AI一键补全单位转换系数',
              };
              window.dispatchEvent(new CustomEvent('carbonflow-action', {
                detail: { action }
              }));
              setAiAutoFillConfirmType(null);
            }
          }}
          okText="确认"
          cancelText="取消"
          width={1400}
        >
          {(() => {
            const selected = filteredNodesForAIModal.filter(item => aiAutoFillSelectedRowKeys.includes(item.id));
            if (aiAutoFillConfirmType === 'conversion') {
              const hasFilled = selected.some(item => item.data.unitConversion !== undefined && item.data.unitConversion !== null && String(item.data.unitConversion).trim() !== '');
              return hasFilled ? '检测到已填写单位转换系数数据，AI补全将覆盖原有数据，是否继续？' : '是否对所选排放源进行AI补全单位转换系数？';
            } else if (aiAutoFillConfirmType === 'transport') {
              const hasFilled = selected.some(item => item.data.quantity !== undefined && item.data.quantity !== null && String(item.data.quantity).trim() !== ''); // Check quantity for transport
              return hasFilled ? '检测到已填写活动数据数值的数据，AI补全将覆盖原有数据，是否继续？' : '是否对所选排放源进行AI补全运输数据？';
            }
            return null;
          })()}
        </Modal>
        {/* 补全结果弹窗 */}
        <Modal
          open={!!aiAutoFillResult}
          title="AI补全结果"
          onCancel={() => setAiAutoFillResult(null)}
          footer={<Button type="primary" onClick={() => setAiAutoFillResult(null)}>关闭</Button>}
          width={1400}
        >
          <div style={{ marginBottom: 16 }}>
            <b>补全成功：</b> {aiAutoFillResult?.success.length || 0} 条
            <ul style={{ marginTop: 8 }}>
              {aiAutoFillResult?.success.map(id => {
                const node = nodes.find(n => n.id === id); // Find node
                return <li key={id}>{node?.data?.label || id}</li>;
              })}
            </ul>
          </div>
          <div>
            <b>补全失败：</b> {aiAutoFillResult?.failed.length || 0} 条
            <ul style={{ marginTop: 8 }}>
              {aiAutoFillResult?.failed.map(({ id, reason }: { id: string, reason: string }) => { // Add types for id and reason
                const node = nodes.find(n => n.id === id); // Find node
                return <li key={id}>{node?.data?.label || id}（{reason}）</li>;
              })}
            </ul>
          </div>
        </Modal>
      </Modal>

      {/* New Modal for AI File Parse / Raw Data Files */}
      <Modal
        title="AI文件解析" // Changed title to match prototype
        open={isAIFileParseModalVisible}
        onCancel={handleCloseAIFileParseModal}
        width="80%" // Increased width to accommodate two columns
        footer={[
          <Button key="close" onClick={handleCloseAIFileParseModal}>
            返回
          </Button>,
        ]}
        destroyOnClose
      >
        <Row gutter={16}>
          <Col span={8}> {/* Left column for file list */}
            <Card title="原始数据文件" size="small" extra={<Button icon={<UploadOutlined />} onClick={handleOpenUploadModal}>上传</Button>}>
              <div className="flex-grow overflow-auto file-upload-table-container" style={{ maxHeight: 'calc(80vh - 200px)' }}> {/* Adjust maxHeight for modal context */}
                {isLoadingFiles && <Spin tip="加载文件中..." />}
                {!isLoadingFiles && uploadedFiles.length === 0 && (
                  <Empty description="暂无文件" />
                )}
                {!isLoadingFiles && uploadedFiles.length > 0 && (
                  <Table
                    columns={fileTableColumns.map(col => {
                      // Make columns more compact for this view if needed
                      if (col.key === 'action') {
                        return { ...col, width: 80 }; // Example: reduce action column width
                      }
                      return col;
                    })}
                    dataSource={[...uploadedFiles].sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime())}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 10, size: 'small' }} // Smaller pagination
                    className="file-upload-table"
                    // Add onRow click handler if needed for right panel later
                    onRow={(record: UploadedFile) => {
                      return {
                        onClick: event => {
                          console.log('Row clicked in AI Parse Modal:', record);
                          setSelectedFileForParse(record);
                        },
                      };
                    }}
                    rowClassName={(record: UploadedFile) => {
                      return record.id === selectedFileForParse?.id ? 'ant-table-row-selected' : '';
                    }}
                  />
                )}
              </div>
            </Card>
          </Col>
          <Col span={16}> {/* Right column, for file details and parse results */}
            {selectedFileForParse ? (
              <div>
                <Typography.Title level={4} style={{ marginBottom: 16 }}>{selectedFileForParse.name}</Typography.Title>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Typography.Text><strong>上传时间:</strong> {selectedFileForParse.uploadTime}</Typography.Text>
                  </Col>
                  <Col span={24}>
                    <Typography.Text><strong>类型:</strong> {selectedFileForParse.type}</Typography.Text>
                  </Col>
                  <Col span={24}>
                    <Typography.Text><strong>源文件:</strong> </Typography.Text>
                    <Button type="link" onClick={() => handlePreviewFile(selectedFileForParse)} disabled={!selectedFileForParse.url}>
                      {selectedFileForParse.name} (点击预览)
                    </Button>
                  </Col>
                </Row>


                <Typography.Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>解析结果</Typography.Title>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Typography.Text><strong>解析状态:</strong> {getChineseFileStatusMessage(selectedFileForParse.status)}</Typography.Text>
                  </Col>
                  <Col span={12} style={{ textAlign: 'right' }}>
                    <Button
                      type="primary"
                      onClick={() => selectedFileForParse && handleParseFile(selectedFileForParse)}
                      loading={selectedFileForParse?.status === 'parsing'} // Simplified loading state
                      disabled={selectedFileForParse?.status === 'parsing'} // Disable if parsing
                    >
                      {(selectedFileForParse?.status === 'completed' || selectedFileForParse?.status === 'failed') ? '重新解析' : '开始解析'}
                    </Button>
                  </Col>
                  <Col span={24}>
                    <Typography.Text><strong>解析结果概览:</strong></Typography.Text>
                    <Card size="small" style={{ marginTop: 8, backgroundColor: 'var(--bolt-elements-background-depth-1)', borderColor: 'var(--bolt-elements-borderColor)' }}>
                      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: 'var(--bolt-elements-textPrimary)', maxHeight: 100, overflowY: 'auto' }}>
                        {selectedFileForParse?.status === 'parsing' ? '正在解析文件...' :
                          selectedFileForParse?.status === 'pending' ? '等待解析。' :
                            selectedFileForParse?.content || '暂无概览信息。'}
                      </pre>
                    </Card>
                  </Col>
                </Row>


                <Divider />

                {/* 解析结果数据表格 */}
                <Typography.Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>解析结果数据</Typography.Title>
                {parsedNodes.length > 0 ? (
                  <>
                    <Table
                      rowSelection={{
                        selectedRowKeys: selectedParsedSourceKeys,
                        onChange: setSelectedParsedSourceKeys,
                      }}
                      columns={parsedEmissionSourceTableColumns as any}
                      dataSource={parsedNodes as any}
                      rowKey="key"
                      size="small"
                      pagination={{ pageSize: 5, size: 'small' }}
                      scroll={{ y: 200 }}
                    />
                  </>
                ) : (
                  <Empty description='解析完成，但未提取到有效数据点。' />
                )}

                <Divider />

              </div>
            ) : (
              <div style={{ border: '1px dashed var(--bolt-elements-borderColor)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(80vh - 130px)', backgroundColor: 'var(--bolt-elements-background-depth-0)' }}>
                <Empty description="请从左侧选择一个文件以查看详情和解析结果" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            )}
          </Col>
        </Row>
      </Modal>


      <div style={{ display: 'none' }}>
        <CarbonFlowAISummary
          setSelectedNode={(node: Node<NodeData> | null) => {
            // console.log('AISummary: Node click in CarbonCalculatorPanel, node ID:', node?.id);
            useCarbonFlowStore.getState().setSelectedNodeId(node?.id ?? null);
          }}
        />
      </div>

    </div>
  );
}

// 在文件末尾添加 CSS 样式
const customStyles = `
/* Set explicit dark background for the table */
.emission-source-table .ant-table {
  background: var(--bolt-elements-background-depth-2, #1e1e1e) !important; /* Explicit dark background */
}

.emission-source-table .ant-table-thead > tr > th {
  background: var(--bolt-elements-background-depth-2, #1e1e1e) !important; /* Match table background */
  color: var(--bolt-elements-textSecondary) !important;
  border-bottom: 1px solid var(--bolt-elements-borderColor) !important;
}

.emission-source-table .ant-table-tbody > tr > td {
  background: transparent !important; /* Keep cell background transparent to inherit from row */
  border-bottom: 1px solid var(--bolt-elements-borderColor) !important;
  color: var(--bolt-elements-textPrimary) !important;
}

/* Target potential inner cell wrappers */
.emission-source-table .ant-table-cell {
    background: inherit !important; /* Inherit from td/th */
}

/* Row background - set here so cells inherit */
.emission-source-table .ant-table-tbody > tr {
    background: var(--bolt-elements-background-depth-2, #1e1e1e) !important;
}

/* Fix for fixed column background overlap */
.emission-source-table .ant-table-thead > tr > th.ant-table-cell-fix-right,
.emission-source-table .ant-table-tbody > tr > td.ant-table-cell-fix-right,
.emission-source-table .ant-table-thead > tr > th.ant-table-cell-fix-left,
.emission-source-table .ant-table-tbody > tr > td.ant-table-cell-fix-left {
    background: var(--bolt-elements-background-depth-2, #1e1e1e) !important; /* Keep base background same as row */
}

/* Ensure fixed column hover is OPAQUE */
.emission-source-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-right,
.emission-source-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-left {
    background: var(--bolt-elements-background-depth-1, #2a2a2a) !important; /* Use a slightly lighter opaque color */
}

/* 悬停和选中行的背景色 - Apply to the row (Non-fixed columns can be semi-transparent) */
.emission-source-table .ant-table-tbody > tr:hover > td {
    background: var(--bolt-hover-background, rgba(255, 255, 255, 0.1)) !important;
}

/* Ensure pagination elements match the theme */
.emission-source-table .ant-pagination {
    background: var(--bolt-elements-background-depth-2, #1e1e1e) !important;
    padding: 8px;
    border-radius: 4px;
    margin-top: 16px !important; /* Add some space */
    display: flex; /* For alignment of items like page sizer */
    justify-content: flex-end; /* Align pagination to the right */
    align-items: center;
}

/* Default text color for pagination items */
.emission-source-table .ant-pagination-item a,
.emission-source-table .ant-pagination-item-link { /* This applies to prev/next arrow icons and ellipsis */
    color: var(--bolt-elements-textSecondary) !important;
    display: block; /* Ensure link fills the item for clickability */
    height: 100%;
    width: 100%;
    line-height: 30px; /* Adjust if item height is different */
}

/* Individual pagination items (numbers, prev/next, ellipsis buttons) */
.emission-source-table .ant-pagination-item,
.emission-source-table .ant-pagination-prev,
.emission-source-table .ant-pagination-next,
.emission-source-table .ant-pagination-jump-prev,
.emission-source-table .ant-pagination-jump-next {
    background-color: var(--bolt-elements-background-depth-1, #2a2a2a) !important;
    border: 1px solid var(--bolt-elements-borderColor, #333) !important;
    border-radius: 4px !important; /* Updated to 4px for consistency */
    min-width: 32px; /* AntD default min-width */
    height: 32px; /* AntD default height */
    line-height: 30px; /* AntD default line-height */
    text-align: center;
    margin-right: 8px; /* Spacing between items */
    display: inline-flex !important; /* Use flex for centering content */
    align-items: center;
    justify-content: center;
    transition: background-color 0.3s, border-color 0.3s;
}

/* Hover state for non-active, non-disabled items */
.emission-source-table .ant-pagination-item:not(.ant-pagination-item-active):not(.ant-pagination-disabled):hover,
.emission-source-table .ant-pagination-prev:not(.ant-pagination-disabled):hover,
.emission-source-table .ant-pagination-next:not(.ant-pagination-disabled):hover,
.emission-source-table .ant-pagination-jump-prev:not(.ant-pagination-disabled):hover,
.emission-source-table .ant-pagination-jump-next:not(.ant-pagination-disabled):hover {
    background-color: var(--bolt-hover-background, #383838) !important;
    border-color: var(--bolt-primary, #5165f9) !important;
}

/* Text/icon color on hover for non-active, non-disabled items */
.emission-source-table .ant-pagination-item:not(.ant-pagination-item-active):not(.ant-pagination-disabled):hover a,
.emission-source-table .ant-pagination-prev:not(.ant-pagination-disabled):hover .ant-pagination-item-link,
.emission-source-table .ant-pagination-next:not(.ant-pagination-disabled):hover .ant-pagination-item-link,
.emission-source-table .ant-pagination-jump-prev:not(.ant-pagination-disabled):hover .ant-pagination-item-link, /* This targets the wrapper of ellipsis icon */
.emission-source-table .ant-pagination-jump-next:not(.ant-pagination-disabled):hover .ant-pagination-item-link {
    color: var(--bolt-primary, #5165f9) !important;
}

/* Active pagination item */
.emission-source-table .ant-pagination-item-active {
    background-color: var(--bolt-primary, #5165f9) !important;
    border-color: var(--bolt-primary, #5165f9) !important;
}
.emission-source-table .ant-pagination-item-active a {
    color: var(--bolt-primary-contrast-text, #fff) !important; /* Contrast color for text on primary background */
}

/* Disabled pagination item */
.emission-source-table .ant-pagination-disabled,
.emission-source-table .ant-pagination-disabled:hover { /* Keep same style on hover for disabled */
    background-color: var(--bolt-elements-background-disabled, #222) !important;
    border-color: var(--bolt-elements-borderColor, #333) !important;
    cursor: not-allowed;
}
.emission-source-table .ant-pagination-disabled .ant-pagination-item-link,
.emission-source-table .ant-pagination-disabled a {
    color: var(--bolt-elements-textDisabled, #555) !important;
    cursor: not-allowed;
}

/* Page size selector (e.g., "10 / page") */
.emission-source-table .ant-pagination-options {
    margin-left: 16px; /* Add some space to its left */
}
.emission-source-table .ant-pagination-options .ant-select-selector {
    background-color: var(--bolt-elements-background-depth-1, #2a2a2a) !important;
    border-color: var(--bolt-elements-borderColor, #333) !important;
    color: var(--bolt-elements-textPrimary, #fff) !important;
    height: 32px !important;
    line-height: 30px !important;
    padding: 0 11px !important;
    border-radius: 4px !important;
}
.emission-source-table .ant-pagination-options .ant-select-arrow {
    color: var(--bolt-elements-textSecondary, #ccc) !important;
}
.emission-source-table .ant-pagination-options .ant-select-focused .ant-select-selector,
.emission-source-table .ant-pagination-options .ant-select-selector:hover {
  border-color: var(--bolt-primary, #5165f9) !important;
}

/* Styles for the SELECT DROPDOWN itself (when it's open) */
/* This needs to be less specific if AntD portals the dropdown to body root */
/* A global .ant-select-dropdown style for dark theme might be needed, */
/* or use AntD's ConfigProvider for theme tokens. */
/* For now, attempting to scope it: */
.ant-select-dropdown[class*="ant-select-dropdown-placement"] { /* General for all dropdowns if not themed by ConfigProvider */
    background-color: var(--bolt-elements-background-depth-1, #2a2a2a) !important;
    border: 1px solid var(--bolt-elements-borderColor, #444) !important;
    box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.25) !important; /* Darker shadow */
    border-radius: 4px;
}

.ant-select-dropdown .ant-select-item {
    color: var(--bolt-elements-textPrimary, #fff) !important;
    padding: 5px 12px !important; /* Standard padding */
}

.ant-select-dropdown .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
    background-color: var(--bolt-hover-background, #383838) !important; /* Hover color for options */
    color: var(--bolt-primary, #5165f9) !important;
}

.ant-select-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
    background-color: var(--bolt-primary-background, rgba(81, 101, 249, 0.15)) !important; /* Selected option background */
    color: var(--bolt-primary, #5165f9) !important;
    font-weight: 600;
}

.ant-select-dropdown .ant-select-item-option-disabled {
    color: var(--bolt-elements-textDisabled, #555) !important;
    cursor: not-allowed;
}


/* Empty state text in table */
.emission-source-table .ant-empty-description {
    color: var(--bolt-elements-textSecondary) !important;
}


/* --- Upload Modal Dark Styles --- */
.ant-modal-content {
    background-color: var(--bolt-elements-background-depth-2, #1e1e1e) !important;
}
.ant-modal-header {
    background-color: transparent !important; /* Set to transparent */
    border-bottom: 1px solid var(--bolt-elements-borderColor, #333) !important;
}
.ant-modal-title {
    color: var(--bolt-elements-textPrimary, #fff) !important;
}
.ant-modal-close {
    color: var(--bolt-elements-textSecondary, #ccc) !important;
}
.ant-modal-close:hover {
    color: var(--bolt-elements-textPrimary, #fff) !important;
}
.ant-modal-body {
    /* Inherits from content */
}
.ant-modal-footer {
     background-color: transparent !important; /* Set to transparent */
     border-top: 1px solid var(--bolt-elements-borderColor, #333) !important;
}

/* Style form elements within the modal */
.ant-modal-body .ant-form-item-label > label {
    color: var(--bolt-elements-textSecondary, #ccc) !important;
}
.ant-modal-body .upload-modal-select .ant-select-selector, /* Target specific select */
.ant-modal-body .ant-select-dropdown {
    background-color: var(--bolt-elements-background-depth-1, #2a2a2a) !important;
    border-color: var(--bolt-elements-borderColor, #333) !important;
    color: var(--bolt-elements-textPrimary, #fff) !important;
}
.ant-modal-body .upload-modal-select .ant-select-selection-placeholder {
    color: var(--bolt-elements-textDisabled, #555) !important;
}
.ant-modal-body .upload-modal-select .ant-select-arrow {
     color: var(--bolt-elements-textSecondary, #ccc) !important;
}

/* Style Upload Dragger */
.ant-modal-body .upload-modal-dragger,
.ant-modal-body .upload-modal-dragger .ant-upload.ant-upload-drag {
    background: var(--bolt-elements-background-depth-1, #2a2a2a) !important;
    border: 1px dashed var(--bolt-elements-borderColor, #555) !important;
}
.ant-modal-body .upload-modal-dragger:hover .ant-upload.ant-upload-drag {
    border-color: var(--bolt-primary, #5165f9) !important;
}
.ant-modal-body .upload-modal-dragger .ant-upload-drag-icon .anticon {
    color: var(--bolt-primary, #5165f9) !important;
}
.ant-modal-body .upload-modal-dragger .ant-upload-text {
    color: var(--bolt-elements-textPrimary, #fff) !important;
}
.ant-modal-body .upload-modal-dragger .ant-upload-hint {
    color: var(--bolt-elements-textSecondary, #ccc) !important;
}

/* Style Upload List Items (basic) */
.ant-modal-body .ant-upload-list-item {
    color: var(--bolt-elements-textPrimary, #fff) !important;
}
.ant-modal-body .ant-upload-list-item-error .ant-upload-list-item-name,
.ant-modal-body .ant-upload-list-item-error .ant-upload-list-item-card-actions .anticon {
    color: var(--bolt-danger, #f5222d) !important;
}


/* Style Modal Footer Buttons */
.ant-modal-footer .ant-btn-primary {
    /* Primary button styles (usually themed) */
}
.ant-modal-footer .ant-btn-default {
     background-color: var(--bolt-elements-background-depth-1, #2a2a2a) !important;
     border-color: var(--bolt-elements-borderColor, #333) !important;
     color: var(--bolt-elements-textPrimary, #fff) !important;
}
.ant-modal-footer .ant-btn-default:hover {
    border-color: var(--bolt-primary, #5165f9) !important;
    color: var(--bolt-primary, #5165f9) !important;
}

/* --- Ant Design Message (Toast) Dark Theme Styles --- */
.ant-message-notice-content {
    background-color: var(--bolt-elements-background-depth-1, #2a2a2a) !important; /* Darker background */
    color: var(--bolt-elements-textPrimary, #fff) !important;
    border: 1px solid var(--bolt-elements-borderColor, #444) !important; /* Subtle border */
    box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.25) !important; /* Adjusted shadow for dark */
    border-radius: 4px !important;
}

.ant-message-success .anticon {
    color: var(--bolt-success, #52c41a) !important; /* Use a success variable or fallback */
}

.ant-message-error .anticon {
    color: var(--bolt-danger, #ff4d4f) !important; /* Use danger variable or fallback (antd default red) */
}

.ant-message-info .anticon {
    color: var(--bolt-primary, #5165f9) !important; /* Use primary variable or fallback */
}

.ant-message-warning .anticon {
    color: var(--bolt-warning, #faad14) !important; /* Use warning variable or fallback */
}

.ant-message-loading .anticon {
    color: var(--bolt-primary, #5165f9) !important; /* Use primary for loading too */
}
/* --- End Toast Styles --- */

/* --- Upload Modal Spacing Fix --- */
.upload-modal-upload-item {
    margin-top: 16px !important; /* Add space above the upload section */
}

/* Adjust position of file type error message */
.upload-modal-filetype-item .ant-form-item-explain {
    margin-top: 14px !important; /* Adjusted value to 14px */
}

/* Ensure all form validation errors are red */
.ant-form-item-explain-error {
    color: var(--bolt-danger, #ff4d4f) !important; /* Use danger variable or Antd default red */
}

/* Reduce font size in file upload table in main panel */
.file-upload-table .ant-table-tbody > tr > td {
    font-size: 12px !important; /* Smaller font size */
}

/* Reduce font size in emission source table */
.emission-source-table .ant-table-tbody > tr > td {
    font-size: 12px !important; /* Smaller font size */
}

/* Styles for the table within the upload modal */
.upload-modal-file-table .ant-table-tbody > tr > td {
  font-size: 12px; /* Consistent small font */
  padding: 8px !important; /* Adjust padding for Select */
}

.upload-modal-file-table .ant-table-tbody > tr > td:nth-child(2) > .ant-select {
  margin-left: 18px !important; /* 轻微向右推移 */
}

.upload-modal-file-table .ant-select-selector {
  height: 30px !important; /* Ensure select fits well */
  font-size: 12px;
  width: 90px !important; /* Explicit fixed width */
  min-width: 90px !important; /* Ensure it doesn't shrink further */
  box-sizing: border-box !important; /* Ensure padding/border are included in width */
}
.upload-modal-file-table .ant-select-selection-item,
.upload-modal-file-table .ant-select-selection-placeholder {
  line-height: 28px !important; /* Adjust line height for vertical centering */
}
  background-color: var(--bolt-primary, #5165f9) !important;
  color: var(--bolt-primary-contrast-text, #fff) !important;
  border-left-color: var(--bolt-primary-glow, #8da0ff) !important; /* Brighter left border */
  font-weight: 500 !important; /* Semi-bold */
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.05) !important; /* Very subtle inner shadow */
}

/* Readjust 'All' button styles to ensure they integrate and override correctly */
.lifecycle-all-button { /* This is for non-selected state of 'All' button */
  background-color: rgba(var(--bolt-primary-rgb, 81, 101, 249), 0.15) !important; /* More prominent base */
  color: var(--bolt-elements-textPrimary) !important;
  /* border-left and transition are handled by common .lifecycle-nav-bar .ant-btn */
}

.lifecycle-all-button:hover:not(.ant-btn-primary) { /* Hover for 'All' button when NOT selected */
  background-color: rgba(var(--bolt-primary-rgb, 81, 101, 249), 0.25) !important;
  border-left-color: var(--bolt-primary, #5165f9) !important;
  color: var(--bolt-primary) !important;
}

/* .lifecycle-all-button.ant-btn-primary (selected 'All' button) styles remain as they are, they are specific enough */

/* Custom class to make modal select smaller */
.custom-modal-select-small .ant-select-selector {
  height: 40px !important;
  padding: 10px 8px !important;

  margin-left: 2px !important;
  display: flex !important; /* For vertical alignment */
  align-items: center !important; /* For vertical alignment */
}

.custom-modal-input-small .ant-input {
  height: 40px !important;
  padding: 10px 0px !important;
  margin-left: 2px !important;
}


.background-data-match-select .ant-select-selector {
  height: 40px !important;
  padding: 10px 8px !important;
  margin-left: 2px !important;
  display: flex !important; /* For vertical alignment */
  align-items: center !important; /* For vertical alignment */
}

.background-data-match-input {
  height: 40px !important;
  width: 350px !important;
  padding: 10px 8px !important;
  margin-top: 8px !important;
  margin-left: 2px !important;
}


.panel-sider-select {
  height: 40px !important;
  padding: 30px 8px !important;
  margin-left: 14px !important;
  display: flex !important; /* For vertical alignment */
  align-items: center !important; /* For vertical alignment */
}

.panel-sider-input {
  height: 40px !important;
  padding: 10px 8px !important;
  
  margin-top: 8px !important;
  margin-left: 2px !important;

}

.panel-sider-textarea {
  height: 40px !important;
  padding: 10px 8px !important;
  margin-left: 2px !important;
  margin-top: 8px !important;
}

/* AI Auto Fill Modal Specific Styles */
.ai-autofill-modal .ant-modal-body {
  padding-top: 12px !important; /* Reduce top padding of modal body */
}

/* Filter Panel Compacting */
.ai-autofill-modal .ant-modal-body > div:first-child { /* The filter panel wrapper */
  padding: 8px !important; /* Further reduce padding from 10px */
  margin-bottom: 8px !important; /* Further reduce bottom margin from 10px */
}

.ai-autofill-modal .ant-modal-body > div:first-child .ant-row {
  margin-bottom: 2px !important; /* Reduce space between filter rows from 4px */
}
/* Ensure filter rows themselves are more compact if they have default large margins */
.ai-autofill-modal .ant-modal-body > div:first-child .ant-row.ant-form-item {
    margin-bottom: 2px !important; /* Reduce from 4px */
}


.ai-autofill-modal .ant-modal-body > div:first-child .ant-col {
  padding-top: 2px !important; /* Reduce vertical padding for cols */
  padding-bottom: 2px !important;
}

/* Filter Labels and Controls Font and Size */
.ai-autofill-modal .ant-typography,
.ai-autofill-modal .ant-form-item-label > label {
  font-size: 12px !important;
  line-height: 1.4 !important;
  margin-bottom: 2px !important; /* Reduce space below label */
}

.ai-autofill-modal .ant-radio-wrapper,
.ai-autofill-modal .ant-radio-button-wrapper {
  font-size: 12px !important;
  padding: 0 8px !important; /* Adjust padding for radio buttons */
  height: 28px !important; /* Adjust height */
  line-height: 26px !important; /* Adjust line-height */
}
.ai-autofill-modal .ant-radio-group {
  margin-top: 2px; /* Align radio group better with label */
}


.ai-autofill-modal .ant-input,
.ai-autofill-modal .ant-input-affix-wrapper {
  font-size: 12px !important;
  height: 28px !important; /* Adjust height */
  padding-top: 0px !important; /* Corrected padding for input field text */
  padding-bottom: 0px !important;
}
.ai-autofill-modal .ant-input-affix-wrapper input.ant-input {
    height: auto !important; /* Allow inner input to not conflict */
}


.ai-autofill-modal .ant-btn {
  font-size: 12px !important;
  padding: 0px 10px !important; /* Adjust padding for buttons */
  height: 28px !important; /* Adjust height */
  line-height: 26px !important; /* Needs to be slightly less than height for text centering */
}
.ai-autofill-modal .ant-btn .anticon {
  font-size: 14px !important; /* Keep icons readable */
  vertical-align: middle !important; /* Better icon alignment in button */
}


/* Filter Row Alignment and Label Width */
.ai-autofill-modal .ant-modal-body > div:first-child .ant-row.ant-row-middle {
  margin-bottom: 2px !important; /* Tighter rows, was 4px */
}
.ai-autofill-modal .ant-modal-body > div:first-child .ant-row.ant-row-middle .ant-col[flex*="px"] { /* Target label column */
  flex-basis: 110px !important; /* Reduce label column width */
  max-width: 110px !important;
  margin-right: 8px; /* Add some space between label and control */
}
.ai-autofill-modal .ant-modal-body > div:first-child .ant-row.ant-row-middle .ant-col[flex="auto"] {
  padding-left: 0 !important; /* Remove potential padding from auto col */
}


/* Table Font and Padding */
.ai-autofill-modal .ant-table-thead > tr > th,
.ai-autofill-modal .ant-table-tbody > tr > td {
  font-size: 12px !important;
  padding: 6px 8px !important; /* Reduce padding in table cells */
  text-align: center !important; /* Center align text in table cells */
}

/* Specifically for the grouped table headers */
.ai-autofill-modal .ant-table-thead > tr > th > div {
  font-size: 12px !important;
  font-weight: bold !important; /* Keep headers bold */
  padding: 2px 0 !important; /* Reduce padding inside the div wrapper of group titles */
  text-align: center !important; /* Center align group headers */
}
/* Ensure individual column headers are also centered if not part of a group */
.ai-autofill-modal .ant-table-thead > tr > th {
    text-align: center !important;
}

/* Bottom Action Buttons in AI Modal */
.ai-autofill-modal .ant-modal-body > div:last-child { /* The bottom button container */
  margin-top: 12px !important;
  padding-top: 10px !important;
  border-top: 1px solid var(--bolt-elements-borderColor, #333);
}

/* AI Autofill Modal specific scrollbar for its table */
.ai-autofill-modal .ant-table-body::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.ai-autofill-modal .ant-table-body::-webkit-scrollbar-thumb {
  background-color: var(--bolt-elements-textDisabled, #555);
  border-radius: 3px;
}
.ai-autofill-modal .ant-table-body {
  scrollbar-width: thin;
  scrollbar-color: var(--bolt-elements-textDisabled, #555) var(--bolt-elements-background-depth-1, #2a2a2a);
}

/* 强制所有 Radio.Group 单行展示 */
.ai-autofill-modal .ant-radio-group {
  display: inline-flex !important;
  flex-wrap: nowrap !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  font-size: 11px !important;
}
.ai-autofill-modal .ant-radio-group .ant-radio-button-wrapper,
.ai-autofill-modal .ant-radio-group .ant-radio-wrapper {
  flex-shrink: 0 !important;
  min-width: 110px !important;
  max-width: 110px !important;
  width: 110px !important;
  padding: 0 4px !important;
  text-align: center !important;
  justify-content: center !important;
  text-overflow: ellipsis !important;
  overflow: hidden !important;
  white-space: nowrap !important;
  font-size: 11px !important;
  box-sizing: border-box !important;
}

`;

// 注入样式到 head
if (typeof window !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = customStyles;
  document.head.appendChild(styleTag);
}

// 添加 ClientOnly 包装器，如果需要确保此组件仅在客户端渲染
export const CarbonCalculatorPanelClient = () => {
  const { workflow } = useLoaderData() as any;
  return (
    <ClientOnly>
      {() => <CarbonCalculatorPanel workflowId={workflow.id} workflowName={workflow.name} workFlow={workflow} />}
    </ClientOnly>
  );
};