import type { WorkflowTask, VendorTask, CarbonReductionTask, CarbonTrendPoint } from "~/types/dashboard";

export const workflowTasks: WorkflowTask[] = [
  {
    id: "wt-1",
    name: "完成碳足迹评估报告",
    status: "active",
    progress: 75,
    dueDate: "2024-04-15"
  },
  {
    id: "wt-2",
    name: "收集供应商排放数据",
    status: "pending",
    progress: 30,
    dueDate: "2024-04-20"
  },
  {
    id: "wt-3",
    name: "更新碳减排目标",
    status: "completed",
    progress: 100,
    dueDate: "2024-04-10"
  }
];

export const vendorDataTasks: VendorTask[] = [
  {
    id: "vt-1",
    name: "收集供应商A的排放数据",
    status: "pending",
    dueDate: "2024-04-15",
    assignedTo: "张三"
  },
  {
    id: "vt-2",
    name: "收集供应商B的能源使用数据",
    status: "completed",
    dueDate: "2024-04-12",
    assignedTo: "李四"
  },
  {
    id: "vt-3",
    name: "收集供应商C的运输数据",
    status: "failed",
    dueDate: "2024-04-08",
    assignedTo: "王五"
  }
];

export const carbonReductionTasks: CarbonReductionTask[] = [
  {
    id: "cr-1",
    name: "优化生产线能源效率",
    targetReduction: 100,
    currentReduction: 65,
    unit: "tCO₂e",
    deadline: "2024-06-30"
  },
  {
    id: "cr-2",
    name: "实施可再生能源项目",
    targetReduction: 200,
    currentReduction: 80,
    unit: "tCO₂e",
    deadline: "2024-12-31"
  },
  {
    id: "cr-3",
    name: "改进废物管理系统",
    targetReduction: 50,
    currentReduction: 20,
    unit: "tCO₂e",
    deadline: "2024-09-30"
  }
];

export const carbonTrendData: CarbonTrendPoint[] = [
  { date: "2024-01", value: 150, unit: "tCO₂e" },
  { date: "2024-02", value: 145, unit: "tCO₂e" },
  { date: "2024-03", value: 130, unit: "tCO₂e" },
  { date: "2024-04", value: 125.8, unit: "tCO₂e" }
]; 