import type { Node, Edge } from 'reactflow';
import type { NodeData } from './nodes';
import type { SceneInfoType } from './scene';
import type { UploadedFile } from './files';
import type { Comment } from './comments';
import type { WorkflowActionLog } from './workflowActions';
import type { AIRiskItem } from './risks'; // Import the new AIRiskItem type
import type { ProductFootprintReportData } from './productFootprintReport'; // Import the new report type
import type { Product } from './products'; // Import the new products type
import type { User } from './users'; // Import the new products type
import type { ConversationThread } from './conversations'; // Import the new ConversationThread type
import type { KnowledgeUnit } from './knowledgeUnit'; // ADDED: Import for the new unified knowledge type
import type { AISummaryReport } from './aiSummary'; // Import the new AISummaryReport type
/*
 * The WorkflowActionLog type from './workflowActions.ts' is now used for the actionLogs field.
 * This provides a detailed structure for logging actions, consistent with database schema.
 */

export interface Workflow {
  workflowId: string;

  // 用户信息
  user?: User; // 创建者或主要负责人 (owner)
  collaborators?: User[]; // 新增：共享编辑此工作流的协作者列表
  // 产品信息
  productId?: Product; // 产品ID
  // 知识索引信息
  knowledgeUnits?: KnowledgeUnit[]; // ADDED: 统一的知识单元列表
  // 工作流信息
  name?: string; // 工作流名稱
  description?: string; // 用户对工作流的详细描述
  status?: string; // 例如: 'draft', 'in-progress', 'completed', 'archived'
  isPublic?: boolean; // ADDED: Corresponds to DB is_public
  sceneInfo: SceneInfoType;
  nodes: Node<NodeData>[];
  edges: Edge[];
  aiSummary?: AISummaryReport; // 新增字段：用于存储AI的当前todo总表
  uploadedFiles?: UploadedFile[]; // 如果有不直接关联到节点的全局文件列表
  productCarbonFootprintReport?: ProductFootprintReportData; // New field for the PCF report
  editorState?: any; // 保存编辑器UI状态，例如缩放、视图位置等
  lastModifiedBy?: string; // 多人协作：最后修改者ID
  comments?: Comment[]; // 多人协作：评论
  createdAt: string; // ISO 格式日期字符串
  updatedAt: string; // ISO 格式日期字符串
  // AI顾问相关
  actionLogs?: WorkflowActionLog[]; // Changed to WorkflowActionLog[]
  conversationHistory?: ConversationThread[]; // Changed to use an array of ConversationThread
  aiTodoSummary?: string; // 新增字段：用于存储AI的当前todo总表
  aiRiskAssessmentResults?: AIRiskItem[]; // New field for AI risk assessment results
  selectedNodeId?: string | null; // Optional: ID of the currently selected node in the UI
}
