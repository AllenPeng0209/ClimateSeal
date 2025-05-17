import { type Enterprise } from './enterprises';

/**
 * app/types/users.ts
 * Defines the type for user information.
 */

export type User = {
  id: string; // 用户ID，主键
  username?: string; // 用户名 (用于登录)
  email: string; // 邮箱 (用于登录或通知)
  fullName?: string; // 用户全名 (可选)
  avatarUrl?: string; // 用户头像URL (可选)
  role?: string; // 用户角色 (例如："admin", "editor", "viewer", "enterprise_user")
  company?: string; // 公司 (可选)
  enterpriseId?: string; // 关联的企业ID (如果用户属于特定企业)
  department?: string; // 所属部门 (可选)
  jobTitle?: string; // 职位 (可选)
  isActive?: boolean; // 账户是否激活
  isSuperuser?: boolean; // 是否为超级用户 (可选)
  isEmailVerified?: boolean; // 邮箱是否已验证 (可选)
  lastLoginAt?: Date | string; // 上次登录时间 (可选)
  failedLoginAttempts?: number; // 登录失败次数 (可选)
  accountLockedUntil?: Date | string; // 账户锁定截止时间 (可选)
  createdAt?: Date | string; // 创建时间
  updatedAt?: Date | string; // 更新时间

  // Relationships
  enterprise?: Enterprise | null;
}; 