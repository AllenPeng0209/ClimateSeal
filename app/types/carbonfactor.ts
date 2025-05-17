/**
 * app/types/carbonfactor.ts
 * Defines the type for carbon emission factors.
 */

export interface CarbonFactor {
  emission_factor_id: string;            // 排放因子ID，主键
  database_id?: string;                   // 关联的数据库ID (外键)
  name: string;                          // 排放因子名称
  uuid?: string;                          // 排放因子UUID (如果与emission_factor_id不同)
  value: number;                         // 数值
  geo_representative?: string;            // 地理代表性
  time_representative?: string;           // 时间代表性
  numerator_unit: string;                // 排放因子分子单位
  denominator_unit: string;              // 排放因子分母单位
  source?: string;                        // 排放因子来源
  category?: string;                      // 排放因子类别
  evaluation_method?: string;             // 评价方法
  evaluation_metric?: string;             // 评价指标
  geometric_standard_deviation?: number;  // 几何标准差
  version?: string;                       // 版本
  updated_at?: Date | string;             // 更新时间
  updated_by?: string;                    // 更新人
  created_at?: Date | string;             // 创建时间
  // Consider adding other fields if they are part of the database schema but not listed explicitly as columns:
  // e.g. description?: string;
  // e.g. unit?: string; // This might be derived or a combination of numerator/denominator
}


