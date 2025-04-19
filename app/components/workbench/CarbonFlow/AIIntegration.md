# CarbonFlow AI 集成实现文档

## 1. 系统概述

CarbonFlow AI 集成系统是一个将 AI 碳咨询顾问与可视化碳足迹流程相结合的解决方案。该系统允许用户通过自然语言交互来操作 CarbonFlow，包括节点信息填充、因子匹配和自动布局等功能。

### 1.1 核心组件

- **CarbonFlow 编辑器**：可视化碳足迹流程的核心组件
- **AI 提示系统**：基于 prompts_carbon_chinese.ts 的碳咨询顾问
- **数据模型**：定义节点和连接的数据结构
- **因子匹配引擎**：连接碳排放因子数据库

### 1.2 数据流程

1. 用户输入 → AI 分析
2. AI 分析 → 节点数据生成
3. 节点数据 → 用户编辑
4. 用户编辑 → 因子匹配
5. 因子匹配 → 碳排放计算
6. 碳排放计算 → 节点布局优化

## 2. 技术实现

### 2.1 AI 与 CarbonFlow 集成

#### 2.1.1 AI 控制器组件

```typescript
// app/components/workbench/CarbonFlow/AIController.tsx
import React, { useState, useEffect } from 'react';
import { useNodesState, useEdgesState } from 'reactflow';
import { getSystemPromptCarbonChinese } from '~/lib/common/prompts/prompts_carbon_chinese';
import { Node, Edge } from 'reactflow';
import { 
  ProductNodeData, 
  ManufacturingNodeData, 
  DistributionNodeData, 
  UsageNodeData, 
  DisposalNodeData, 
  FinalProductNodeData 
} from './CarbonFlow';

interface AIControllerProps {
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
}

export const AIController: React.FC<AIControllerProps> = ({ 
  onNodesChange, 
  onEdgesChange 
}) => {
  const [userInput, setUserInput] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const processUserInput = async () => {
    if (!userInput.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // 调用 AI 服务处理用户输入
      const response = await fetch('/api/ai/carbon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: userInput,
          systemPrompt: getSystemPromptCarbonChinese()
        })
      });
      
      const data = await response.json();
      setAiResponse(data.response);
      
      // 解析 AI 响应并更新节点和边
      const { nodes, edges } = parseAIResponse(data.response);
      onNodesChange(nodes);
      onEdgesChange(edges);
    } catch (error) {
      console.error('AI 处理错误:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const parseAIResponse = (response: string) => {
    // 解析 AI 响应，提取节点和边信息
    // 这里需要实现复杂的解析逻辑，将自然语言转换为结构化数据
    // 返回 { nodes, edges }
    return { nodes: [], edges: [] };
  };
  
  return (
    <div className="ai-controller">
      <textarea
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        placeholder="描述您的产品碳足迹需求..."
        rows={4}
      />
      <button 
        onClick={processUserInput}
        disabled={isProcessing || !userInput.trim()}
      >
        {isProcessing ? '处理中...' : '提交'}
      </button>
      {aiResponse && (
        <div className="ai-response">
          <h3>AI 响应</h3>
          <div className="response-content">{aiResponse}</div>
        </div>
      )}
    </div>
  );
};
```

#### 2.1.2 数据解析服务

```typescript
// app/services/ai/carbonParser.ts
import { 
  ProductNodeData, 
  ManufacturingNodeData, 
  DistributionNodeData, 
  UsageNodeData, 
  DisposalNodeData, 
  FinalProductNodeData 
} from '~/components/workbench/CarbonFlow/CarbonFlow';

export interface ParsedNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
}

export interface ParsedEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

export const parseCarbonData = (aiResponse: string): { 
  nodes: ParsedNode[], 
  edges: ParsedEdge[] 
} => {
  // 实现 AI 响应解析逻辑
  // 1. 提取产品信息
  // 2. 识别生命周期阶段
  // 3. 创建节点和边
  // 4. 填充节点数据
  
  const nodes: ParsedNode[] = [];
  const edges: ParsedEdge[] = [];
  
  // 解析逻辑实现...
  
  return { nodes, edges };
};
```

