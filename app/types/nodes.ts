import type { Node } from 'reactflow';
// 新增因子表 
import type { CarbonFactor } from './carbonfactor';
import type { EvidenceFile } from './evidenceFiles'; // Import the new EvidenceFile type
import type { Product } from './products'; // Import Product type
import type { Enterprise } from './enterprises'; // Import Enterprise type



// 基础节点数据接口
export interface BaseNodeData {
  id: string; // PK, from DB
  workflowId: string; // FK to workflows.id
  nodeId: string; // React Flow node ID, unique within a workflow
  positionX?: number | null;
  positionY?: number | null;
  
  // activity
  label: string;
  nodeName: string; // Often used as a more technical or internal name
  nodeType?: string; // e.g., 'product', 'manufacturing'. Represents the specific inherited type.

  // 活动
  lifecycleStage: string;
  emissionType: string; // Category of emission, e.g., '原材料', '能耗'
  activitydataSource: string;
  activityScore: number;
  activityScorelevel?: string;
  verificationStatus?: string; // General verification status
  supplementaryInfo?: string;
  hasEvidenceFiles?: boolean;
  evidenceVerificationStatus?: '待解析' | '解析中' | '已验证' | '验证失败' | '无需验证'; // Specific to evidence files
  dataRisk?: string;
  backgroundDataSourceTab?: 'database' | 'manual';

  // carbon footprint
  carbonFootprint: string; // Calculated carbon footprint value as string
  quantity: string; // Activity data quantity as string
  activityUnit?: string;
  CarbonFactorSource?: CarbonFactor;
  carbonFactor: string; // Carbon factor value as string
  carbonFactorName?: string;
  carbonFactorUnit?: string;
  unitConversion?: string; // Conversion factor as string
  carbonFactordataSource?: string;
  emissionFactorGeographicalRepresentativeness?: string;
  emissionFactorTemporalRepresentativeness?: string;
  activityUUID?: string;
  carbonfactorImportDate?: string;
  factorMatchStatus?: '未配置因子' | 'AI匹配失败' | 'AI匹配成功' | '已手动配置因子';
  activityData_aiGenerated?: boolean;
  activityUnit_aiGenerated?: boolean;
  conversionFactor_aiGenerated?: boolean;
  // evidence and metadata
  evidenceFiles?: EvidenceFile[]; // Use the imported EvidenceFile type


  updated_at?: string;
  updated_by?: string;
  created_at?: string;
  created_by?: string;

}

// 产品节点数据
export interface ProductNodeData extends BaseNodeData {
  nodeType: 'product'; // Literal type
  productId: string; // 关联的 products.id (设为必需)
  product?: Product | null; // (可选) 关联的产品对象 (用于前端)

  material?: string;
  weight_per_unit?: string;
  isRecycled?: boolean;
  recycledContent?: string;
  recycledContentPercentage?: number;
  sourcingRegion?: string;
  SourceLocation?: string;
  Destination?: string;
  
  // 供应商信息 (可以保留现有字段，并添加结构化关联)
  SupplierName?: string;
  SupplierAddress?: string;
  supplierEnterpriseId?: string; // (可选) 关联的 enterprises.enterprise_id (作为供应商)
  supplierEnterprise?: Enterprise | null; // (可选) 关联的供应商企业对象

  ProcessingPlantAddress?: string;
  RefrigeratedTransport?: boolean;
  weight?: number;
  certaintyPercentage?: number;
}

