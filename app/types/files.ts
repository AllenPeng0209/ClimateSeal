/**
 * app/types/files.ts
 */
import type { UploadFile } from 'antd/es/upload/interface';

export interface FileRecord {
  id: string;
  workflow_id: string;
  name: string;
  path: string;
  type: string;
  size: number;
  mime_type: string;
  created_at: string;
}

export interface WorkflowFileRecord {
  file_id: string;
  files: FileRecord; // Assuming files is a single object, not an array. If it's an array, this needs to be FileRecord[]
}

// New type for Uploaded Files
export type UploadedFile = {
  id: string;
  name: string;
  type: string; // e.g., '报告', '原始数据', '认证证书'
  uploadTime: string;
  url?: string; // Optional URL for preview/download
  status: 'pending' | 'parsing' | 'completed' | 'failed'; // Added status field based on PRD
  size?: number;
  mimeType?: string;
  content?: string; // 添加content字段用于缓存文件内容
};

// New type for Parsed Emission Sources in the Parse File Modal
export type ParsedEmissionSource = {
  id: string; // Unique ID for this parsed item
  key: React.Key; // For table selection
  index: number; // For display order
  lifecycleStage: string;
  name: string;
  category: string;
  supplementaryInfo?: string;
  activityData?: number;
  activityUnit?: string;
  dataStatus: '未生效' | '已生效' | '已删除'; // Key new field from PRD
  sourceFileId: string; // Link back to the UploadedFile
};

// Extend antd's UploadFile type to include our custom selectedType
export type ModalUploadFile = UploadFile & {
  selectedType?: string;
}; 