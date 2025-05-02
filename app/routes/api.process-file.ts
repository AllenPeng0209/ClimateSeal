import { json } from '@remix-run/node';
import { processFile } from '~/lib/.server/services/file-processor';
import type { ActionFunctionArgs } from '@remix-run/node';

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const promptId = formData.get('promptId') as string;

    if (!file || !promptId) {
      return json({ error: 'Missing file or promptId' }, { status: 400 });
    }

    const result = await processFile(file, promptId);
    return json(result);
  } catch (error) {
    console.error('Error processing file:', error);
    return json({ error: 'Failed to process file' }, { status: 500 });
  }
} 