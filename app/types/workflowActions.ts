/**
 * app/types/workflowActions.ts
 * Defines types related to the Workflow_Actions table, which logs actions,
 * events, and AI interactions within a workflow.
 */

// Suggested statuses for workflow actions
export type WorkflowActionStatus =
  | 'INITIATED'          // Action has been triggered but not yet started processing
  | 'PROCESSING'         // Action is currently being processed
  | 'COMPLETED_SUCCESS'  // Action finished successfully
  | 'COMPLETED_FAILED'   // Action finished with errors
  | 'PENDING_USER_INPUT' // Action is waiting for user input to proceed
  | 'CANCELLED';         // Action was cancelled

// Suggested types for workflow actions to categorize them
export type WorkflowActionType =
  | 'USER_SETTINGS_SAVE'               // User saved scene/scope settings
  | 'USER_NODE_CREATE'                 // User created a new node
  | 'USER_NODE_UPDATE'                 // User updated an existing node
  | 'USER_NODE_DELETE'                 // User deleted a node
  | 'USER_FILE_UPLOAD_GENERAL'         // User uploaded files through the general upload modal
  | 'USER_EVIDENCE_FILE_UPLOAD'        // User uploaded an evidence file for a specific node
  | 'USER_FILE_DELETE'                 // User deleted a file
  | 'AI_FILE_PARSE_INITIATED'          // AI file parsing process started by the system or user
  | 'AI_FILE_PARSE_RESULT'             // Result of AI file parsing (can be success or fail, details in results_summary)
  | 'AI_CARBON_FACTOR_MATCH_INITIATED' // AI carbon factor matching started
  | 'AI_CARBON_FACTOR_MATCH_RESULT'    // Result of AI carbon factor matching
  | 'AI_DATA_AUTOFILL_INITIATED'       // AI data autofill process started
  | 'AI_DATA_AUTOFILL_RESULT'          // Result of AI data autofill
  | 'AI_SUPPLIER_DATA_REQUEST_INITIATED' // AI initiated a data request to a supplier
  | 'AI_SUPPLIER_DATA_REQUEST_SENT'      // AI successfully sent the data request
  | 'AI_SUPPLIER_RESPONSE_RECEIVED'    // A response was received from the supplier
  | 'AI_SUPPLIER_DATA_INTEGRATED'      // Supplier data was successfully integrated
  | 'AI_SUPPLIER_DATA_REQUEST_FAILED'    // AI failed to send request or supplier interaction failed
  | 'AI_RISK_ASSESSMENT_INITIATED'     // AI risk assessment process started
  | 'AI_RISK_ASSESSMENT_COMPLETED'     // AI risk assessment process finished (results may be in summary)
  | 'AI_RISK_IDENTIFIED'               // A specific risk was identified by AI
  | 'AI_RISK_UPDATED'                  // A specific risk was updated (e.g., status, mitigation)
  | 'SYSTEM_SCORE_CALCULATION'         // System calculated model scores
  | 'USER_CHAT_MESSAGE'                // User sent a message in an AI chat interface
  | 'AI_CHAT_RESPONSE'                 // AI responded in a chat interface
  | 'WORKFLOW_LOADED'                  // Workflow data was loaded into the panel
  | 'WORKFLOW_SAVED_MANUAL'            // User manually saved the entire workflow
  | 'WORKFLOW_AUTOSAVED'               // Workflow was auto-saved
  | string;                            // Allows for other custom string types

export interface WorkflowActionLog {
  action_id: string;                   // Primary Key, UUID
  workflow_id: string;                 // Foreign Key to Workflows.workflow_id
  action_type?: WorkflowActionType;    // Category of the action
  operation_name?: string;              // Specific operation, e.g., 'file_parser', 'carbon_factor_match', 'save_scene_info'
  triggered_by_node_ids?: string[];    // Optional: Array of Node UUIDs this action pertains to
  parameters?: Record<string, any>;    // JSONB: Input parameters for the action (avoid storing very large data here)
  status?: WorkflowActionStatus | string; // Action status
  results_summary?: Record<string, any>; // JSONB: Structured summary of results (e.g., { success: [], failed: [], messages: [] })
  detailed_logs?: string;              // TEXT: More detailed textual logs, if applicable
  user_prompt?: string;                // TEXT: User input for AI interactions
  ai_response_summary?: string;        // TEXT: AI's main textual response summary
  started_at: string;                  // Timestamp of when the action started (ISO date string)
  completed_at?: string;               // Optional: Timestamp of when the action completed (ISO date string)
} 