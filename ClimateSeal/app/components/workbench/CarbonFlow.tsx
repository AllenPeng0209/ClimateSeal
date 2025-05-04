import React, { useState, useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import type { CarbonFlowAction } from '~/types/actions';
import ReactFlow, {
  type Node,
  type Edge,
  type Connection,
  type ReactFlowInstance,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './CarbonFlow.css';
import { NodeProperties } from './CarbonFlow/NodeProperties';
import { CarbonFlowActionHandler } from './CarbonFlow/CarbonFlowActions';
import { useCarbonFlowStore, emitCarbonFlowData } from './CarbonFlow/CarbonFlowBridge';
import type { NodeData } from '~/types/nodes';

// 组件接口定义
interface CarbonFactorMatcherProps {
  actionHandler: any; // 请根据实际类型替换
  handleCarbonFlowAction: (action: CarbonFlowAction) => void;
}

// 碳因子匹配组件
const CarbonFactorMatcher = ({ 
  actionHandler, 
  handleCarbonFlowAction 
}: CarbonFactorMatcherProps) => {
  // 状态管理
  const [isMatching, setIsMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  // 触发碳因子匹配操作
  const handleCarbonFactorMatch = useCallback(() => {
    if (!actionHandler) {
      message.error('操作处理器未初始化');
      return;
    }
    
    // 重置状态
    setIsMatching(true);
    setMatchError(null);
    
    message.info('正在进行碳因子匹配...');
    
    const matchAction: CarbonFlowAction = {
      type: 'carbonflow',
      operation: 'carbon_factor_match',
      content: '碳因子匹配',
      description: '进行碳因子匹配操作',
    };
    
    // 添加超时处理
    const timeoutId = setTimeout(() => {
      setIsMatching(false);
      setMatchError('碳因子匹配请求超时，请稍后再试');
      message.error('碳因子匹配请求超时，请稍后再试');
    }, 15000); // 15秒超时
    
    try {
      // 发送匹配请求
      handleCarbonFlowAction(matchAction);
      
      // 模拟操作完成通知（实际项目中应该有回调机制）
      setTimeout(() => {
        clearTimeout(timeoutId); // 清除超时
        setIsMatching(false);
        message.success('碳因子匹配已完成，查看节点更新结果');
      }, 2000);
    } catch(error: unknown) {
      clearTimeout(timeoutId);
      setIsMatching(false);
      setMatchError('碳因子匹配过程中出错');
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      message.error('碳因子匹配失败: ' + errorMessage);
    }
  }, [actionHandler, handleCarbonFlowAction]);

  // 渲染匹配状态
  const renderMatchStatus = () => {
    if (isMatching) {
      return (
        <div className="match-status-indicator">
          <div className="spinner"></div>
          <span>正在进行碳因子匹配，请稍候...</span>
        </div>
      );
    }
    if (matchError) {
      return (
        <div className="match-status-error">
          <span>{matchError}</span>
          <button onClick={() => setMatchError(null)}>清除</button>
        </div>
      );
    }
    return null;
  };

  // 返回组件UI
  return (
    <div className="carbon-factor-matcher">
      <button 
        className="match-button" 
        onClick={handleCarbonFactorMatch}
        disabled={isMatching}
      >
        {isMatching ? '匹配中...' : '匹配碳因子'}
      </button>
      {renderMatchStatus()}
    </div>
  );
};

// 初始节点和边
const initialNodes: Node<NodeData>[] = [];
const initialEdges: Edge[] = [];

// 节点类型定义
const nodeTypes = {
  product: () => <div>产品节点</div>,
  manufacturing: () => <div>制造节点</div>,
  distribution: () => <div>分销节点</div>,
  usage: () => <div>使用节点</div>,
  disposal: () => <div>处置节点</div>,
  finalProduct: () => <div>最终产品</div>,
};

// 节点类型标签
const nodeTypeLabels = {
  product: '原材料',
  manufacturing: '生产制造',
  distribution: '分销和储存',
  usage: '产品使用',
  disposal: '废弃处置',
  finalProduct: '最终产品',
};

// 主要碳流程组件
const CarbonFlowInner = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  
  // 创建 CarbonFlow 操作处理器
  const [actionHandler, setActionHandler] = useState<CarbonFlowActionHandler | null>(null);
  
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
  
  const handleCarbonFlowAction = useCallback((action: CarbonFlowAction) => {
    if (actionHandler) {
      actionHandler.handleAction(action);
    } else {
      console.warn('CarbonFlow 操作处理器尚未初始化');
    }
  }, [actionHandler]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<NodeData>) => {
      setSelectedNode(node);
    },
    []
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  }, []);

  return (
    <div className="editor-layout">
      <div className="editor-header">
        <div className="header-left">
          <h2 className="workflow-title">碳足迹流程图</h2>
        </div>
        <div className="header-actions">
          {/* 在这里添加碳因子匹配组件 */}
          <CarbonFactorMatcher 
            actionHandler={actionHandler} 
            handleCarbonFlowAction={handleCarbonFlowAction} 
          />
        </div>
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
            onPaneClick={onPaneClick}
            onInit={onInit}
            nodeTypes={nodeTypes}
            fitView
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
                />
              </Panel>
            )}
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

// 导出带有Provider的组件
export const CarbonFlow = () => {
  return (
    <ReactFlowProvider>
      <CarbonFlowInner />
    </ReactFlowProvider>
  );
}; 