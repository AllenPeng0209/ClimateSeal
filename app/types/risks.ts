/**
 * app/types/risks.ts
 * Defines types related to AI Risk Assessment results within a workflow.
 */

export type AIRiskCategory =
  | 'Data Quality'
  | 'Model Completeness'
  | 'Parameter Uncertainty'
  | 'Compliance'
  | 'Security'
  | 'Operational'
  | string; // For other custom categories

export type AIRiskSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type AIRiskLikelihood = 'Low' | 'Medium' | 'High';
export type AIRiskMitigationStatus =
  | 'Identified'
  | 'Action Pending'
  | 'In Progress'
  | 'Mitigated'
  | 'Accepted'
  | 'Rejected';

export interface AIRiskItem {
  riskId: string; // Unique identifier for the risk (e.g., UUID)
  workflowId: string; // Associated workflow ID
  riskTitle: string; // A short, descriptive title for the risk
  riskDescription: string; // Detailed explanation of the risk, its causes, and potential impacts
  riskCategory?: AIRiskCategory; // Category of the risk
  affectedEntities?: Array<{ type: string; id: string; name?: string }>; // e.g., [{type: 'node', id: 'node123', name: 'Emission Source X'}, {type: 'global', id: 'lifecycle_stage_completeness'}]
  severity?: AIRiskSeverity; // How impactful the risk could be
  likelihood?: AIRiskLikelihood; // How likely the risk is to occur
  overallRiskLevel?: string; // Calculated or manually set (e.g., 'Low', 'Moderate', 'Significant', 'Severe') - could also be a numeric score
  mitigationSuggestions?: string; // AI or user-provided suggestions to address the risk
  mitigationStatus?: AIRiskMitigationStatus; // Current status of addressing the risk
  identifiedAt: string; // ISO Timestamp when the risk was first identified
  lastAssessedAt?: string; // ISO Timestamp when the risk was last reviewed or updated
  assessedBy?: string; // Identifier for who or what assessed/updated the risk (e.g., 'AI System', 'userId')
  relatedActionLogIds?: string[]; // Optional: Link to WorkflowActionLog entries related to this risk
  notes?: string; // Additional comments or context
} 