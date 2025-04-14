import type { Node, Edge } from 'reactflow';
import type { CarbonFlowAction } from '~/types/actions';

export interface NodeData {
  label: string;
  nodeName: string;
  lifecycleStage: string;
  emissionType: string;
  carbonFactor: number;
  activitydataSource: string;
  activityScore: number;
  carbonFootprint: number;
  [key: string]: any; // 允許其他屬性
}

type NodeType = 'product' | 'manufacturing' | 'distribution' | 'usage' | 'disposal' | 'finalProduct';

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
    if (action.description) {
      // 如果存在描述字段，优先使用描述
      console.log(`[CARBONFLOW_CONTENT] ${action.description}`);
    } 
    
    if (action.content) {
      try {
        // 尝试解析content为JSON对象
        const contentObj = JSON.parse(action.content);
        console.log(`[CARBONFLOW_CONTENT]`, contentObj);
      } catch (e) {
        // 如果解析失败且没有描述字段，则输出原始内容
        if (!action.description) {
          console.log(`[CARBONFLOW_CONTENT] ${action.content}`);
        }
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
      // 改进JSON解析逻辑
      let nodeData: Record<string, any> = {}; // 使用Record<string, any>類型
      
      if (action.content) {
        try {
          // 尝试解析纯JSON内容
          nodeData = JSON.parse(action.content);
        } catch (e) {
          // 如果解析失败，检查是否存在JSON部分
          const jsonStart = action.content.indexOf('{');
          const jsonEnd = action.content.lastIndexOf('}');
          
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            try {
              // 提取JSON部分并尝试解析
              const jsonPart = action.content.substring(jsonStart, jsonEnd + 1);
              nodeData = JSON.parse(jsonPart);
            } catch (innerError) {
              console.error('JSON提取和解析失败:', innerError);
              return;
            }
          } else {
            console.error('内容格式错误，找不到有效的JSON部分');
            return;
          }
        }
      }
      
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
   * @returns 找到的节点或null
   */
  private handleQueryNode(action: CarbonFlowAction): Node<NodeData> | null {
    if (!action.nodeId) {
      console.error('查询节点操作缺少 nodeId');
      return null;
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
      

      if (layoutType === 'normal') {
        this.applyNormalLayout();
      } else if (layoutType === 'vertical') {
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

  private applyNormalLayout(): void {
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
    this.nodes.forEach(node => {
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
          activityScore: 0,
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
          complianceStatus: '待验证',
          carbonLabel: '待认证',
        },
      };
      nodesByType.finalProduct.push(finalProductNode);
    }

    // 计算新的节点位置
    const newNodes = [...this.nodes];
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

    // 计算最终产品节点的位置（放在最右侧）
    const finalProductNodes = newNodes.filter(node => node.type === 'finalProduct').map(node => {
      const x = PADDING + (nodeTypeOrder.length + 1) * HORIZONTAL_SPACING;
      const y = PADDING + (VERTICAL_SPACING / 2); // 垂直居中

      return {
        ...node,
        position: { x, y },
        style: {    
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
        },  
      };
    });

    // 更新节点位置
    this.nodes = [...positionedNodes, ...finalProductNodes];
    
    // 更新边
    this.updateEdges();
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

  private updateEdges(): void {
    // 实现更新边的逻辑
  }
} 