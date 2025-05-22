import type { Node, Edge } from 'reactflow';
import type { CarbonFlowAction } from '~/types/actions';
import type {
  NodeData,
  ManufacturingNodeData,
  DistributionNodeData,
  UsageNodeData,
  DisposalNodeData,
  FinalProductNodeData,
  ProductNodeData,
} from '~/types/nodes';
import type { CsvParseResultItem } from '~/lib/agents/csv-parser';
import convert from 'convert-units'; // Added import for convert-units
import { useCarbonFlowStore } from '../CarbonFlowStore'; // Import the store

// 定义碳因子匹配结果的返回类型
type CarbonFactorResult = {
  factor: number; // Should be in kgCO2e / unit
  activityName: string;
  unit: string; // The unit of the activity for which the factor is provided
  geography?: string; // 新增: 地理位置
  activityUUID?: string; // 新增: 活动UUID
  dataSource?: string; // 新增: 数据来源
  importDate?: string; // 新增: 导入日期
};

type NodeType = 'product' | 'manufacturing' | 'distribution' | 'usage' | 'disposal' | 'finalProduct';

/**
 * Helper function to safely get properties from potentially partial data.
 * Handles null/undefined objects and keys not present, returning a default value.
 */
function safeGet<T extends object, K extends keyof T>(
  obj: T | Partial<T> | Record<string, any> | null | undefined,
  key: K,
  defaultValue: T[K],
): T[K] {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }

  /**
   * We check if the key is in the object to satisfy TypeScript
   * even though Record<string, any> complicates direct K indexing.
   * The `as T[K]` assertion is used because Record<string, any> accepts any string key.
   */
  if (key in obj) {
    return (obj as any)[key] ?? defaultValue;
  }

  return defaultValue;
}

export interface CarbonFlowActionHandlerProps {
  carbonFlowStore: typeof useCarbonFlowStore;
  nodes: Node<NodeData>[];
  edges: Edge[];
  setNodes: (nodesOrUpdater: Node<NodeData>[] | ((nodes: Node<NodeData>[]) => Node<NodeData>[])) => void; // Allow functional updates
  setEdges: (edgesOrUpdater: Edge[] | ((edges: Edge[]) => Edge[])) => void; // Allow functional updates
}

/**
 * CarbonFlow 操作处理器
 * 处理所有 carbonflow 类型的操作，包括增删查改节点和连接
 */
export class CarbonFlowActionHandler {
  private _carbonFlowStore: typeof useCarbonFlowStore;
  private _nodes: Node<NodeData>[];
  private _edges: Edge[];
  private _setNodes: (nodesOrUpdater: Node<NodeData>[] | ((nodes: Node<NodeData>[]) => Node<NodeData>[])) => void;
  private _setEdges: (edgesOrUpdater: Edge[] | ((edges: Edge[]) => Edge[])) => void;

  /*
   * Linter expects private statics to start with _, reverting rename for now.
   * It's a common convention, though not strictly required by JS/TS.
   */
  private static readonly _nodeWidth = 250;
  private static readonly _nodeHeight = 150;

  constructor({ nodes, edges, setNodes, setEdges }: CarbonFlowActionHandlerProps) {
    this._carbonFlowStore = useCarbonFlowStore;
    this._nodes = nodes;
    this._edges = edges;
    this._setNodes = setNodes;
    this._setEdges = setEdges;
  }

  /**
   * 处理 CarbonFlow 操作
   */
  async handleAction(action: CarbonFlowAction): Promise<void> {
    console.log(`[CarbonFlowActionHandler] Received action:`, JSON.stringify(action, null, 2));
    // 记录CarbonFlow操作到日志
    console.log(`[CARBONFLOW_ACTION] Operation: ${action.operation}`, {
      nodeType: action.nodeType,
      nodeId: action.nodeId,
      source: action.source,
      target: action.target,
      position: action.position,
      data: action.operation === 'file_parser' || !action.data ? '<data handled separately or missing>' : '<data provided>',
      description: action.description,
      fileName: (action as any).fileName, // Assuming fileName might be passed in action
    });

    // 记录操作内容
    if (action.description) {
      console.log(`[CARBONFLOW_CONTENT] ${action.description}`);
    }

    // Don't log raw file content here if it's file_parser
    if (action.data && action.operation !== 'file_parser') {
      try {
        const contentObj = JSON.parse(action.data);
        console.log(`[CARBONFLOW_CONTENT]`, contentObj);
      } catch (error) {
        console.warn(`Could not parse action.data as JSON for logging: ${action.data?.substring(0, 100)}...`, error);

        if (!action.description) {
          // Log truncated data if it's too long and not file content
          const logData = action.data.length > 200 ? action.data.substring(0, 200) + '...' : action.data;
          console.log(`[CARBONFLOW_CONTENT] ${logData}`);
        }
      }
    }

    // 验证操作类型
    const validOperations = [
      'create',
      'update',
      'delete',
      'query',
      'connect',
      'layout',
      'calculate',
      'file_parser',
      'carbon_factor_match',
      'ai_autofill_transport_data',
      'ai_autofill_conversion_data',
      'plan', // Added 'plan' operation
    ];

    if (!validOperations.includes(action.operation)) {
      console.error(`无效的 CarbonFlow 操作类型: ${action.operation}`);
      return;
    }

    console.log(`[DEBUG_HANDLE_ACTION] Passed validOperations check. About to switch on operation: "${action.operation}"`); // Added for debugging

    try {
      switch (action.operation) {
        case 'create':
          this._handleCreateNode(action);
          break;
        case 'update':
          this._handleUpdateNode(action);
          break;
        case 'delete':
          this._handleDeleteNode(action);
          break;
        case 'query':
          this._handleQueryNode(action);
          break;
        case 'connect':
          this._handleConnectNodes(action);
          break;
        case 'layout':
          this._handleLayout(action);
          break;
        case 'calculate':
          this._handleCalculate(action);
          break;
        case 'carbon_factor_match':
          await this._handleCarbonFactorMatch(action);
          break;
        case 'file_parser':
          await this._handleFileParseAndCreateNodes(action);
          break;
        case 'ai_autofill_transport_data':
          await this._handleAIAutoFillTransportData(action);
          break;
        case 'ai_autofill_conversion_data': // New operation
          await this._handleAIAutoFillConversionData(action);
          break;
        case 'plan':
          await this._handlePlan(action);
          break;
        default: {
          // Use type assertion for exhaustive check
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const _exhaustiveCheck: never = action.operation;
          console.warn(`未知的 CarbonFlow 操作: ${action.operation}`, JSON.stringify(action, null, 2));
          break; // Added break statement
        }
      }
    } catch (error) {
      console.error(`处理 CarbonFlow 操作失败: ${action.operation}`, error);
    }
  }

  // Removed _parseCsv function

  // Removed _mapCsvRowToNodeData function

  /**
   * Renamed from _handleBomParser and refactored to call the API and then _handleCreateNode
   * Make this async as it now calls fetch
   */
  private async _handleFileParseAndCreateNodes(action: CarbonFlowAction): Promise<void> {
    console.log('Handling File Parse action (Calling API)...');

    if (!action.data) {
      console.error('File Parse 操作缺少 data (file content) 字段');
      return;
    }
    // Предположим, что имя файла передается в action.fileName
    // You'll need to ensure CarbonFlowAction type and the dispatching logic include fileName
    const fileNameFromAction = (action as any).fileName || 'unknown_file';

    const fileContent = action.data;
    console.log('[File Content Provided]:', fileContent.substring(0, 100) + '...');

    let aiResult: CsvParseResultItem[] = [];

    try {
      const response = await fetch('/api/parse-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvContent: fileContent }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
        const errorMessage = 
          typeof errorBody === 'object' && 
          errorBody !== null && 
          'error' in errorBody && 
          typeof errorBody.error === 'string' 
            ? errorBody.error 
            : typeof errorBody === 'object' && 
              errorBody !== null && 
              'message' in errorBody && 
              typeof errorBody.message === 'string' 
            ? errorBody.message 
            : response.statusText;
        throw new Error(`API Error (${response.status}): ${errorMessage}`);
      }

      const result = (await response.json()) as { success?: boolean; data?: CsvParseResultItem[] };

      if (!result.success || !Array.isArray(result.data)) {
        throw new Error(`API returned unsuccessful or invalid data: ${JSON.stringify(result)}`);
      }

      aiResult = result.data;
      console.log(`[API Response] Received ${aiResult.length} parsed items from backend.`);
    } catch (error) {
      console.error('调用 /api/parse-csv 失败:', error);
      // TODO: Add user feedback (e.g., show an error message to the user)
      return; // Stop processing if API call fails
    }
    console.log('aiResult', aiResult);
    // --- Process the results from the real API call ---
    if (aiResult.length === 0) {
      console.warn('AI parsing (via API) resulted in no nodes.');
      // TODO: Add user feedback
      return;
    }

    console.log(`AI parsed ${aiResult.length} potential nodes. Attempting creation...`);
    let createdNodeCount = 0;
    let nodeCreationErrors = 0;

    // Call _handleCreateNode for each item from AI result
    aiResult.forEach((item) => {
      // Basic validation (redundant? parseCsvWithLlmAgent should ensure this structure)
      // Keep it as a safeguard against unexpected API responses
      if (
        !item ||
        typeof item !== 'object' ||
        !item.nodeType ||
        typeof item.nodeType !== 'string' ||
        !item.data ||
        typeof item.data !== 'object'
      ) {
        console.warn(`Skipping invalid item structure from API response:`, item);
        nodeCreationErrors++;
        return; // Skip this item
      }

      // Add parse_from_file_name to the data object
      const nodeSpecificData = item.data as Record<string, any>;
      nodeSpecificData.parse_from_file_name = fileNameFromAction;

      try {
        // Pass nodeType and stringified data to _handleCreateNode
        this._handleCreateNode({
          type: 'carbonflow',
          operation: 'create',
          nodeType: item.nodeType,
          data: JSON.stringify(nodeSpecificData), // Pass data (now including filename) received from API
          // Generate a more descriptive content message
          content: `Create node from file: ${nodeSpecificData.label || `Unnamed ${item.nodeType}`}`,
          //log
        });
        console.log('item.data with fileName:', nodeSpecificData);

        createdNodeCount++;
      } catch (createError) {
        console.error(`Failed to create node for item: ${nodeSpecificData.label || item.nodeType}`, createError, item);
        nodeCreationErrors++;
      }
    });

    console.log(`文件解析和节点创建尝试完成。成功创建: ${createdNodeCount}, 失败: ${nodeCreationErrors}。`);
    // TODO: Add user feedback about success/failures

    // Optionally trigger layout and calculation after all creation attempts
    if (createdNodeCount > 0) {
      this._handleLayout({ type: 'carbonflow', operation: 'layout', content: 'Layout after file parse' });
      this._handleCalculate({ type: 'carbonflow', operation: 'calculate', content: 'Calculate after file parse' });
    }
  }

