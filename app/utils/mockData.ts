import type { WorkflowTask as WorkflowTaskDashboard, VendorTask, CarbonReductionTask as CarbonReductionTaskDashboard, CarbonTrendPoint } from "~/types/dashboard";
import type { WorkflowTask, VendorDataTask, CarbonReductionTask, CarbonTrendData } from "~/types";

export const workflowTasks: WorkflowTask[] = [
  {
    id: "wt-1",
    title: "完成碳足迹评估报告",
    status: "进行中",
    priority: "high",
    deadline: "2024-04-15",
    progress: 75
  },
  {
    id: "wt-2",
    title: "收集供应商排放数据",
    status: "未开始",
    priority: "medium",
    deadline: "2024-04-20",
    progress: 30
  },
  {
    id: "wt-3",
    title: "更新碳减排目标",
    status: "已完成",
    priority: "low",
    deadline: "2024-04-10",
    progress: 100
  }
];

export const vendorDataTasks: VendorDataTask[] = [
  {
    id: "vt-1",
    vendor: "供应商A",
    product: "原材料X",
    status: "待提交",
    deadline: "2024-04-15",
    submittedAt: null,
    dataQuality: null
  },
  {
    id: "vt-2",
    vendor: "供应商B",
    product: "能源供应",
    status: "已提交",
    deadline: "2024-04-12",
    submittedAt: "2024-04-10",
    dataQuality: "良好"
  },
  {
    id: "vt-3",
    vendor: "供应商C",
    product: "运输服务",
    status: "逾期",
    deadline: "2024-04-08",
    submittedAt: null,
    dataQuality: null
  }
];

export const carbonReductionTasks: CarbonReductionTask[] = [
  {
    id: "cr-1",
    title: "优化生产线能源效率",
    status: "进行中",
    target: "减少100 tCO₂e",
    responsible: "生产部门",
    deadline: "2024-06-30",
    progress: 65
  },
  {
    id: "cr-2",
    title: "实施可再生能源项目",
    status: "规划中",
    target: "减少200 tCO₂e",
    responsible: "设施部门",
    deadline: "2024-12-31",
    progress: 40
  },
  {
    id: "cr-3",
    title: "改进废物管理系统",
    status: "未开始",
    target: "减少50 tCO₂e",
    responsible: "可持续发展部门",
    deadline: "2024-09-30",
    progress: 0
  }
];

export const carbonTrendData: CarbonTrendData = {
  months: ["一月", "二月", "三月", "四月", "五月", "六月"],
  values: [150, 145, 130, 125, 115, 110],
  industryAvg: [160, 158, 155, 152, 150, 148],
  leadingAvg: [140, 135, 130, 125, 120, 115],
  ourCompany: [150, 145, 130, 125, 115, 110]
}; 