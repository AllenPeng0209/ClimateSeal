import { create } from 'zustand';
import type { Node, Edge } from 'reactflow';
import type { NodeData } from '~/types/nodes';
import type { Workflow as WorkflowState } from '~/types/workflow';
import type { SceneInfoType } from '~/types/scene';
import type { AISummaryReport } from '~/types/aiSummary';

// Define Actions Interface
interface WorkflowActions {
  setNodes: (nodes: Node<NodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  setAiSummary: (aiSummary: AISummaryReport | undefined) => void;
  setSceneInfo: (sceneInfo: Partial<SceneInfoType> | SceneInfoType) => void;
  setWorkflowName: (name: string) => void;
  setWorkflowStatus: (status: string) => void;
  loadWorkflow: (workflow: WorkflowState) => void;
  setProductName: (productName: string) => void;
  // getWorkflowState is excluded as getState() serves this purpose for the full store object
}

// Define Full Store Type
export type CarbonFlowStore = WorkflowState & WorkflowActions;

// Helper to generate a simple UUID (for placeholder workflowId)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;

    return v.toString(16);
  });
}

const initialSceneInfo: SceneInfoType = {
  workflowId: '', // Will be set from the main workflowId
  verificationLevel: undefined,
  standard: undefined,
  productName: undefined,
  taskName: undefined,
  productSpecs: undefined,
  productDesc: undefined,
  dataCollectionStartDate: undefined,
  dataCollectionEndDate: undefined,
  totalOutputValue: undefined,
  totalOutputUnit: undefined,
  benchmarkValue: undefined,
  benchmarkUnit: undefined,
  conversionFactor: undefined,
  functionalUnit: undefined,
  lifecycleType: undefined,
  calculationBoundaryHalfLifecycle: [],
  calculationBoundaryFullLifecycle: [],
};

const initialWorkflowState: WorkflowState = {
  workflowId: generateUUID(),
  nodes: [],
  edges: [],
  sceneInfo: { ...initialSceneInfo }, // Ensure sceneInfo is a copy and non-null
  aiSummary: undefined,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  // Initialize other optional fields from Workflow interface as needed
  name: undefined,
  description: undefined,
  status: 'draft', // Default status
  isPublic: false,
  user: undefined,
  collaborators: [],
  productId: undefined,
  knowledgeUnits: [],
  uploadedFiles: [],
  productCarbonFootprintReport: undefined,
  editorState: undefined,
  lastModifiedBy: undefined,
  comments: [],
  actionLogs: [],
  conversationHistory: [],
  aiTodoSummary: undefined,
  aiRiskAssessmentResults: [],
  selectedNodeId: null, // Added for selected node
};
initialWorkflowState.sceneInfo.workflowId = initialWorkflowState.workflowId; // Sync workflowId to sceneInfo

// 创建Zustand存储，状态为整个Workflow对象
export const useCarbonFlowStore = create<CarbonFlowStore>((set, get) => ({
  ...initialWorkflowState,

  // Actions to modify parts of the Workflow state
  setNodes: (nodes: Node<NodeData>[]) => set((state) => ({ ...state, nodes, updatedAt: new Date().toISOString() })),

  setEdges: (edges: Edge[]) => set((state) => ({ ...state, edges, updatedAt: new Date().toISOString() })),

  setAiSummary: (aiSummary: AISummaryReport | undefined) =>
    set((state) => ({ ...state, aiSummary, updatedAt: new Date().toISOString() })),

  // To update the entire sceneInfo object or specific fields within it
  setSceneInfo: (sceneInfo: Partial<SceneInfoType> | SceneInfoType) =>
    set((state) => ({
      ...state,
      sceneInfo: { ...state.sceneInfo, ...sceneInfo },
      updatedAt: new Date().toISOString(),
    })),

  setWorkflowName: (name: string) => set((state) => ({ ...state, name, updatedAt: new Date().toISOString() })),

  setWorkflowStatus: (status: string) => set((state) => ({ ...state, status, updatedAt: new Date().toISOString() })),

  // Action to replace the entire workflow state, useful for loading a workflow
  loadWorkflow: (workflow: WorkflowState) => set(() => ({ ...workflow, updatedAt: new Date().toISOString() })),

  // Get the current entire workflow state
  // getWorkflowState is removed from actions; use useCarbonFlowStore.getState() directly
  // Or, if a specific getter for only state is needed, it would be more complex to implement dynamically.

  // Example of an action that modifies a nested property within sceneInfo
  setProductName: (productName: string) =>
    set((state) => ({
      ...state,
      sceneInfo: { ...state.sceneInfo, productName },
      updatedAt: new Date().toISOString(),
    })),

}));

// 事件发射器
export const emitCarbonFlowData = () => {
  const data = useCarbonFlowStore.getState(); // data is CarbonFlowStore
  const event = new CustomEvent('carbonFlowDataUpdate', { detail: data });
  window.dispatchEvent(event);
  return data;
};

// 订阅CarbonFlow数据更新
export const subscribeToCarbonFlowData = (callback: (data: CarbonFlowStore) => void) => {
  const handleUpdate = (event: CustomEvent<CarbonFlowStore>) => {
    callback(event.detail);
  };

  window.addEventListener('carbonFlowDataUpdate', handleUpdate as EventListener);

  // 返回取消订阅函数
  return () => {
    window.removeEventListener('carbonFlowDataUpdate', handleUpdate as EventListener);
  };
};