  /**
   * 创建新节点 (Now handles data parsing and type safety internally)
   */
  private _handleCreateNode(action: CarbonFlowAction): void {
    if (!action.nodeType) {
      console.error('创建节点操作缺少 nodeType');
      return;
    }

    const nodeType = action.nodeType as NodeType;
    const nodeId = action.nodeId || `${nodeType}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

    let inputData: Record<string, any> = {};
    if (action.data) {
      try {
        inputData = JSON.parse(action.data);
      } catch (e) {
        console.error(`解析节点数据失败 for ${nodeType} (${action.data?.substring(0, 50)}...):`, e);
        // Create a node with minimal default data on parsing failure
        inputData = { label: `无效数据 - ${nodeType}` };
      }
    }

    let data: NodeData;

    /*
     * Use safeGet for all properties, providing defaults matching the interface
     * IMPORTANT: Ensure safeGet handles basic type conversion if needed, or perform checks here
     */
    switch (nodeType) {
      case 'product':
        data = {
          id: nodeId, // PK, from DB - Use generated nodeId
          workflowId: this._carbonFlowStore.getState().workflowId || '', // FK to workflows.id
          nodeId: nodeId, // React Flow node ID, unique within a workflow
          nodeType: 'product',
          productId: '', // Added default productId
          label: String(safeGet(inputData, 'label', `${nodeType}_${nodeId}`)),
          nodeName: String(safeGet(inputData, 'nodeName', nodeId)),
          lifecycleStage: 'product',
          emissionType: String(safeGet(inputData, 'emissionType', 'unknown')),
          quantity: String(safeGet(inputData, 'quantity', '')),
          activityUnit: String(safeGet(inputData, 'activityUnit', '')),
          carbonFactor: String(safeGet(inputData, 'carbonFactor', '0')), // String as per BaseNodeData
          carbonFactorName: String(safeGet(inputData, 'carbonFactorName', '')),
          unitConversion: String(safeGet(inputData, 'unitConversion', '0')), // String as per BaseNodeData
          carbonFactordataSource: String(safeGet(inputData, 'carbonFactordataSource', '')),
          activitydataSource: String(safeGet(inputData, 'activitydataSource', 'unknown')),
          activityScore: Number(safeGet(inputData, 'activityScore', 0)), // Number as per BaseNodeData
          carbonFootprint: String(safeGet(inputData, 'carbonFootprint', '0')), // String as per BaseNodeData
          verificationStatus: String(safeGet(inputData, 'verificationStatus', 'pending')),
          material: String(safeGet(inputData, 'material', '')),
          weight_per_unit: String(safeGet(inputData, 'weight_per_unit', '')),
          isRecycled: Boolean(safeGet(inputData, 'isRecycled', false)),
          recycledContent: String(safeGet(inputData, 'recycledContent', '')),
          recycledContentPercentage: Number(safeGet(inputData, 'recycledContentPercentage', 0)), // Number as per ProductNodeData
          sourcingRegion: String(safeGet(inputData, 'sourcingRegion', '')),
          SourceLocation: String(safeGet(inputData, 'SourceLocation', '')),
          Destination: String(safeGet(inputData, 'Destination', '')),
          SupplierName: String(safeGet(inputData, 'SupplierName', '')),
          SupplierAddress: String(safeGet(inputData, 'SupplierAddress', '')),
          ProcessingPlantAddress: String(safeGet(inputData, 'ProcessingPlantAddress', '')),
          RefrigeratedTransport: Boolean(safeGet(inputData, 'RefrigeratedTransport', false)),
          weight: Number(safeGet(inputData, 'weight', 0)), // Number as per ProductNodeData
          supplier: String(safeGet(inputData, 'supplier', '')),
          certaintyPercentage: Number(safeGet(inputData, 'certaintyPercentage', 0)), // Number as per ProductNodeData
          dataSources: safeGet(inputData, 'dataSources', undefined) as string | undefined,
          parse_from_file_name: String(safeGet(inputData, 'parse_from_file_name', '')),
        } as ProductNodeData;
        break;
      case 'manufacturing':
        data = {
          id: nodeId,
          workflowId: this._carbonFlowStore.getState().workflowId || '',
          nodeId: nodeId,
          nodeType: 'manufacturing',
          label: String(safeGet(inputData, 'label', `${nodeType}_${nodeId}`)),
          nodeName: String(safeGet(inputData, 'nodeName', nodeId)),
          lifecycleStage: 'manufacturing',
          emissionType: String(safeGet(inputData, 'emissionType', 'unknown')),
          quantity: String(safeGet(inputData, 'quantity', '')),
          activityUnit: String(safeGet(inputData, 'activityUnit', '')),
          carbonFactor: String(safeGet(inputData, 'carbonFactor', '0')), // String
          activitydataSource: String(safeGet(inputData, 'activitydataSource', 'unknown')),
          activityScore: Number(safeGet(inputData, 'activityScore', 0)), // Number
          carbonFootprint: String(safeGet(inputData, 'carbonFootprint', '0')), // String
          verificationStatus: String(safeGet(inputData, 'verificationStatus', 'pending')),
          ElectricityAccountingMethod: String(safeGet(inputData, 'ElectricityAccountingMethod', '')),
          ElectricityAllocationMethod: String(safeGet(inputData, 'ElectricityAllocationMethod', '')),
          EnergyConsumptionMethodology: String(safeGet(inputData, 'EnergyConsumptionMethodology', '')),
          EnergyConsumptionAllocationMethod: String(safeGet(inputData, 'EnergyConsumptionAllocationMethod', '')),
          energyConsumption: Number(safeGet(inputData, 'energyConsumption', 0)), // Number
          energyType: String(safeGet(inputData, 'energyType', '')),
          chemicalsMaterial: String(safeGet(inputData, 'chemicalsMaterial', '')),
          MaterialAllocationMethod: String(safeGet(inputData, 'MaterialAllocationMethod', '')),
          WaterUseMethodology: String(safeGet(inputData, 'WaterUseMethodology', '')),
          WaterAllocationMethod: String(safeGet(inputData, 'WaterAllocationMethod', '')),
          waterConsumption: Number(safeGet(inputData, 'waterConsumption', 0)), // Number
          packagingMaterial: String(safeGet(inputData, 'packagingMaterial', '')),
          direct_emission: String(safeGet(inputData, 'direct_emission', '')),
          WasteGasTreatment: String(safeGet(inputData, 'WasteGasTreatment', '')),
          WasteDisposalMethod: String(safeGet(inputData, 'WasteDisposalMethod', '')),
          WastewaterTreatment: String(safeGet(inputData, 'WastewaterTreatment', '')),
          productionMethod: String(safeGet(inputData, 'productionMethod', '')),
          processEfficiency: Number(safeGet(inputData, 'processEfficiency', 0)), // Number
          wasteGeneration: Number(safeGet(inputData, 'wasteGeneration', 0)), // Number
          recycledMaterialPercentage: Number(safeGet(inputData, 'recycledMaterialPercentage', 0)), // Number
          productionCapacity: Number(safeGet(inputData, 'productionCapacity', 0)), // Number
          machineUtilization: Number(safeGet(inputData, 'machineUtilization', 0)), // Number
          qualityDefectRate: Number(safeGet(inputData, 'qualityDefectRate', 0)), // Number
          processTechnology: String(safeGet(inputData, 'processTechnology', '')),
          manufacturingStandard: String(safeGet(inputData, 'manufacturingStandard', '')),
          automationLevel: String(safeGet(inputData, 'automationLevel', '')),
          manufacturingLocation: String(safeGet(inputData, 'manufacturingLocation', '')),
          byproducts: String(safeGet(inputData, 'byproducts', '')),
          emissionControlMeasures: String(safeGet(inputData, 'emissionControlMeasures', '')),
          dataSources: safeGet(inputData, 'dataSources', undefined) as string | undefined,
          productionMethodDataSource: String(safeGet(inputData, 'productionMethodDataSource', '')),
          productionMethodVerificationStatus: String(safeGet(inputData, 'productionMethodVerificationStatus', '')),
          productionMethodApplicableStandard: String(safeGet(inputData, 'productionMethodApplicableStandard', '')),
          productionMethodCompletionStatus: String(safeGet(inputData, 'productionMethodCompletionStatus', '')),
          parse_from_file_name: String(safeGet(inputData, 'parse_from_file_name', '')),
        } as ManufacturingNodeData;
        break;
      case 'distribution':
        data = {
          id: nodeId,
          workflowId: this._carbonFlowStore.getState().workflowId || '',
          nodeId: nodeId,
          nodeType: 'distribution',
          label: String(safeGet(inputData, 'label', `${nodeType}_${nodeId}`)),
          nodeName: String(safeGet(inputData, 'nodeName', nodeId)),
          lifecycleStage: 'distribution',
          emissionType: String(safeGet(inputData, 'emissionType', 'unknown')),
          quantity: String(safeGet(inputData, 'quantity', '')),
          activityUnit: String(safeGet(inputData, 'activityUnit', '')),
          carbonFactor: String(safeGet(inputData, 'carbonFactor', '0')), // String
          activitydataSource: String(safeGet(inputData, 'activitydataSource', 'unknown')),
          activityScore: Number(safeGet(inputData, 'activityScore', 0)), // Number
          carbonFootprint: String(safeGet(inputData, 'carbonFootprint', '0')), // String
          verificationStatus: String(safeGet(inputData, 'verificationStatus', 'pending')),
          dataSources: safeGet(inputData, 'dataSources', undefined) as string | undefined,
          transportationMode: String(safeGet(inputData, 'transportationMode', '')),
          transportationDistance: Number(safeGet(inputData, 'transportationDistance', 0)), // Number
          startPoint: String(safeGet(inputData, 'startPoint', '')),
          endPoint: String(safeGet(inputData, 'endPoint', '')),
          vehicleType: String(safeGet(inputData, 'vehicleType', '')),
          fuelType: String(safeGet(inputData, 'fuelType', '')),
          fuelEfficiency: Number(safeGet(inputData, 'fuelEfficiency', 0)), // Number
          loadFactor: Number(safeGet(inputData, 'loadFactor', 0)), // Number
          refrigeration: Boolean(safeGet(inputData, 'refrigeration', false)),
          packagingMaterial: String(safeGet(inputData, 'packagingMaterial', '')),
          packagingWeight: Number(safeGet(inputData, 'packagingWeight', 0)), // Number
          warehouseEnergy: Number(safeGet(inputData, 'warehouseEnergy', 0)), // Number
          storageTime: Number(safeGet(inputData, 'storageTime', 0)), // Number
          storageConditions: String(safeGet(inputData, 'storageConditions', '')),
          distributionNetwork: String(safeGet(inputData, 'distributionNetwork', '')),
          aiRecommendation: String(safeGet(inputData, 'aiRecommendation', '')),
          returnLogistics: Boolean(safeGet(inputData, 'returnLogistics', false)),
          packagingRecyclability: Number(safeGet(inputData, 'packagingRecyclability', 0)), // Number
          lastMileDelivery: String(safeGet(inputData, 'lastMileDelivery', '')),
          distributionMode: String(safeGet(inputData, 'distributionMode', '')),
          distributionDistance: Number(safeGet(inputData, 'distributionDistance', 0)), // Number
          distributionStartPoint: String(safeGet(inputData, 'distributionStartPoint', '')),
          distributionEndPoint: String(safeGet(inputData, 'distributionEndPoint', '')),
          distributionTransportationMode: String(safeGet(inputData, 'distributionTransportationMode', '')),
          distributionTransportationDistance: Number(safeGet(inputData, 'distributionTransportationDistance', 0)), // Number
          parse_from_file_name: String(safeGet(inputData, 'parse_from_file_name', '')),
        } as DistributionNodeData;
        break;
      case 'usage':
        data = {
          id: nodeId,
          workflowId: this._carbonFlowStore.getState().workflowId || '',
          nodeId: nodeId,
          nodeType: 'usage',
          label: String(safeGet(inputData, 'label', `${nodeType}_${nodeId}`)),
          nodeName: String(safeGet(inputData, 'nodeName', nodeId)),
          lifecycleStage: 'usage',
          emissionType: String(safeGet(inputData, 'emissionType', 'unknown')),
          quantity: String(safeGet(inputData, 'quantity', '')),
          activityUnit: String(safeGet(inputData, 'activityUnit', '')),
          carbonFactor: String(safeGet(inputData, 'carbonFactor', '0')), // String
          activitydataSource: String(safeGet(inputData, 'activitydataSource', 'unknown')),
          activityScore: Number(safeGet(inputData, 'activityScore', 0)), // Number
          carbonFootprint: String(safeGet(inputData, 'carbonFootprint', '0')), // String
          verificationStatus: String(safeGet(inputData, 'verificationStatus', 'pending')),
          dataSources: safeGet(inputData, 'dataSources', undefined) as string | undefined,
          lifespan: Number(safeGet(inputData, 'lifespan', 0)), // Number
          energyConsumptionPerUse: Number(safeGet(inputData, 'energyConsumptionPerUse', 0)), // Number
          waterConsumptionPerUse: Number(safeGet(inputData, 'waterConsumptionPerUse', 0)), // Number
          consumablesUsed: String(safeGet(inputData, 'consumablesUsed', '')),
          consumablesWeight: Number(safeGet(inputData, 'consumablesWeight', 0)), // Number
          usageFrequency: Number(safeGet(inputData, 'usageFrequency', 0)), // Number
          maintenanceFrequency: Number(safeGet(inputData, 'maintenanceFrequency', 0)), // Number
          repairRate: Number(safeGet(inputData, 'repairRate', 0)), // Number
          userBehaviorImpact: Number(safeGet(inputData, 'userBehaviorImpact', 0)), // Number
          efficiencyDegradation: Number(safeGet(inputData, 'efficiencyDegradation', 0)), // Number
          standbyEnergyConsumption: Number(safeGet(inputData, 'standbyEnergyConsumption', 0)), // Number
          usageLocation: String(safeGet(inputData, 'usageLocation', '')),
          usagePattern: String(safeGet(inputData, 'usagePattern', '')),
          userInstructions: String(safeGet(inputData, 'userInstructions', '')),
          upgradeability: Number(safeGet(inputData, 'upgradeability', 0)), // Number
          secondHandMarket: Boolean(safeGet(inputData, 'secondHandMarket', false)),
          parse_from_file_name: String(safeGet(inputData, 'parse_from_file_name', '')),
        } as UsageNodeData;
        break;
      case 'disposal':
        data = {
          id: nodeId,
          workflowId: this._carbonFlowStore.getState().workflowId || '',
          nodeId: nodeId,
          nodeType: 'disposal',
          label: String(safeGet(inputData, 'label', `${nodeType}_${nodeId}`)),
          nodeName: String(safeGet(inputData, 'nodeName', nodeId)),
          lifecycleStage: 'disposal',
          emissionType: String(safeGet(inputData, 'emissionType', 'unknown')),
          quantity: String(safeGet(inputData, 'quantity', '')),
          activityUnit: String(safeGet(inputData, 'activityUnit', '')),
          carbonFactor: String(safeGet(inputData, 'carbonFactor', '0')), // String
          activitydataSource: String(safeGet(inputData, 'activitydataSource', 'unknown')),
          activityScore: Number(safeGet(inputData, 'activityScore', 0)), // Number
          carbonFootprint: String(safeGet(inputData, 'carbonFootprint', '0')), // String
          verificationStatus: String(safeGet(inputData, 'verificationStatus', 'pending')),
          dataSources: safeGet(inputData, 'dataSources', undefined) as string | undefined,
          recyclingRate: Number(safeGet(inputData, 'recyclingRate', 0)), // Number
          landfillPercentage: Number(safeGet(inputData, 'landfillPercentage', 0)), // Number
          incinerationPercentage: Number(safeGet(inputData, 'incinerationPercentage', 0)), // Number
          compostPercentage: Number(safeGet(inputData, 'compostPercentage', 0)), // Number
          reusePercentage: Number(safeGet(inputData, 'reusePercentage', 0)), // Number
          hazardousWasteContent: Number(safeGet(inputData, 'hazardousWasteContent', 0)), // Number
          biodegradability: Number(safeGet(inputData, 'biodegradability', 0)), // Number
          disposalEnergyRecovery: Number(safeGet(inputData, 'disposalEnergyRecovery', 0)), // Number
          transportToDisposal: Number(safeGet(inputData, 'transportToDisposal', 0)), // Number
          disposalMethod: String(safeGet(inputData, 'disposalMethod', '')),
          endOfLifeTreatment: String(safeGet(inputData, 'endOfLifeTreatment', '')),
          recyclingEfficiency: Number(safeGet(inputData, 'recyclingEfficiency', 0)), // Number
          dismantlingDifficulty: String(safeGet(inputData, 'dismantlingDifficulty', '')),
          wasteRegulations: String(safeGet(inputData, 'wasteRegulations', '')),
          takeback: Boolean(safeGet(inputData, 'takeback', false)),
          circularEconomyPotential: Number(safeGet(inputData, 'circularEconomyPotential', 0)), // Number
          parse_from_file_name: String(safeGet(inputData, 'parse_from_file_name', '')),
        } as DisposalNodeData;
        break;
      case 'finalProduct':
        data = {
          id: nodeId,
          workflowId: this._carbonFlowStore.getState().workflowId || '',
          nodeId: nodeId,
          nodeType: 'finalProduct',
          label: String(safeGet(inputData, 'label', `${nodeType}_${nodeId}`)),
          nodeName: String(safeGet(inputData, 'nodeName', nodeId)),
          lifecycleStage: 'finalProduct',
          emissionType: String(safeGet(inputData, 'emissionType', 'total')),
          quantity: String(safeGet(inputData, 'quantity', '')),
          activityUnit: String(safeGet(inputData, 'activityUnit', '')),
          carbonFactor: String(safeGet(inputData, 'carbonFactor', '0')), // String
          activitydataSource: String(safeGet(inputData, 'activitydataSource', 'calculated')),
          activityScore: Number(safeGet(inputData, 'activityScore', 0)), // Number
          carbonFootprint: String(safeGet(inputData, 'carbonFootprint', '0')), // String (as per BaseNodeData)
          verificationStatus: String(safeGet(inputData, 'verificationStatus', 'pending')),
          dataSources: safeGet(inputData, 'dataSources', undefined) as string | undefined,
          finalProductName: String(
            safeGet(inputData, 'finalProductName', String(safeGet(inputData, 'label', `${nodeType}_${nodeId}`))),
          ),
          totalCarbonFootprint: Number(safeGet(inputData, 'totalCarbonFootprint', 0)), // Number as per FinalProductNodeData
          certificationStatus: String(safeGet(inputData, 'certificationStatus', 'pending')),
          environmentalImpact: String(safeGet(inputData, 'environmentalImpact', '')),
          sustainabilityScore: Number(safeGet(inputData, 'sustainabilityScore', 0)), // Number as per FinalProductNodeData
          productCategory: String(safeGet(inputData, 'productCategory', '')),
          marketSegment: String(safeGet(inputData, 'marketSegment', '')),
          targetRegion: String(safeGet(inputData, 'targetRegion', '')),
          complianceStatus: String(safeGet(inputData, 'complianceStatus', 'pending')),
          carbonLabel: String(safeGet(inputData, 'carbonLabel', '')),
          parse_from_file_name: String(safeGet(inputData, 'parse_from_file_name', '')),
        } as FinalProductNodeData;
        break;
      default: {
        // Should not happen due to earlier check, but good for type safety
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _exhaustiveCheck: never = nodeType;
        console.error(`创建节点时遇到未知类型: ${nodeType as string}`);
        return; // Do not create node if type is somehow invalid
      }
    }

    // Determine position: Use provided, or calculate default
    let position = { x: Math.random() * 400, y: Math.random() * 400 };
    if (action.position) {
      try {
        const parsedPosition = JSON.parse(action.position);
        if (typeof parsedPosition.x === 'number' && typeof parsedPosition.y === 'number') {
          position = parsedPosition;
        } else {
          console.warn(`Provided position data is invalid: ${action.position}, using default.`);
        }
      } catch (e) {
        console.warn(`Failed to parse position data: ${action.position}, using default.`, e);
      }
    }

    const newNode: Node<NodeData> = {
      id: nodeId,
      type: nodeType,
      position,
      data, // Use the fully constructed and typed data object (property shorthand)
    };

    // Use functional update for setNodes
    this._setNodes((currentNodes) => {
      // Check if node with the same ID already exists to prevent duplicates
      if (currentNodes.some((node) => node.id === newNode.id)) {
        console.warn(`Node with ID ${newNode.id} already exists. Skipping creation.`);
        return currentNodes;
      }

      console.log(`成功创建节点: ${newNode.id} (${newNode.data.label})`);

      return [...currentNodes, newNode];
    });

    /* Optional: Trigger layout or calculate after creation if needed
     * this._handleLayout({ type: 'carbonflow', operation: 'layout', content: 'Layout after create'});
     * this._handleCalculate({ type: 'carbonflow', operation: 'calculate', content: 'Calculate after create'});
     */
  }

  /**
   * 更新节点
   */
  private _handleUpdateNode(action: CarbonFlowAction): void {
    if (!action.nodeId) {
      console.error('更新节点操作缺少 nodeId');
      return;
    }

    try {
      let updateData: Record<string, any> = {};

      if (action.data) {
        try {
          updateData = JSON.parse(action.data);
        } catch (e) {
          console.error('解析更新数据失败:', e);
          return;
        }
      }

      let updated = false;
      // Use functional update for setNodes to ensure atomicity if possible, though direct map is common
      this._setNodes((currentNodes) => {
        let nodesChangedInUpdate = false;
        const updatedNodesResult = currentNodes.map((node) => {
          if (node.id === action.nodeId || node.data.nodeName === action.nodeId) {
            const originalDataString = JSON.stringify(node.data);
            // Ensure potentialNewData conforms to NodeData (loosely for now)
            const potentialNewData = { ...node.data, ...updateData } as NodeData;

            if (originalDataString === JSON.stringify(potentialNewData)) {
              return node; // No actual change
            }

            updated = true; // Mark that an update happened (for logging/recalc)
            nodesChangedInUpdate = true;
            return {
              ...node,
              data: potentialNewData, // Data should now be NodeData (or a subtype)
            };
          }
          return node;
        });

        // Only return the new array if changes actually occurred within the map
        return nodesChangedInUpdate ? updatedNodesResult : currentNodes;
      });

      if (updated) {
        // this._setNodes(updatedNodes); // setNodes is now handled functionally above
        console.log(`成功更新节点: ${action.nodeId}`);
        // Recalculate if relevant data changed

        if (
          Object.keys(updateData).some((key) =>
            ['carbonFactor', 'weight', 'energyConsumption', 'transportationDistance', 'lifespan'].includes(key),
          )
        ) {
          this._handleCalculate({ type: 'carbonflow', operation: 'calculate', content: 'Recalculate after update' });
        }
      } else {
        console.log(`节点 ${action.nodeId} 无需更新。`);
      }
    } catch (error) {
      console.error('更新节点失败:', error);
    }
  }

  /**
   * 删除节点
   */
  private _handleDeleteNode(action: CarbonFlowAction): void {
    if (!action.nodeId) {
      console.error('删除节点操作缺少 nodeId');
      return;
    }

    try {
      let nodeDeleted = false;
      let relatedEdgesDeleted = false;
      let nodeIdToDelete = '';

      this._setNodes((currentNodes) => {
        const nodeToDelete = currentNodes.find((n) => n.id === action.nodeId || n.data.nodeName === action.nodeId);
        if (!nodeToDelete) {
          console.log(`未找到要删除的节点: ${action.nodeId}`);
          return currentNodes; // No change
        }
        nodeIdToDelete = nodeToDelete.id;
        const filteredNodes = currentNodes.filter((node) => node.id !== nodeIdToDelete);
        if (filteredNodes.length !== currentNodes.length) {
          nodeDeleted = true;
          return filteredNodes;
        }
        return currentNodes;
      });

      this._setEdges((currentEdges) => {
        const filteredEdges = currentEdges.filter(
          (edge) => edge.source !== nodeIdToDelete && edge.target !== nodeIdToDelete,
        );
        if (filteredEdges.length !== currentEdges.length) {
          relatedEdgesDeleted = true;
          return filteredEdges;
        }
        return currentEdges;
      });

      if (nodeDeleted || relatedEdgesDeleted) {
        console.log(`成功删除节点: ${nodeIdToDelete} and related edges.`);
        this._handleCalculate({ type: 'carbonflow', operation: 'calculate', content: 'Recalculate after delete' });
      }
    } catch (error) {
      console.error('删除节点失败:', error);
    }
  }

  /**
   * 查询节点
   * @returns 找到的节点或null
   */
  private _handleQueryNode(action: CarbonFlowAction): Node<NodeData> | null {
    if (!action.nodeId) {
      console.error('查询节点操作缺少 nodeId');
      return null;
    }

    try {
      // Find within the current state (_nodes might be stale if updates happen quickly)
      // Consider using a getter if state management becomes complex
      const node = this._nodes.find((n) => n.id === action.nodeId || n.data.nodeName === action.nodeId);

      if (node) {
        console.log(`节点 ${action.nodeId} 信息:`, JSON.stringify(node));
        return JSON.parse(JSON.stringify(node)); // Return a deep copy
      } else {
        console.warn(`未找到节点: ${action.nodeId}`);
        return null;
      }
    } catch (error) {
      console.error('查询节点失败:', error);
      return null;
    }
  }

  /**
   * 连接节点
   */
  private _handleConnectNodes(action: CarbonFlowAction): void {
    if (!action.source || !action.target) {
      console.error('连接节点操作缺少 source 或 target');
      return;
    }

    try {
      // Find nodes based on the current state
      const sourceNode = this._nodes.find((node) => node.id === action.source || node.data.nodeName === action.source);
      const targetNode = this._nodes.find((node) => node.id === action.target || node.data.nodeName === action.target);

      if (!sourceNode || !targetNode) {
        console.error(`源节点或目标节点不存在: source=${action.source}, target=${action.target}`);
        return;
      }

      if (sourceNode.id === targetNode.id) {
        console.warn(`不允许创建自环连接: ${sourceNode.id}`);
        return;
      }

      // Check against current edges state
      const edgeExists = this._edges.some((edge) => edge.source === sourceNode.id && edge.target === targetNode.id);

      if (edgeExists) {
        console.warn(`连接已存在: ${sourceNode.id} -> ${targetNode.id}`);
        return;
      }

      const edgeData = action.data ? JSON.parse(action.data) : {};
      const newEdge: Edge = {
        id: `e-${sourceNode.id}-${targetNode.id}-${Date.now()}`,
        source: sourceNode.id,
        target: targetNode.id,
        label: edgeData.label || '',
        data: edgeData,
      };

      this._setEdges((currentEdges) => [...currentEdges, newEdge]); // Use functional update
      console.log(`成功连接节点: ${sourceNode.id} -> ${targetNode.id}`);
      this._handleCalculate({ type: 'carbonflow', operation: 'calculate', content: 'Recalculate after connect' });
    } catch (error) {
      console.error('连接节点失败:', error);
    }
  }

  /**
   * 自动布局 - Use static constants
   */
  private _handleLayout(action: CarbonFlowAction): void {
    try {
      const layoutConfig = action.data ? JSON.parse(action.data) : {};
      const layoutType = layoutConfig.type || 'vertical';
      console.log(`Applying layout: ${layoutType}`);
      let layoutApplied = false;

      switch (layoutType) {
        case 'normal':
          layoutApplied = this._applyNormalLayout();
          break;
        case 'vertical':
          layoutApplied = this._applyVerticalLayout();
          break;
        case 'horizontal':
          layoutApplied = this._applyHorizontalLayout();
          break;
        case 'radial':
          layoutApplied = this._applyRadialLayout();
          break;
        default: {
          console.warn(`未知的布局类型: ${layoutType}, defaulting to vertical.`);
          layoutApplied = this._applyVerticalLayout();
        }
      }

      if (layoutApplied) {
        console.log('Layout application finished.');
      } else {
        console.log('Layout application resulted in no changes.');
      }
    } catch (error) {
      console.error('应用布局失败:', error);
    }
  }

  // --- Layout Implementations return true if changes applied ---

  private _applyNormalLayout(): boolean {
    let layoutAppliedReturnFlag = false;

    this._setNodes((currentNodesGlobal) => {
      const nodesToLayout = currentNodesGlobal;

      const NODE_WIDTH = CarbonFlowActionHandler._nodeWidth;
      const NODE_HEIGHT = CarbonFlowActionHandler._nodeHeight;
      const HORIZONTAL_SPACING = 350;
      const VERTICAL_SPACING = 250;
      const PADDING = 50;

      const nodeTypeOrder: NodeType[] = ['product', 'manufacturing', 'distribution', 'usage', 'disposal'];
      const nodesByType: Record<NodeType | 'finalProduct', Node<NodeData>[]> = {
        product: [],
        manufacturing: [],
        distribution: [],
        usage: [],
        disposal: [],
        finalProduct: [],
      };
      let maxNodesInStage = 0;

      nodesToLayout.forEach((node) => { // Use nodesToLayout
        const nodeType = node.type as NodeType | 'finalProduct';
        if (nodesByType[nodeType]) {
          nodesByType[nodeType].push(node);
          if (nodeType !== 'finalProduct') {
            maxNodesInStage = Math.max(maxNodesInStage, nodesByType[nodeType].length);
          }
        } else {
          console.warn(`Node ${node.id} has unknown type: ${node.type}`);
        }
      });
      maxNodesInStage = Math.max(1, maxNodesInStage);

      const finalProductNode = nodesByType.finalProduct[0];
      const positionedNodes: Node<NodeData>[] = [];

      nodeTypeOrder.forEach((nodeType, typeIndex) => {
        const typeNodes = nodesByType[nodeType] || [];
        const stageHeight = typeNodes.length * (NODE_HEIGHT + VERTICAL_SPACING) - VERTICAL_SPACING;
        const totalMaxHeight = maxNodesInStage * (NODE_HEIGHT + VERTICAL_SPACING) - VERTICAL_SPACING;
        const startY = PADDING + (totalMaxHeight - stageHeight) / 2;

        typeNodes.forEach((node, nodeIndex) => {
          const x = PADDING + typeIndex * (NODE_WIDTH + HORIZONTAL_SPACING);
          const y = startY + nodeIndex * (NODE_HEIGHT + VERTICAL_SPACING);
          positionedNodes.push({ ...node, position: { x, y } });
        });
      });

      if (finalProductNode) {
        const x = PADDING + nodeTypeOrder.length * (NODE_WIDTH + HORIZONTAL_SPACING);
        const totalMaxHeight = maxNodesInStage * (NODE_HEIGHT + VERTICAL_SPACING) - VERTICAL_SPACING;
        const y = PADDING + (totalMaxHeight - NODE_HEIGHT) / 2;
        positionedNodes.push({ ...finalProductNode, position: { x, y } });
      }

      const positionedIds = new Set(positionedNodes.map((n) => n.id));
      nodesToLayout.forEach((node) => { // Ensure all nodes from nodesToLayout are included
        if (!positionedIds.has(node.id)) {
          positionedNodes.push({ ...node, position: { x: PADDING, y: PADDING } });
        }
      });
      
      let positionsActuallyChanged = false;
      if (nodesToLayout.length !== positionedNodes.length) {
        positionsActuallyChanged = true;
      } else {
        const originalNodePositions = new Map(nodesToLayout.map(n => [n.id, n.position]));
        for (const updatedNode of positionedNodes) {
            const originalPos = originalNodePositions.get(updatedNode.id);
            if (!originalPos || originalPos.x !== updatedNode.position.x || originalPos.y !== updatedNode.position.y) {
                positionsActuallyChanged = true;
                break;
            }
        }
      }

      if (positionsActuallyChanged) {
        layoutAppliedReturnFlag = true;
        this._updateEdgesInternal(positionedNodes); // Pass the newly layouted nodes
        console.log('Successfully applied Normal layout (functional update)');
        return positionedNodes;
      }
      return nodesToLayout;
    });
    return layoutAppliedReturnFlag;
  }

  private _applyVerticalLayout(): boolean {
    let layoutAppliedReturnFlag = false;

    this._setNodes((currentNodesGlobal) => {
      const nodesToLayout = currentNodesGlobal;

      const NODE_WIDTH = CarbonFlowActionHandler._nodeWidth;
      const NODE_HEIGHT = CarbonFlowActionHandler._nodeHeight;
      const HORIZONTAL_SPACING = 250;
      const VERTICAL_SPACING = 200;
      const PADDING = 50;

      const stages: NodeType[] = ['product', 'manufacturing', 'distribution', 'usage', 'disposal', 'finalProduct'];
      const stageMap = new Map<string, Node<NodeData>[]>();
      stages.forEach((stage) => stageMap.set(stage, []));
      const miscNodes: Node<NodeData>[] = [];
      let maxNodesInRow = 0;

      nodesToLayout.forEach((node) => { // Use nodesToLayout
        const stage = node.type as string;
        if (stageMap.has(stage)) {
          stageMap.get(stage)?.push(node);
          maxNodesInRow = Math.max(maxNodesInRow, stageMap.get(stage)!.length);
        } else {
          miscNodes.push(node);
        }
      });
      maxNodesInRow = Math.max(maxNodesInRow, miscNodes.length, 1);

      const updatedNodesFromLayout: Node<NodeData>[] = [];
      let currentY = PADDING;
      const totalMaxWidth = maxNodesInRow * (NODE_WIDTH + HORIZONTAL_SPACING) - HORIZONTAL_SPACING;

      stages.forEach((stage) => {
        const nodesInStage = stageMap.get(stage) || [];
        if (nodesInStage.length > 0) {
          const stageWidth = nodesInStage.length * (NODE_WIDTH + HORIZONTAL_SPACING) - HORIZONTAL_SPACING;
          let currentX = PADDING + (totalMaxWidth - stageWidth) / 2;
          nodesInStage.forEach((node) => {
            updatedNodesFromLayout.push({ ...node, position: { x: currentX, y: currentY } });
            currentX += NODE_WIDTH + HORIZONTAL_SPACING;
          });
          currentY += NODE_HEIGHT + VERTICAL_SPACING;
        }
      });

      if (miscNodes.length > 0) {
        const stageWidth = miscNodes.length * (NODE_WIDTH + HORIZONTAL_SPACING) - HORIZONTAL_SPACING;
        let currentX = PADDING + (totalMaxWidth - stageWidth) / 2;
        miscNodes.forEach((node) => {
          updatedNodesFromLayout.push({ ...node, position: { x: currentX, y: currentY } });
          currentX += NODE_WIDTH + HORIZONTAL_SPACING;
        });
      }
      
      let positionsActuallyChanged = false;
       if (nodesToLayout.length !== updatedNodesFromLayout.length) {
        positionsActuallyChanged = true;
      } else {
        const originalNodePositions = new Map(nodesToLayout.map(n => [n.id, n.position]));
        for (const updatedNode of updatedNodesFromLayout) {
            const originalPos = originalNodePositions.get(updatedNode.id);
            if (!originalPos || originalPos.x !== updatedNode.position.x || originalPos.y !== updatedNode.position.y) {
                positionsActuallyChanged = true;
                break;
            }
        }
      }

      if (positionsActuallyChanged) {
        layoutAppliedReturnFlag = true;
        this._updateEdgesInternal(updatedNodesFromLayout); // Pass the newly layouted nodes
        console.log('Successfully applied Vertical layout (functional update)');
        return updatedNodesFromLayout;
      }
      return nodesToLayout;
    });
    return layoutAppliedReturnFlag;
  }

  private _applyHorizontalLayout(): boolean {
    let layoutAppliedReturnFlag = false;

    this._setNodes((currentNodesGlobal) => {
      const nodesToLayout = currentNodesGlobal;

      const NODE_WIDTH = CarbonFlowActionHandler._nodeWidth;
      const NODE_HEIGHT = CarbonFlowActionHandler._nodeHeight;
      const HORIZONTAL_SPACING = 250;
      const VERTICAL_SPACING = 200;
      const PADDING = 50;

      const stages: NodeType[] = ['product', 'manufacturing', 'distribution', 'usage', 'disposal', 'finalProduct'];
      const stageMap = new Map<string, Node<NodeData>[]>();
      stages.forEach((stage) => stageMap.set(stage, []));
      const miscNodes: Node<NodeData>[] = [];
      let maxNodesInCol = 0;

      nodesToLayout.forEach((node) => { // Use nodesToLayout
        const stage = node.type as string;
        if (stageMap.has(stage)) {
          stageMap.get(stage)?.push(node);
          maxNodesInCol = Math.max(maxNodesInCol, stageMap.get(stage)!.length);
        } else {
          miscNodes.push(node);
        }
      });
      maxNodesInCol = Math.max(maxNodesInCol, miscNodes.length, 1);

      const updatedNodesFromLayout: Node<NodeData>[] = [];
      let currentX = PADDING;
      const totalMaxHeight = maxNodesInCol * (NODE_HEIGHT + VERTICAL_SPACING) - VERTICAL_SPACING;

      stages.forEach((stage) => {
        const nodesInStage = stageMap.get(stage) || [];
        if (nodesInStage.length > 0) {
          const stageHeight = nodesInStage.length * (NODE_HEIGHT + VERTICAL_SPACING) - VERTICAL_SPACING;
          let currentY = PADDING + (totalMaxHeight - stageHeight) / 2;
          nodesInStage.forEach((node) => {
            updatedNodesFromLayout.push({ ...node, position: { x: currentX, y: currentY } });
            currentY += NODE_HEIGHT + VERTICAL_SPACING;
          });
          currentX += NODE_WIDTH + HORIZONTAL_SPACING;
        }
      });

      if (miscNodes.length > 0) {
        const stageHeight = miscNodes.length * (NODE_HEIGHT + VERTICAL_SPACING) - VERTICAL_SPACING;
        let currentY = PADDING + (totalMaxHeight - stageHeight) / 2;
        miscNodes.forEach((node) => {
          updatedNodesFromLayout.push({ ...node, position: { x: currentX, y: currentY } });
          currentY += NODE_HEIGHT + VERTICAL_SPACING;
        });
      }

      let positionsActuallyChanged = false;
      if (nodesToLayout.length !== updatedNodesFromLayout.length) {
        positionsActuallyChanged = true;
      } else {
        const originalNodePositions = new Map(nodesToLayout.map(n => [n.id, n.position]));
        for (const updatedNode of updatedNodesFromLayout) {
            const originalPos = originalNodePositions.get(updatedNode.id);
            if (!originalPos || originalPos.x !== updatedNode.position.x || originalPos.y !== updatedNode.position.y) {
                positionsActuallyChanged = true;
                break;
            }
        }
      }

      if (positionsActuallyChanged) {
        layoutAppliedReturnFlag = true;
        this._updateEdgesInternal(updatedNodesFromLayout); // Pass the newly layouted nodes
        console.log('Successfully applied Horizontal layout (functional update)');
        return updatedNodesFromLayout;
      }
      return nodesToLayout;
    });
    return layoutAppliedReturnFlag;
  }

  private _applyRadialLayout(): boolean {
    let layoutAppliedReturnFlag = false;

    this._setNodes((currentNodesGlobal) => {
      const nodesToLayout = currentNodesGlobal;

      if (nodesToLayout.length <= 1) {
        console.log('Skipping radial layout for 1 or 0 nodes.');
        // No change to layoutAppliedReturnFlag, it remains false
        return nodesToLayout; // Return original nodes
      }

      const centerNodeCandidate = nodesToLayout.find((node) => node.type === 'finalProduct');
      const centerNode = centerNodeCandidate || nodesToLayout[0];
      const otherNodes = nodesToLayout.filter((node) => node.id !== centerNode.id);

      const approxWidth = Math.max(800, Math.sqrt(nodesToLayout.length) * (CarbonFlowActionHandler._nodeWidth + 150));
      const approxHeight = Math.max(600, Math.sqrt(nodesToLayout.length) * (CarbonFlowActionHandler._nodeHeight + 150));
      const centerX = approxWidth / 2;
      const centerY = approxHeight / 2;
      const radius = Math.max(200, Math.min(centerX * 0.8, centerY * 0.8, otherNodes.length * 50));

      const updatedNodesFromLayout: Node<NodeData>[] = [];
      updatedNodesFromLayout.push({ ...centerNode, position: { x: centerX, y: centerY } });

      otherNodes.forEach((node, index) => {
        const angle = (2 * Math.PI * index) / otherNodes.length;
        const x = centerX + radius * Math.cos(angle) - CarbonFlowActionHandler._nodeWidth / 2;
        const y = centerY + radius * Math.sin(angle) - CarbonFlowActionHandler._nodeHeight / 2;
        updatedNodesFromLayout.push({ ...node, position: { x, y } });
      });

      // Ensure all nodes from nodesToLayout are included if any were missed (e.g. if centerNode logic was complex)
      if (updatedNodesFromLayout.length !== nodesToLayout.length) {
          const layoutIds = new Set(updatedNodesFromLayout.map(n => n.id));
          nodesToLayout.forEach(n => {
              if (!layoutIds.has(n.id)) {
                  updatedNodesFromLayout.push({...n, position: {x: centerX, y: centerY}}); // Default position for any missed
              }
          });
      }


      let positionsActuallyChanged = false;
      // Check if positions actually changed compared to nodesToLayout
      if (nodesToLayout.length !== updatedNodesFromLayout.length) {
         positionsActuallyChanged = true; // Should not happen if logic is correct
      } else {
        const originalNodePositions = new Map(nodesToLayout.map(n => [n.id, n.position]));
        for (const updatedNode of updatedNodesFromLayout) {
            const originalPos = originalNodePositions.get(updatedNode.id);
            if (!originalPos || originalPos.x !== updatedNode.position.x || originalPos.y !== updatedNode.position.y) {
                positionsActuallyChanged = true;
                break;
            }
        }
      }


      if (positionsActuallyChanged) {
        layoutAppliedReturnFlag = true;
        this._updateEdgesInternal(updatedNodesFromLayout); // Pass the newly layouted nodes
        console.log('Successfully applied Radial layout (functional update)');
        return updatedNodesFromLayout;
      }
      return nodesToLayout;
    });

    return layoutAppliedReturnFlag;
  }

  /**
   * 计算碳足迹
   */
  private _handleCalculate(action: CarbonFlowAction): void {
    try {
      const footprintsChanged = this._calculateNodeFootprints();
      let totalChanged = false;
      // Find final product node ID, default to null if not found
      const targetNodeId = action.target || this._nodes.find((n) => n.type === 'finalProduct')?.id || null;

      if (targetNodeId) {
        totalChanged = this._calculateTotalFootprint(targetNodeId);
      }

      if (footprintsChanged || totalChanged) {
        console.log('成功计算碳足迹');
      } else {
        console.log('碳足迹计算未导致数值变化。');
      }
    } catch (error) {
      console.error('计算碳足迹失败:', error);
    }
  }

  private _getActivityData(node: Node<NodeData>): number {
    const data = node.data;
    // Ensure node.data.quantity is used if it's the primary activity data field
    // For now, respecting existing logic, but this might need unification.
    // The unit of this returned value is assumed to be node.data.activityUnit
    switch (node.type as NodeType) {
      case 'product':
        // Prefer quantity if available and meaningful, otherwise fallback to weight
        return Number((data as ProductNodeData).quantity) || Number((data as ProductNodeData).weight) || 1;
      case 'manufacturing':
        return Number((data as ManufacturingNodeData).quantity) || Number((data as ManufacturingNodeData).energyConsumption) || 1;
      case 'distribution':

        return Number((data as DistributionNodeData).quantity) || Number((data as DistributionNodeData).transportationDistance) || 1;
      case 'usage': {
        const usageData = data as UsageNodeData;
        // If quantity is provided for usage, it might represent the number of functional units directly
        if (usageData.quantity && Number(usageData.quantity)) {
          return Number(usageData.quantity);
        }
        const activity =
          (Number(usageData.lifespan) || 0) *
          (Number(usageData.usageFrequency) || 0) *
          (Number(usageData.energyConsumptionPerUse) || 0);
        return activity || 1;
      }
      case 'disposal':
        return Number((data as DisposalNodeData).quantity) || 1; // Assuming quantity is relevant here too
      case 'finalProduct':
        return 1; // Final product's own activity data is not directly used for its footprint sum
      default:
        console.warn(`Unhandled node type in _getActivityData: ${node.type as string}`);
        return 1;
    }
  }

  private _calculateNodeFootprints(): boolean {
    let overallChanged = false;

    this._setNodes(currentNodes => {
      let changedInThisUpdate = false;
      const updatedNodes = currentNodes.map((node) => {
        if (node.type === 'finalProduct') {
          return node;
        }

        const carbonFactor = Number(node.data.carbonFactor) || 0;
        const activityDataOriginal = this._getActivityData(node);
        const unitConversionFactorValue = Number(node.data.unitConversion) || 1;

        const activityDataInFactorUnit = activityDataOriginal * unitConversionFactorValue;
        const carbonFootprintCalc = carbonFactor * activityDataInFactorUnit;

        const currentFootprint = Number(node.data.carbonFootprint) || 0;
        const footprintChanged = Math.abs(currentFootprint - carbonFootprintCalc) > 1e-9;

        if (footprintChanged) {
          changedInThisUpdate = true;
          return {
            ...node,
            data: {
              ...node.data,
              carbonFootprint: String(carbonFootprintCalc),
            } as NodeData,
          };
        }
        return node;
      });

      if (changedInThisUpdate) {
        overallChanged = true; // Set the flag for the outer function
        console.log('Node footprints recalculated using unit conversions (functional update).');
        return updatedNodes;
      }
      return currentNodes; // No change
    });

    return overallChanged;
  }

  private _calculateTotalFootprint(targetNodeId: string): boolean {
    const targetNode = this._nodes.find((node) => node.id === targetNodeId);
    if (!targetNode || targetNode.type !== 'finalProduct') {
      console.warn(`计算总足迹的目标节点无效或不是 finalProduct: ${targetNodeId}`);
      return false;
    }

    let totalFootprint = 0;
    const visited = new Set<string>();
    const nodeMap = new Map(this._nodes.map((n) => [n.id, n]));
    const edgesMap = new Map<string, Edge[]>();
    this._edges.forEach((edge) => {
      if (!edgesMap.has(edge.target)) edgesMap.set(edge.target, []);
      edgesMap.get(edge.target)?.push(edge);
    });

    const calculateContribution = (nodeId: string): number => {
      if (visited.has(nodeId)) return 0;
      visited.add(nodeId);

      const node = nodeMap.get(nodeId);
      if (!node || node.type === 'finalProduct') return 0;

      let upstreamFootprint = 0;
      const incomingEdges = edgesMap.get(nodeId) || [];
      incomingEdges.forEach((edge) => {
        upstreamFootprint += calculateContribution(edge.source);
      });

      return (Number(node.data.carbonFootprint) || 0) + upstreamFootprint;
    };

    const finalIncomingEdges = edgesMap.get(targetNodeId) || [];
    finalIncomingEdges.forEach((edge) => {
      visited.clear();
      totalFootprint += calculateContribution(edge.source);
    });

    let changed = false;
    this._setNodes((currentNodes) => {
      let nodeChanged = false;
      const updatedNodesResult = currentNodes.map((node) => {
        if (node.id === targetNode.id) {
          const finalProductData = node.data as FinalProductNodeData;
          const currentTotal = Number(finalProductData.totalCarbonFootprint) || 0;
          const currentCompliance = finalProductData.complianceStatus || 'pending';
          const newCompliance = 'complete';

          if (Math.abs(currentTotal - totalFootprint) > 1e-6 || currentCompliance !== newCompliance) {
            changed = true;
            nodeChanged = true;
            return {
              ...node,
              data: {
                ...finalProductData,
                totalCarbonFootprint: totalFootprint,
                complianceStatus: newCompliance,
              } as FinalProductNodeData,
            };
          }
        }
        return node;
      });
      return nodeChanged ? updatedNodesResult : currentNodes;
    });

    if (changed) {
      console.log(`Total footprint updated for ${targetNodeId}: ${totalFootprint}`);
    }

    return changed;
  }

  /**
   * 碳因子数据库匹配 (Simulation)
   */
  private async _handleCarbonFactorMatch(action: CarbonFlowAction): Promise<void> {
    console.log('Handling Carbon Factor Match action:', action);
    let updated = false;

    type NodeUpdateInfo = {
      node: Node<NodeData>;
      factor: number; // kgCO2e / unit
      activityName: string;
      unit: string; // activity unit for the factor
      geography?: string; // 新增: 地理位置
      activityUUID?: string; // 新增: 活动UUID
      dataSource?: string; // 新增: 数据来源
      importDate?: string; // 新增: 导入日期
    };

    const nodesToUpdate: NodeUpdateInfo[] = [];

    const matchResults = {
      success: [] as string[],
      failed: [] as string[],
      logs: [] as string[],
    };

    for (const node of this._nodes) {
      const currentFactor = node.data.carbonFactor;

      if (action.nodeId) {
        const nodeIds = action.nodeId.split(',');
        if (!nodeIds.includes(node.id)) {
          continue;
        }
      }

      if (currentFactor === undefined || currentFactor === '0' || currentFactor === '') {
        matchResults.logs.push(`开始为节点 "${node.data.label || node.id}" 尝试匹配碳因子...`);

        try {
          const climatiqResult = await this._fetchCarbonFactorFromClimatiqAPI(node);

          if (climatiqResult) {
            nodesToUpdate.push({
              node,
              factor: climatiqResult.factor,
              activityName: climatiqResult.activityName,
              unit: climatiqResult.unit,
              geography: climatiqResult.geography,
              activityUUID: climatiqResult.activityUUID,
              dataSource: climatiqResult.dataSource,
              importDate: climatiqResult.importDate,
            });

            matchResults.success.push(node.id);
            matchResults.logs.push(
              `节点 "${node.data.label || node.id}" 通过Climatiq API匹配成功，碳因子: ${climatiqResult.factor}`,
            );

            updated = true;
            continue;
          } else {
            matchResults.logs.push(
              `节点 "${node.data.label || node.id}" 通过Climatiq API匹配失败，尝试使用Climateseal API...`,
            );
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          matchResults.logs.push(`节点 "${node.data.label || node.id}" 通过Climatiq API匹配出错: ${errorMessage}`);
        }

        try {
          const climatesealResult = await this._fetchCarbonFactorFromClimatesealAPI(node);

          if (climatesealResult) {
            nodesToUpdate.push({
              node,
              factor: climatesealResult.factor,
              activityName: climatesealResult.activityName,
              unit: climatesealResult.unit,
              geography: climatesealResult.geography,
              activityUUID: climatesealResult.activityUUID,
              dataSource: climatesealResult.dataSource,
              importDate: climatesealResult.importDate,
            });

            matchResults.success.push(node.id);
            matchResults.logs.push(
              `节点 "${node.data.label || node.id}" 通过Climateseal API匹配成功，碳因子: ${climatesealResult.factor}`,
            );

            updated = true;
          } else {
            matchResults.failed.push(node.id);
            matchResults.logs.push(`节点 "${node.data.label || node.id}" 通过两个API都匹配失败`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          matchResults.logs.push(`节点 "${node.data.label || node.id}" 通过Climateseal API匹配出错: ${errorMessage}`);

          if (!matchResults.success.includes(node.id)) {
            matchResults.failed.push(node.id);
          }
        }
      } else if (action.nodeId) {
        matchResults.logs.push(`跳过节点 "${node.data.label || node.id}"，因为它已经有碳因子: ${currentFactor}`);
      }
    }

    if (nodesToUpdate.length > 0) {
      this._setNodes((currentNodes) => {
        const updatedNodesMap = currentNodes.map((node) => {
          const updateInfo = nodesToUpdate.find((u) => u.node.id === node.id);
          if (updateInfo) {
            console.log('[CarbonFactorMatch] Update info for node:', node.id, updateInfo); // <--- ADD THIS LOG
            updated = true;
            const nodeActivityUnit = node.data.activityUnit;
            const apiFactorActivityUnit = updateInfo.unit;
            const conversionMultiplier = this._getConversionMultiplier(nodeActivityUnit, apiFactorActivityUnit);

            return {
              ...node,
              data: {
                ...node.data,
                carbonFactor: String(updateInfo.factor), // Factor in kgCO2e / apiFactorActivityUnit
                carbonFactorName: updateInfo.activityName,
                carbonFactorUnit: apiFactorActivityUnit, // The unit of activity for which carbonFactor is specified
                unitConversion: String(conversionMultiplier), // Multiplier to convert node's activityUnit to carbonFactorUnit
                carbonFactordataSource: updateInfo.dataSource || '数据库匹配', // Use API's dataSource, fallback to default text
                emissionFactorGeographicalRepresentativeness: updateInfo.geography, // 使用API返回的地理位置
                emissionFactorTemporalRepresentativeness: updateInfo.importDate, // 使用API返回的导入日期
                activityUUID: updateInfo.activityUUID, // Store activityUUID from API
              } as NodeData, // 确保类型正确
            };
          }
          return node;
        });
        return updatedNodesMap; // Corrected: was updatedNodes
      });

      if (updated) {
        console.log(`碳因子匹配完成，已更新 ${nodesToUpdate.length} 个节点`);
        this._handleCalculate({
          type: 'carbonflow',
          operation: 'calculate',
          content: 'Recalculate after factor match',
        });
      }
    } else {
      console.log('碳因子匹配完成，没有需要更新的节点');
    }

    window.dispatchEvent(
      new CustomEvent('carbonflow-match-results', {
        detail: matchResults,
      }),
    );

    // 因子匹配完成后，触发chat响应
    window.dispatchEvent(
      new CustomEvent('carbonflow-trigger-chat', {
        detail: {
          type: 'factor_match_complete',
          matchResults: {
            totalMatched: nodesToUpdate.length,
            successCount: matchResults.success.length,
            failedCount: matchResults.failed.length,
            updated: updated
          }
        }
      })
    );

    console.log('Carbon factor match operation completed, updated:', updated);
    console.log('Match results:', matchResults);
  }

  private async _fetchCarbonFactorFromClimatesealAPI(node: Node<NodeData>): Promise<CarbonFactorResult | null> {
    try {
      const label = node.data.label || '';
      if (!label || label.trim() === '') {
        console.warn(`节点 ${node.id} 没有有效的标签用于碳因子查询`);
        return null;
      }

      console.log(`尝试为节点 ${node.id} (${label}) 从Climateseal API获取碳因子`);

      const requestBody = {
        labels: [label],
        top_k: 3,
        min_score: 0.3,
        embedding_model: 'dashscope_v3',
        search_method: 'script_score',
      };

      console.log('Climateseal requestBody', requestBody);
      const response = await fetch('https://api.climateseals.com/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Climateseal API返回错误状态: ${response.status}`);
      }

      const data = (await response.json()) as {
        success: boolean;
        results: Array<{
          query_label: string;
          matches: Array<{
            kg_co2eq: number; // This is the factor value in kgCO2e per reference_product_unit
            activity_name: string;
            reference_product_unit: string; // This is the activity unit for the factor
            geography: string; // 新增
            activity_uuid_product_uuid: string; // 新增
            data_source: string; // 新增
            import_date: string; // 新增
            [key: string]: any;
          }>;
          error: string | null;
        }>;
      };
      console.log('Climateseal 碳因子API响应:', data);

      if (data.results && data.results.length > 0 && data.results[0].matches && data.results[0].matches.length > 0) {
        const bestMatch = data.results[0].matches[0];
        return {
          factor: bestMatch.kg_co2eq, // Factor in kgCO2e / reference_product_unit
          activityName: bestMatch.activity_name || '',
          unit: bestMatch.reference_product_unit || 'kg', // Activity unit for the factor
          geography: bestMatch.geography, // 新增
          activityUUID: bestMatch.activity_uuid_product_uuid || undefined, // Use activity_uuid_product_uuid, fallback to undefined
          dataSource: bestMatch.data_source || undefined, // Use data_source, fallback to undefined
          importDate: bestMatch.import_date || undefined, // Use import_date, fallback to undefined
        };
      } else {
        console.warn('Climateseal API没有返回匹配结果');
        return null;
      }
    } catch (error) {
      console.error(`从Climateseal获取碳因子时出错:`, error);
      console.log(`Climateseal API调用失败，不使用默认碳因子`);
      return null;
    }
  }

  private async _fetchCarbonFactorFromClimatiqAPI(node: Node<NodeData>): Promise<CarbonFactorResult | null> {
    try {
      const label = node.data.label || '';
      if (!label || label.trim() === '') {
        console.warn(`节点 ${node.id} 没有有效的标签用于碳因子查询`);
        return null;
      }

      console.log(`尝试为节点 ${node.id} (${label}) 从Climatiq API获取碳因子`);

      // This section requires careful review to align activity_id, parameters, and node data semantics.
      // For now, we proceed with the existing logic of using 'energy' and 'energy_unit'.
      // The `CarbonFactorResult.unit` will be 'kWh' due to `energy_unit: 'kWh'`.
      let activityId = 'electricity-supply_grid-source_residual_mix';
      let activityValue = 1000; // This is the 'energy' parameter value
      const activityUnitForFactor = 'kWh'; // This is due to requestBody.parameters.energy_unit

      switch (node.type as NodeType) {
        case 'product':
          activityId = 'material-production_average-steel-primary'; // Factor likely per unit mass
          // The 'energy' parameter is currently (mis)used for weight.
          activityValue = Number((node.data as ProductNodeData).weight) || 1000;
          // Ideally, activityUnitForFactor should be the mass unit, but Climatiq call uses 'kWh'.
          break;
        case 'distribution':
          activityId = 'freight_vehicle-type_truck-size_heavy-fuel_source_diesel-distance_long'; // Factor likely per unit distance or tkm
          activityValue = Number((node.data as DistributionNodeData).transportationDistance) || 1000;
          break;
        case 'manufacturing':
          activityId = 'electricity-supply_grid-source_residual_mix'; // Factor per kWh
          activityValue = Number((node.data as ManufacturingNodeData).energyConsumption) || 1000;
          break;
      }

      const requestBody = {
        emission_factor: {
          activity_id: activityId,
          data_version: '^21',
        },
        parameters: {
          energy: activityValue, // Value of activity (e.g. weight, distance, energy consumption)
          energy_unit: activityUnitForFactor, // Unit of activityValue, hardcoded to 'kWh'
        },
      };

      console.log('Climatiq requestBody', requestBody);

      const API_KEY = 'KSBRPY3WYN3HZ5XBCKD0FYD80R';
      const response = await fetch('https://api.climatiq.io/data/v1/estimate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Climatiq API返回错误状态: ${response.status}`);
      }

      const data = (await response.json()) as {
        co2e?: number; // Total CO2e for the given parameters
        emission_factor?: { name?: string };
        co2e_unit?: string; // Unit of data.co2e (e.g., 'kg', 'g')
      };
      console.log('Climatiq 碳因子API响应:', data);

      if (data && data.co2e !== undefined && typeof data.co2e === 'number' && activityValue !== 0) {
        let factorKgCo2ePerActivityUnit = data.co2e / activityValue; // Factor in [data.co2e_unit] / [activityUnitForFactor]

        // Convert factor to kgCO2e / activityUnitForFactor
        if (data.co2e_unit === 'g') {
          factorKgCo2ePerActivityUnit /= 1000;
        } else if (data.co2e_unit === 't' || data.co2e_unit === 'tonne') {
          factorKgCo2ePerActivityUnit *= 1000;
        } else if (data.co2e_unit !== 'kg') {
          console.warn(
            `Climatiq CO2e unit is ${data.co2e_unit}. Factor is ${factorKgCo2ePerActivityUnit} [${data.co2e_unit}/${activityUnitForFactor}]. Conversion to kgCO2e might be inaccurate if not 'g', 't', or 'kg'.`,
          );
          // Add more conversions if necessary (e.g., from lbs)
        }

        return {
          factor: factorKgCo2ePerActivityUnit, // Factor in kgCO2e / activityUnitForFactor (e.g. kgCO2e/kWh)
          activityName: data.emission_factor?.name || activityId,
          unit: activityUnitForFactor, // Activity unit for the factor (e.g. 'kWh')
        };
      } else {
        console.warn('Climatiq API响应格式不符合预期或 activityValue (energy parameter) 为0');
        return null;
      }
    } catch (error) {
      console.error(`从Climatiq获取碳因子时出错:`, error);
      console.log(`Climatiq API调用失败`);
      return null;
    }
  }

  /**
   * 更新边 (Ensures edges are valid after node changes)
   * This method is now an internal helper called by layout methods within their setNodes callback.
   * It directly triggers a functional update on edges.
   */
  private _updateEdgesInternal(currentLayoutedNodes: Node<NodeData>[]): void {
    this._setEdges((currentEdges) => {
      const nodeIds = new Set(currentLayoutedNodes.map((n) => n.id));
      const originalEdgeCount = currentEdges.length;
      const validEdges = currentEdges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));

      if (validEdges.length !== originalEdgeCount) {
        console.log(`Removing ${originalEdgeCount - validEdges.length} invalid edges (functional update).`);
        this._handleCalculate({ // This calculate call might need similar functional update if it writes to nodes
          type: 'carbonflow',
          operation: 'calculate',
          content: 'Recalculate after edge update',
        });
        return validEdges;
      }
      return currentEdges;
    });
  }

  /**
   * Checks if all required fields for a node's type are present and valid.
   * TODO: Implement based on actual required fields per node type defined in `~/types/nodes`.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _checkRequiredFields(node: Node<NodeData>): boolean {
    /*
     * Example placeholder check: ensure label and carbon factor exist
     * if (!node.data.label || node.data.carbonFactor === undefined) {
     *
     *   return false;
     *
     * }
     *
     * // Add more checks based on node.type using type guards if possible
     *
     * // switch(node.type) { case 'product': if (!(node.data as ProductNodeData).weight) return false; ... }
     *
     */
    return true;
  }

  /**
   * Maps commonly used unit strings to the abbreviations expected by the 'convert-units' library.
   * @param unit The unit string to map.
   * @returns The corresponding 'convert-units' abbreviation, or the original unit if no mapping is found.
   */
  private _mapUnitToConvertUnitsAbbreviation(unit: string | undefined): string | undefined {
    if (!unit) return undefined;
    const normalizedUnit = String(unit).toLowerCase().trim();

    const unitMap: Record<string, string> = {
      // Weight
      'kg': 'kg',
      'kilogram': 'kg',
      'gram': 'g',
      'g': 'g',
      'tonne': 't',
      't': 't',
      'metric ton': 't',
      'lb': 'lb',
      'pound': 'lb',
      'oz': 'oz', // mass ounce
      'ounce': 'oz',

      // Energy
      'kwh': 'kWh',
      'kilowatt hour': 'kWh',
      'wh': 'Wh',
      'watt hour': 'Wh',
      'mwh': 'MWh',
      'megawatt hour': 'MWh',
      'gwh': 'GWh',
      'gigawatt hour': 'GWh',
      'mj': 'MJ',
      'megajoule': 'MJ',
      'gj': 'GJ',
      'gigajoule': 'GJ',
      'btu': 'Btu', // British Thermal Unit
      'british thermal unit': 'Btu',

      // Distance
      'km': 'km',
      'kilometer': 'km',
      'm': 'm',
      'meter': 'm',
      'mi': 'mi',
      'mile': 'mi',
      'nmi': 'nMi', // Nautical Mile
      'nautical mile': 'nMi',

      // Volume
      'l': 'l',
      'liter': 'l',
      'litre': 'l',
      'ml': 'ml',
      'milliliter': 'ml',
      'm3': 'm3', // Cubic meter
      'cubic meter': 'm3',
      'gallon': 'gal', // US liquid gallon is default for 'gal'
      'us gallon': 'gal',
      'uk gallon': 'galUK', // Imperial gallon
      'imperial gallon': 'galUK',

      // Add other units as needed
    };

    return unitMap[normalizedUnit] || normalizedUnit; // Return mapped or original if not in map
  }

  /**
   * Calculates a conversion multiplier to convert a value from a source unit to a target unit,
   * using the 'convert-units' library.
   * @param sourceUnit The unit of the original value (e.g., node.data.activityUnit).
   * @param targetUnit The unit required for the calculation (e.g., carbonFactor's activity unit).
   * @returns A multiplier. If conversion is not possible or units are same/unknown, returns 1.
   */
  private _getConversionMultiplier(sourceUnit: string | undefined, targetUnit: string | undefined): number {
    if (!sourceUnit || !targetUnit) {
      return 1;
    }

    const sUnitRaw = String(sourceUnit).toLowerCase().trim();
    const tUnitRaw = String(targetUnit).toLowerCase().trim();

    if (sUnitRaw === tUnitRaw) {
      return 1;
    }

    const sUnit = this._mapUnitToConvertUnitsAbbreviation(sUnitRaw);
    const tUnit = this._mapUnitToConvertUnitsAbbreviation(tUnitRaw);

    if (!sUnit || !tUnit) {
      console.warn(
        `Unit mapping failed for source '${sourceUnit}' or target '${targetUnit}'. Defaulting to conversion factor 1.`,
      );
      return 1;
    }
    
    if (sUnit === tUnit) { // Check again after mapping
        return 1;
    }

    try {
      // Ensure 'convert' is available in the scope (e.g., imported at the top of the file)
      // import convert from 'convert-units'; // This line is now at the top of the file
      const multiplier = convert(1).from(sUnit as any).to(tUnit as any); // Use 'as any' if types are tricky with convert-units
      
      if (typeof multiplier === 'number' && !isNaN(multiplier)) {
        return multiplier;
      } else {
        console.warn(
          `'convert-units' returned an unexpected value for ${sUnit} to ${tUnit}: ${multiplier}. Defaulting to 1.`,
        );
        return 1;
      }
    } catch (error) {
      console.warn(
        `Cannot convert unit from '${sourceUnit}' (mapped to '${sUnit}') to '${targetUnit}' (mapped to '${tUnit}') using 'convert-units'. Error: ${(error as Error).message}. Defaulting to conversion factor 1.`,
      );
      return 1;
    }
  }

  /**
   * AI一键补全运输数据
   * @param action CarbonFlowAction，需包含 nodeId（逗号分隔的id字符串）
   */
  private async _handleAIAutoFillTransportData(action: CarbonFlowAction): Promise<void> {
    if (!action.nodeId) return;
    const nodeIds = action.nodeId.split(',').map(id => id.trim()).filter(Boolean);
    if (!nodeIds.length) return;
    const nodesToFill = this._nodes.filter(n => nodeIds.includes(n.id));
    if (!nodesToFill.length) return;

    // 构造请求体，增加 nodeType 和 category
    const requestBody = nodesToFill.map(node => ({
      nodeId: node.id,
      startPoint: (node.data as any).startPoint,
      endPoint: (node.data as any).endPoint,
      name: node.data.label || node.data.nodeName || '',
      nodeType: node.type,
      category: (node.data as any).emissionType || '',
    }));

    let aiResult: any[] = [];
    try {
      const response = await fetch('/api/ai-autofill-transport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: requestBody }),
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
        if (
          errorBody &&
          typeof errorBody === 'object' &&
          errorBody !== null &&
          'message' in errorBody &&
          typeof errorBody.message === 'string'
        ) {
          throw new Error(`API Error (${response.status}): ${errorBody.message}`);
        } else {
          throw new Error(`API Error (${response.status}): ${response.statusText}`);
        }
      }
      aiResult = await response.json();
    } catch (error) {
      console.error('调用 /api/ai-autofill-transport 失败:', error);
      window.dispatchEvent(new CustomEvent('carbonflow-autofill-results', {
        detail: { success: [], failed: nodeIds, logs: [`AI补全运输数据API调用失败: ${error instanceof Error ? error.message : String(error)}`] },
      }));
      return;
    }

    // aiResult: [{ nodeId, transportType, distance, distanceUnit, notes }]
    const success: string[] = [];
    const failed: string[] = [];
    const logs: string[] = [];
    const updatedNodes = this._nodes.map(node => {
      const ai = aiResult.find(r => r.nodeId === node.id);
      if (!ai) return node;
      try {
        // 更新节点数据
        const newData = {
          ...node.data,
          transportationMode: ai.transportType, // 保留运输方式的更新
          transportationDistance: String(ai.distance), 
          transportationDistanceUnit: ai.distanceUnit,
          quantity: String(ai.distance), // 新增：将AI返回的distance赋给quantity
          activityUnit: 'km', // 新增：将activityUnit固定为'km'
          notes: ai.notes, // 保留备注信息的更新
        };
        success.push(node.id);
        logs.push(`节点${node.id}补全成功: 运输方式=${ai.transportType}, 活动数据数值=${ai.distance}, 活动数据单位=km`);
        console.log('更新节点111111', node.id, newData);
        return { ...node, data: newData as NodeData }; // Add type assertion
      } catch (e) {
        failed.push(node.id);
        logs.push(`节点${node.id}补全失败: ${(e as Error).message}`);
        return node;
      }
    });
    // 统计未返回的节点为失败
    nodeIds.forEach(id => {
      if (!success.includes(id) && !failed.includes(id)) {
        failed.push(id);
        logs.push(`节点${id}未返回AI补全结果`);
      }
    });
    // 更新节点
    console.log('更新节点', updatedNodes);
    this._setNodes(updatedNodes);
    window.dispatchEvent(new CustomEvent('carbonflow-autofill-results', {
      detail: { success, failed, logs },
    }));
    if (success.length > 0) {
      window.dispatchEvent(new CustomEvent('carbonflow-data-updated', {
        detail: { action: 'AI_AUTOFILL_TRANSPORT', nodeIds: success },
      }));
    }
  }




  private async _handleAIAutoFillConversionData(action: CarbonFlowAction): Promise<void> {
    if (!action.nodeId) {
      console.warn('AI AutoFill Conversion Data: 操作中缺少 nodeId。');
      window.dispatchEvent(new CustomEvent('carbonflow-autofill-results', {
        detail: { success: [], failed: [], logs: ['AI补全转换数据失败: 操作缺少nodeId'] },
      }));
      return;
    }

    const nodeIds = action.nodeId.split(',').map(id => id.trim()).filter(Boolean);
    if (!nodeIds.length) {
      console.warn('AI AutoFill Conversion Data: 未提供有效的 nodeId。');
      window.dispatchEvent(new CustomEvent('carbonflow-autofill-results', {
        detail: { success: [], failed: [], logs: ['AI补全转换数据失败: 未提供有效的nodeId'] },
      }));
      return;
    }

    const nodesToFill = this._nodes.filter(n => nodeIds.includes(n.id));
    if (!nodesToFill.length) {
      console.warn('AI AutoFill Conversion Data: 未找到与提供的 ID 匹配的节点。');
      window.dispatchEvent(new CustomEvent('carbonflow-autofill-results', {
        detail: { success: [], failed: nodeIds, logs: ['AI补全转换数据失败: 未找到与ID匹配的节点'] },
      }));
      return;
    }

    const requestBody = nodesToFill.map(node => ({
      nodeId: node.id,
      name: node.data.label || node.data.nodeName || '',
      nodeType: node.type,
      category: (node.data as any).emissionType || '', // 使用 any 以简化，后续可考虑更严格的类型
      currentQuantity: node.data.quantity,
      currentActivityUnit: node.data.activityUnit,
      carbonFactorUnit: node.data.carbonFactorUnit, // AI 可能需要碳因子的单位作为参考
    }));

    let aiResults: Array<{
      nodeId: string;
      unitConversion?: string; // 单位转换的乘数
      targetUnit?: string;     // 碳因子实际对应的单位或应转换到的目标单位
      // convertedQuantity?: string; // AI也可能直接返回转换后的活动量 (较少见)
      notes?: string;          // AI返回的备注信息
    }> = [];

    try {
      const response = await fetch('/api/ai-autofill-conversion', { // 新的API端点
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: requestBody }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: '无法解析错误响应' }));
        const errorMessage = (typeof errorBody === 'object' && errorBody !== null && 'message' in errorBody && typeof errorBody.message === 'string')
          ? errorBody.message
          : response.statusText;
        throw new Error(`API 错误 (${response.status}): ${errorMessage}`);
      }
      aiResults = await response.json();
      console.log('AI AutoFill Conversion Data - API Response:', aiResults);
    } catch (error) {
      console.error('调用 /api/ai-autofill-conversion 失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      window.dispatchEvent(new CustomEvent('carbonflow-autofill-results', {
        detail: { success: [], failed: nodeIds, logs: [`AI补全转换数据API调用失败: ${errorMessage}`] },
      }));
      return;
    }

    const success: string[] = [];
    const failed: string[] = [];
    const logs: string[] = [];
    let nodesActuallyChangedInThisCall = false;

    this._setNodes(currentNodes => {
      let internalChanges = false;
      const updatedNodes = currentNodes.map(node => {
        const aiData = aiResults.find(r => r.nodeId === node.id);
        if (!aiData) return node; // 没有此节点的AI数据

        try {
          const newData = { ...node.data };
          let nodeChangedThisIteration = false;

          if (aiData.unitConversion !== undefined) {
            newData.unitConversion = String(aiData.unitConversion);
            logs.push(`节点 ${node.id} (${newData.label}): 单位转换因子已更新为 ${aiData.unitConversion}. ${aiData.notes || ''}`);
            nodeChangedThisIteration = true;
          }

          if (aiData.targetUnit !== undefined && 'carbonFactorUnit' in newData) {
            (newData as any).carbonFactorUnit = aiData.targetUnit;
            logs.push(`节点 ${node.id} (${newData.label}): 碳因子单位已更新为 ${aiData.targetUnit}.`);
            nodeChangedThisIteration = true;
          }
          
          // 如果AI还提供了其他可以更新的字段，可以在这里添加逻辑
          // 例如: newData.someOtherField = aiData.someOtherField;

          if (nodeChangedThisIteration) {
            if (!success.includes(node.id)) success.push(node.id);
            internalChanges = true;
            nodesActuallyChangedInThisCall = true; // 更新顶层作用域的标志
            return { ...node, data: newData as NodeData };
          }
          return node;

        } catch (e) {
          if (!failed.includes(node.id)) failed.push(node.id);
          logs.push(`节点 ${node.id} (${node.data.label || 'N/A'}) AI数据应用失败: ${(e as Error).message}`);
          return node;
        }
      });

      // 将请求处理但未收到有效AI结果的节点标记为失败
      nodeIds.forEach(id => {
        if (!success.includes(id) && !failed.includes(id)) {
          const targetNode = currentNodes.find(n => n.id === id);
          const nodeLabelInfo = targetNode ? `${targetNode.data.label || targetNode.id}` : id;
          failed.push(id);
          logs.push(`节点 ${nodeLabelInfo}: AI未返回有效补全结果或处理失败。`);
        }
      });
      
      return internalChanges ? updatedNodes : currentNodes;
    });

    window.dispatchEvent(new CustomEvent('carbonflow-autofill-results', {
      detail: { success, failed, logs },
    }));

    if (nodesActuallyChangedInThisCall) {
      console.log(`AI AutoFill Conversion Data: 成功更新 ${success.length} 个节点。`);
      this._handleCalculate({
        type: 'carbonflow',
        operation: 'calculate',
        content: 'AI自动填充转换数据后重新计算',
      });
      window.dispatchEvent(new CustomEvent('carbonflow-data-updated', {
        detail: { action: 'AI_AUTOFILL_CONVERSION_DATA', nodeIds: success },
      }));
    } else {
      console.log('AI AutoFill Conversion Data: AI未更新任何节点。');
    }
  } 

  private async _handlePlan(action: CarbonFlowAction) {
    console.log('Handling Plan action:', action);

    if (typeof action.data === 'string') {
      try {
        const parsedData = JSON.parse(action.data);

        // Check if the parsed data is the expected Record<string, string> format
        if (typeof parsedData === 'object' && parsedData !== null && !Array.isArray(parsedData)) {
          const planDataForStore: Record<string, string> = {};
          let isValidPlanData = true;
          for (const key in parsedData) {
            if (Object.prototype.hasOwnProperty.call(parsedData, key) && typeof parsedData[key] === 'string') {
              planDataForStore[key] = parsedData[key];
            } else {
              console.warn(`[CarbonFlowActions._handlePlan] Plan data for key "${key}" is not a string:`, parsedData[key]);
              // Optionally, mark as invalid or skip this entry
              // isValidPlanData = false;
              // break;
            }
          }

          if (isValidPlanData && Object.keys(planDataForStore).length > 0) {
            this._carbonFlowStore.getState().updateTasksFromPlan(planDataForStore);
            console.log('[CarbonFlowActions._handlePlan] Successfully called updateTasksFromPlan with:', planDataForStore);
          } else if (!isValidPlanData) {
            console.error('[CarbonFlowActions._handlePlan] Parsed plan data values are not all strings, cannot call updateTasksFromPlan:', parsedData);
          } else {
            console.warn('[CarbonFlowActions._handlePlan] Parsed plan data is empty or not in the expected Record<string, string> format after filtering:', parsedData);
            // Optionally clear tasks or log an error
            // this._carbonFlowStore.getState().setTasks([]); 
          }

        } else {
          console.error('[CarbonFlowActions._handlePlan] Parsed plan data is not a Record<string, string> object:', parsedData);
          // this._carbonFlowStore.getState().setTasks([]); 
        }
      } catch (error) {
        console.error('[CarbonFlowActions._handlePlan] Failed to parse plan data string:', error, "Data string was:", action.data);
        // this._carbonFlowStore.getState().setTasks([]);
      }
    } else {
      console.error('[CarbonFlowActions._handlePlan] Plan data is not a string (unexpected):', action.data);
      // this._carbonFlowStore.getState().setTasks([]);
    }
    // The original 'return;' is not strictly necessary for an async void function if it's the last statement.
  } 

}