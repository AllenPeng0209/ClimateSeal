import { supabase } from '~/lib/supabase';
import { generateText } from 'ai';
import { DEFAULT_MODEL, DEFAULT_PROVIDER } from '~/utils/constants';
import { LLMManager } from '~/lib/modules/llm/manager';
import { saveFile, getFilesByWorkflow, getFileUrl } from './file-storage';
import type { FileMetadata } from './file-storage';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('file-processor');

export interface FileProcessingResult {
  fileId: string;
  type: string;               // 文件物理类型: csv / pdf / excel / unknown
  category: string;           // 业务语义分类: bom / energy / distribution / usage / waste / unknown
  content: string;
  actions: CarbonFlowAction[]; // 建议写入 CarbonFlow 的操作列表
  userPrompt?: string;        // 用于 Chat Action 的用户提示
}

export interface FileInfo {
  name: string;
  path: string;
  type: string;
  content: string;
}

export interface CarbonFlowAction {
  type: "carbonflow";
  operation: "create" | "update" | "delete" | "query" | "connect" | "layout" | "calculate";
  nodeId?: string;
  position?: string;
  data: string;
  description?: string;
}

export async function uploadFile(file: File): Promise<{ path: string }> {
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(`temp/${file.name}`, file);
  
  if (error) throw error;
  return { path: data.path };
}

export function determineFileType(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (['xlsx', 'xls'].includes(ext)) return 'excel';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'csv') return 'csv';
  return 'unknown';
}

export async function readFileContent(file: File): Promise<string> {
  // 浏览器环境
  if (typeof window !== 'undefined' && typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  // Node/服务器环境
  // @ts-ignore - File in node has arrayBuffer()
  const buffer = await file.arrayBuffer();
  const content = Buffer.from(buffer).toString('utf-8');
  logger.debug('processFile:readFileContent done', { length: content.length });
  return content;
}

export function parseBOMToCarbonFlow(content: string): CarbonFlowAction[] {
  const actions: CarbonFlowAction[] = [];

  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return actions;

  const headers = lines[0].split(',').map((h) => h.trim());

  lines.slice(1).forEach((line, idx) => {
    const cols = line.split(',');
    if (cols.length === 0 || !cols[0]) return;

    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h] = cols[i]?.trim() || '';
    });

    const nodeId = `bom_${idx}`;
    actions.push({
      type: 'carbonflow',
      operation: 'create',
      nodeId,
      data: JSON.stringify({
        label: record['name'] || record['material'] || `Material ${idx + 1}`,
        lifecycleStage: 'rawMaterial',
        ...record,
      }),
      description: 'Create BOM material node',
    });
  });

  return actions;
}

export function parseEnergyDataToCarbonFlow(content: string): CarbonFlowAction[] {
  const actions: CarbonFlowAction[] = [];
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return actions;

  const headers = lines[0].split(',').map((h) => h.trim());

  lines.slice(1).forEach((line, idx) => {
    const cols = line.split(',');
    if (!cols[0]) return;

    const record: Record<string, string> = {};
    headers.forEach((h, i) => (record[h] = cols[i]?.trim() || ''));

    const nodeId = `energy_${idx}`;
    actions.push({
      type: 'carbonflow',
      operation: 'create',
      nodeId,
      data: JSON.stringify({
        label: record['device'] || record['equipment'] || `Energy ${idx + 1}`,
        lifecycleStage: 'manufacturing',
        energyType: record['energyType'] || record['type'] || 'electricity',
        energyConsumption: Number(record['amount'] || record['consumption'] || 0),
        ...record,
      }),
      description: 'Create energy consumption node',
    });
  });

  return actions;
}

