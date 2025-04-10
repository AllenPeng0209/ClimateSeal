import type { Node, Edge } from 'reactflow';
import type { CarbonFlowAction } from '~/types/actions';
import type { NodeData } from '../CarbonFlow';

export interface CarbonFlowActionHandlerProps {
  nodes: Node<NodeData>[];
  edges: Edge[];
  setNodes: (nodes: Node<NodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
}

/**
 * CarbonFlow 操作处理器
 * 处理所有 carbonflow 类型的操作，包括增删查改节点和连接
 */
export class CarbonFlowActionHandler {
  private nodes: Node<NodeData>[];
  private edges: Edge[];
  private setNodes: (nodes: Node<NodeData>[]) => void;
  private setEdges: (edges: Edge[]) => void;

  constructor({ nodes, edges, setNodes, setEdges }: CarbonFlowActionHandlerProps) {
    this.nodes = nodes;
    this.edges = edges;
    this.setNodes = setNodes;
    this.setEdges = setEdges;
  }

  /**
   * 处理 CarbonFlow 操作
   */
  public handleAction(action: CarbonFlowAction): void {
    // 记录CarbonFlow操作到日志
    console.log(`[CARBONFLOW_ACTION] Operation: ${action.operation}`, {
      nodeType: action.nodeType,
      nodeId: action.nodeId,
      source: action.source,
      target: action.target,
      position: action.position
    });
    
    // 记录操作内容
    if (action.content) {
      try {
        const contentObj = JSON.parse(action.content);
        console.log(`[CARBONFLOW_CONTENT]`, contentObj);
      } catch (e) {
        console.log(`[CARBONFLOW_CONTENT] ${action.content}`);
      }
    }

    switch (action.operation) {
      case 'add':
        this.handleAddNode(action);
        break;
      case 'update':
        this.handleUpdateNode(action);
        break;
      case 'delete':
        this.handleDeleteNode(action);
        break;
      case 'query':
        this.handleQueryNode(action);
        break;
      case 'connect':
        this.handleConnectNodes(action);
        break;
      case 'layout':
        this.handleLayout(action);
        break;
      case 'calculate':
        this.handleCalculate(action);
        break;
      default:
        console.warn(`未知的 CarbonFlow 操作: ${(action as any).operation}`);
    }
  }

  /**
   * 添加节点
   */
  private handleAddNode(action: CarbonFlowAction): void {
    if (!action.nodeType) {
      console.error('添加节点操作缺少 nodeType');
      return;
    }

    try {
      const nodeData = action.content ? JSON.parse(action.content) : {};
      let position = { x: 100, y: 100 }; // 默认位置
      
      // 解析位置信息
      if (action.position) {
        try {
          position = JSON.parse(action.position.replace(/'/g, '"'));
        } catch (e) {
          console.warn('无法解析节点位置，使用默认位置', e);
        }
      }
      
      // 创建新节点
      const newNode: Node<NodeData> = {
        id: `${action.nodeType}-${Date.now()}`,
        type: action.nodeType,
        position,
        data: {
          label: nodeData.label || `${action.nodeType} 节点`,
          nodeName: nodeData.nodeName || `${action.nodeType}_${Date.now()}`,
          lifecycleStage: nodeData.lifecycleStage || action.nodeType,
          emissionType: nodeData.emissionType || '直接排放',
          carbonFactor: nodeData.carbonFactor || 0,
          activitydataSource: nodeData.activitydataSource || '手动输入',
          activityScore: nodeData.activityScore || 0,
          carbonFootprint: nodeData.carbonFootprint || 0,
          ...nodeData
        }
      };

      // 更新节点列表
      this.setNodes([...this.nodes, newNode]);
      console.log(`成功添加 ${action.nodeType} 节点: ${newNode.id}`);
    } catch (error) {
      console.error('添加节点失败:', error);
    }
  }

  /**
   * 更新节点
   */
  private handleUpdateNode(action: CarbonFlowAction): void {
    if (!action.nodeId) {
      console.error('更新节点操作缺少 nodeId');
      return;
    }

    try {
      const updateData = action.content ? JSON.parse(action.content) : {};
      
      // 查找并更新节点
      const updatedNodes = this.nodes.map(node => {
        if (node.id === action.nodeId || node.data.nodeName === action.nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...updateData
            }
          };
        }
        return node;
      });

      // 更新节点列表
      this.setNodes(updatedNodes);
      console.log(`成功更新节点: ${action.nodeId}`);
    } catch (error) {
      console.error('更新节点失败:', error);
    }
  }

