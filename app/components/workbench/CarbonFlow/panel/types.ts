import type { Node, Edge } from 'reactflow';
import type { NodeData, ProductNodeData, FinalProductNodeData } from '~/types/nodes';
import type { TableProps, ColumnType } from 'antd/es/table';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import type { CarbonFlowAction } from '~/types/actions';

/**
 * 面板组件的属性接口
 */
export interface PanelProps {
  // 可以添加特定属性
}

/**
 * 数据项接口
 */
export interface DataItem {
  key: string;
  id: string;
  name: string;
  emissionSource: string;
  dataQuality: string;
  carbonFootprint: number | string;
  unit: string;
  status: string;
}

/**
 * 表格列搜索属性接口
 */
export interface ColumnSearchProps {
  dataIndex: string;
  filterText?: string;
  setFilterText?: (text: string) => void;
}

/**
 * 场景信息类型
 */
export interface ScenarioInfo {
  id: string;
  name: string;
  desc: string;
  updatedAt: string;
  createdAt: string;
}

/**
 * 表单值接口
 */
export interface FormValues {
  name: string;
  emissionSource: string;
  dataQuality: string;
  carbonFootprint: number | string;
  unit: string;
  status: string;
}

// 后续可添加更多类型定义 