export function parseDistributionDataToCarbonFlow(content: string): CarbonFlowAction[] {
  const actions: CarbonFlowAction[] = [];
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return actions;
  const headers = lines[0].split(',').map((h) => h.trim());

  lines.slice(1).forEach((line, idx) => {
    const cols = line.split(',');
    if (!cols[0]) return;
    const record: Record<string, string> = {};
    headers.forEach((h, i) => (record[h] = cols[i]?.trim() || ''));

    const nodeId = `dist_${idx}`;
    actions.push({
      type: 'carbonflow',
      operation: 'create',
      nodeId,
      data: JSON.stringify({
        label: record['route'] || `Distribution ${idx + 1}`,
        lifecycleStage: 'distribution',
        transportationMode: record['mode'] || record['transport'] || 'truck',
        transportationDistance: Number(record['distance'] || 0),
        ...record,
      }),
      description: 'Create distribution node',
    });
  });
  return actions;
}

export function parseUsageDataToCarbonFlow(content: string): CarbonFlowAction[] {
  const actions: CarbonFlowAction[] = [];
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return actions;
  const headers = lines[0].split(',').map((h) => h.trim());

  lines.slice(1).forEach((line, idx) => {
    const cols = line.split(',');
    if (!cols[0]) return;
    const record: Record<string, string> = {};
    headers.forEach((h, i) => (record[h] = cols[i]?.trim() || ''));

    const nodeId = `usage_${idx}`;
    actions.push({
      type: 'carbonflow',
      operation: 'create',
      nodeId,
      data: JSON.stringify({
        label: record['activity'] || `Usage ${idx + 1}`,
        lifecycleStage: 'usage',
        energyConsumptionPerUse: Number(record['energy'] || 0),
        waterConsumptionPerUse: Number(record['water'] || 0),
        ...record,
      }),
      description: 'Create usage node',
    });
  });
  return actions;
}

export function parseWasteDataToCarbonFlow(content: string): CarbonFlowAction[] {
  const actions: CarbonFlowAction[] = [];
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return actions;
  const headers = lines[0].split(',').map((h) => h.trim());

  lines.slice(1).forEach((line, idx) => {
    const cols = line.split(',');
    if (!cols[0]) return;
    const record: Record<string, string> = {};
    headers.forEach((h, i) => (record[h] = cols[i]?.trim() || ''));

    const nodeId = `waste_${idx}`;
    actions.push({
      type: 'carbonflow',
      operation: 'create',
      nodeId,
      data: JSON.stringify({
        label: record['method'] || `Waste ${idx + 1}`,
        lifecycleStage: 'endOfLife',
        disposalMethod: record['method'] || 'landfill',
        wasteAmount: Number(record['amount'] || 0),
        ...record,
      }),
      description: 'Create waste disposal node',
    });
  });
  return actions;
}

