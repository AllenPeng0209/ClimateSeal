import type { Node, Edge } from 'reactflow';
import type { Message } from 'ai';
// Note: Adjust this import path if AISummary or NodeData are defined elsewhere
// It might be better to define simplified versions here if the CarbonFlow ones are too complex or cause circular dependencies
import type { AISummary, NodeData } from '~/components/workbench/CarbonFlow';

/**
 * Represents the metadata associated with a checkpoint.
 * Typically stored in localStorage or a database metadata column.
 */
export interface CheckpointMetadata {
  name: string; // Unique identifier for the checkpoint
  timestamp: number; // Unix timestamp (ms) of when the checkpoint was created
  description?: string; // Optional user-provided description
  tags?: string[]; // Optional tags for categorization
  version?: string; // Optional version identifier (e.g., '1.0', 'auto-save')
}

/**
 * Represents the core data payload of a checkpoint.
 * This is the bulk of the state saved, often stored in IndexedDB or a database JSONB column.
 */
export interface CheckpointData {
  nodes: Node<NodeData>[];
  edges: Edge[];
  aiSummary: AISummary | null; // The AI summary state, allowing for null if not generated
  settings: { // User-specific settings at the time of save
    theme?: string;
    language?: string;
    notifications?: boolean;
    eventLogs?: boolean;
    timezone?: string;
    contextOptimization?: boolean;
    autoSelectTemplate?: boolean;
  };
  chatHistory?: Message[]; // The chat history messages
}

/**
 * Represents the complete checkpoint structure, often used for import/export operations.
 * Combines metadata and data into a single object.
 */
export interface CarbonFlowCheckpoint {
  name: string;
  timestamp: number;
  data: CheckpointData;
  // Embeds metadata fields directly, excluding redundant name/timestamp
  metadata: Omit<CheckpointMetadata, 'name' | 'timestamp'>;
} 