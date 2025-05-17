export type Product = {
  id: string;          // 产品ID, 主键
  name: string;        // 产品名称
  specification?: string; // 产品规格
  description?: string;   // 产品描述
  imageUrl?: string;       // 产品图片
  primaryWorkflowId?: string | null; // 新增：关联的主要工作流ID
  updatedAt?: Date | string;     // 更新时间
  updatedBy?: string;          // 更新人
  createdAt?: Date | string;     // 创建时间
};

