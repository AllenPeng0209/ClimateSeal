import { create } from 'zustand';
import type { Node, Edge } from 'reactflow';
import type { NodeData } from '~/types/nodes';
import type { CarbonFlowData, AISummary } from '~/types/carbonFlow';

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
  }
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