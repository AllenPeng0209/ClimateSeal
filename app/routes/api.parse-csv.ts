import { type ActionFunctionArgs, json } from '@remix-run/node'; // or @remix-run/cloudflare
import { parseCsvWithLlmAgent } from '~/lib/agents/csv-parser';

/**
 * Constants for the Aliyun Dashscope LLM configuration.
 */
const LLM_PROVIDER_NAME = 'Aliyun';
const DASHSCOPE_ENDPOINT = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const DASHSCOPE_MODEL = 'qwen-plus'; // Or your preferred model, e.g., qwen-turbo, qwen-max

/**
 * Fallback API key - ensure this is a valid key if you rely on this fallback mechanism.
 * It is strongly recommended to set the API key via .env and bindings.
 */
const FALLBACK_DASHSCOPE_API_KEY = 'sk-fa57208fc8184dd89310666789d16faa'; // Replace with your actual fallback or remove if not needed

export async function action({ request, context }: ActionFunctionArgs) {
  console.log('[API /api/parse-csv Action] Received request.');

  // --- BEGIN DETAILED DEBUGGING ---
  console.log('[API /api/parse-csv Action] Inspecting context.cloudflare.env object:');
  if (context && context.cloudflare && context.cloudflare.env) {
    console.log(JSON.stringify(context.cloudflare.env, null, 2));
    const rawApiKeyFromEnv = context.cloudflare.env.DASHSCOPE_API_KEY;
    console.log(`[API /api/parse-csv Action] Raw DASHSCOPE_API_KEY from env: "${rawApiKeyFromEnv}"`);
    console.log(`[API /api/parse-csv Action] Type of DASHSCOPE_API_KEY from env: ${typeof rawApiKeyFromEnv}`);
  } else {
    console.log('[API /api/parse-csv Action] context.cloudflare.env is not available.');
  }
  // --- END DETAILED DEBUGGING ---

  if (request.method !== 'POST') {
    console.warn('[API /api/parse-csv Action] Method not POST. Returning 405.');
    return json({ error: 'Method Not Allowed' }, { status: 405 });
  }

  const dashscopeApiKeyFromEnv = context?.cloudflare?.env?.DASHSCOPE_API_KEY as string | undefined;
  let apiKeyToUse: string | undefined = dashscopeApiKeyFromEnv;
  const apiKeySource = 'Cloudflare binding (context.cloudflare.env.DASHSCOPE_API_KEY)'; // Made const as it's not reassigned before fallback

  console.log(
    `[API /api/parse-csv Action] Attempting to use API key from ${apiKeySource}. Value (raw): "${apiKeyToUse}", Type: ${typeof apiKeyToUse}. Fallback will be used if this is empty, null, or undefined.`
  );

  if (!apiKeyToUse) { // This condition is true for "", null, undefined
    console.warn(
      `[API /api/parse-csv Action] DASHSCOPE_API_KEY was not found or was empty via ${apiKeySource}. Value was: "${dashscopeApiKeyFromEnv}". Attempting to use hardcoded fallback key.`,
    );
    apiKeyToUse = FALLBACK_DASHSCOPE_API_KEY;
    // apiKeySource = 'Hardcoded fallback'; // This line was previously here, uncomment if apiKeySource should reflect fallback status

    if (!apiKeyToUse || apiKeyToUse === 'YOUR_FALLBACK_DASHSCOPE_API_KEY_HERE' || apiKeyToUse.length < 10) {
      console.error(
        '[API /api/parse-csv Action] Fallback DASHSCOPE_API_KEY is invalid or a placeholder. LLM service cannot be initialized.',
      );
      return json({ error: 'LLM Service Misconfigured: Invalid Fallback API Key' }, { status: 500 });
    }
    console.log(`[API /api/parse-csv Action] Now using API key from Hardcoded fallback.`);
  }

  try {
    const payload = (await request.json()) as { csvContent?: unknown };
    const { csvContent } = payload;

    if (!csvContent || typeof csvContent !== 'string' || csvContent.trim() === '') {
      console.warn('[API /api/parse-csv Action] Missing or invalid csvContent in request payload.');
      return json({ error: 'Missing or invalid csvContent' }, { status: 400 });
    }

    console.log('[API /api/parse-csv Action] Calling parseCsvWithLlmAgent...');
    const parsedItems = await parseCsvWithLlmAgent({
      csvContent,
      llmProviderName: LLM_PROVIDER_NAME,
      apiKey: apiKeyToUse, 
      baseURL: DASHSCOPE_ENDPOINT,
      model: DASHSCOPE_MODEL,
    });

    console.log(`[API /api/parse-csv Action] Successfully parsed ${parsedItems.length} items.`);
    return json({ success: true, data: parsedItems });

  } catch (error) {
    console.error('[API /api/parse-csv Action] Error during CSV processing or LLM interaction:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return json(
      { error: `Failed to parse CSV: ${errorMessage}` },
      { status: 500 },
    );
  }
}

// Optional: Add a loader function if you need to handle GET requests for this route
// export async function loader({ request }: LoaderFunctionArgs) {
//   return json({ message: "POST requests only for CSV parsing." });
// }