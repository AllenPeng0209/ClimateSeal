import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  Col,
  Row,
  Space,
  Table,
  Input,
  Select,
  Modal,
  Drawer,
  Form,
  message,
  Popconfirm,
  Upload,
  Tooltip,
} from 'antd';
import type { FormInstance } from 'antd';
import {
  SettingOutlined,
  PlusOutlined,
  SearchOutlined,
  RedoOutlined,
  UploadOutlined,
  EyeOutlined,
  DeleteOutlined,
  ExperimentOutlined,
  EditOutlined,
  InboxOutlined,
  ClearOutlined,
  AimOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { ClientOnly } from 'remix-utils/client-only';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { useCarbonFlowStore } from './CarbonFlowBridge';
import type { Node } from 'reactflow';
import type { NodeData } from '~/types/nodes';

// Placeholder data types (replace with actual types later)
type SceneInfoType = {
  verificationLevel?: string;
  standard?: string;
  productName?: string;
};

// Define a type for individual scores (0-1 range) based on AISummary logic
type AIScoreType = {
    score: number; // Score between 0 and 1
};

// Update ModelScoreType to use AIScoreType for sub-scores and store overall score (0-1)
type ModelScoreType = {
    credibilityScore?: number; // Overall score (assume 0-1 from calculation)
    completeness?: AIScoreType;
    traceability?: AIScoreType;
    massBalance?: AIScoreType;
    validation?: AIScoreType; // Maps to "数据准确性"
};

type EmissionSource = {
  id: string;
  name: string;
  category: string;
  activityData: number;
  activityUnit: string;
  conversionFactor: number;
  factorName: string;
  factorUnit: string;
  factorSource: string;
  updatedAt: string;
  updatedBy: string;
};

// New type for Uploaded Files
type UploadedFile = {
  id: string;
  name: string;
  type: string; // e.g., '报告', '原始数据', '认证证书'
  uploadTime: string;
  url?: string; // Optional URL for preview/download
  status: 'pending' | 'parsing' | 'completed' | 'failed'; // Added status field based on PRD
};

// Extend antd's UploadFile type to include our custom selectedType
type ModalUploadFile = UploadFile & {
  selectedType?: string;
};

// File types enum based on PRD
const RawFileTypes = [
    'BOM',
    '能耗数据',
    '运输数据',
    '废弃物',
    '原材料运输',
    '成品运输',
    '产品使用数据',
    '成品废弃数据'
];

const lifecycleStages = [
  '原材料获取阶段',
  '生产阶段',
  '分销运输阶段',
  '使用阶段',
  '寿命终止阶段',
];

const emissionCategories = ['原材料', '包装材料', '能耗', '运输', '废弃物'];

// --- 映射关系 ---
const lifecycleStageToNodeTypeMap: Record<string, string> = {
  '原材料获取阶段': 'product',
  '生产阶段': 'manufacturing',
  '分销运输阶段': 'distribution',
  '使用阶段': 'usage',
  '寿命终止阶段': 'disposal',
};

const nodeTypeToLifecycleStageMap: Record<string, string> = Object.fromEntries(
  Object.entries(lifecycleStageToNodeTypeMap).map(([key, value]) => [value, key])
);
// --- 结束映射关系 ---

export function CarbonCalculatorPanel() {
  const [sceneInfo, setSceneInfo] = useState<SceneInfoType>({}); // Placeholder state
  const [modelScore, setModelScore] = useState<ModelScoreType>({}); // Placeholder state
  const [selectedStage, setSelectedStage] = useState<string>(lifecycleStages[0]);
  const [emissionSources, setEmissionSources] = useState<EmissionSource[]>([]); // Placeholder state
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isEmissionDrawerVisible, setIsEmissionDrawerVisible] = useState(false);
  const [editingEmissionSource, setEditingEmissionSource] = useState<EmissionSource | null>(null);
  const [drawerInitialValues, setDrawerInitialValues] = useState<Partial<EmissionSource & { lifecycleStage: string }>>({}); // 用于传递初始值
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]); // State for main file list
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false); // State for the upload modal visibility
  const [modalFileList, setModalFileList] = useState<ModalUploadFile[]>([]); // State for files in the modal upload list

  const uploadModalFormRef = React.useRef<FormInstance>(null);

  // 从CarbonFlowStore获取数据
  const { nodes, edges, aiSummary, setNodes: setStoreNodes } = useCarbonFlowStore();

  // 当aiSummary更新时，更新modelScore
  useEffect(() => {
    if (aiSummary) {
      setModelScore({
        credibilityScore: aiSummary.credibilityScore,
        completeness: { score: aiSummary.modelCompleteness?.score || 0 },
        traceability: { score: aiSummary.dataTraceability?.score || 0 },
        massBalance: { score: aiSummary.massBalance?.score || 0 },
        validation: { score: aiSummary.validation?.score || 0 }
      });
    }
  }, [aiSummary]);

  // 当nodes更新时，从nodes中提取并转化为排放源数据
  useEffect(() => {
    if (nodes && nodes.length > 0) {
      // 根据当前选中的生命周期阶段筛选节点
      let stageType = '';
      switch (selectedStage) {
        case '原材料获取阶段':
          stageType = 'product';
          break;
        case '生产阶段':
          stageType = 'manufacturing';
          break;
        case '分销运输阶段':
          stageType = 'distribution';
          break;
        case '使用阶段':
          stageType = 'usage';
          break;
        case '寿命终止阶段':
          stageType = 'disposal';
          break;
        default:
          stageType = '';
      }

      // 筛选节点并转换为排放源格式，使用类型断言避免类型错误
      const filteredNodes = nodes
        .filter(node => node.type === stageType && node.data)
        .map(node => {
          // 从节点数据中提取排放源信息，使用any类型断言来避免类型检查错误
          const data = node.data as any;
          // Helper to safely parse number from potentially non-numeric string
          const safeParseFloat = (val: any): number => {
              const num = parseFloat(val);
              return isNaN(num) ? 0 : num;
          };
          return {
            id: node.id,
            name: data.label || '未命名节点',
            category: typeof data.emissionType === 'string' ? data.emissionType : '未分类',
            activityData: safeParseFloat(data.quantity), // 读取 quantity 并转为 number
            activityUnit: typeof data.activityUnit === 'string' ? data.activityUnit : '', // 读取 activityUnit
            conversionFactor: typeof data.carbonFactor === 'number' ? data.carbonFactor : 0, // 读取 carbonFactor
            factorName: typeof data.carbonFactorName === 'string' ? data.carbonFactorName : '', // 读取 carbonFactorName
            factorUnit: typeof data.carbonFactorUnit === 'string' ? data.carbonFactorUnit : '', // 读取 carbonFactorUnit
            factorSource: typeof data.activitydataSource === 'string' ? data.activitydataSource : '', // 读取 activitydataSource
            updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
            updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : 'System'
          };
        });

      setEmissionSources(filteredNodes);
    }
  }, [nodes, selectedStage]);

  // --- Placeholder functions ---
  const handleAIComplete = () => {
    console.log('一键AI补全 clicked');
    alert('功能待实现');
  };

  const handleCarbonFactorMatch = () => {
    console.log('碳因子匹配 clicked');
    alert('功能待实现');
  };

  const handleCheckpointManage = () => {
    console.log('检查点管理 clicked');
    alert('功能待实现');
  };

  const handleOpenSettings = () => setIsSettingsModalVisible(true);
  const handleCloseSettings = () => setIsSettingsModalVisible(false);
  const handleSaveSettings = (values: any) => {
    console.log('Saving settings:', values);
    // TODO: API call to save settings
    setSceneInfo({
        verificationLevel: values.verificationLevel,
        standard: values.standard,
        productName: values.productName,
    });
    message.success('场景信息已保存');
    handleCloseSettings();
  };


  const handleStageSelect = (stage: string) => {
    setSelectedStage(stage);
    // TODO: Fetch emission sources for the selected stage
    console.log('Selected stage:', stage);
    // Placeholder: Clear sources on stage change
    setEmissionSources([]);
  };

  const handleAddEmissionSource = () => {
    setEditingEmissionSource(null);
    // 新增时，设置默认生命周期为当前选中的阶段
    setDrawerInitialValues({ lifecycleStage: selectedStage });
    setIsEmissionDrawerVisible(true);
  };

  const handleEditEmissionSource = (record: EmissionSource) => {
    setEditingEmissionSource(record);
    // 编辑时，根据节点ID查找节点类型，并映射回中文阶段名称
    const node = nodes?.find(n => n.id === record.id);
    const stage = node ? nodeTypeToLifecycleStageMap[node.type || ''] || selectedStage : selectedStage;
    setDrawerInitialValues({ ...record, lifecycleStage: stage });
    setIsEmissionDrawerVisible(true);
  };

  const handleDeleteEmissionSource = (id: string) => {
    console.log('Deleting emission source:', id);
    console.log('Before deletion - local sources count:', emissionSources.length);
    console.log('Before deletion - store nodes count:', nodes?.length || 0);
    
    // 更新本地狀態
    setEmissionSources(prev => prev.filter(item => item.id !== id));
    
    // 同步更新 store 中的節點
    if (nodes && setStoreNodes) {
      // 檢查節點是否存在
      const nodeExists = nodes.some(node => node.id === id);
      console.log('Node exists in store:', nodeExists);
      
      if (!nodeExists) {
        console.warn('嘗試刪除的節點在 store 中不存在，ID:', id);
        message.warning('節點不存在於流程圖中');
        return;
      }
      
      const updatedNodes = nodes.filter(node => node.id !== id);
      console.log('After filter - updated nodes count:', updatedNodes.length);
      
      setStoreNodes(updatedNodes);
      
      // 觸發事件，通知其他組件數據已更新
      window.dispatchEvent(new CustomEvent('carbonflow-data-updated', {
        detail: { action: 'DELETE_NODE', nodeId: id }
      }));
      
      message.success('排放源已刪除');
    } else {
      console.warn('Store 或 setStoreNodes 未定義');
      message.success('排放源已刪除（本地）');
    }
  };

   const handleCloseEmissionDrawer = () => {
    setIsEmissionDrawerVisible(false);
    setEditingEmissionSource(null);
    setDrawerInitialValues({}); // 关闭时清空初始值
   };

   const handleSaveEmissionSource = (values: any) => {
     console.log('Saving emission source:', values);
     // 从表单值获取选择的生命周期阶段，并映射到 nodeType
     const selectedStageName = values.lifecycleStage;
     const selectedNodeType = lifecycleStageToNodeTypeMap[selectedStageName] || 'product'; // 默认为 product

     if (editingEmissionSource) {
       // --- 更新已有排放源 ---
       // 更新本地狀態
       setEmissionSources(prev => prev.map(item => 
         item.id === editingEmissionSource.id 
           ? { 
                // 更新本地 emissionSources 状态时也使用正确的映射
                id: item.id,
                name: values.name,
                category: values.category, 
                activityData: values.activityData, // Form data is likely number
                activityUnit: values.activityUnit, 
                conversionFactor: values.conversionFactor, 
                factorName: values.factorName,
                factorUnit: values.factorUnit,
                factorSource: values.factorSource,
                updatedAt: new Date().toISOString(), 
                updatedBy: 'User' 
             } 
           : item
       ));

       // 同步更新 store 中的節點
       if (nodes && setStoreNodes) {
         const updatedNodes = nodes.map(node => {
           if (node.id === editingEmissionSource.id) {
             // 獲取現有節點數據
             const currentNodeData = { ...node.data };
             const originalNodeType = node.type; // 保留原始类型以便检查是否需要重建data

             // --- 更新通用字段保存逻辑 (使用 as any 绕过类型检查) --- 
             const dataToUpdate: any = currentNodeData; // 将 currentNodeData 断言为 any

             dataToUpdate.label = values.name;
             dataToUpdate.nodeName = values.name;
             dataToUpdate.emissionType = values.category; // 保存类别
             dataToUpdate.quantity = String(values.activityData); // 保存活动数据为 string
             dataToUpdate.activityUnit = values.activityUnit; // 保存活动数据单位
             dataToUpdate.carbonFactor = values.conversionFactor; // 保存转换系数 (因子)
             dataToUpdate.carbonFactorName = values.factorName; // 保存因子名称
             dataToUpdate.carbonFactorUnit = values.factorUnit; // 保存因子单位
             dataToUpdate.activitydataSource = values.factorSource; // 保存因子来源
             dataToUpdate.lifecycleStage = selectedStageName;
             // --- 结束更新通用字段保存逻辑 ---

             let finalNodeData = dataToUpdate; // 使用更新后的 dataToUpdate

             // 如果生命周期阶段（即节点类型）改变了，我们需要创建匹配新类型的数据结构
             if (originalNodeType !== selectedNodeType) {
                console.log(`节点 ${editingEmissionSource.id} 类型从 ${originalNodeType} 变为 ${selectedNodeType}，重新构建数据结构。`);
                // 基于新类型创建数据对象，并尽可能保留通用字段
                const commonData = {
                    label: values.name,
                    nodeName: values.name,
                    lifecycleStage: selectedStageName, 
                    emissionType: values.category, 
                    activitydataSource: values.factorSource, // 因子来源
                    activityScore: finalNodeData.activityScore || 0,
                    verificationStatus: finalNodeData.verificationStatus || '未驗證',
                    carbonFootprint: String(finalNodeData.carbonFootprint || 0),
                    quantity: String(values.activityData), // 活动数据
                    activityUnit: values.activityUnit, // 活动数据单位
                    carbonFactor: values.conversionFactor, // 转换系数 (因子)
                    carbonFactorName: values.factorName, // 因子名称
                    carbonFactorUnit: values.factorUnit, // 因子单位
                    unitConversion: String(finalNodeData.unitConversion ?? 1), 
                };

                // 根据新的 selectedNodeType 创建特定数据结构
                switch (selectedNodeType) {
                    case 'product':
                        finalNodeData = { ...commonData, material: values.category, weight_per_unit: '', isRecycled: false, recycledContent: '', recycledContentPercentage: 0, sourcingRegion: '', SourceLocation: '', weight: 0, supplier: '' }; break;
                    case 'manufacturing':
                        finalNodeData = { ...commonData, ElectricityAccountingMethod: '', ElectricityAllocationMethod: '', EnergyConsumptionMethodology: '', EnergyConsumptionAllocationMethod: '', chemicalsMaterial: '', MaterialAllocationMethod: '', WaterUseMethodology: '', WaterAllocationMethod: '', packagingMaterial: '', direct_emission: '', WasteGasTreatment: '', WasteDisposalMethod: '', WastewaterTreatment: '', energyConsumption: 0, energyType: '', processEfficiency: 0, wasteGeneration: 0, waterConsumption: 0, recycledMaterialPercentage: 0, productionCapacity: 0, machineUtilization: 0, qualityDefectRate: 0, processTechnology: '', manufacturingStandard: '', automationLevel: '', manufacturingLocation: '', byproducts: '', emissionControlMeasures: '' }; break;
                    case 'distribution':
                        finalNodeData = { ...commonData, transportationMode: '', transportationDistance: 0, startPoint: '', endPoint: '', vehicleType: '', fuelType: '', fuelEfficiency: 0, loadFactor: 0, refrigeration: false, packagingMaterial: '', packagingWeight: 0, warehouseEnergy: 0, storageTime: 0, storageConditions: '', distributionNetwork: '' }; break;
                    case 'usage':
                        finalNodeData = { ...commonData, lifespan: 0, energyConsumptionPerUse: 0, waterConsumptionPerUse: 0, consumablesUsed: '', consumablesWeight: 0, usageFrequency: 0, maintenanceFrequency: 0, repairRate: 0, userBehaviorImpact: 0, efficiencyDegradation: 0, standbyEnergyConsumption: 0, usageLocation: '', usagePattern: '' }; break;
                    case 'disposal':
                        finalNodeData = { ...commonData, recyclingRate: 0, landfillPercentage: 0, incinerationPercentage: 0, compostPercentage: 0, reusePercentage: 0, hazardousWasteContent: 0, biodegradability: 0, disposalEnergyRecovery: 0, transportToDisposal: 0, disposalMethod: '', endOfLifeTreatment: '', recyclingEfficiency: 0, dismantlingDifficulty: '' }; break;
                    default: // 假设 'finalProduct' 或其他未知类型，使用基础结构
                        finalNodeData = { ...commonData, finalProductName: values.name, totalCarbonFootprint: 0, certificationStatus: '未認證', environmentalImpact: '', sustainabilityScore: 0, productCategory: values.category, marketSegment: '', targetRegion: '', complianceStatus: '', carbonLabel: '' }; break;
                }
             }

             return {
               ...node,
               type: selectedNodeType, // 更新节点的类型
               data: finalNodeData // 使用最终的数据对象
             };
           }
           return node;
         });
         
         setStoreNodes(updatedNodes);
         
         // 觸發事件，通知其他組件數據已更新
         window.dispatchEvent(new CustomEvent('carbonflow-data-updated', {
           detail: { action: 'UPDATE_NODE', nodeId: editingEmissionSource.id }
         }));
         
         message.success('排放源已更新');
       } else {
         message.success('排放源已更新（本地）');
       }
     } else {
       // --- 添加新排放源 ---

       // 根据用户在表单中选择的生命周期阶段确定节点类型
       const nodeType = selectedNodeType; // 直接使用上面映射得到的类型

       // 創建新的排放源
       const newSourceId = Date.now().toString();
       const newSource: EmissionSource = {
         ...values,
         id: newSourceId,
         updatedAt: new Date().toISOString(),
         updatedBy: 'User'
       };
       
       // 更新本地狀態
       setEmissionSources(prev => [...prev, newSource]);
       
       // 創建對應的 Flow 節點並更新 store
       if (setStoreNodes) {
         // 計算新節點位置（可以基於現有節點或使用默認位置）
         let position = { x: 100, y: 100 };
         const existingNodesOfSameType = nodes?.filter(n => n.type === nodeType) || [];
         if (existingNodesOfSameType.length > 0) {
           const lastNode = existingNodesOfSameType[existingNodesOfSameType.length - 1];
           position = {
             x: lastNode.position.x + 150,
             y: lastNode.position.y + 50
           };
         }
         
         // 根據節點類型創建正確的節點數據對象
         let nodeData: NodeData;
         const commonData = { // 提取通用数据创建逻辑
             label: values.name,
             nodeName: values.name,
             lifecycleStage: selectedStageName, 
             emissionType: values.category, 
             activitydataSource: values.factorSource, // 因子来源
             activityScore: 0,
             verificationStatus: '未驗證',
             carbonFootprint: String(0),
             quantity: String(values.activityData), // 活动数据
             activityUnit: values.activityUnit, // 活动数据单位
             carbonFactor: values.conversionFactor, // 转换系数 (因子)
             carbonFactorName: values.factorName, // 因子名称
             carbonFactorUnit: values.factorUnit, // 因子单位
             unitConversion: String(1), 
         };

         switch (nodeType) {
           case 'product':
             nodeData = {
                ...commonData,
               material: values.category,
               weight_per_unit: '',
               isRecycled: false,
               recycledContent: '',
               recycledContentPercentage: 0,
               sourcingRegion: '',
               SourceLocation: '',
               weight: 0,
               supplier: ''
             };
             break;
           
           case 'manufacturing':
             nodeData = {
                ...commonData,
               ElectricityAccountingMethod: '',
               ElectricityAllocationMethod: '',
               EnergyConsumptionMethodology: '',
               EnergyConsumptionAllocationMethod: '',
               chemicalsMaterial: '',
               MaterialAllocationMethod: '',
               WaterUseMethodology: '',
               WaterAllocationMethod: '',
               packagingMaterial: '',
               direct_emission: '',
               WasteGasTreatment: '',
               WasteDisposalMethod: '',
               WastewaterTreatment: '',
               energyConsumption: 0,
               energyType: '',
               processEfficiency: 0,
               wasteGeneration: 0,
               waterConsumption: 0,
               recycledMaterialPercentage: 0,
               productionCapacity: 0,
               machineUtilization: 0,
               qualityDefectRate: 0,
               processTechnology: '',
               manufacturingStandard: '',
               automationLevel: '',
               manufacturingLocation: '',
               byproducts: '',
               emissionControlMeasures: ''
             };
             break;
           
           case 'distribution':
             nodeData = {
                ...commonData,
               transportationMode: '',
               transportationDistance: 0,
               startPoint: '',
               endPoint: '',
               vehicleType: '',
               fuelType: '',
               fuelEfficiency: 0,
               loadFactor: 0,
               refrigeration: false,
               packagingMaterial: '',
               packagingWeight: 0,
               warehouseEnergy: 0,
               storageTime: 0,
               storageConditions: '',
               distributionNetwork: ''
             };
             break;
           
           case 'usage':
             nodeData = {
                ...commonData,
               lifespan: 0,
               energyConsumptionPerUse: 0,
               waterConsumptionPerUse: 0,
               consumablesUsed: '',
               consumablesWeight: 0,
               usageFrequency: 0,
               maintenanceFrequency: 0,
               repairRate: 0,
               userBehaviorImpact: 0,
               efficiencyDegradation: 0,
               standbyEnergyConsumption: 0,
               usageLocation: '',
               usagePattern: ''
             };
             break;
           
           case 'disposal':
             nodeData = {
                ...commonData,
               recyclingRate: 0,
               landfillPercentage: 0,
               incinerationPercentage: 0,
               compostPercentage: 0,
               reusePercentage: 0,
               hazardousWasteContent: 0,
               biodegradability: 0,
               disposalEnergyRecovery: 0,
               transportToDisposal: 0,
               disposalMethod: '',
               endOfLifeTreatment: '',
               recyclingEfficiency: 0,
               dismantlingDifficulty: ''
             };
             break;
           
           default:
             nodeData = {
                ...commonData,
               finalProductName: values.name,
               totalCarbonFootprint: 0,
               certificationStatus: '未認證',
               environmentalImpact: '',
               sustainabilityScore: 0,
               productCategory: values.category,
               marketSegment: '',
               targetRegion: '',
               complianceStatus: '',
               carbonLabel: ''
             };
         }
         
         const newNode: Node<NodeData> = {
           id: newSourceId,
           type: nodeType,
           position,
           data: nodeData,
           width: 180,
           height: 40,
           selected: false,
           positionAbsolute: position,
           dragging: false
         };
         
         setStoreNodes([...(nodes || []), newNode]);
         
         // 觸發事件，通知其他組件數據已更新
         window.dispatchEvent(new CustomEvent('carbonflow-data-updated', {
           detail: { action: 'ADD_NODE', nodeId: newSourceId, nodeType }
         }));
         
         message.success('排放源已添加');
       } else {
         message.success('排放源已添加（本地）');
       }
     }
     
     handleCloseEmissionDrawer();
   };

   // --- File Upload Handlers (Placeholders) ---
   const handleFileUpload = (info: any) => {
    // This is a basic handler, you'll need to implement actual upload logic
    // using fetch or a library like axios to send the file to your backend.
    if (info.file.status === 'done') {
      message.success(`${info.file.name} file uploaded successfully`);
      // Assuming backend returns file info upon successful upload
      const newFile: UploadedFile = {
          id: info.file.uid, // Use UID from upload event
          name: info.file.name,
          type: '未分类', // Determine type based on upload or response
          uploadTime: new Date().toISOString(),
          url: info.file.response?.url, // Example: get URL from server response
          status: 'pending'
      };
      setUploadedFiles(prev => [...prev, newFile]);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
    // You might want to handle 'uploading' status too
   };

   const handlePreviewFile = (file: UploadedFile) => {
     console.log('Previewing file:', file);
     if (file.url) {
       window.open(file.url, '_blank');
     } else {
       message.info('此文件没有可用的预览链接');
     }
   };

   const handleDeleteFile = (id: string) => {
     console.log('Deleting file:', id);
     // TODO: API call to delete file on server
     setUploadedFiles(prev => prev.filter(item => item.id !== id));
     message.success('文件已删除');
   };

   // Placeholder handlers for new file actions
   const handleParseFile = (file: UploadedFile) => {
       console.log('Parsing file:', file);
       // TODO: Implement parsing logic trigger
       message.info('解析功能待实现');
   };

   const handleEditFile = (file: UploadedFile) => {
       console.log('Editing file metadata:', file);
       // TODO: Implement logic to open an edit modal/form for file metadata (like type)
       message.info('编辑功能待实现');
   };

   // Handler to open the new upload modal
   const handleOpenUploadModal = () => {
       setIsUploadModalVisible(true);
   };

   // Handler to close the new upload modal
   const handleCloseUploadModal = () => {
       setIsUploadModalVisible(false);
       setModalFileList([]); // Clear file list on cancel
       uploadModalFormRef.current?.resetFields(); // Reset form fields
   };

   // Handler for clicking OK in the upload modal
   const handleUploadModalOk = () => {
     console.log('Upload Modal OK');
     if (modalFileList.length === 0) {
         message.error('请上传文件');
         return;
     }

     const filesWithoutType = modalFileList.filter(file => !file.selectedType);
     if (filesWithoutType.length > 0) {
         message.error(`请为所有文件选择文件类型: ${filesWithoutType.map(f => f.name).join(', ')}`);
         return;
     }

     const filesToAdd = modalFileList.map((file) => ({
         id: file.uid,
         name: file.name,
         type: file.selectedType!, // Use individual file's selected type
         uploadTime: new Date().toISOString(),
         status: 'pending' as const, 
         url: file.response?.url || file.thumbUrl 
     }));

     setUploadedFiles(prev => [...filesToAdd, ...prev]); 
     message.success(`${filesToAdd.length} 个文件已添加到列表`);
     handleCloseUploadModal(); 
   };

   // Handler for Upload component changes in the modal
   const handleModalUploadChange: UploadProps['onChange'] = ({ fileList: newFileListFromAntd }) => {
      const updatedModalFileList = newFileListFromAntd.map(fileFromAntd => {
        const existingFileInOurList = modalFileList.find(mf => mf.uid === fileFromAntd.uid);
        return {
            ...fileFromAntd,
            selectedType: existingFileInOurList?.selectedType || undefined // Initialize with undefined or a default
        };
      });
      setModalFileList(updatedModalFileList);
   };

   // Handler for changing a single file's type in the modal table
   const handleModalFileTypeChange = (fileUid: string, type: string) => {
    setModalFileList(prevList =>
      prevList.map(file =>
        file.uid === fileUid ? { ...file, selectedType: type } : file
      )
    );
  };

  // Handler for removing a file from the modal list (via table delete button)
  const handleRemoveFileFromModalList = (fileUid: string) => {
    setModalFileList(prevList => prevList.filter(file => file.uid !== fileUid));
  };

  // Handler for clearing the file list in the modal
  const handleClearModalList = () => {
       setModalFileList([]);
   };

  // --- Render functions ---

  // Updated renderScore to return the score value (0-100, rounded) or 0 if invalid/missing/zero
  const renderScore = (scoreData?: AIScoreType): number => {
    if (!scoreData || typeof scoreData.score !== 'number' || isNaN(scoreData.score)) {
        return 0; // Return 0 if data is missing/invalid
    }
    // Convert 0-1 score to 0-100 score, rounded. Handles score === 0 correctly.
    return Math.round(scoreData.score);
  };

  const emissionTableColumns = [
      { title: '序号', dataIndex: 'index', key: 'index', render: (_: any, __: any, index: number) => index + 1, width: 60, fixed: 'left' as 'left' },
      { title: '排放源名称', dataIndex: 'name', key: 'name', fixed: 'left' as 'left' },
      { title: '排放源类别', dataIndex: 'category', key: 'category' },
      { title: '活动数据数值', dataIndex: 'activityData', key: 'activityData' },
      { title: '活动数据单位', dataIndex: 'activityUnit', key: 'activityUnit' },
      { title: '单位转换系数', dataIndex: 'conversionFactor', key: 'conversionFactor' },
      { title: '排放因子名称', dataIndex: 'factorName', key: 'factorName' },
      { title: '排放因子单位', dataIndex: 'factorUnit', key: 'factorUnit' },
      { title: '数据库名称', dataIndex: 'factorSource', key: 'factorSource' },
      // { title: '因子UUID', dataIndex: 'factorUUID', key: 'factorUUID' }, // 新增列 - 现在移除
      {
          title: '操作',
          key: 'action',
          fixed: 'right' as 'right',
          width: 150,
          render: (_: any, record: EmissionSource) => (
              <Space size="small"> {/* Reduced space, similar to file table */}
                  <Tooltip title="查看">
                      {/* Added View action - Placeholder */}
                      <Button type="link" icon={<EyeOutlined />} onClick={() => { console.log('Viewing:', record); message.info('查看功能待实现'); }} />
                  </Tooltip>
                  <Tooltip title="编辑">
                      <Button type="link" icon={<EditOutlined />} onClick={() => handleEditEmissionSource(record)} />
                  </Tooltip>
                  <Tooltip title="删除">
                      <Popconfirm title="确定删除吗?" onConfirm={() => handleDeleteEmissionSource(record.id)}>
                          <Button type="link" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                  </Tooltip>
              </Space>
          ),
      },
  ];

  // Columns for the File Upload table - Updated based on PRD
  const fileTableColumns = [
      { title: '文件名称', dataIndex: 'name', key: 'name' },
      { title: '文件类型', dataIndex: 'type', key: 'type', width: 120 }, // Renamed header as per PRD
      // { title: '上传时间', dataIndex: 'uploadTime', key: 'uploadTime', width: 170, render: (ts: string) => new Date(ts).toLocaleString() },
      { title: '状态', dataIndex: 'status', key: 'status', width: 100 }, // Added Status column
      {
          title: '操作',
          key: 'action',
          fixed: 'right' as 'right',
          width: 120, // Increased width for more icons
          render: (_: any, record: UploadedFile) => (
              <Space size="small"> {/* Reduced space slightly */}
                  <Tooltip title="解析">
                      <Button type="link" icon={<ExperimentOutlined />} onClick={() => handleParseFile(record)} />
                  </Tooltip>
                  <Tooltip title="编辑">
                       <Button type="link" icon={<EditOutlined />} onClick={() => handleEditFile(record)} />
                  </Tooltip>
                  <Tooltip title="预览">
                      <Button type="link" icon={<EyeOutlined />} onClick={() => handlePreviewFile(record)} />
                  </Tooltip>
                  <Tooltip title="删除">
                       <Popconfirm title="确定删除吗?" onConfirm={() => handleDeleteFile(record.id)}>
                          <Button type="link" danger icon={<DeleteOutlined />} />
                       </Popconfirm>
                  </Tooltip>
              </Space>
          ),
      },
  ];


  return (
    <div className="flex flex-col h-screen p-4 space-y-4 bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary"> {/* Added h-screen */}
      {/* Wrapper for Card Rows to manage height distribution */}
      <div className="flex-grow flex flex-col space-y-4 min-h-0">

          {/* 2. Upper Row - Fixed proportional height (e.g., 30%) */}
          <Row gutter={16} className="h-[30%] flex-shrink-0"> {/* Changed height to 30% */}
            {/* 2.1 Scene Info (Top Left) - Adjusted span to 5 */}
            <Col span={5} className="flex flex-col h-full"> {/* Added flex flex-col h-full */}
              <Card
                title="场景信息"
                size="small"
                extra={<Button type="link" icon={<SettingOutlined />} onClick={handleOpenSettings}>设置</Button>}
                className="flex-grow min-h-0 bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor" // Added flex-grow, min-h-0
                bodyStyle={{ overflow: 'auto' }}
              >
                <Space direction="vertical" className="w-full">
                  <div>预期核验等级: {sceneInfo.verificationLevel || '未设置'}</div>
                  <div>满足标准: {sceneInfo.standard || '未设置'}</div>
                  <div>核算产品: {sceneInfo.productName || '未设置'}</div>
                </Space>
              </Card>
            </Col>

            {/* 2.2 File Upload (Moved to middle) - Adjusted span to 14 */}
            <Col span={14} className="flex flex-col h-full"> {/* Added flex flex-col h-full */}
                <Card
                    title="原始数据文件"
                    size="small"
                    extra={
                        <Button icon={<UploadOutlined />} onClick={handleOpenUploadModal}>上传文件</Button>
                    }
                    className="flex-grow min-h-0 bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor flex flex-col file-upload-card" // Added flex-grow, min-h-0
                    bodyStyle={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
                >
                     <div className="flex-grow overflow-auto file-upload-table-container">
                        <Table
                            columns={fileTableColumns}
                            dataSource={ [...uploadedFiles].sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime()) }
                            rowKey="id"
                            size="small"
                            pagination={{ pageSize: 5 }}
                            className="file-upload-table"
                        />
                    </div>
                </Card>
            </Col>

             {/* 2.3 Model Score (Moved to right) - Adjusted span to 5 */}
            <Col span={5} className="flex flex-col h-full"> {/* Added flex flex-col h-full */}
              <Card
                title="模型评分"
                size="small"
                className="flex-grow min-h-0 bg-bolt-elements-background-depth-1 border border-bolt-primary/30 flex flex-col" 
                bodyStyle={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'auto' }}
                >
                 <div className="text-center mb-4 flex-grow flex flex-col justify-center">
                    <div className="text-sm text-bolt-elements-textSecondary mb-1">可信得分</div>
                    <div className="text-4xl font-bold text-bolt-elements-textPrimary">
                        {typeof modelScore.credibilityScore === 'number' && !isNaN(modelScore.credibilityScore)
                            ? Math.round(modelScore.credibilityScore )
                            : 0}
                    </div>
                 </div>
                 <div className="flex-shrink-0">
                     <Row gutter={[16, 8]}>
                        <Col span={12} className="text-xs text-bolt-elements-textSecondary">模型完整度: {renderScore(modelScore.completeness)}/100</Col>
                        <Col span={12} className="text-xs text-bolt-elements-textSecondary">数据可追溯性: {renderScore(modelScore.traceability)}/100</Col>
                        <Col span={12} className="text-xs text-bolt-elements-textSecondary">质量平衡: {renderScore(modelScore.massBalance)}/100</Col>
                        <Col span={12} className="text-xs text-bolt-elements-textSecondary">数据准确性: {renderScore(modelScore.validation)}/100</Col>
                     </Row>
                 </div>
              </Card>
            </Col>
          </Row>

          {/* 3. Lower Row - Takes remaining height */}
          <Row gutter={16} className="flex-grow min-h-0"> {/* Keep flex-grow min-h-0 */}
             {/* 3.1 Lifecycle Navigation (Bottom Left) - Adjusted span to 5 */}
             <Col span={5} className="flex flex-col h-full">
               <Card title="生命周期阶段" size="small" className="flex-grow flex flex-col min-h-0 bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor">
                    <div className="flex-grow overflow-y-auto">
                     <Space direction="vertical" className="w-full">
                        {lifecycleStages.map(stage => (
                          <Button key={stage} type={selectedStage === stage ? 'primary' : 'text'} onClick={() => handleStageSelect(stage)} block className="text-left">
                            {stage}
                          </Button>
                        ))}
                     </Space>
                     </div>
               </Card>
             </Col>

             {/* 3.2 Emission Source List (Bottom Right) - Adjusted span to 19 */}
             <Col span={19} className="flex flex-col h-full">
               <Card title={`排放源清单 - ${selectedStage}`} size="small" className="flex-grow flex flex-col min-h-0 bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor emission-source-table">
                    <div className="mb-4 flex-shrink-0 filter-controls flex justify-between items-center">
                        <Space>
                            <Input placeholder="排放源名称" prefix={<SearchOutlined />} style={{width: 120}} />
                            <Select placeholder="排放源类别" allowClear style={{width: 120}}>
                                {emissionCategories.map(cat => <Select.Option key={cat} value={cat}>{cat}</Select.Option>)}
                            </Select>
                            <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                            <Button icon={<RedoOutlined />}>重置</Button>
                        </Space>
                        <Space>
                            <Button icon={<AimOutlined />} onClick={handleAIComplete}>AI一键补全</Button>
                            <Button icon={<DatabaseOutlined />} onClick={handleCarbonFactorMatch}>碳因子匹配</Button>
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddEmissionSource}>新增排放源</Button>
                        </Space>
                    </div>
                    <div className="flex-grow overflow-auto emission-source-table-scroll-container">
                        <Table
                            className="emission-source-table"
                            columns={emissionTableColumns}
                            dataSource={emissionSources}
                            rowKey="id"
                            size="small"
                            pagination={{ pageSize: 10 }}
                            scroll={{ x: 1500, y: 'calc(100vh - 500px)' }}
                        />
                    </div>
               </Card>
             </Col>
          </Row>
       </div>

      {/* Modals and Drawers */}
      <Modal
        title="设置场景信息"
        open={isSettingsModalVisible}
        onCancel={handleCloseSettings}
        footer={null} // Use Form's footer
      >
            <Form layout="vertical" onFinish={handleSaveSettings} initialValues={sceneInfo}>
                <Form.Item name="verificationLevel" label="预期核验等级" rules={[{ required: true, message: '请选择核验等级' }]}>
                    <Select placeholder="选择核验等级">
                        <Select.Option value="准核验级别">准核验级别</Select.Option>
                        <Select.Option value="披露级别">披露级别</Select.Option>
                    </Select>
                </Form.Item>
                 <Form.Item name="standard" label="满足标准" rules={[{ required: true, message: '请选择满足标准' }]}>
                    <Select placeholder="选择满足标准">
                        <Select.Option value="ISO14067">ISO14067</Select.Option>
                        <Select.Option value="欧盟电池法">欧盟电池法</Select.Option>
                    </Select>
                </Form.Item>
                 <Form.Item name="productName" label="核算产品" rules={[{ required: true, message: '请输入核算产品名称' }]}>
                    <Input placeholder="输入产品名称" />
                </Form.Item>
                 <Form.Item className="text-right">
                     <Space>
                        <Button onClick={handleCloseSettings}>取消</Button>
                        <Button type="primary" htmlType="submit">保存</Button>
                     </Space>
                 </Form.Item>
            </Form>
      </Modal>

       <Drawer
        title={editingEmissionSource ? "编辑排放源" : "新增排放源"}
        width={500}
        onClose={handleCloseEmissionDrawer}
        open={isEmissionDrawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
        footer={null} // Using Form footer
        destroyOnClose // Ensure form state is reset each time
      >
        <Form layout="vertical" onFinish={handleSaveEmissionSource} initialValues={drawerInitialValues} key={editingEmissionSource?.id || 'new'}>
            <Form.Item name="lifecycleStage" label="生命周期阶段" rules={[{ required: true, message: '请选择生命周期阶段' }]}>
              <Select placeholder="请选择生命周期阶段">
                 {lifecycleStages.map(stage => <Select.Option key={stage} value={stage}>{stage}</Select.Option>)}
              </Select>
           </Form.Item>
           <Form.Item name="name" label="排放源名称" rules={[{ required: true, message: '请输入排放源名称' }]}>
              <Input placeholder="请输入排放源名称" />
           </Form.Item>
            <Form.Item name="category" label="排放源类别" rules={[{ required: true, message: '请选择排放源类别' }]}>
              <Select placeholder="请选择排放源类别">
                 {emissionCategories.map(cat => <Select.Option key={cat} value={cat}>{cat}</Select.Option>)}
              </Select>
           </Form.Item>
           <Form.Item name="activityData" label="活动数据" rules={[{ required: true, message: '请输入活动数据' }]}>
              <Input type="number" step="0.0000000001" placeholder="请输入活动数据" />
           </Form.Item>
            <Form.Item name="activityUnit" label="活动数据单位" rules={[{ required: true, message: '请输入活动数据单位' }]}>
              <Input placeholder="请输入活动数据单位" />
           </Form.Item>
           <Form.Item name="conversionFactor" label="单位转换系数" rules={[{ required: true, message: '请输入单位转换系数' }]}>
              <Input type="number" step="0.0000000001" placeholder="请输入单位转换系数" />
           </Form.Item>
           <Form.Item name="factorName" label="排放因子名称" rules={[{ required: true, message: '请输入排放因子名称' }]}>
              <Input placeholder="请输入排放因子名称" />
           </Form.Item>
            <Form.Item name="factorUnit" label="排放因子单位" rules={[{ required: true, message: '请输入排放因子单位' }]}>
              <Input placeholder="请输入排放因子单位" />
           </Form.Item>
           <Form.Item name="factorSource" label="排放因子来源" rules={[{ required: true, message: '请输入排放因子来源' }]}>
              <Input placeholder="请输入排放因子来源" />
           </Form.Item>
           <Form.Item className="text-right">
             <Space>
                 <Button onClick={handleCloseEmissionDrawer}>取消</Button>
                 <Button type="primary" htmlType="submit">保存</Button>
             </Space>
            </Form.Item>
        </Form>
      </Drawer>

      {/* Upload File Modal (New - Implementing Content) */}
      <Modal
        title="上传原始文件"
        open={isUploadModalVisible}
        onOk={handleUploadModalOk} // Connect OK handler
        onCancel={handleCloseUploadModal} // Connect Cancel handler
        width={600} // Increased width
        okText="确认" // Customize button text
        cancelText="取消" // Customize button text
        destroyOnClose // Reset state when modal is closed
      >
         <Form layout="vertical" ref={uploadModalFormRef}>
            <Form.Item label="添加文件:" className="upload-modal-upload-item">
                 <Upload.Dragger
                    name="files" 
                    multiple={true}
                    onChange={handleModalUploadChange}
                    fileList={modalFileList} 
                    showUploadList={false} // Hide default list, we use our table
                 >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                    <p className="ant-upload-hint">
                        支持单次或批量上传。
                    </p>
                 </Upload.Dragger>
            </Form.Item>

            {modalFileList.length > 0 && (
              <Form.Item label="已选文件列表:">
                <Table
                  dataSource={modalFileList}
                  columns={[
                    { title: '文件名称', dataIndex: 'name', key: 'name', ellipsis: true },
                    {
                      title: '文件类型',
                      dataIndex: 'uid', 
                      key: 'type',
                      width: 180,
                      render: (uid: string, record: ModalUploadFile) => (
                        <Select
                          value={record.selectedType}
                          onChange={(value) => handleModalFileTypeChange(uid, value)}
                          placeholder="选择类型"
                          allowClear
                        >
                          {RawFileTypes.map(type => (
                            <Select.Option key={type} value={type}>{type}</Select.Option>
                          ))}
                        </Select>
                      ),
                    },
                    {
                      title: '操作',
                      key: 'action',
                      width: 80,
                      render: (text: any, record: ModalUploadFile) => (
                        <Tooltip title="删除">
                          <Button
                            danger
                            type="link"
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveFileFromModalList(record.uid)}
                          />
                        </Tooltip>
                      ),
                    },
                  ]}
                  rowKey="uid"
                  size="small"
                  pagination={false} // Or configure pagination if needed for many files
                  scroll={{ y: 200 }} // Add scroll if list can be long
                  className="upload-modal-file-table" // For potential styling
                />
                <div style={{ marginTop: '10px', textAlign: 'right' }}>
                    <Button icon={<ClearOutlined />} onClick={handleClearModalList} disabled={modalFileList.length === 0}>
                        清空列表
                    </Button>
                </div>
              </Form.Item>
            )}
         </Form>
      </Modal>
    </div>
  );
}

