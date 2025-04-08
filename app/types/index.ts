export interface Product {
  id: string;
  name: string;
  category: string;
  carbonFootprint: number;
  unit: string;
  reductionTarget: number;
  progress: number;
}

export interface WorkflowTask {
  id: string;
  title: string;
  name: string;
  workflow: string;
  assignee: string;
  status: '进行中' | '未开始' | '已完成';
  priority: 'high' | 'medium' | 'low';
  deadline: string;
  progress: number;
}

export interface VendorDataTask {
  id: string;
  vendor: string;
  product: string;
  status: '已提交' | '待提交' | '逾期';
  deadline: string;
  submittedAt: string | null;
  dataQuality: string;
}

export interface CarbonReductionTask {
  id: string;
  title: string;
  name: string;
  description: string;
  category: string;
  target: string;
  responsible: string;
  status: '进行中' | '未开始' | '规划中' | '已完成';
  deadline: string;
  progress: number;
  potentialReduction: number;
  cost: number;
  priority: 'high' | 'medium' | 'low';
  assignee: string;
  difficulty: '高' | '中' | '低';
  timeline: string;
  investment: number;
}

export interface CarbonTrendData {
  months: string[];
  values: number[];
  industryAvg: number[];
  leadingAvg: number[];
  ourCompany: number[];
} 