import { type ActionFunctionArgs, json } from '@remix-run/node'; // Or cloudflare/deno
import { createOpenAI } from '@ai-sdk/openai'; // We reuse this client for compatible APIs
import { type LanguageModelV1 } from 'ai';

import { parseCsvWithLlmAgent } from '~/lib/agents/csv-parser'; // Adjust path if needed

// --- IMPORTANT: LLM Instance Configuration for Aliyun Dashscope ---
// This uses the OpenAI-compatible endpoint for Dashscope.
// Ensure process.env.DASHSCOPE_API_KEY is set in your environment!
let llmInstance: LanguageModelV1 | undefined;
const llmProviderName = 'Aliyun'; // Set provider name
const dashscopeEndpoint = 'https://dashscope.aliyuncs.com/compatible-mode/v1'; // Dashscope OpenAI-compatible endpoint
const dashscopeModel = 'qwen-plus'; // Example model, adjust if needed (e.g., qwen-turbo, qwen-max)


try {
  if (!process.env.DASHSCOPE_API_KEY) {
    console.warn(
      'DASHSCOPE_API_KEY environment variable is not set. API route /api/parse-csv might fail.',
    );
    // Handle appropriately - maybe assign a dummy/error state or allow proceeding if offline testing
  } else {
    // Use createOpenAI but configure it for Dashscope
    const dashscope = createOpenAI({
      apiKey: process.env.DASHSCOPE_API_KEY,
      baseURL: dashscopeEndpoint,
    });

    llmInstance = dashscope(dashscopeModel);
  }
} catch (err) {
  console.error('Failed to initialize Aliyun LLM instance for /api/parse-csv:', err);
  // Handle the error appropriately
}
// --- End LLM Configuration ---

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, { status: 405 });
  }

  if (!llmInstance) {
    console.error(
      '/api/parse-csv called but LLM Service Not Initialized (API key missing or initialization failed?)',
    );
    return json({ error: 'LLM Service Not Initialized' }, { status: 500 });
  }

  try {
    // Type assertion for payload - assumes client sends { csvContent: string }
    const payload = await request.json() as { csvContent?: unknown };
    const { csvContent } = payload;

    if (!csvContent || typeof csvContent !== 'string') {
      return json({ error: 'Missing or invalid csvContent' }, { status: 400 });
    }

    console.log('[API /api/parse-csv] Received request for CSV parsing using Aliyun.');

    const parsedItems = await parseCsvWithLlmAgent({
      llmInstance,
      csvContent,
      llmProviderName, // Pass the correct provider name
    });

    console.log(`[API /api/parse-csv] Successfully parsed ${parsedItems.length} items using Aliyun.`);
    // Return the array of CsvParseResultItem objects directly
    return json({ success: true, data: parsedItems });
  } catch (error) {
    console.error('[API /api/parse-csv] Error processing CSV with Aliyun:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error during CSV parsing';
    // Consider logging the full error stack trace for better debugging
    // console.error(error);
    return json({ error: `Failed to parse CSV: ${errorMessage}` }, { status: 500 });
  }
}

// Optional: Add a loader function if you need to handle GET requests for this route
// export async function loader({ request }: LoaderFunctionArgs) {
//   return json({ message: "POST requests only for CSV parsing." });
// }