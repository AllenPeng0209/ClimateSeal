// carbonflow-bridge.ts
// 用于连接大模型输出的CarbonFlow操作与CarbonFlow组件

import type { CarbonFlowAction } from '~/types/actions';
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
  private actionRunner: ActionRunner | null = null;
  private initialized: boolean = false;

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
  public initialize(actionRunner: ActionRunner): void {
    if (this.initialized) {
      console.warn('CarbonFlow桥接器已经初始化');
      return;
    }

    this.actionRunner = actionRunner;
    this.initialized = true;

    // 修改ActionRunner的runAction方法，增加对CarbonFlow操作的支持
    this.extendActionRunner();

    // 添加全局事件监听
    this.setupEventListeners();

    console.log('[CarbonFlowBridge] 初始化完成');
  }

  /**
   * 扩展ActionRunner，添加对CarbonFlow操作的处理
   */
  private extendActionRunner(): void {
    if (!this.actionRunner) {
      console.error('ActionRunner未初始化');
      return;
    }

    // 保存原始runAction方法的引用
    const originalRunAction = this.actionRunner.runAction.bind(this.actionRunner);

    // 重写runAction方法，添加对CarbonFlow操作的支持
    this.actionRunner.runAction = async (data, isStreaming = false) => {
      const { action } = data;

      // 如果是CarbonFlow操作，分发到CarbonFlow组件
      if (action.type === 'carbonflow') {
        this.dispatchCarbonFlowAction(action as CarbonFlowAction);
        return;
      }

      // 其他类型的操作，使用原始方法处理
      return originalRunAction(data, isStreaming);
    };
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

    // 创建自定义事件并分发
    const event = new CustomEvent('carbonflow-action', { detail: enrichedAction });
    window.dispatchEvent(event);
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