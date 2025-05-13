/**
 * 从本地存储获取数据
 * @param key 存储键名
 * @param defaultValue 默认值
 * @returns 存储的值或默认值
 */
export const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (error) {
    console.error('从本地存储获取数据失败:', error);
    return defaultValue;
  }
};

/**
 * 设置数据到本地存储
 * @param key 存储键名
 * @param value 要存储的值
 */
export const setLocalStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('设置数据到本地存储失败:', error);
  }
};

/**
 * 格式化日期
 * @param dateString 日期字符串
 * @returns 格式化后的日期字符串
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 筛选表格数据
 * @param data 原始数据
 * @param searchText 搜索文本
 * @param dataIndex 索引字段
 * @returns 筛选后的数据
 */
export const filterTableData = <T extends Record<string, any>>(
  data: T[],
  searchText: string,
  dataIndex: string,
): T[] => {
  if (!searchText) {
    return data;
  }
  
  return data.filter(record => {
    const value = record[dataIndex]?.toString().toLowerCase();
    return value?.includes(searchText.toLowerCase());
  });
};

// 后续可添加更多工具函数 