// 制造节点数据
export interface ManufacturingNodeData extends BaseNodeData {
  nodeType: 'manufacturing'; // Literal type
  ElectricityAccountingMethod: string;
  ElectricityAllocationMethod: string;
  EnergyConsumptionMethodology: string;
  EnergyConsumptionAllocationMethod: string;
  chemicalsMaterial: string;
  MaterialAllocationMethod: string;
  WaterUseMethodology: string;
  WaterAllocationMethod: string;
  packagingMaterial: string;
  direct_emission: string;
  WasteGasTreatment: string;
  WasteDisposalMethod: string;
  WastewaterTreatment: string;
  productionMethod?: string;
  productionMethodDataSource?: string;
  productionMethodVerificationStatus?: string;
  productionMethodApplicableStandard?: string;
  productionMethodCompletionStatus?: string;
  energyConsumption: number;
  energyType: string;
  processEfficiency: number;
  wasteGeneration: number;
  waterConsumption: number;
  recycledMaterialPercentage: number;
  productionCapacity: number;
  machineUtilization: number;
  qualityDefectRate: number;
  processTechnology: string;
  manufacturingStandard: string;
  automationLevel: string;
  manufacturingLocation: string;
  byproducts: string;
  emissionControlMeasures: string;
}

// 分销节点数据
export interface DistributionNodeData extends BaseNodeData {
  nodeType: 'distribution'; // Literal type
  transportationMode: string;
  transportationDistance: number;
  // startPoint and endPoint are inherited from BaseNodeData if made common
  vehicleType: string;
  fuelType: string;
  fuelEfficiency: number;
  loadFactor: number;
  refrigeration: boolean;
  packagingMaterial: string;
  packagingWeight: number;
  warehouseEnergy: number;
  storageTime: number;
  storageConditions: string;
  distributionNetwork: string;
  aiRecommendation?: string;
  returnLogistics?: boolean;
  packagingRecyclability?: number;
  lastMileDelivery?: string;
  distributionMode?: string; // Potentially redundant with transportationMode if used for same purpose
  distributionDistance?: number; // Potentially redundant with transportationDistance
  distributionDistanceUnit?: string; // Note: carbonpanel uses number for unit, check consistency. Original was number.
  distributionTransportationMode?: string; // Potentially redundant
  distributionTransportationDistance?: number; // Potentially redundant
}

// 使用节点数据
export interface UsageNodeData extends BaseNodeData {
  nodeType: 'usage'; // Literal type
  lifespan: number;
  energyConsumptionPerUse: number;
  waterConsumptionPerUse: number;
  consumablesUsed: string;
  consumablesWeight: number;
  usageFrequency: number;
  maintenanceFrequency: number;
  repairRate: number;
  userBehaviorImpact: number;
  efficiencyDegradation: number;
  standbyEnergyConsumption: number;
  usageLocation: string;
  usagePattern: string;
  userInstructions?: string;
  upgradeability?: number;
  secondHandMarket?: boolean;
}

// 处置节点数据
export interface DisposalNodeData extends BaseNodeData {
  nodeType: 'disposal'; // Literal type
  recyclingRate: number;
  landfillPercentage: number;
  incinerationPercentage: number;
  compostPercentage: number;
  reusePercentage: number;
  hazardousWasteContent: number;
  biodegradability: number;
  disposalEnergyRecovery: number;
  transportToDisposal: number; // Assuming this is a distance or similar metric
  disposalMethod: string;
  endOfLifeTreatment: string;
  recyclingEfficiency: number;
  dismantlingDifficulty: string;
  wasteRegulations?: string;
  takeback?: boolean;
  circularEconomyPotential?: number;
}

// 最终产品节点数据
export interface FinalProductNodeData extends BaseNodeData {
  nodeType: 'finalProduct'; // Literal type
  finalProductName: string; // This should be `label` or `name` from BaseNodeData ideally.
  totalCarbonFootprint: number;
  certificationStatus: string;
  environmentalImpact: string;
  sustainabilityScore: number;
  productCategory: string; // This is likely `emissionType` from BaseNodeData.
  marketSegment: string;
  targetRegion: string;
  complianceStatus: string;
  carbonLabel: string;
}

// 联合类型定义
export type NodeData =
  | ProductNodeData
  | ManufacturingNodeData
  | DistributionNodeData
  | UsageNodeData
  | DisposalNodeData
  | FinalProductNodeData;

// 带数据的节点类型
export type DataNode = Node<NodeData>; 