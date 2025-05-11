import OpenAI from "openai";

/**
 * Defines the structure for each item parsed by the CsvParsingAgent.
 * Ensures that the data object always includes a non-empty label.
 */
export interface CsvParseResultItem {
  nodeType: string; // e.g., 'product', 'manufacturing'
  data: Record<string, any> & { label: string }; // data object MUST contain label
}

/**
 * Interface defining the options required to initialize the CsvParsingAgent.
 */
interface CsvParsingAgentOptions {
  csvContent: string; // The CSV text content to parse
  llmProviderName: string; // Name of the LLM provider (for logging, less relevant now)
  apiKey?: string; // API Key for the LLM provider
  baseURL?: string; // Base URL for the LLM provider API
  model?: string; // Model name to use
}

/**
 * Child Agent: CsvParsingAgent
 *
 * Responsible for calling an LLM to parse CSV content, determine the nodeType
 * for each row, and return a validated array of structured node data.
 *
 * @param options - Configuration including the CSV content, API key, baseURL, and model.
 * @returns A Promise resolving to an array of CsvParseResultItem objects.
 * @throws {Error} If the LLM API call fails, or if the response is empty,
 *                 invalid JSON, not an array, or contains no valid items
 *                 matching the expected structure.
 */
export async function parseCsvWithLlmAgent({
  csvContent,
  apiKey = process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY,
  baseURL = "https://dashscope.aliyuncs.com/compatible-mode/v1", // Default baseURL from example
  model = 'qwen-plus',
}: CsvParsingAgentOptions): Promise<CsvParseResultItem[]> {
  console.log(`[CsvParsingAgent] Starting CSV parsing using official OpenAI SDK compatible API...`);

  // --- 1. Construct the Prompt (Remains the same) ---
  const prompt = `
You are an expert data extraction assistant specializing in carbon footprint lifecycle analysis.
Your task is to meticulously parse the following CSV data. Each row likely represents a material, component, or process step in a product's lifecycle.

Follow these instructions precisely:
1.  **确定单一节点类型:** 分析整个CSV文件，确定所有行共同代表的一个生命周期阶段。从以下选项中选择一种作为整个文件的nodeType: 'product'(产品/原材料), 'manufacturing'(制造), 'distribution'(分销), 'usage'(使用), 'disposal'(处置)。所有行必须使用相同的nodeType。

2.  **提取标签:** 为每行提取清晰简洁的名称或标识符。这必须放在每个'data'对象内的'label'字段中。'label'字段不能为空。

3.  **提取所有基础数据:** 对每行，始终填充以下基础字段:
    * label: 描述性标签(必填)
    * nodeName: 节点名称(必填)
    * lifecycleStage: 生命周期阶段(必填)
    * emissionType: 排放类型(必填)
    * quantity: 数量(必填)
    * activitydataSource: 活动数据来源(有则填，无则不填)
    * activityScore: 活动评分(有则填，无则不填)
    * activityScorelevel: 活动评分等级(有则填，无则不填)
    * verificationStatus: 验证状态(有则填，无则不填)
    * carbonFootprint: 碳足迹值(数值)
    * carbonFactor: 碳排放因子(有则填，无则不填)
    * carbonFactorName: 碳因子名称(有则填，无则不填)  
    * unitConversion: 单位转换(数值,有则填，无则不填)
    * carbonFactordataSource: 碳因子数据来源(有则填，无则不填)

4.  **根据节点类型提取专属数据:** 根据第一步确定的nodeType，每行还必须包含以下对应字段:
    * 如果是'product'类型:
      - material: 材料种类
      - weight_per_unit: 单位重量
      - weight: 重量(数值)
      - supplier: 供应商
      - isRecycled: 是否回收(布尔值)
      - recycledContent: 回收成分
      - recycledContentPercentage: 回收成分百分比(数值)
      - sourcingRegion: 采购区域
      - 其他所有适用于产品的字段

    * 如果是'manufacturing'类型:
      - energyConsumption: 能源消耗(数值)
      - energyType: 能源类型
      - productionMethod: 生产方法
      - waterConsumption: 水消耗(数值)
      - processEfficiency: 工艺效率(数值)
      - wasteGeneration: 废物产生(数值)
      - 其他所有适用于制造的字段

    * 如果是'distribution'类型:
      - transportationMode: 运输方式
      - transportationDistance: 运输距离(数值)
      - startPoint: 起点
      - endPoint: 终点
      - packagingMaterial: 包装材料
      - vehicleType: 车辆类型
      - fuelType: 燃料类型
      - 其他所有适用于分销的字段

    * 如果是'usage'类型:
      - lifespan: 寿命(数值)
      - energyConsumptionPerUse: 每次使用能耗(数值)
      - waterConsumptionPerUse: 每次使用水耗(数值)
      - usageFrequency: 使用频率(数值)
      - maintenanceFrequency: 维护频率(数值)
      - 其他所有适用于使用阶段的字段

    * 如果是'disposal'类型:
      - recyclingRate: 回收率(数值)
      - landfillPercentage: 填埋比例(数值)
      - disposalMethod: 处置方法
      - endOfLifeTreatment: 生命周期结束处理
      - hazardousWasteContent: 有害废物含量(数值)
      - 其他所有适用于处置阶段的字段

5.  **处理缺失数据:** 如果某行缺少关键字段，提取其他可用信息，但不要编造数据。缺失的数值字段可以设为0，缺失的字符串字段设为空字符串。

6.  **数量跟重量的填写：** 当这个表的数量跟重量是同一个字段时，请将数量设定为重量, 并且给出单位

7.  **输出格式:** 您的*整个*输出必须是单个有效的JSON数组。数组中的每个对象代表一个成功解析的行，并且必须具有以下结构：
    {
      "nodeType": "确定的单一节点类型", 
      "data": {          
        "label": "必需的标签",
        "nodeName": "必需的标签(同label)",
        "lifecycleStage": "生命周期阶段",
        "emissionType": "排放类型",  //原材料、原材料运输、生产能耗、辅材&添加剂、水资源、包装材料、生产过程-温室气体直接排放、废气、固体废弃物、废水、燃料消耗、成品运输、耗材、使用阶段排放、填埋活焚烧排放、回收材料、不可回收材料
        "quantity": "数量",  //数量後面要加单位（重量、体积、计数、包装、能源）, example: 1000kg, 100本（册子）、57吨、 2.5m³ (立方米)、3加仑 (gallon)、1000kWh (千瓦时)、24箱 (cartons)
        "activityUnit": "数量单位", //数量单位
        其他所有必要字段
      }
    }

7.  **严格JSON数组:** 不要在JSON数组之前或之后包含*任何*文本。没有介绍、解释、道歉或markdown格式。只有JSON数组本身。

CSV Data:
\`\`\`
${csvContent}
\`\`\`
`;

  // --- 2. Call LLM API using official OpenAI SDK ---
  let llmResponseText: string | null = null; // Initialize to null

  const openai = new OpenAI({
    apiKey,
    baseURL,
  });

  try {
    console.log(`[CsvParsingAgent] About to call openai.chat.completions.create for model ${model} at ${new Date().toISOString()}`);

    // Define messages with types compatible with OpenAI SDK
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: "You are an expert data extraction assistant." },
      { role: "user", content: prompt },
    ];

    const completion = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: 8192, // Ensure this parameter is appropriate and supported
      // temperature: 0, // Optional: for deterministic output, if needed
    });

    console.log(`[CsvParsingAgent] openai.chat.completions.create call completed at ${new Date().toISOString()}`);

    if (completion && completion.choices && completion.choices[0] && completion.choices[0].message && completion.choices[0].message.content) {
      llmResponseText = completion.choices[0].message.content;
      console.log(`[CsvParsingAgent] Received response content. Length: ${llmResponseText.length}`);
      // console.log("[CsvParsingAgent] Raw LLM Response content:", llmResponseText); // Uncomment for full response
    } else {
      console.error('[CsvParsingAgent] Error: Could not extract content from LLM response. Response structure:', JSON.stringify(completion, null, 2));
      throw new Error('Could not extract content from LLM response.');
    }
    // Log usage if available and needed
    if (completion.usage) {
        console.log(`[CsvParsingAgent] Token usage: ${JSON.stringify(completion.usage)}`);
    }


  } catch (error: any) {
    console.error(`[CsvParsingAgent] Error during OpenAI API call or processing:`);
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    if (error.status) {
      console.error("Error status:", error.status);
    }
    if (error.message) {
      console.error("Error message:", error.message);
    }
    if (error.response && error.response.data) {
      console.error("Error response data:", JSON.stringify(error.response.data, null, 2));
    }
    if (error.error) {
        console.error("Nested error details:", JSON.stringify(error.error, null, 2));
    }
    // It's important to also log the state of llmResponseText if an error occurs after it might have been (or not been) set.
    console.error(`[CsvParsingAgent] State at error: llmResponseText="${llmResponseText}"`);
    throw error;
  }

  if (!llmResponseText || llmResponseText.trim() === '') {
    console.error('[CsvParsingAgent] Error: LLM response content was empty or null after API call.');
    throw new Error('LLM response content was empty or null after API call.');
  }

  // --- 3. Parse and Validate Response (Remains largely the same) ---
  let parsedJson: any;

  try {
    const cleanedResponse = llmResponseText.trim().replace(/^```json\\s*|\\s*```$/g, '');
    parsedJson = JSON.parse(cleanedResponse);
    console.log('[CsvParsingAgent] Successfully parsed JSON response.');
  } catch (error) {
    console.error('[CsvParsingAgent] Error parsing LLM response JSON:', error);
    console.error('[CsvParsingAgent] Raw response causing error:', llmResponseText);
    throw new Error(`Failed to parse LLM response as JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!Array.isArray(parsedJson)) {
    console.error('[CsvParsingAgent] Error: Parsed JSON is not an array. Response:', parsedJson);
    throw new Error('Parsed JSON response is not an array.');
  }

  // --- 4. Validate Individual Items and Filter (Remains the same) ---
  const validItems: CsvParseResultItem[] = [];

  for (const item of parsedJson) {
    if (
      item &&
      typeof item === 'object' &&
      typeof item.nodeType === 'string' &&
      item.data &&
      typeof item.data === 'object' &&
      typeof item.data.label === 'string' &&
      item.data.label.trim() !== ''
    ) {
      validItems.push(item as CsvParseResultItem);
    } else {
      console.warn('[CsvParsingAgent] Skipping invalid item in LLM response:', item);
    }
  }

  if (validItems.length === 0) {
    console.error('[CsvParsingAgent] Error: No valid items found in the parsed LLM response.');
    console.error('[CsvParsingAgent] Original parsed array:', parsedJson);
    throw new Error('No valid items found in the LLM response after parsing and validation.');
  }

  console.log(`[CsvParsingAgent] Successfully parsed and validated ${validItems.length} items from CSV.`);

  return validItems;
}