### 2.2 节点属性自动填充

#### 2.2.1 扩展 NodeProperties 组件

```typescript
// app/components/workbench/CarbonFlow/NodeProperties.tsx
// 在现有组件基础上添加自动填充功能

// 添加自动填充按钮
const AutoFillButton: React.FC<{ 
  nodeData: any, 
  onUpdate: (data: any) => void 
}> = ({ nodeData, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleAutoFill = async () => {
    setIsLoading(true);
    try {
      // 调用 AI 服务获取节点属性建议
      const response = await fetch('/api/ai/node-properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeData })
      });
      
      const suggestedData = await response.json();
      onUpdate({ ...nodeData, ...suggestedData });
    } catch (error) {
      console.error('自动填充错误:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <button 
      onClick={handleAutoFill}
      disabled={isLoading}
      className="auto-fill-button"
    >
      {isLoading ? '填充中...' : 'AI 自动填充'}
    </button>
  );
};

// 在表单中添加自动填充按钮
// 在各个生命周期阶段的表单中添加
```

### 2.3 因子匹配系统

#### 2.3.1 因子匹配服务

```typescript
// app/services/carbon/factorMatching.ts
import { supabase } from '~/lib/supabase';

export interface CarbonFactor {
  id: string;
  name: string;
  value: number;
  unit: string;
  source: string;
  category: string;
  subcategory: string;
  region: string;
  year: number;
  confidence: number;
}

export const matchCarbonFactor = async (
  nodeType: string,
  nodeData: any
): Promise<CarbonFactor | null> => {
  try {
    // 构建查询条件
    const query = supabase
      .from('carbon_factors')
      .select('*');
    
    // 根据节点类型和属性添加过滤条件
    if (nodeType === 'product') {
      query.eq('category', 'material')
           .ilike('name', `%${nodeData.material || ''}%`);
    } else if (nodeType === 'manufacturing') {
      query.eq('category', 'energy')
           .ilike('name', `%${nodeData.energyType || ''}%`);
    } else if (nodeType === 'distribution') {
      query.eq('category', 'transportation')
           .ilike('name', `%${nodeData.transportationMode || ''}%`);
    } else if (nodeType === 'usage') {
      query.eq('category', 'energy')
           .ilike('name', `%${nodeData.energyConsumptionPerUse || ''}%`);
    } else if (nodeType === 'disposal') {
      query.eq('category', 'waste')
           .ilike('name', `%${nodeData.disposalMethod || ''}%`);
    }
    
    // 添加区域过滤
    if (nodeData.region) {
      query.eq('region', nodeData.region);
    }
    
    // 添加年份过滤
    if (nodeData.year) {
      query.eq('year', nodeData.year);
    }
    
    // 执行查询
    const { data, error } = await query;
    
    if (error) throw error;
    
    // 如果没有匹配结果，返回 null
    if (!data || data.length === 0) return null;
    
    // 按置信度排序，返回最佳匹配
    const sortedFactors = data.sort((a, b) => b.confidence - a.confidence);
    return sortedFactors[0];
  } catch (error) {
    console.error('因子匹配错误:', error);
    return null;
  }
};
```

#### 2.3.2 因子匹配 UI 组件

