/**
 * app/types/databases.ts
 * Defines the type for database records, typically used for emission factor databases.
 */

export interface CarbonFactorDatabase {
  database_id: string;          // 数据库ID，主键
  database_name: string;        // 数据库名称
  database_version?: string;    // 数据库版本
  updated_at?: Date | string;   // 更新时间
  updated_by?: string;          // 更新人
  created_at?: Date | string;   // 创建时间
}