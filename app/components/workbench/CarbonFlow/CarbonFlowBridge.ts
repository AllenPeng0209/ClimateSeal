import { create } from 'zustand';
import type { Node, Edge } from 'reactflow';
import type { NodeData } from '~/types/nodes';
import type { CarbonFlowData, AISummary } from '~/types/carbonFlow';
import type { CarbonFlowAction } from '~/types/actions';

// 定义CarbonFlow数据存储
interface CarbonFlowStore {
  nodes: Node<NodeData>[];
  edges: Edge[];
  aiSummary: AISummary | null;
  setNodes: (nodes: Node<NodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  setAiSummary: (aiSummary: AISummary | null) => void;
  getCarbonFlowData: () => CarbonFlowData;
}

// 创建Zustand存储
export const useCarbonFlowStore = create<CarbonFlowStore>((set, get) => ({
  nodes: [],
  edges: [],
  aiSummary: null,
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setAiSummary: (aiSummary) => set({ aiSummary }),
  getCarbonFlowData: () => {
    const { nodes, edges, aiSummary } = get();
    return { nodes, edges, aiSummary };
  },
}));

// 事件发射器
export const emitCarbonFlowData = () => {
  const data = useCarbonFlowStore.getState().getCarbonFlowData();
  const event = new CustomEvent('carbonFlowDataUpdate', { detail: data });
  window.dispatchEvent(event);

  return data;
};

// 订阅CarbonFlow数据更新
export const subscribeToCarbonFlowData = (callback: (data: CarbonFlowData) => void) => {
  const handleUpdate = (event: CustomEvent<CarbonFlowData>) => {
    callback(event.detail);
  };

  window.addEventListener('carbonFlowDataUpdate', handleUpdate as EventListener);

  // 返回取消订阅函数
  return () => {
    window.removeEventListener('carbonFlowDataUpdate', handleUpdate as EventListener);
  };
};

// 批量应用 CarbonFlowAction 到 CarbonFlowStore
export function applyCarbonFlowActions(actions: CarbonFlowAction[]) {
  const { nodes, setNodes } = useCarbonFlowStore.getState();
  const newNodes = [...nodes]; // Use const as it's reassigned via push

  actions.forEach((action) => {
    if (action.type === 'carbonflow') {
      if (action.operation === 'create') {
        // Ensure action.data is a string before parsing
        const dataToParse = typeof action.data === 'string' ? action.data : '{}';
        const nodeData = JSON.parse(dataToParse);
        newNodes.push({
          id: action.nodeId || `node_${Date.now()}_${Math.random()}`,
          type: nodeData.lifecycleStage || 'default',
          position: { x: 100, y: 100 }, // 可根据需要自定义布局
          data: nodeData,
        });
      }
      // TODO: 支持 update/delete/connect 等操作
    }
  });

  setNodes(newNodes);
} 