// 在文件末尾添加 CSS 样式
const customStyles = `
/* Set explicit dark background for the table */
.emission-source-table .ant-table {
  background: var(--bolt-elements-background-depth-2, #1e1e1e) !important; /* Explicit dark background */
}

.emission-source-table .ant-table-thead > tr > th {
  background: var(--bolt-elements-background-depth-2, #1e1e1e) !important; /* Match table background */
  color: var(--bolt-elements-textSecondary) !important;
  border-bottom: 1px solid var(--bolt-elements-borderColor) !important;
}

.emission-source-table .ant-table-tbody > tr > td {
  background: transparent !important; /* Keep cell background transparent to inherit from row */
  border-bottom: 1px solid var(--bolt-elements-borderColor) !important;
  color: var(--bolt-elements-textPrimary) !important;
}

/* Target potential inner cell wrappers */
.emission-source-table .ant-table-cell {
    background: inherit !important; /* Inherit from td/th */
}

/* Row background - set here so cells inherit */
.emission-source-table .ant-table-tbody > tr {
    background: var(--bolt-elements-background-depth-2, #1e1e1e) !important;
}

/* Fix for fixed column background overlap */
.emission-source-table .ant-table-thead > tr > th.ant-table-cell-fix-right,
.emission-source-table .ant-table-tbody > tr > td.ant-table-cell-fix-right,
.emission-source-table .ant-table-thead > tr > th.ant-table-cell-fix-left,
.emission-source-table .ant-table-tbody > tr > td.ant-table-cell-fix-left {
    background: var(--bolt-elements-background-depth-2, #1e1e1e) !important; /* Keep base background same as row */
}

/* Ensure fixed column hover is OPAQUE */
.emission-source-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-right,
.emission-source-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-left {
    background: var(--bolt-elements-background-depth-1, #2a2a2a) !important; /* Use a slightly lighter opaque color */
}

/* 悬停和选中行的背景色 - Apply to the row (Non-fixed columns can be semi-transparent) */
.emission-source-table .ant-table-tbody > tr:hover > td {
    background: var(--bolt-hover-background, rgba(255, 255, 255, 0.1)) !important;
}

/* Ensure pagination elements match the theme */
.emission-source-table .ant-pagination {
    background: var(--bolt-elements-background-depth-2, #1e1e1e) !important;
    padding: 8px;
    border-radius: 4px;
    margin-top: 16px !important; /* Add some space */
}
.emission-source-table .ant-pagination-item a,
.emission-source-table .ant-pagination-item-link,
.emission-source-table .ant-pagination-item-ellipsis {
    color: var(--bolt-elements-textSecondary) !important;
}
.emission-source-table .ant-pagination-item-active a {
    color: var(--bolt-primary, #5165f9) !important;
    /* background: var(--bolt-primary-background, rgba(81, 101, 249, 0.1)) !important; */
    border-color: var(--bolt-primary, #5165f9) !important;
}
.emission-source-table .ant-pagination-item-active {
    border-color: var(--bolt-primary, #5165f9) !important;
}
.emission-source-table .ant-pagination-disabled .ant-pagination-item-link {
    color: var(--bolt-elements-textDisabled) !important;
}
.emission-source-table .ant-select-selector {
    background-color: var(--bolt-elements-background-depth-1, #2a2a2a) !important;
    border-color: var(--bolt-elements-borderColor) !important;
    color: var(--bolt-elements-textPrimary) !important;
}
.emission-source-table .ant-select-arrow {
    color: var(--bolt-elements-textSecondary) !important;
}

/* 空状态的样式 */
.emission-source-table .ant-empty-description {
    color: var(--bolt-elements-textSecondary) !important;
}

/* --- Dark Scrollbar Styles --- */
/* Class added to the scrollable container div */
.emission-source-table-scroll-container::-webkit-scrollbar {
  width: 8px;  /* Width of vertical scrollbar */
  height: 8px; /* Height of horizontal scrollbar */
}

.emission-source-table-scroll-container::-webkit-scrollbar-track {
  background: var(--bolt-elements-background-depth-1, #2a2a2a); /* Track color slightly lighter than deep background */
  border-radius: 4px;
}

.emission-source-table-scroll-container::-webkit-scrollbar-thumb {
  background-color: var(--bolt-elements-textDisabled, #555); /* Thumb color */
  border-radius: 4px;
  border: 2px solid var(--bolt-elements-background-depth-1, #2a2a2a); /* Creates padding around thumb */
}

.emission-source-table-scroll-container::-webkit-scrollbar-thumb:hover {
  background-color: var(--bolt-elements-textSecondary, #777); /* Thumb color on hover */
}

/* Firefox Scrollbar Styles */
.emission-source-table-scroll-container {
  scrollbar-width: thin; /* "auto" or "thin" */
  scrollbar-color: var(--bolt-elements-textDisabled, #555) var(--bolt-elements-background-depth-1, #2a2a2a); /* thumb color track color */
}

/* --- Filter Control Height Adjustment & Hover Glow --- */

/* Base styles + transition for smooth effect */
.filter-controls .ant-input-affix-wrapper,
.filter-controls .ant-select-selector,
.filter-controls .ant-btn {
    height: 32px !important; /* Standard Antd default height */
    display: flex !important; /* Helps vertical alignment */
    align-items: center !important;
    box-sizing: border-box !important;
    border-color: var(--bolt-elements-borderColor) !important; /* Consistent border color */
    background-color: var(--bolt-elements-background-depth-1, #2a2a2a) !important; /* Consistent background */
    color: var(--bolt-elements-textPrimary) !important; /* Consistent text color for input/select */
    transition: border-color 0.2s ease-out, box-shadow 0.2s ease-out !important; /* Added transition */
}

/* Hover State for Input/Select */
.filter-controls .ant-input-affix-wrapper:hover,
.filter-controls .ant-select-selector:hover {
    border-color: var(--bolt-primary, #5165f9) !important;
    /* Added Glow Effect */
    box-shadow: 0 0 5px 1px rgba(var(--bolt-primary-rgb, 81, 101, 249), 0.5) !important;
}

/* Hover State for Buttons in Filter Controls */
.filter-controls .ant-btn:hover {
    border-color: var(--bolt-primary, #5165f9) !important;
     /* Added Glow Effect - Adjust color/opacity slightly for buttons if desired */
    box-shadow: 0 0 5px 1px rgba(var(--bolt-primary-rgb, 81, 101, 249), 0.5) !important;
    /* Optional: Slightly brighten background on hover for default buttons */
    /* background-color: var(--bolt-hover-background) !important; */
}
/* Keep primary button background on hover, but apply glow */
.filter-controls .ant-btn-primary:hover {
    /* background-color: var(--bolt-primary-hover, #4155e7) !important; /* Antd might handle this */
    border-color: var(--bolt-primary-hover, #4155e7) !important; /* Darker border for primary */
    box-shadow: 0 0 5px 1px rgba(var(--bolt-primary-rgb, 81, 101, 249), 0.7) !important; /* Slightly stronger glow */
}

/* Focus State for Input/Select (Keep existing focus ring style) */
.filter-controls .ant-input-affix-wrapper-focused,
.filter-controls .ant-select-focused .ant-select-selector {
    border-color: var(--bolt-primary, #5165f9) !important;
    box-shadow: 0 0 0 2px rgba(var(--bolt-primary-rgb, 81, 101, 249), 0.2) !important; /* Consistent focus ring */
}

/* --- Glow Effect for Top Buttons --- */

/* Base transition for top buttons */
.p-4 > .ant-row:first-child .ant-btn {
    transition: border-color 0.2s ease-out, box-shadow 0.2s ease-out, background-color 0.2s ease-out !important;
}

/* Hover state for top buttons */
.p-4 > .ant-row:first-child .ant-btn:hover {
    border-color: var(--bolt-primary, #5165f9) !important;
    box-shadow: 0 0 5px 1px rgba(var(--bolt-primary-rgb, 81, 101, 249), 0.5) !important;
}

/* Adjust primary top button hover if needed */
.p-4 > .ant-row:first-child .ant-btn-primary:hover {
    border-color: var(--bolt-primary-hover, #4155e7) !important;
    box-shadow: 0 0 5px 1px rgba(var(--bolt-primary-rgb, 81, 101, 249), 0.7) !important;
}

/* --- Drawer Dark Theme Styles --- */

.ant-drawer-content-wrapper {
  /* Match card background */
  background-color: var(--bolt-elements-background-depth-2, #1e1e1e) !important;
}

.ant-drawer-header {
  background-color: var(--bolt-elements-background-depth-2, #1e1e1e) !important;
  border-bottom: 1px solid var(--bolt-elements-borderColor, #333) !important;
}

.ant-drawer-title {
  color: var(--bolt-elements-textPrimary, #fff) !important;
}

.ant-drawer-close {
  color: var(--bolt-elements-textSecondary, #ccc) !important;
}
.ant-drawer-close:hover {
  color: var(--bolt-elements-textPrimary, #fff) !important;
}

.ant-drawer-body {
  background-color: var(--bolt-elements-background-depth-2, #1e1e1e) !important;
  color: var(--bolt-elements-textPrimary, #fff) !important; /* Default text color in body */
}

/* Style form elements within the drawer */
.ant-drawer-body .ant-form-item-label > label {
    color: var(--bolt-elements-textSecondary, #ccc) !important; /* Lighter label color */
}

/* Force styling on ALL relevant input/select elements within the drawer's form items */
.ant-drawer-body .ant-form-item .ant-input,
.ant-drawer-body .ant-form-item .ant-input-affix-wrapper,
.ant-drawer-body .ant-form-item .ant-input-number,
.ant-drawer-body .ant-form-item .ant-select-selector {
    background-color: var(--bolt-elements-background-depth-1, #2a2a2a) !important;
    border-color: var(--bolt-elements-borderColor, #333) !important;
    color: var(--bolt-elements-textPrimary, #fff) !important;
}
/* Ensure the input element *inside* the affix wrapper also gets the styles */
.ant-drawer-body .ant-form-item .ant-input-affix-wrapper input.ant-input {
    background-color: transparent !important; /* Let wrapper handle background */
    color: var(--bolt-elements-textPrimary, #fff) !important;
    border: none !important; /* Remove border as wrapper has it */
}

/* Placeholders */
.ant-drawer-body .ant-form-item .ant-input-affix-wrapper input::placeholder, /* Specificity for placeholder in wrapper */
.ant-drawer-body .ant-input-number::placeholder,
.ant-drawer-body .ant-select-selection-placeholder {
    color: var(--bolt-elements-textDisabled, #555) !important; /* Dimmer placeholder */
}

/* Style buttons in the drawer footer area (even if footer is null, the Form.Item acts like one) */
.ant-drawer-body .ant-form-item:last-child {
     /* You might need a specific class if this isn't always the last item */
    background-color: var(--bolt-elements-background-depth-2, #1e1e1e) !important; /* Match drawer body */
    margin-top: 24px; /* Add some space above buttons */
    padding-top: 10px; /* Padding like a footer */
    border-top: 1px solid var(--bolt-elements-borderColor, #333) !important; /* Separator line */
}

.ant-drawer-body .ant-btn {
     /* Standard button styling */
}
.ant-drawer-body .ant-btn-primary {
     /* Primary button styling (might inherit theme) */
}
.ant-drawer-body .ant-btn-default {
     background-color: var(--bolt-elements-background-depth-1, #2a2a2a) !important;
     border-color: var(--bolt-elements-borderColor, #333) !important;
     color: var(--bolt-elements-textPrimary, #fff) !important;
}
.ant-drawer-body .ant-btn-default:hover {
    border-color: var(--bolt-primary, #5165f9) !important;
    color: var(--bolt-primary, #5165f9) !important;
}

/* --- File Upload Card Styles (Add if needed) --- */
.file-upload-card .file-upload-table .ant-table {
    background: var(--bolt-elements-background-depth-2, #1e1e1e) !important;
}
.file-upload-card .file-upload-table .ant-table-thead > tr > th {
  background: var(--bolt-elements-background-depth-2, #1e1e1e) !important;
  color: var(--bolt-elements-textSecondary) !important;
  border-bottom: 1px solid var(--bolt-elements-borderColor) !important;
}
.file-upload-card .file-upload-table .ant-table-tbody > tr > td {
  background: transparent !important;
  border-bottom: 1px solid var(--bolt-elements-borderColor) !important;
  color: var(--bolt-elements-textPrimary) !important;
}
.file-upload-card .file-upload-table .ant-table-cell {
    background: inherit !important;
}
.file-upload-card .file-upload-table .ant-table-tbody > tr {
    background: var(--bolt-elements-background-depth-2, #1e1e1e) !important;
}
.file-upload-card .file-upload-table .ant-table-tbody > tr:hover > td {
  background: var(--bolt-hover-background, rgba(255, 255, 255, 0.1)) !important;
}
/* Add similar styles for pagination, empty state, scrollbar if needed */
.file-upload-table-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.file-upload-table-container::-webkit-scrollbar-track {
  background: var(--bolt-elements-background-depth-1, #2a2a2a);
  border-radius: 4px;
}
.file-upload-table-container::-webkit-scrollbar-thumb {
  background-color: var(--bolt-elements-textDisabled, #555);
  border-radius: 4px;
  border: 2px solid var(--bolt-elements-background-depth-1, #2a2a2a);
}
.file-upload-table-container::-webkit-scrollbar-thumb:hover {
  background-color: var(--bolt-elements-textSecondary, #777);
}
.file-upload-table-container {
  scrollbar-width: thin;
  scrollbar-color: var(--bolt-elements-textDisabled, #555) var(--bolt-elements-background-depth-1, #2a2a2a);
}

/* --- Upload Modal Dark Styles --- */
.ant-modal-content {
    background-color: var(--bolt-elements-background-depth-2, #1e1e1e) !important;
}
.ant-modal-header {
    background-color: transparent !important; /* Set to transparent */
    border-bottom: 1px solid var(--bolt-elements-borderColor, #333) !important;
}
.ant-modal-title {
    color: var(--bolt-elements-textPrimary, #fff) !important;
}
.ant-modal-close {
    color: var(--bolt-elements-textSecondary, #ccc) !important;
}
.ant-modal-close:hover {
    color: var(--bolt-elements-textPrimary, #fff) !important;
}
.ant-modal-body {
    /* Inherits from content */
}
.ant-modal-footer {
     background-color: transparent !important; /* Set to transparent */
     border-top: 1px solid var(--bolt-elements-borderColor, #333) !important;
}

/* Style form elements within the modal */
.ant-modal-body .ant-form-item-label > label {
    color: var(--bolt-elements-textSecondary, #ccc) !important;
}
.ant-modal-body .upload-modal-select .ant-select-selector, /* Target specific select */
.ant-modal-body .ant-select-dropdown {
    background-color: var(--bolt-elements-background-depth-1, #2a2a2a) !important;
    border-color: var(--bolt-elements-borderColor, #333) !important;
    color: var(--bolt-elements-textPrimary, #fff) !important;
}
.ant-modal-body .upload-modal-select .ant-select-selection-placeholder {
    color: var(--bolt-elements-textDisabled, #555) !important;
}
.ant-modal-body .upload-modal-select .ant-select-arrow {
     color: var(--bolt-elements-textSecondary, #ccc) !important;
}

/* Style Upload Dragger */
.ant-modal-body .upload-modal-dragger,
.ant-modal-body .upload-modal-dragger .ant-upload.ant-upload-drag {
    background: var(--bolt-elements-background-depth-1, #2a2a2a) !important;
    border: 1px dashed var(--bolt-elements-borderColor, #555) !important;
}
.ant-modal-body .upload-modal-dragger:hover .ant-upload.ant-upload-drag {
    border-color: var(--bolt-primary, #5165f9) !important;
}
.ant-modal-body .upload-modal-dragger .ant-upload-drag-icon .anticon {
    color: var(--bolt-primary, #5165f9) !important;
}
.ant-modal-body .upload-modal-dragger .ant-upload-text {
    color: var(--bolt-elements-textPrimary, #fff) !important;
}
.ant-modal-body .upload-modal-dragger .ant-upload-hint {
    color: var(--bolt-elements-textSecondary, #ccc) !important;
}

/* Style Upload List Items (basic) */
.ant-modal-body .ant-upload-list-item {
    color: var(--bolt-elements-textPrimary, #fff) !important;
}
.ant-modal-body .ant-upload-list-item-error .ant-upload-list-item-name,
.ant-modal-body .ant-upload-list-item-error .ant-upload-list-item-card-actions .anticon {
    color: var(--bolt-danger, #f5222d) !important;
}


/* Style Modal Footer Buttons */
.ant-modal-footer .ant-btn-primary {
    /* Primary button styles (usually themed) */
}
.ant-modal-footer .ant-btn-default {
     background-color: var(--bolt-elements-background-depth-1, #2a2a2a) !important;
     border-color: var(--bolt-elements-borderColor, #333) !important;
     color: var(--bolt-elements-textPrimary, #fff) !important;
}
.ant-modal-footer .ant-btn-default:hover {
    border-color: var(--bolt-primary, #5165f9) !important;
    color: var(--bolt-primary, #5165f9) !important;
}

/* --- Ant Design Message (Toast) Dark Theme Styles --- */
.ant-message-notice-content {
    background-color: var(--bolt-elements-background-depth-1, #2a2a2a) !important; /* Darker background */
    color: var(--bolt-elements-textPrimary, #fff) !important;
    border: 1px solid var(--bolt-elements-borderColor, #444) !important; /* Subtle border */
    box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.25) !important; /* Adjusted shadow for dark */
    border-radius: 4px !important;
}

.ant-message-success .anticon {
    color: var(--bolt-success, #52c41a) !important; /* Use a success variable or fallback */
}

.ant-message-error .anticon {
    color: var(--bolt-danger, #ff4d4f) !important; /* Use danger variable or fallback (antd default red) */
}

.ant-message-info .anticon {
    color: var(--bolt-primary, #5165f9) !important; /* Use primary variable or fallback */
}

.ant-message-warning .anticon {
    color: var(--bolt-warning, #faad14) !important; /* Use warning variable or fallback */
}

.ant-message-loading .anticon {
    color: var(--bolt-primary, #5165f9) !important; /* Use primary for loading too */
}
/* --- End Toast Styles --- */

/* --- Upload Modal Spacing Fix --- */
.upload-modal-upload-item {
    margin-top: 16px !important; /* Add space above the upload section */
}

/* Adjust position of file type error message */
.upload-modal-filetype-item .ant-form-item-explain {
    margin-top: 14px !important; /* Adjusted value to 14px */
}

/* Ensure all form validation errors are red */
.ant-form-item-explain-error {
    color: var(--bolt-danger, #ff4d4f) !important; /* Use danger variable or Antd default red */
}

/* Reduce font size in file upload table in main panel */
.file-upload-table .ant-table-tbody > tr > td {
    font-size: 12px !important; /* Smaller font size */
}

/* Reduce font size in emission source table */
.emission-source-table .ant-table-tbody > tr > td {
    font-size: 12px !important; /* Smaller font size */
}

/* Styles for the table within the upload modal */
.upload-modal-file-table .ant-table-tbody > tr > td {
  font-size: 12px; /* Consistent small font */
  padding: 8px !important; /* Adjust padding for Select */
}

.upload-modal-file-table .ant-table-tbody > tr > td:nth-child(2) > .ant-select {
  margin-left: 18px !important; /* 轻微向右推移 */
}

.upload-modal-file-table .ant-select-selector {
  height: 30px !important; /* Ensure select fits well */
  font-size: 12px;
  width: 90px !important; /* Explicit fixed width */
  min-width: 90px !important; /* Ensure it doesn't shrink further */
  box-sizing: border-box !important; /* Ensure padding/border are included in width */
}
.upload-modal-file-table .ant-select-selection-item,
.upload-modal-file-table .ant-select-selection-placeholder {
  line-height: 28px !important; /* Adjust line height for vertical centering */
}


`;

// 注入样式到 head
if (typeof window !== 'undefined') {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = customStyles;
    document.head.appendChild(styleTag);
}

// 添加 ClientOnly 包装器，如果需要确保此组件仅在客户端渲染
export const CarbonCalculatorPanelClient = () => (
  <ClientOnly fallback={<div>Loading Panel...</div>}>
    {() => <CarbonCalculatorPanel />}
  </ClientOnly>
); 