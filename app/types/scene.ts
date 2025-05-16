export type SceneInfoType = {
  workflowId?: string; // 工作流ID
  verificationLevel?: string; // 预期核验级别
  standard?: string; // 满足标准 (PRD) / 核算标准 (Screenshot)
  productName?: string; // 核算产品

  // New fields from PRD/Screenshot
  taskName?: string; // 核算任务名称
  productSpecs?: string; // 产品规格 (for display)
  productDesc?: string; // 产品描述 (for display)

  dataCollectionStartDate?: string; // 数据收集开始时间 (Antd DatePicker will store as string or Moment object, handle accordingly)
  dataCollectionEndDate?: string; // 数据收集结束时间

  totalOutputValue?: number; // 产品总产量 - 数值
  totalOutputUnit?: string; // 产品总产量 - 单位

  benchmarkValue?: number; // 核算基准 - 数值
  benchmarkUnit?: string; // 核算基准 - 单位

  conversionFactor?: number; // 总产量单位转换系数 (Screenshot: next to 核算基准)

  functionalUnit?: string; // 功能单位

  lifecycleType?: 'half' | 'full'; // New: To store the radio choice for lifecycle boundary
  calculationBoundaryHalfLifecycle?: string[];
  calculationBoundaryFullLifecycle?: string[];
}; 