import React from 'react';
import DashboardSection from '~/components/dashboard/sections/DashboardSection';
import type { Product, WorkflowTask, VendorDataTask, CarbonReductionTask, CarbonTrendData } from '~/types';

export default function DashboardIndex() {
  // 模拟数据
  const products: Product[] = [
    {
      id: '1',
      name: '产品A',
      category: '电子产品',
      carbonFootprint: 42.5,
      unit: 'kgCO2e',
      reductionTarget: 30,
      progress: 65,
    },
    {
      id: '2',
      name: '产品B',
      category: '电子产品',
      carbonFootprint: 38.2,
      unit: 'kgCO2e',
      reductionTarget: 25,
      progress: 45,
    },
  ];

  const workflowTasks: WorkflowTask[] = [
    {
      id: '1',
      title: '碳排放数据审核',
      name: '碳排放数据审核',
      workflow: '数据审核流程',
      assignee: '张三',
      status: '进行中',
      priority: 'high',
      deadline: '2024-02-28',
      progress: 75,
    },
    {
      id: '2',
      title: '供应商数据收集',
      name: '供应商数据收集',
      workflow: '数据收集流程',
      assignee: '李四',
      status: '未开始',
      priority: 'medium',
      deadline: '2024-03-15',
      progress: 0,
    },
  ];

  const vendorDataTasks: VendorDataTask[] = [
    {
      id: '1',
      vendor: '供应商A',
      product: '原材料X',
      status: '已提交',
      deadline: '2024-02-20',
      submittedAt: '2024-02-18',
      dataQuality: '良好',
    },
    {
      id: '2',
      vendor: '供应商B',
      product: '原材料Y',
      status: '待提交',
      deadline: '2024-02-25',
      submittedAt: null,
      dataQuality: '待评估',
    },
  ];

  const carbonReductionTasks: CarbonReductionTask[] = [
    {
      id: '1',
      title: '能源使用优化',
      name: '能源使用优化',
      description: '通过优化能源使用方式，提高能源利用效率',
      category: '能源管理',
      target: '降低20%',
      responsible: '生产部',
      status: '进行中',
      deadline: '2024-06-30',
      progress: 45,
      potentialReduction: 15,
      cost: 50000,
      priority: 'high',
      assignee: '王五',
      difficulty: '中',
      timeline: '6个月',
      investment: 100000,
    },
    {
      id: '2',
      title: '工艺改进',
      name: '工艺改进',
      description: '改进生产工艺，减少碳排放',
      category: '工艺优化',
      target: '降低15%',
      responsible: '技术部',
      status: '规划中',
      deadline: '2024-08-31',
      progress: 0,
      potentialReduction: 10,
      cost: 80000,
      priority: 'medium',
      assignee: '赵六',
      difficulty: '高',
      timeline: '8个月',
      investment: 150000,
    },
  ];

  const carbonTrendData: CarbonTrendData = {
    months: ['1月', '2月', '3月', '4月', '5月', '6月'],
    values: [42.5, 41.8, 40.2, 39.5, 38.8, 38.2],
    industryAvg: [45.2, 44.8, 44.5, 44.2, 43.8, 43.5],
    leadingAvg: [35.8, 35.5, 35.2, 34.8, 34.5, 34.2],
    ourCompany: [42.5, 41.8, 40.2, 39.5, 38.8, 38.2],
  };

  return (
    <DashboardSection
      products={products}
      workflowTasks={workflowTasks}
      vendorDataTasks={vendorDataTasks}
      carbonReductionTasks={carbonReductionTasks}
      carbonTrendData={carbonTrendData}
    />
  );
} 