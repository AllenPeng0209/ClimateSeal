/**
 * 应用配置文件
 */

// API配置
export const API_CONFIG = {
  // 碳因子匹配API地址
  CARBON_FACTOR_API: process.env.VITE_CARBON_FACTOR_API || 'http://localhost:9000',
  
  // API超时时间 (毫秒)
  API_TIMEOUT: 10000,
};

// 碳因子匹配相关配置
export const CARBON_FACTOR_CONFIG = {
  // 默认碳因子值 (当匹配失败时使用)
  DEFAULT_CARBON_FACTOR: 1.0,
  
  // 默认单位
  DEFAULT_UNIT: 'kg',
  
  // 最小匹配分数 (低于此分数的匹配将被忽略)
  MIN_MATCH_SCORE: 0.3,
  
  // 匹配结果数量
  TOP_K: 3,
};

// 应用设置
export const APP_CONFIG = {
  // 调试模式
  DEBUG: process.env.NODE_ENV === 'development',
}; 