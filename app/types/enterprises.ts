/**
 * app/types/enterprises.ts
 * Defines the type for enterprise information.
 */
import type { Country } from './countries';
import type { Industry } from './industries';

export type Enterprise = {
  enterpriseId: string;            // 企业ID，主键
  name: string;                     // 企业名称
  legalName?: string;              // 企业法定全称 (可选)
  registrationNumber?: string;     // 统一社会信用代码或注册号 (可选)
  industryId?: string;             // 关联的行业ID (FK)
  industry?: Industry | null;      // Embedded Industry object
  addressLine1?: string;           // 地址行1
  addressLine2?: string;           // 地址行2 (可选)
  city?: string;                    // 所在城市
  provinceState?: string;          // 省份/州
  postalCode?: string;             // 邮政编码
  country: Country;                 // 国家对象, assumed non-nullable
  contactPersonName?: string;     // 主要联系人姓名 (可选)
  contactPersonEmail?: string;    // 主要联系人邮箱 (可选)
  contactPersonPhone?: string;    // 主要联系人电话 (可选)
  website?: string;                 // 企业网址 (可选)
  description?: string;             // 企业简介 (可选)
  scale?: string;                   // 企业规模 (例如："大型", "中型", "小型", "微型")
  ownershipType?: string;          // 所有制类型 (例如："国有企业", "民营企业", "外商投资企业")
  establishedDate?: Date | string; // 成立日期 (可选)
  carbonEmissionTarget?: string;  // 碳排放目标描述 (可选)
  reportingScope?: string;         // 报告范围 (例如："法人边界", "运营控制边界")
  parentCompanyId?: string;       // 母公司ID (如果适用，可选)
  entityType?: string;             // 实体类型
  enterpriseStatus?: string;       // 企业状态
  createdAt?: Date | string;       // 创建时间
  updatedAt?: Date | string;       // 更新时间
}; 