```typescript
// app/components/workbench/CarbonFlow/FactorMatching.tsx
import React, { useState, useEffect } from 'react';
import { matchCarbonFactor, CarbonFactor } from '~/services/carbon/factorMatching';

interface FactorMatchingProps {
  nodeType: string;
  nodeData: any;
  onFactorMatched: (factor: CarbonFactor) => void;
}

export const FactorMatching: React.FC<FactorMatchingProps> = ({
  nodeType,
  nodeData,
  onFactorMatched
}) => {
  const [factor, setFactor] = useState<CarbonFactor | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const findFactor = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const matchedFactor = await matchCarbonFactor(nodeType, nodeData);
        setFactor(matchedFactor);
        
        if (matchedFactor) {
          onFactorMatched(matchedFactor);
        }
      } catch (err) {
        setError('因子匹配失败');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    findFactor();
  }, [nodeType, nodeData, onFactorMatched]);
  
  if (isLoading) return <div>匹配因子中...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!factor) return <div>未找到匹配的因子</div>;
  
  return (
    <div className="factor-matching">
      <h3>匹配的碳因子</h3>
      <div className="factor-details">
        <p><strong>名称:</strong> {factor.name}</p>
        <p><strong>值:</strong> {factor.value} {factor.unit}</p>
        <p><strong>来源:</strong> {factor.source}</p>
        <p><strong>类别:</strong> {factor.category}</p>
        <p><strong>子类别:</strong> {factor.subcategory}</p>
        <p><strong>区域:</strong> {factor.region}</p>
        <p><strong>年份:</strong> {factor.year}</p>
        <p><strong>置信度:</strong> {factor.confidence}%</p>
      </div>
    </div>
  );
};
```

### 2.4 自动计算系统

#### 2.4.1 碳排放计算服务

```typescript
// app/services/carbon/emissionCalculator.ts
import { Node, Edge } from 'reactflow';
import { CarbonFactor } from './factorMatching';

export interface EmissionResult {
  nodeId: string;
  emissionValue: number;
  unit: string;
  confidence: number;
}

export const calculateEmissions = (
  nodes: Node[],
  edges: Edge[],
  factors: Record<string, CarbonFactor>
): EmissionResult[] => {
  const results: EmissionResult[] = [];
  
  // 遍历所有节点
  nodes.forEach(node => {
    const nodeData = node.data;
    const factor = factors[node.id];
    
    if (!factor) return;
    
    // 根据节点类型和因子计算排放
    let emissionValue = 0;
    
    if (node.type === 'product') {
      // 产品节点: 材料重量 * 材料因子
      emissionValue = (nodeData.weight_per_unit || 0) * factor.value;
    } else if (node.type === 'manufacturing') {
      // 制造节点: 能源消耗 * 能源因子
      emissionValue = (nodeData.energyConsumption || 0) * factor.value;
    } else if (node.type === 'distribution') {
      // 分销节点: 运输距离 * 运输因子
      emissionValue = (nodeData.transportationDistance || 0) * factor.value;
    } else if (node.type === 'usage') {
      // 使用节点: 使用频率 * 能源消耗 * 能源因子
      emissionValue = (nodeData.usageFrequency || 0) * 
                     (nodeData.energyConsumptionPerUse || 0) * 
                     factor.value;
    } else if (node.type === 'disposal') {
      // 处置节点: 处置量 * 处置因子
      emissionValue = (nodeData.wasteAmount || 0) * factor.value;
    }
    
    results.push({
      nodeId: node.id,
      emissionValue,
      unit: factor.unit,
      confidence: factor.confidence
    });
  });
  
  return results;
};
```

#### 2.4.2 可视化组件