  /**
   * 删除节点
   */
  private handleDeleteNode(action: CarbonFlowAction): void {
    if (!action.nodeId) {
      console.error('删除节点操作缺少 nodeId');
      return;
    }

    try {
      // 查找并删除节点
      const filteredNodes = this.nodes.filter(node => 
        node.id !== action.nodeId && node.data.nodeName !== action.nodeId
      );
      
      // 同时删除与该节点相关的边
      const filteredEdges = this.edges.filter(edge => 
        edge.source !== action.nodeId && 
        edge.target !== action.nodeId
      );

      // 更新节点和边列表
      this.setNodes(filteredNodes);
      this.setEdges(filteredEdges);
      console.log(`成功删除节点: ${action.nodeId}`);
    } catch (error) {
      console.error('删除节点失败:', error);
    }
  }

  /**
   * 查询节点
   */
  private handleQueryNode(action: CarbonFlowAction): void {
    if (!action.nodeId) {
      console.error('查询节点操作缺少 nodeId');
      return;
    }

    try {
      // 查找节点
      const node = this.nodes.find(node => 
        node.id === action.nodeId || node.data.nodeName === action.nodeId
      );
      
      if (node) {
        console.log(`节点 ${action.nodeId} 信息:`, node);
        return node;
      } else {
        console.warn(`未找到节点: ${action.nodeId}`);
        return null;
      }
    } catch (error) {
      console.error('查询节点失败:', error);
      return null;
    }
  }

  /**
   * 连接节点
   */
  private handleConnectNodes(action: CarbonFlowAction): void {
    if (!action.source || !action.target) {
      console.error('连接节点操作缺少 source 或 target');
      return;
    }

    try {
      // 检查源节点和目标节点是否存在
      const sourceExists = this.nodes.some(node => 
        node.id === action.source || node.data.nodeName === action.source
      );
      
      const targetExists = this.nodes.some(node => 
        node.id === action.target || node.data.nodeName === action.target
      );
      
      if (!sourceExists || !targetExists) {
        console.error(`源节点或目标节点不存在: source=${action.source}, target=${action.target}`);
        return;
      }
      
      // 创建连接属性
      const edgeData = action.content ? JSON.parse(action.content) : {};
      
      // 创建新边
      const newEdge: Edge = {
        id: `e-${action.source}-${action.target}-${Date.now()}`,
        source: action.source,
        target: action.target,
        label: edgeData.label,
        data: edgeData
      };

      // 更新边列表
      this.setEdges([...this.edges, newEdge]);
      console.log(`成功连接节点: ${action.source} -> ${action.target}`);
    } catch (error) {
      console.error('连接节点失败:', error);
    }
  }

  /**
   * 自动布局
   */
  private handleLayout(action: CarbonFlowAction): void {
    try {
      const layoutConfig = action.content ? JSON.parse(action.content) : {};
      const layoutType = layoutConfig.type || 'vertical';
      
      if (layoutType === 'vertical') {
        this.applyVerticalLayout();
      } else if (layoutType === 'horizontal') {
        this.applyHorizontalLayout();
      } else if (layoutType === 'radial') {
        this.applyRadialLayout();
      } else {
        console.warn(`未知的布局类型: ${layoutType}`);
      }
    } catch (error) {
      console.error('应用布局失败:', error);
    }
  }

  /**
   * 垂直布局
   */
  private applyVerticalLayout(): void {
    const spacing = 150;
    const updatedNodes = [...this.nodes];
    
    // 按生命周期阶段分组
    const stages = ['product', 'manufacturing', 'distribution', 'usage', 'disposal', 'finalProduct'];
    const stageMap = new Map<string, Node<NodeData>[]>();
    
    // 初始化阶段映射
    stages.forEach(stage => stageMap.set(stage, []));
    
    // 按阶段分组节点
    updatedNodes.forEach(node => {
      const stage = node.type as string;
      if (stageMap.has(stage)) {
        stageMap.get(stage)?.push(node);
      } else {
        // 对于未知阶段，放入杂项组
        if (!stageMap.has('misc')) {
          stageMap.set('misc', []);
        }
        stageMap.get('misc')?.push(node);
      }
    });
    
    // 应用垂直布局
    let yOffset = 100;
    stageMap.forEach((nodes, stage) => {
      if (nodes.length === 0) return;
      
      const xCenter = 400;
      const xSpacing = 200;
      
      nodes.forEach((node, index) => {
        const xPos = xCenter + (index - (nodes.length - 1) / 2) * xSpacing;
        node.position = { x: xPos, y: yOffset };
      });
      
      yOffset += spacing;
    });
    
    // 更新节点位置
    this.setNodes([...updatedNodes]);
    console.log('成功应用垂直布局');
  }

