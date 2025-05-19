import { supabase } from '~/lib/supabase';
import type { Node } from 'reactflow';
import type { NodeData } from '~/types/nodes';

/**
 * 拉取指定 workflowId 和 userId 的所有 workflow_nodes，映射为 React Flow 节点结构
 */
export async function fetchWorkflowNodes(workflowId: string, userId: string): Promise<Node<NodeData>[]> {
  const { data, error } = await supabase
    .from('workflow_nodes')
    .select('*')
    .eq('workflow_id', workflowId);

  if (error) throw new Error(error.message);

  return (data || []).map((row: any) => ({
    id: row.id,
    type: row.node_type,
    position: { x: row.position_x ?? 0, y: row.position_y ?? 0 },
    data: {
      ...row,
      id: row.id,
      nodeId: row.id,
      workflowId: row.workflow_id,
      positionX: row.position_x,
      positionY: row.position_y,
      nodeType: row.node_type,
      lifecycleStage: row.lifecycle_stage,
      emissionType: row.emission_type,
      activitydataSource: row.activity_data_source,
      activityScore: row.activity_score,
      activityScorelevel: row.activity_scorelevel,
      verificationStatus: row.verification_status,
      supplementaryInfo: row.supplementary_info,
      hasEvidenceFiles: row.has_evidence_files,
      evidenceVerificationStatus: row.evidence_verification_status,
      dataRisk: row.data_risk,
      backgroundDataSourceTab: row.background_data_source_tab,
      carbonFootprint: row.carbon_footprint,
      quantity: row.quantity,
      activityUnit: row.activity_unit,
      carbonFactor: row.carbon_factor,
      carbonFactorName: row.carbon_factor_name,
      carbonFactorUnit: row.carbon_factor_unit,
      unitConversion: row.unit_conversion,
      carbonFactordataSource: row.carbon_factor_data_source,
      emissionFactorGeographicalRepresentativeness: row.emission_factor_geographical_representativeness,
      emissionFactorTemporalRepresentativeness: row.emission_factor_temporal_representativeness,
      activityUUID: row.activity_uuid,
      carbonfactorImportDate: row.carbon_factor_import_date,
      factorMatchStatus: row.factor_match_status,
      activityData_aiGenerated: row.activity_data_ai_generated,
      activityUnit_aiGenerated: row.activity_unit_ai_generated,
      conversionFactor_aiGenerated: row.conversion_factor_ai_generated,
      // 证据文件、产品、供应商等可按需补充
      // 其他字段可根据 NodeData 类型继续补全
    },
  }));
} 