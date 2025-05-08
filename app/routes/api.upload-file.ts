import { json } from '@remix-run/node';
import type { ActionFunction } from '@remix-run/node';
import { saveFile } from '~/lib/.server/services/file-storage';

export const action: ActionFunction = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const workflowId = formData.get('workflowId') as string;

    if (!file || !workflowId) {
      return json({ error: 'Missing file or workflowId' }, { status: 400 });
    }

    const fileMetadata = await saveFile(file, workflowId);
    return json({ success: true, fileMetadata });
  } catch (error) {
    console.error('File upload error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}; 