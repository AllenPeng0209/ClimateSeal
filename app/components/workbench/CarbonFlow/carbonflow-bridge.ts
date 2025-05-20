// carbonflow-bridge.ts
// 用于连接大模型输出的CarbonFlow操作与CarbonFlow组件

import type { CarbonFlowAction } from '~/types/actions';
import type { ActionCallbackData } from '~/lib/runtime/message-parser';
import { ActionRunner } from '~/lib/runtime/action-runner';

/**
 * CarbonFlow桥接器
 * 
 * 负责：
 * 1. 初始化事件监听
 * 2. 将AI生成的CarbonFlow操作发送到CarbonFlow组件
 * 3. 处理操作响应
 */
export class CarbonFlowBridge {
  private static instance: CarbonFlowBridge;
  private initialized: boolean = false;
  private static extendedActionRunnerPrototype = false; // 防止重复修改原型

  /**
   * 获取单例实例
   */
  public static getInstance(): CarbonFlowBridge {
    if (!CarbonFlowBridge.instance) {
      CarbonFlowBridge.instance = new CarbonFlowBridge();
    }
    return CarbonFlowBridge.instance;
  }

  /**
   * 初始化桥接器
   */
  public initialize(): void { // 不再需要 actionRunnerInstance 参数
    console.log('[CarbonFlowBridge.initialize] Attempting to initialize...');
    if (this.initialized) {
      console.warn('CarbonFlow桥接器实例已经初始化，跳过。');
      return;
    }

    this.extendActionRunnerPrototype(); // 修改原型
    this.setupEventListeners(); // 设置事件监听器

    this.initialized = true;
    console.log('[CarbonFlowBridge.initialize] Initialization complete, ActionRunner.prototype extended, event listeners set up.');
  }

  /**
   * 扩展ActionRunner.prototype，添加对CarbonFlow操作的处理
   */
  private extendActionRunnerPrototype(): void {
    if (CarbonFlowBridge.extendedActionRunnerPrototype) {
      console.log('[CarbonFlowBridge.extendActionRunnerPrototype] ActionRunner.prototype 已经扩展过，跳过。');
      return;
    }
    console.log('[CarbonFlowBridge.extendActionRunnerPrototype] Extending ActionRunner.prototype...');

    const originalRunAction = ActionRunner.prototype.runAction;

    ActionRunner.prototype.runAction = async function(
        this: ActionRunner, // 确保 this 指向 ActionRunner 实例
        data: ActionCallbackData, // 修改参数类型
        isStreaming = false
    ) {
      // 尝试从 data.action 获取，如果不存在，则从 ActionRunner 的内部存储中获取
      // this.actions 是 ActionRunner 实例的属性
      const actionToProcess = data.action ?? this.actions.get()[data.actionId]; 
      const actionId = data.actionId;

      console.log(`[CarbonFlowBridge - Patched runAction] 处理 Action ID: ${actionId}, Type: ${actionToProcess?.type}, Streaming: ${isStreaming}`, actionToProcess);

      if (!actionToProcess) {
        console.error(`[CarbonFlowBridge - Patched runAction] Action not found in data or store for actionId: ${actionId}. Calling original ActionRunner.runAction.`);
        return originalRunAction.call(this, data, isStreaming); 
      }

      if (actionToProcess.type === 'carbonflow') {
        console.log('[CarbonFlowBridge - Patched runAction] 检测到 CarbonFlow action:', actionToProcess);
        // 调用 CarbonFlowBridge 实例的方法来分发事件
        CarbonFlowBridge.getInstance().dispatchCarbonFlowAction(actionToProcess as CarbonFlowAction);
        // CarbonFlow action 分发后，仍然继续调用原始的 runAction 以处理通用逻辑 (如状态更新)
      }

      // 调用原始的 runAction 逻辑
      // 这里的 this 已经是 ActionRunner 实例
      return originalRunAction.call(this, data, isStreaming);
    };

    CarbonFlowBridge.extendedActionRunnerPrototype = true;
    console.log('[CarbonFlowBridge.extendActionRunnerPrototype] ActionRunner.prototype.runAction 已被覆盖');
  }