```typescript
// app/components/workbench/CarbonFlow/EmissionVisualization.tsx
import React from 'react';
import { EmissionResult } from '~/services/carbon/emissionCalculator';

interface EmissionVisualizationProps {
  results: EmissionResult[];
}

export const EmissionVisualization: React.FC<EmissionVisualizationProps> = ({
  results
}) => {
  // 计算总排放量
  const totalEmission = results.reduce(
    (sum, result) => sum + result.emissionValue, 
    0
  );
  
  // 计算平均置信度
  const avgConfidence = results.length > 0
    ? results.reduce((sum, result) => sum + result.confidence, 0) / results.length
    : 0;
  
  return (
    <div className="emission-visualization">
      <h3>碳排放结果</h3>
      
      <div className="total-emission">
        <h4>总碳排放</h4>
        <div className="value">{totalEmission.toFixed(2)} {results[0]?.unit || 'kgCO2e'}</div>
        <div className="confidence">置信度: {avgConfidence.toFixed(1)}%</div>
      </div>
      
      <div className="emission-breakdown">
        <h4>排放明细</h4>
        <ul>
          {results.map(result => (
            <li key={result.nodeId}>
              <span className="node-name">{result.nodeId}</span>
              <span className="emission-value">
                {result.emissionValue.toFixed(2)} {result.unit}
              </span>
              <span className="confidence">{result.confidence}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
```

### 2.5 自动布局优化

#### 2.5.1 布局算法

```typescript
// app/services/carbon/layoutOptimizer.ts
import { Node, Edge } from 'reactflow';

interface LayoutOptions {
  horizontalSpacing: number;
  verticalSpacing: number;
  startX: number;
  startY: number;
}

export const optimizeLayout = (
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {
    horizontalSpacing: 250,
    verticalSpacing: 100,
    startX: 50,
    startY: 50
  }
): Node[] => {
  // 按生命周期阶段分组节点
  const stageGroups: Record<string, Node[]> = {
    product: [],
    manufacturing: [],
    distribution: [],
    usage: [],
    disposal: [],
    finalProduct: []
  };
  
  nodes.forEach(node => {
    const stage = node.type;
    if (stageGroups[stage]) {
      stageGroups[stage].push(node);
    }
  });
  
  // 计算每个阶段的垂直位置
  const stages = Object.keys(stageGroups);
  const updatedNodes: Node[] = [];
  
  stages.forEach((stage, stageIndex) => {
    const stageNodes = stageGroups[stage];
    
    // 计算该阶段节点的水平位置
    stageNodes.forEach((node, nodeIndex) => {
      const x = options.startX + (stageIndex * options.horizontalSpacing);
      const y = options.startY + (nodeIndex * options.verticalSpacing);
      
      updatedNodes.push({
        ...node,
        position: { x, y }
      });
    });
  });
  
  return updatedNodes;
};
```

#### 2.5.2 布局控制器

```typescript
// app/components/workbench/CarbonFlow/LayoutController.tsx
import React from 'react';
import { Node, Edge } from 'reactflow';
import { optimizeLayout } from '~/services/carbon/layoutOptimizer';

interface LayoutControllerProps {
  nodes: Node[];
  edges: Edge[];
  onLayoutChange: (nodes: Node[]) => void;
}

export const LayoutController: React.FC<LayoutControllerProps> = ({
  nodes,
  edges,
  onLayoutChange
}) => {
  const handleOptimizeLayout = () => {
    const optimizedNodes = optimizeLayout(nodes, edges);
    onLayoutChange(optimizedNodes);
  };
  
  return (
    <div className="layout-controller">
      <button onClick={handleOptimizeLayout}>
        优化布局
      </button>
    </div>
  );
};
```

### 2.6 AI 摘要与建议

#### 2.6.1 增强 AISummary 组件

```typescript
// app/components/workbench/CarbonFlow/AISummary.tsx
// 在现有组件基础上添加 AI 建议功能

// 添加 AI 建议部分
const AIRecommendations: React.FC<{
  nodes: Node[];
  edges: Edge[];
}> = ({ nodes, edges }) => {
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const generateRecommendations = async () => {
    setIsLoading(true);
    try {
      // 调用 AI 服务生成建议
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges })
      });
      
      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error('生成建议错误:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    generateRecommendations();
  }, [nodes, edges]);
  
  if (isLoading) return <div>生成建议中...</div>;
  if (recommendations.length === 0) return null;
  
  return (
    <div className="ai-recommendations">
      <h3>AI 优化建议</h3>
      <ul>
        {recommendations.map((rec, index) => (
          <li key={index}>{rec}</li>
        ))}
      </ul>
    </div>
  );
};

// 在主组件中添加 AIRecommendations
```

