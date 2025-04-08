export type WorkflowStatus = 'active' | 'pending' | 'completed' | 'failed';
export type WorkflowType = 'assessment' | 'collection' | 'report';

export interface Workflow {
  id: string;
  name: string;
  status: WorkflowStatus;
  industry: string;
  type: WorkflowType;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  carbonFootprint: number;
  unit: string;
}

export interface VendorTask {
  id: string;
  name: string;
  status: 'pending' | 'completed' | 'failed';
  dueDate: string;
  assignedTo: string;
}

export interface WorkflowTask {
  id: string;
  name: string;
  status: WorkflowStatus;
  progress: number;
  dueDate: string;
}

export interface CarbonReductionTask {
  id: string;
  name: string;
  targetReduction: number;
  currentReduction: number;
  unit: string;
  deadline: string;
}

export interface CarbonTrendPoint {
  date: string;
  value: number;
  unit: string;
}

export interface DashboardData {
  workflows: Workflow[];
  products: Product[];
  vendorTasks: VendorTask[];
  workflowTasks: WorkflowTask[];
  carbonReductionTasks: CarbonReductionTask[];
  carbonTrendData: CarbonTrendPoint[];
} 