  /**
   * 分发CarbonFlow操作到组件
   */
  public dispatchCarbonFlowAction(action: CarbonFlowAction): void {
    if (!this.initialized) {
      console.error('CarbonFlow桥接器未初始化');
      return;
    }

    console.log(`[CarbonFlowBridge] 分发操作: ${action.operation}`, action);

    // 添加跟踪ID
    const enrichedAction = {
      ...action,
      traceId: `cf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    // 创建自定义事件并分发到 window，或者特定组件
    // 如果你的 CarbonFlow 组件直接监听 window 事件，则 window.dispatchEvent(event) 是可以的
    // 如果 CarbonFlow 组件是 DOM 中的一个特定元素，并且你想更精确地定位事件，可以考虑：
    // const component = document.querySelector('carbon-flow-component'); // 假设这是你的组件的选择器
    // if (component) { component.dispatchEvent(event); } else { console.error('CarbonFlow component not found for event dispatch'); }
    const event = new CustomEvent('carbonflow-action', { detail: enrichedAction, bubbles: true, composed: true });
    window.dispatchEvent(event); // 继续使用 window dispatch，假设组件能监听到
  }

  /**
   * 设置全局事件监听
   */
  private setupEventListeners(): void {
    // 监听carbonflow-action事件的结果回调
    window.addEventListener('carbonflow-action-result', (event: Event) => {
      const customEvent = event as CustomEvent;
      const result = customEvent.detail;

      console.log('[CarbonFlowBridge] 操作结果:', result);
    });

    // 为了方便调试，添加全局监听器
    window.addEventListener('carbonflow-action', event => {
      const customEvent = event as CustomEvent;
      const action = customEvent.detail as CarbonFlowAction;

      console.log(`[CarbonFlowBridge] 接收到操作: ${action.operation}`, action);
    });
  }
}

/**
 * 用于从其他组件访问桥接器的辅助函数
 */
export const getCarbonFlowBridge = (): CarbonFlowBridge => {
  return CarbonFlowBridge.getInstance();
};

/**
 * 测试发送一个CarbonFlow操作
 * 可以在控制台中使用: window.testCarbonFlowAction()
 */
export const testCarbonFlowAction = (): void => {
  const bridge = getCarbonFlowBridge();
  
  const testAction: CarbonFlowAction = {
    type: 'carbonflow',
    operation: 'create',
    nodeType: 'product',
    content: JSON.stringify({
      label: '测试产品节点',
      nodeName: 'test_product',
      lifecycleStage: '原材料获取',
      emissionType: '上游间接排放',
      carbonFactor: 2.5,
      activitydataSource: '测试数据',
      activityScore: 8.0,
      carbonFootprint: 250,
      material: '测试材料',
      weight: '1kg'
    }),
    position: JSON.stringify({ x: 150, y: 150 }),
    description: 'Add test product node to CarbonFlow diagram'
  };
  
  bridge.dispatchCarbonFlowAction(testAction);
  
  console.log('成功发送测试CarbonFlow操作，请查看CarbonFlow视图');
};

/**
 * 测试完整的CarbonFlow流程
 * 可以在控制台中使用: window.testFullCarbonFlow()
 */
export const testFullCarbonFlow = (): void => {
  const bridge = getCarbonFlowBridge();
  
  // 测试原材料节点
  const materialNode: CarbonFlowAction = {
    type: 'carbonflow',
    operation: 'create',
    nodeType: 'product',
    content: JSON.stringify({
      label: '测试原材料',
      nodeName: 'test_material',
      lifecycleStage: '原材料获取',
      emissionType: '上游间接排放',
      carbonFactor: 3.2,
      activitydataSource: '供应商数据',
      activityScore: 7.5,
      carbonFootprint: 320,
      material: '塑料+金属复合材料',
      weight: '2kg'
    }),
    position: JSON.stringify({ x: 150, y: 100 }),
    description: 'Add material node'
  };
  
  // 测试制造节点
  const manufacturingNode: CarbonFlowAction = {
    type: 'carbonflow',
    operation: 'create',
    nodeType: 'manufacturing',
    content: JSON.stringify({
      label: '测试制造',
      nodeName: 'test_manufacturing',
      lifecycleStage: '制造',
      emissionType: '直接排放',
      carbonFactor: 1.8,
      activitydataSource: '生产记录',
      activityScore: 8.2,
      carbonFootprint: 180,
      energyConsumption: 250,
      manufacturingProcess: '注塑+组装'
    }),
    position: JSON.stringify({ x: 150, y: 250 }),
    description: 'Add manufacturing node'
  };
  
  // 测试连接操作
  const connectAction: CarbonFlowAction = {
    type: 'carbonflow',
    operation: 'connect',
    source: 'test_material',
    target: 'test_manufacturing',
    content: JSON.stringify({
      label: '材料流',
      transportEmissions: 0.5
    }),
    description: 'Connect material to manufacturing'
  };
  
  // 依次发送操作
  setTimeout(() => {
    bridge.dispatchCarbonFlowAction(materialNode);
    console.log('添加原材料节点');
    
    setTimeout(() => {
      bridge.dispatchCarbonFlowAction(manufacturingNode);
      console.log('添加制造节点');
      
      setTimeout(() => {
        bridge.dispatchCarbonFlowAction(connectAction);
        console.log('连接节点');
        
        setTimeout(() => {
          // 发送布局操作
          bridge.dispatchCarbonFlowAction({
            type: 'carbonflow',
            operation: 'layout',
            content: JSON.stringify({ type: 'vertical' }),
            description: 'Apply vertical layout'
          });
          console.log('应用布局');
        }, 500);
      }, 500);
    }, 500);
  }, 0);
  
  console.log('开始测试CarbonFlow完整流程，请查看CarbonFlow视图');
};

// 暴露测试函数到全局作用域，方便调试
if (typeof window !== 'undefined') {
  (window as any).testCarbonFlowAction = testCarbonFlowAction;
  (window as any).testFullCarbonFlow = testFullCarbonFlow;
} 