# CarbonFlow 组件

CarbonFlow 是一个用于创建和管理碳足迹流程图的React组件。它允许用户创建、连接和布局不同类型的节点，以模拟产品生命周期的碳排放。

## 核心文件结构

- `CarbonFlow.tsx` - 主组件，负责渲染流程图
- `CarbonFlowActions.ts` - 处理所有操作，包括添加、更新、删除和连接节点
- `carbonflow-bridge.js` - 桥接消息解析和组件之间的通信
- `carbonflow-starter.js` - 初始化和启动CarbonFlow组件
- `utils/cli.js` - 命令行工具，用于测试和调试

## 使用方法

### 基础操作

CarbonFlow 支持以下操作:

- `add` - 添加节点
- `update` - 更新节点
- `delete` - 删除节点
- `query` - 查询节点
- `connect` - 连接节点
- `layout` - 自动布局
- `calculate` - 计算碳足迹

### 示例

#### 添加节点

```javascript
// 在聊天框内
<boltAction type="carbonflow" operation="add" nodeType="material" content='{"nodeName":"主板","label":"主板"}' />

// 通过JS API
window.carbonflow.add('material', 'mainboard');
```

#### 连接节点

```javascript
// 在聊天框内
<boltAction type="carbonflow" operation="connect" source="mainboard" target="assembly" />

// 通过JS API
window.carbonflow.connect('mainboard', 'assembly');
```

### 节点类型

CarbonFlow 支持以下节点类型:

- `product` (或 `material`) - 产品/材料节点
- `manufacturing` - 制造节点
- `distribution` - 分销节点
- `usage` - 使用节点
- `disposal` - 废弃节点
- `finalProduct` - 最终产品节点

## 排错指南

### 常见问题

1. **节点不显示**
   - 确保当前视图是 CarbonFlow 视图
   - 查看控制台错误信息
   - 使用 `carbonflow.test()` 创建测试节点检查组件是否正常工作

2. **连接失败**
   - 确保源节点和目标节点都已存在
   - 检查节点名称拼写
   - 查看控制台中的 `[HANDLER_CONNECT]` 日志

3. **组件未初始化**
   - 手动调用 `window.CarbonFlowStarter.init()`
   - 检查控制台中的 `[CARBONFLOW_STARTER]` 日志

## 调试工具

为了便于调试，CarbonFlow 提供了命令行工具:

```javascript
// 切换到 CarbonFlow 视图
carbonflow.view('carbonflow');

// 创建测试场景
carbonflow.test();

// 查看操作历史
carbonflow.history();

// 显示帮助信息
carbonflow.help();
```

## 数据流

CarbonFlow 的数据流如下:

1. 用户在聊天框中输入操作
2. 消息解析器提取操作并传递给 ActionRunner
3. ActionRunner 通过桥接模块分发操作
4. CarbonFlow 组件接收操作并传递给 CarbonFlowActionHandler
5. CarbonFlowActionHandler 处理操作并更新状态
6. React 重新渲染组件以反映状态变化

## 开发指南

### 添加新节点类型

1. 在 `CarbonFlow.tsx` 中的 `nodeTypes` 对象中添加新类型
2. 创建新节点的组件 (`nodes/NewTypeNode.tsx`)
3. 更新 `NodeData` 类型定义

### 添加新操作

1. 在 `types/actions.ts` 中的 `CarbonFlowOperation` 类型中添加新操作
2. 在 `CarbonFlowActionHandler` 类中添加新操作的处理方法
3. 在 `message-parser.ts` 中添加新操作的解析逻辑

## AI 集成

CarbonFlow支持从大模型接收操作指令，实现智能交互。完整流程如下：

1. 大模型生成CarbonFlow操作 `<boltAction type="carbonflow" operation="add" nodeType="product">`
2. 消息解析器提取操作信息，通过ActionRunner处理
3. 通过自定义事件系统将操作分发到CarbonFlow组件
4. CarbonFlow组件处理操作，更新图表
5. 操作结果通过事件系统返回

### 示例：添加节点

```
<boltAction type="carbonflow" operation="add" nodeType="product">
{
  "label": "原材料",
  "nodeName": "raw_material",
  "emissionType": "direct",
  "carbonFactor": 2.5,
  "activitydataSource": "manual"
}
</boltAction>
```

### 示例：更新节点

```
<boltAction type="carbonflow" operation="update" nodeId="product-12345">
{
  "carbonFactor": 3.2,
  "emissionType": "indirect"
}
</boltAction>
```

### 示例：连接节点

```
<boltAction type="carbonflow" operation="connect" source="product-12345" target="manufacturing-67890">
{
  "label": "材料流"
}
</boltAction>
```

### 测试操作

在浏览器控制台中可以通过全局方法测试CarbonFlow操作：

```javascript
window.testCarbonFlowAction();
```

更多详细信息请参考 `flow.md` 文档。 