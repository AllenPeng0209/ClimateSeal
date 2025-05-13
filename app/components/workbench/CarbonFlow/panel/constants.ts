/**
 * 本地存储键名
 */
export const KEY_CARBON_PANEL_COLLAPSE = 'carbon-panel-collapse';

/**
 * 表格默认分页设置
 */
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE_SIZES = [10, 20, 50, 100];

/**
 * 数据质量选项
 */
export const DATA_QUALITY_OPTIONS = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
];

/**
 * 状态选项
 */
export const STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '已提交' },
  { value: 'approved', label: '已批准' },
  { value: 'rejected', label: '已拒绝' },
];

/**
 * 单位选项
 */
export const UNIT_OPTIONS = [
  { value: 'kg', label: 'kg' },
  { value: 'ton', label: 'ton' },
  { value: 'g', label: 'g' },
];

/**
 * 排放源选项
 */
export const EMISSION_SOURCE_OPTIONS = [
  { value: 'energy', label: '能源' },
  { value: 'transport', label: '运输' },
  { value: 'material', label: '材料' },
  { value: 'waste', label: '废弃物' },
  { value: 'other', label: '其他' },
];

// 后续可添加更多常量定义 