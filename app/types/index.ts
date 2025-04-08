export interface Product {
  id: string;
  name: string;
  carbonFootprint: number;
  unit: string;
  category: string;
  reductionTarget: number;
  progress: number;
}

export interface WorkflowTask {
  id: string;
  title: string;
  status: "进行中" | "未开始" | "已完成";
  priority: "high" | "medium" | "low";
  deadline: string;
  progress: number;
}

export interface VendorDataTask {
  id: string;
  vendor: string;
  product: string;
  status: "待提交" | "已提交" | "逾期";
  deadline: string;
  submittedAt: string | null;
  dataQuality: string | null;
}

export interface CarbonReductionTask {
  id: string;
  title: string;
  status: "进行中" | "未开始" | "已完成" | "规划中";
  target: string;
  responsible: string;
  deadline: string;
  progress: number;
}

export interface CarbonTrendData {
  months: string[];
  values: number[];
  industryAvg: number[];
  leadingAvg: number[];
  ourCompany: number[];
} 