## 3. 数据模型扩展

### 3.1 节点数据模型

```typescript
// app/types/carbon.ts
export interface BaseNodeData {
  label: string;
  nodeName: string;
  lifecycleStage: string;
  emissionType: string;
  carbonFactor?: string;
  carbonFactorName?: string;
  activityScore?: number;
  carbonFootprint?: number;
  quantity?: number;
  unit?: string;
  unitConversion?: number;
  aiGenerated?: boolean;
  aiConfidence?: number;
  lastUpdated?: string;
}

export interface ProductNodeData extends BaseNodeData {
  material?: string;
  weight_per_unit?: number;
  isRecycled?: boolean;
  recycledContent?: number;
  sourcingRegion?: string;
  SourceLocation?: string;
  Destination?: string;
  SupplierName?: string;
  SupplierAddress?: string;
  ProcessingPlantAddress?: string;
  RefrigeratedTransport?: boolean;
  weight?: number;
  supplier?: string;
  certaintyPercentage?: number;
}

// 其他节点数据接口保持不变...
```

### 3.2 连接数据模型

```typescript
// app/types/carbon.ts
export interface CarbonEdgeData {
  label?: string;
  flowType?: string;
  flowAmount?: number;
  flowUnit?: string;
  carbonTransfer?: number;
  aiGenerated?: boolean;
  aiConfidence?: number;
}
```

## 4. API 设计

### 4.1 节点管理 API

```typescript
// app/api/carbon/nodes.ts
import { supabase } from '~/lib/supabase';
import { Node } from 'reactflow';

export const saveNodes = async (nodes: Node[], projectId: string) => {
  const { data, error } = await supabase
    .from('carbon_nodes')
    .upsert(
      nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
        project_id: projectId
      }))
    );
  
  if (error) throw error;
  return data;
};

export const loadNodes = async (projectId: string) => {
  const { data, error } = await supabase
    .from('carbon_nodes')
    .select('*')
    .eq('project_id', projectId);
  
  if (error) throw error;
  return data;
};
```

### 4.2 数据解析 API

```typescript
// app/api/ai/parse-carbon-data.ts
import { parseCarbonData } from '~/services/ai/carbonParser';

export const parseCarbonDataAPI = async (req, res) => {
  try {
    const { aiResponse } = req.body;
    
    if (!aiResponse) {
      return res.status(400).json({ error: '缺少 AI 响应数据' });
    }
    
    const result = parseCarbonData(aiResponse);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('解析碳数据错误:', error);
    return res.status(500).json({ error: '解析碳数据失败' });
  }
};
```

### 4.3 因子匹配 API

```typescript
// app/api/carbon/match-factor.ts
import { matchCarbonFactor } from '~/services/carbon/factorMatching';

export const matchFactorAPI = async (req, res) => {
  try {
    const { nodeType, nodeData } = req.body;
    
    if (!nodeType || !nodeData) {
      return res.status(400).json({ error: '缺少节点类型或数据' });
    }
    
    const factor = await matchCarbonFactor(nodeType, nodeData);
    
    return res.status(200).json({ factor });
  } catch (error) {
    console.error('因子匹配错误:', error);
    return res.status(500).json({ error: '因子匹配失败' });
  }
};
```

## 5. 用户界面优化

### 5.1 节点属性面板

