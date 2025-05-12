import type { ActionFunction } from '@remix-run/node';
import { autofillTransportWithLlmAgent } from '~/lib/agents/transport-autofill-agent';

export const action: ActionFunction = async ({ request }) => {
  const { nodes } = await request.json();
  if (!Array.isArray(nodes)) {
    return new Response(JSON.stringify({ error: '参数错误' }), { status: 400 });
  }
  try {
    const result = await autofillTransportWithLlmAgent({
      nodes,
      llmProviderName: 'qwen-plus', // 或者您希望使用的其他provider名称
    });
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (e: any) {
    console.error('AI Autofill Transport API Error:', e);
    return new Response(JSON.stringify({ error: e.message || 'Internal Server Error' }), { status: 500 });
  }
}; 