export async function processFile(file: File, workflowId: string): Promise<FileProcessingResult> {
  try {
    logger.debug('Starting file processing', {
      fileName: file.name,
      workflowId,
      size: file.size,
      type: file.type,
    });

    // 1. 保存文件到 Supabase
    logger.debug('Attempting to save file to storage');
    const fileMetadata = await saveFile(file, workflowId);
    logger.debug('File saved successfully', { fileMetadata });
    
    // 2. 根据文件类型处理文件
    logger.debug('Determining file type');
    const fileType = determineFileType(file);
    logger.debug('File type determined', { fileType });

    logger.debug('Reading file content');
    const content = await readFileContent(file);
    logger.debug('File content read successfully', { contentLength: content.length });
    
    // === 使用 LLM 进行语义分类 ===
    logger.debug('Classifying file category');
    const category = await classifyFileCategory(file.name, content);
    logger.debug('File category determined', { category });

    let actions: CarbonFlowAction[] = [];
    let userPrompt = '';

    logger.debug('Processing file based on category', { category });
    switch (category) {
      case 'bom':
        actions = parseBOMToCarbonFlow(content);
        userPrompt = '我上传了一个BOM清单，请根据以下操作更新碳足迹模型。';
        break;
      case 'energy':
        actions = parseEnergyDataToCarbonFlow(content);
        userPrompt = '我上传了能耗数据清单，请根据以下操作更新碳足迹模型。';
        break;
      case 'distribution':
        actions = parseDistributionDataToCarbonFlow(content);
        userPrompt = '我上传了分销数据清单，请根据以下操作更新碳足迹模型。';
        break;
      case 'usage':
        actions = parseUsageDataToCarbonFlow(content);
        userPrompt = '我上传了产品使用阶段数据，请根据以下操作更新碳足迹模型。';
        break;
      case 'waste':
        actions = parseWasteDataToCarbonFlow(content);
        userPrompt = '我上传了废弃处理数据，请根据以下操作更新碳足迹模型。';
        break;
      default:
        userPrompt = '我上传了一个数据文件，请帮我分析并更新碳足迹模型。';
    }
    
    logger.debug('File processing completed', {
      fileId: fileMetadata.id,
      type: fileType,
      category,
      actionCount: actions.length,
      userPrompt
    });

    // 4. 返回处理结果
    return {
      fileId: fileMetadata.id,
      type: fileType,
      category,
      content,
      actions,
      userPrompt,
    };
  } catch (error) {
    logger.error('Failed to process file', { 
      error, 
      fileName: file.name,
      workflowId,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

export function extractBoltActions(response: string): string {
  // 使用正则表达式提取 BoltAction
  const boltActionRegex = /<boltArtifact[^>]*>[\s\S]*?<\/boltArtifact>/g;
  const matches = response.match(boltActionRegex);
  return matches ? matches.join('\n') : '';
}

export function validateBoltAction(boltAction: string): boolean {
  // 验证 BoltAction 格式
  try {
    // 检查是否包含必要的标签
    if (!boltAction.includes('<boltArtifact') || !boltAction.includes('</boltArtifact>')) {
      return false;
    }
    
    // 检查是否包含必要的属性
    const artifactId = boltAction.match(/id="([^"]*)"/);
    const artifactTitle = boltAction.match(/title="([^"]*)"/);
    if (!artifactId || !artifactTitle) {
      return false;
    }
    
    // 检查是否包含 CarbonFlow 操作
    if (!boltAction.includes('type="carbonflow"')) {
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Failed to validate BoltAction', { error, boltAction });
    return false;
  }
}

export async function getWorkflowFiles(workflowId: string): Promise<FileMetadata[]> {
  return getFilesByWorkflow(workflowId);
}

export async function getFileContent(filePath: string): Promise<string> {
  const fileUrl = await getFileUrl(filePath);
  const response = await fetch(fileUrl);
  return await response.text();
}

/**
 * 使用 LLM 对文件内容进行语义分类
 * 返回: bom | energy | distribution | usage | waste | unknown
 */
export async function classifyFileCategory(fileName: string, content: string): Promise<string> {
  try {
    logger.debug('classifyFileCategory:start', { fileName });
    const provider = DEFAULT_PROVIDER;
    const llmMgr = LLMManager.getInstance();
    let modelDetails = llmMgr.getStaticModelListFromProvider(provider).find((m) => m.name === DEFAULT_MODEL);

    if (!modelDetails) {
      // fallback to first available model
      const allModels = provider.staticModels || [];
      modelDetails = allModels[0];
    }

    // 只取前 1500 字符，避免 prompt 过长
    const snippet = content.slice(0, 1500);
    const prompt = `
你是碳足迹评估助手，需要根据文件名和文件内容判断其属于哪一类数据。
可选类别如下（仅返回对应英文关键字，不要添加其他文本）：
  - bom           : 物料清单/BOM
  - energy        : 能耗数据（例如用电、燃气等）
  - distribution  : 分销/运输数据
  - usage         : 产品使用阶段数据
  - waste         : 废弃/废气处理数据

如果无法确定，返回 unknown。

文件名: ${fileName}
文件内容片段:
"""
${snippet}
"""

请输出上面列表中最合适的一个关键字。`;

    const result = await generateText({
      model: provider.getModelInstance({ model: modelDetails.name }),
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 5,
    });

    const output = result.text.trim().toLowerCase();
    logger.debug('classifyFileCategory:llm_output', { output });
    if (['bom', 'energy', 'distribution', 'usage', 'waste'].includes(output)) {
      return output;
    }
    return 'unknown';
  } catch (err) {
    logger.error('LLM classify file category failed', { err });
    return 'unknown';
  }
} 