```typescript
// app/components/workbench/CarbonFlow/NodePropertiesPanel.tsx
import React from 'react';
import { NodeProperties } from './NodeProperties';
import { FactorMatching } from './FactorMatching';
import { EmissionVisualization } from './EmissionVisualization';

interface NodePropertiesPanelProps {
  selectedNode: Node | null;
  onNodeUpdate: (nodeId: string, data: any) => void;
}

export const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({
  selectedNode,
  onNodeUpdate
}) => {
  if (!selectedNode) {
    return (
      <div className="node-properties-panel empty">
        <p>选择一个节点查看属性</p>
      </div>
    );
  }
  
  const handleNodeUpdate = (data: any) => {
    onNodeUpdate(selectedNode.id, data);
  };
  
  return (
    <div className="node-properties-panel">
      <h2>节点属性</h2>
      
      <NodeProperties 
        node={selectedNode} 
        onUpdate={handleNodeUpdate} 
      />
      
      <FactorMatching 
        nodeType={selectedNode.type} 
        nodeData={selectedNode.data}
        onFactorMatched={(factor) => {
          handleNodeUpdate({
            ...selectedNode.data,
            carbonFactor: factor.id,
            carbonFactorName: factor.name
          });
        }}
      />
      
      <EmissionVisualization 
        results={[
          {
            nodeId: selectedNode.id,
            emissionValue: selectedNode.data.carbonFootprint || 0,
            unit: 'kgCO2e',
            confidence: selectedNode.data.aiConfidence || 100
          }
        ]}
      />
    </div>
  );
};
```

### 5.2 AI 交互界面

```typescript
// app/components/workbench/CarbonFlow/AIInteractionPanel.tsx
import React from 'react';
import { AIController } from './AIController';
import { AIRecommendations } from './AISummary';

interface AIInteractionPanelProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
}

export const AIInteractionPanel: React.FC<AIInteractionPanelProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange
}) => {
  return (
    <div className="ai-interaction-panel">
      <h2>AI 碳咨询顾问</h2>
      
      <AIController 
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
      />
      
      <AIRecommendations 
        nodes={nodes}
        edges={edges}
      />
    </div>
  );
};
```

## 6. 实施路线图

### 6.1 第一阶段：基础集成

1. 实现 AI 控制器组件
2. 开发数据解析服务
3. 集成到 CarbonFlow 主组件
4. 测试基本功能

### 6.2 第二阶段：功能增强

1. 实现因子匹配系统
2. 开发自动计算系统
3. 添加自动布局优化
4. 增强 AI 摘要与建议

### 6.3 第三阶段：用户体验优化

1. 优化用户界面
2. 添加批量操作功能
3. 实现数据导入/导出
4. 性能优化

## 7. 潜在挑战与解决方案

### 7.1 数据一致性

**挑战**：AI 生成的数据与用户输入的数据可能存在不一致。

**解决方案**：
- 实现数据验证机制
- 提供数据冲突解决界面
- 保留数据来源追踪

### 7.2 性能问题

**挑战**：大量节点和复杂计算可能导致性能下降。

**解决方案**：
- 实现节点虚拟化
- 优化计算算法
- 使用 Web Workers 进行后台计算

### 7.3 用户体验复杂性

**挑战**：功能丰富可能导致界面复杂。

**解决方案**：
- 实现渐进式功能展示
- 提供上下文帮助
- 设计直观的交互流程

## 8. 最佳实践建议

### 8.1 代码组织

- 采用模块化设计
- 使用 TypeScript 类型系统
- 实现单元测试
- 遵循 React 最佳实践

### 8.2 测试策略

- 单元测试核心功能
- 集成测试组件交互
- 端到端测试用户流程
- 性能测试关键操作

### 8.3 性能考虑

- 实现数据缓存
- 优化渲染性能
- 使用懒加载组件
- 监控内存使用

## 9. 结论

通过整合 prompts_carbon_chinese.ts 与 CarbonFlow 组件，我们创建了一个强大的碳足迹评估系统。该系统不仅提供了直观的可视化界面，还通过 AI 辅助功能增强了数据收集、节点管理、因子匹配和用户体验。随着系统的不断完善，它将为用户提供更加高效、准确的碳足迹评估工具。 