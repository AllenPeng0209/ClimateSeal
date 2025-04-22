import type { Change } from 'diff';

export type ActionType = 'file' | 'shell' | 'start' | 'supabase' | 'carbonflow' | 'llm' | 'datasheet' | 'settings';

export interface BaseAction {
  type: 'llm' | 'carbonflow' | 'datasheet' | 'settings';
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

export interface LlmAction extends BaseAction {
  type: 'llm';
  operation: 'analyze' | 'summarize' | 'recommend';
}

export interface CarbonFlowAction extends BaseAction {
  type: 'carbonflow';
  operation: 'add' | 'update' | 'delete' | 'query' | 'connect' | 'layout' | 'calculate';
  nodeType?: string;
  nodeId?: string;
  source?: string;
  target?: string;
  position?: string;
  layoutType?: string;
}

export interface DatasheetAction extends BaseAction {
  type: 'datasheet';
  operation: string;
  filePath?: string;
}

export interface SettingsAction extends BaseAction {
  type: 'settings';
  operation: string;
}

export type BoltAction = FileAction | ShellAction | StartAction | BuildAction | SupabaseAction | CarbonFlowAction | LlmAction | DatasheetAction | SettingsAction;

export type BoltActionData = BoltAction | BaseAction;

export interface ActionAlert {
  type: string;
  title: string;
  description: string;
  content: string;
  source?: 'terminal' | 'preview'; // Add source to differentiate between terminal and preview errors
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

  // Novo campo para rastrear a origem das mudanças
  changeSource?: 'user' | 'auto-save' | 'external';
}