  /**
   * 水平布局
   */
  private applyHorizontalLayout(): void {
    const spacing = 200;
    const updatedNodes = [...this.nodes];
    
    // 按生命周期阶段分组
    const stages = ['product', 'manufacturing', 'distribution', 'usage', 'disposal', 'finalProduct'];
    const stageMap = new Map<string, Node<NodeData>[]>();
    
    // 初始化阶段映射
    stages.forEach(stage => stageMap.set(stage, []));
    
    // 按阶段分组节点
    updatedNodes.forEach(node => {
      const stage = node.type as string;
      if (stageMap.has(stage)) {
        stageMap.get(stage)?.push(node);
      } else {
        // 对于未知阶段，放入杂项组
        if (!stageMap.has('misc')) {
          stageMap.set('misc', []);
        }
        stageMap.get('misc')?.push(node);
      }
    });
    
    // 应用水平布局
    let xOffset = 100;
    stageMap.forEach((nodes, stage) => {
      if (nodes.length === 0) return;
      
      const yCenter = 300;
      const ySpacing = 150;
      
      nodes.forEach((node, index) => {
        const yPos = yCenter + (index - (nodes.length - 1) / 2) * ySpacing;
        node.position = { x: xOffset, y: yPos };
      });
      
      xOffset += spacing;
    });
    
    // 更新节点位置
    this.setNodes([...updatedNodes]);
    console.log('成功应用水平布局');
  }

  /**
   * 放射状布局
   */
  private applyRadialLayout(): void {
    // 如果节点很少，不需要应用放射状布局
    if (this.nodes.length <= 1) return;
    
    const centerX = 400;
    const centerY = 300;
    const radius = 250;
    const updatedNodes = [...this.nodes];
    
    // 找出中心节点（通常是最终产品节点）
    const centerNode = updatedNodes.find(node => node.type === 'finalProduct');
    const otherNodes = centerNode 
      ? updatedNodes.filter(node => node !== centerNode)
      : updatedNodes;
    
    // 设置中心节点位置
    if (centerNode) {
      centerNode.position = { x: centerX, y: centerY };
    }
    
    // 环绕中心放置其他节点
    otherNodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / otherNodes.length;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      node.position = { x, y };
    });
    
    // 更新节点位置
    this.setNodes([...updatedNodes]);
    console.log('成功应用放射状布局');
  }

  /**
   * 计算碳足迹
   */
  private handleCalculate(action: CarbonFlowAction): void {
    try {
      // 计算每个节点的碳足迹
      this.calculateNodeFootprints();
      
      // 如果指定了目标节点，更新其碳足迹为所有节点的总和
      if (action.target) {
        this.calculateTotalFootprint(action.target);
      }
      
      console.log('成功计算碳足迹');
    } catch (error) {
      console.error('计算碳足迹失败:', error);
    }
  }

  /**
   * 计算各节点碳足迹
   */
  private calculateNodeFootprints(): void {
    const updatedNodes = this.nodes.map(node => {
      // 简单计算: 碳足迹 = 碳因子 * 活动数据
      // 在实际应用中，这里会有更复杂的计算逻辑
      const carbonFactor = node.data.carbonFactor || 0;
      const activityData = node.data.activityData || 1; // 假设有活动数据字段
      const carbonFootprint = carbonFactor * activityData;
      
      return {
        ...node,
        data: {
          ...node.data,
          carbonFootprint
        }
      };
    });
    
    this.setNodes(updatedNodes);
  }

  /**
   * 计算总碳足迹
   */
  private calculateTotalFootprint(targetNodeId: string): void {
    // 寻找目标节点
    const targetNode = this.nodes.find(node => 
      node.id === targetNodeId || node.data.nodeName === targetNodeId
    );
    
    if (!targetNode) {
      console.warn(`未找到目标节点: ${targetNodeId}`);
      return;
    }
    
    // 计算所有节点的碳足迹总和
    const totalFootprint = this.nodes.reduce((sum, node) => {
      // 排除目标节点自身以避免重复计算
      if (node.id === targetNode.id) return sum;
      return sum + (node.data.carbonFootprint || 0);
    }, 0);
    
    // 更新目标节点的碳足迹
    const updatedNodes = this.nodes.map(node => {
      if (node.id === targetNode.id) {
        return {
          ...node,
          data: {
            ...node.data,
            carbonFootprint: totalFootprint
          }
        };
      }
      return node;
    });
    
    this.setNodes(updatedNodes);
  }
} 