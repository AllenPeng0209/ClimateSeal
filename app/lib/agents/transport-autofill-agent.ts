import OpenAI from 'openai';

export interface TransportAutofillInputItem {
  nodeId: string;
  startPoint: string;
  endPoint: string;
  name: string;
}

export interface TransportAutofillResultItem {
  nodeId: string;
  transportType: string; // 运输方式，如"卡车"、"火车"
  distance: number; // 距离，单位km
  distanceUnit: string; // 距离单位，通常为"km"
  emissionFactor?: number; // 可选，kgCO2e/km
  notes?: string; // AI补全说明
}

interface TransportAutofillAgentOptions {
  nodes: TransportAutofillInputItem[];
  llmProviderName: string;
  apiKey?: string;
  baseURL?: string;
  model?: string;
}

export async function autofillTransportWithLlmAgent({
  nodes,
  apiKey = process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY,
  baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  model = 'qwen-plus',
}: TransportAutofillAgentOptions): Promise<TransportAutofillResultItem[]> {
  // 1. 构造详细 prompt
  const prompt = `
你是碳足迹运输数据补全专家。请根据输入的每个节点（包含 nodeId、起点、终点、名称），推测合理的运输方式、距离（km）、距离单位，并补全相关字段。
输出严格的 JSON 数组，每个元素结构如下：
{
  "nodeId": "xxx",
  "transportType": "卡车",
  "distance": 123.4,
  "distanceUnit": "km",
  "emissionFactor": 0.12, // 可选
  "notes": "推理说明"
}
注意事项：
1. distance 必须为数字，distanceUnit 必须为"km"。
2. 不要编造 emissionFactor，若无数据可不填。
3. 输出必须是严格的 JSON 数组，不要有任何多余文本或 markdown。
4. 不要输出解释、说明、markdown，只输出 JSON 数组本身。

输入节点：
${JSON.stringify(nodes, null, 2)}
`;

  const openai = new OpenAI({
    apiKey,
    baseURL,
  });

  let llmResponseText: string | null = null;
  try {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: '你是碳足迹运输数据补全专家。' },
      { role: 'user', content: prompt },
    ];
    const completion = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: 2048,
      temperature: 0.2,
    });
    if (
      completion &&
      completion.choices &&
      completion.choices[0] &&
      completion.choices[0].message &&
      completion.choices[0].message.content
    ) {
      llmResponseText = completion.choices[0].message.content;
    } else {
      throw new Error('无法从大模型返回中提取内容');
    }
  } catch (error: any) {
    console.error('[TransportAutofillAgent] LLM API 调用异常:', error);
    throw error;
  }

  if (!llmResponseText || llmResponseText.trim() === '') {
    throw new Error('大模型返回内容为空');
  }

  // 2. 解析和校验 JSON
  let parsedJson: any;
  try {
    const cleaned = llmResponseText.trim().replace(/^```json\s*|\s*```$/g, '');
    parsedJson = JSON.parse(cleaned);
  } catch (error) {
    console.error('[TransportAutofillAgent] JSON 解析失败:', error);
    console.error('[TransportAutofillAgent] 原始返回:', llmResponseText);
    throw new Error('大模型返回内容 JSON 解析失败');
  }
  if (!Array.isArray(parsedJson)) {
    throw new Error('大模型返回内容不是数组');
  }

  // 3. 校验每个元素
  const validItems: TransportAutofillResultItem[] = [];
  for (const item of parsedJson) {
    if (
      item &&
      typeof item === 'object' &&
      typeof item.nodeId === 'string' &&
      typeof item.transportType === 'string' &&
      typeof item.distance === 'number' &&
      typeof item.distanceUnit === 'string'
    ) {
      validItems.push(item as TransportAutofillResultItem);
    } else {
      console.warn('[TransportAutofillAgent] 跳过无效项:', item);
    }
  }
  if (validItems.length === 0) {
    throw new Error('大模型返回内容无有效补全项');
  }
  return validItems;
} 