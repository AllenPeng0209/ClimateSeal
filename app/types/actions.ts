import type { Change } from 'diff';

// import type { NodeData } from './nodes'; // Removed unused import

export type ActionType =
  | 'file'
  | 'shell'
  | 'start'
  | 'supabase'
  | 'carbonflow'
  | 'llm'
  | 'datasheet'
  | 'settings'
  | 'build';

export interface BaseAction {
  type: ActionType;
  content: string;
  description?: string;
  traceId?: string;
}

export interface FileAction extends BaseAction {
  type: 'file';
  filePath: string;
}

export interface ShellAction extends BaseAction {
  type: 'shell';
}

export interface StartAction extends BaseAction {
  type: 'start';
}

export interface BuildAction extends BaseAction {
  type: 'build';
}

export interface SupabaseAction extends BaseAction {
  type: 'supabase';
  operation: 'migration' | 'query';
  filePath?: string;
  projectId?: string;
}

export interface CarbonFlowAction extends BaseAction {
  type: 'carbonflow';
  operation:
  | 'plan'
  | 'scene'
  | 'create'
  | 'update'
  | 'delete'
  | 'query'
  | 'connect'
  | 'layout'
  | 'calculate'
  | 'file_parser'
  | 'carbon_factor_match'
  | 'generate_supplier_task'
  | 'ai_autofill'
  | 'generate_data_validation_task'
  | 'report'
  workflowid: string;
  filePath?: string;
}

export type BoltAction = FileAction | ShellAction | StartAction | BuildAction | SupabaseAction | CarbonFlowAction;

export type BoltActionData = BoltAction | BaseAction;

export interface ActionAlert {
  type: string;
  title: string;
  description: string;
  content: string;
  source?: 'terminal' | 'preview';
}

export interface SupabaseAlert {
  type: string;
  title: string;
  description: string;
  content: string;
  source?: 'supabase';
}

export interface FileHistory {
  originalContent: string;
  lastModified: number;
  changes: Change[];
  versions: {
    timestamp: number;
    content: string;
  }[];
  changeSource?: 'user' | 'auto-save' | 'external';
}
