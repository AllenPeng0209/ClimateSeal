import type { Node } from 'reactflow';

// 基础节点数据接口
export interface BaseNodeData {
  label: string;
  nodeName: string;
  lifecycleStage: string;
  emissionType: string;
  carbonFactor: number;
  activitydataSource: string;
  activityScore: number;
  carbonFootprint: number;
  dataSources?: string;
  verificationStatus?: string;
  quantity?: number;
  carbonFactorName?: string;
  unitConversion?: number;
  carbonFactordataSource?: string;
  activityScorelevel?: number;
}

// 产品节点数据
export interface ProductNodeData extends BaseNodeData {
  material?: string;
  weight_per_unit?: string;
  isRecycled?: boolean;
  recycledContent?: string;
  recycledContentPercentage?: number;
  sourcingRegion?: string;
  SourceLocation?: string;
  Destination?: string;
  SupplierName?: string;
  SupplierAddress?: string;
  ProcessingPlantAddress?: string;
  RefrigeratedTransport?: boolean;
  weight?: number;
  supplier?: string;
  certaintyPercentage?: number;
}

// 制造节点数据
export interface ManufacturingNodeData extends BaseNodeData {
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
  transportationMode: string;
  transportationDistance: number;
  startPoint: string;
  endPoint: string;
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
  distributionMode?: string;
  distributionDistance?: number;
  distributionStartPoint?: string;
  distributionEndPoint?: string;
  distributionTransportationMode?: string;
  distributionTransportationDistance?: number;
}

// 使用节点数据
export interface UsageNodeData extends BaseNodeData {
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
  recyclingRate: number;
  landfillPercentage: number;
  incinerationPercentage: number;
  compostPercentage: number;
  reusePercentage: number;
  hazardousWasteContent: number;
  biodegradability: number;
  disposalEnergyRecovery: number;
  transportToDisposal: number;
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
  finalProductName: string;
  totalCarbonFootprint: number;
  certificationStatus: string;
  environmentalImpact: string;
  sustainabilityScore: number;
  productCategory: string;
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