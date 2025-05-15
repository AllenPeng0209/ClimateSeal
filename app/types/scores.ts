/**
 * app/types/scores.ts
 */

// Define a type for individual scores (0-1 range) based on AISummary logic
export type AIScoreType = {
  score: number; // Score between 0 and 1
};

// Update ModelScoreType to use AIScoreType for sub-scores and store overall score (0-1)
export type ModelScoreType = {
  workflowId?: string; // 工作流ID
  evaulationtype?: string; // 评估类型
  relatelawId?: string; // 法律ID
  credibilityScore?: number; // Overall score (assume 0-1 from calculation)
  completeness?: AIScoreType;
  traceability?: AIScoreType;
  massBalance?: AIScoreType;
  validation?: AIScoreType; // Maps to "数据准确性"
}; 