import { create } from 'zustand';
import type { Node, Edge } from 'reactflow';
import type { NodeData } from '~/types/nodes';
import type { Workflow as WorkflowState } from '~/types/workflow';
import type { SceneInfoType } from '~/types/scene';
import type { AISummaryReport } from '~/types/aiSummary';
import type { Task } from '~/types/task'; // Import Task type
import { v4 as uuidv4 } from 'uuid';

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
  saveCurrentWorkflow: () => Promise<void>; // Added saveCurrentWorkflow
  // Task Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (taskDescription: string) => void;
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  toggleTaskStatus: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  updateTasksFromPlan: (planData: Record<string, string>) => void; // Added to ensure type compatibility
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
  tasks: [], // Initialize tasks
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
  loadWorkflow: (workflow: WorkflowState) => set(() => ({ ...workflow, tasks: workflow.tasks || [], updatedAt: new Date().toISOString() })),

  // Get the current entire workflow state
  // getWorkflowState is removed from actions; use useCarbonFlowStore.getState() directly
  // Or, if a specific getter for only state is needed, it would be more complex to implement dynamically.

  // Task Management Actions
  setTasks: (tasks: Task[]) => set((state) => ({ ...state, tasks, updatedAt: new Date().toISOString() })),
  addTask: (taskDescription: string) =>
    set((state) => {
      const newTask: Task = {
        id: generateUUID(), // Reuse your UUID generator
        description: taskDescription,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return { ...state, tasks: [...(state.tasks || []), newTask], updatedAt: new Date().toISOString() };
    }),
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) =>
    set((state) => ({
      ...state,
      tasks: (state.tasks || []).map((task) =>
        task.id === taskId ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
      ),
      updatedAt: new Date().toISOString(),
    })),
  toggleTaskStatus: (taskId: string) =>
    set((state) => ({
      ...state,
      tasks: (state.tasks || []).map((task) =>
        task.id === taskId
          ? { ...task, status: task.status === 'pending' ? 'completed' : 'pending', updatedAt: new Date().toISOString() }
          : task
      ),
      updatedAt: new Date().toISOString(),
    })),
  deleteTask: (taskId: string) =>
    set((state) => ({
      ...state,
      tasks: (state.tasks || []).filter((task) => task.id !== taskId),
      updatedAt: new Date().toISOString(),
    })),

  updateTasksFromPlan: (planData: Record<string, string>) => {
    console.log('[CarbonFlowStore] updateTasksFromPlan called with planData:', JSON.stringify(planData, null, 2));
    set((state) => {
      const newTasks = [...(state.tasks || [])]; // 创建当前任务列表的副本，并确保tasks存在
      const now = new Date().toISOString();

      Object.entries(planData).forEach(([description, statusString]) => {
        // 将 AI 返回的状态字符串映射到 TaskStatus
        let taskStatus: 'pending' | 'completed' = 'pending'; // 默认为 pending
        if (statusString === "以完成" || statusString === "已完成" || statusString.toLowerCase() === "completed") {
          taskStatus = 'completed';
        }

        // 检查任务是否已存在 (基于描述)
        const existingTaskIndex = newTasks.findIndex(task => task.description === description);

        if (existingTaskIndex !== -1) {
          // 如果任务已存在，更新其状态和 updatedAt
          newTasks[existingTaskIndex] = {
            ...newTasks[existingTaskIndex],
            status: taskStatus,
            updatedAt: now,
          };
        } else {
          // 如果任务不存在，创建新任务
          newTasks.push({
            id: uuidv4(), // 生成唯一 ID
            description: description,
            status: taskStatus,
            createdAt: now,
            updatedAt: now,
          });
        }
      });

      // 更新 store 中的 tasks 数组
      console.log('[CarbonFlowStore] Updating tasks from plan:', newTasks);
      return { ...state, tasks: newTasks, updatedAt: new Date().toISOString() }; // 同时更新工作流的 updatedAt
    });
    // 可以在这里触发一次自动保存，如果需要的话
    // useCarbonFlowStore.getState().saveCurrentWorkflow();
  },

  // Example of an action that modifies a nested property within sceneInfo
  setProductName: (productName: string) =>
    set((state) => ({
      ...state,
      sceneInfo: { ...state.sceneInfo, productName },
      updatedAt: new Date().toISOString(),
    })),

  saveCurrentWorkflow: async () => {
    const currentState = get();
    console.log('Attempting to save workflow:', currentState);
    // Placeholder for actual save logic to Supabase
    // Example: await supabase.from('workflows').update(currentState).eq('workflowId', currentState.workflowId);
    // For now, we'll just simulate a save operation
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Workflow save simulated.');
        set({ updatedAt: new Date().toISOString() });
        resolve();
      }, 1000);
    });
  },

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
