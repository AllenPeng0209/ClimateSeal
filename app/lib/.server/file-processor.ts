import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '~/utils/constants';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface FileInfo {
  name: string;
  path: string;
  type: string;
  content: string;
}

export async function uploadFile(file: File): Promise<{ path: string }> {
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(`temp/${file.name}`, file);
  
  if (error) throw error;
  return { path: data.path };
}

export function getFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['xlsx', 'xls'].includes(ext)) return 'excel';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'csv') return 'csv';
  return 'unknown';
}

export async function readFileContent(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('uploads')
    .download(filePath);
  
  if (error) throw error;
  
  // 根据文件类型读取内容
  if (filePath.endsWith('.pdf')) {
    // TODO: 实现PDF解析
    return 'PDF content placeholder';
  } else if (filePath.endsWith('.xlsx') || filePath.endsWith('.xls')) {
    // TODO: 实现Excel解析
    return 'Excel content placeholder';
  } else if (filePath.endsWith('.csv')) {
    // TODO: 实现CSV解析
    return 'CSV content placeholder';
  }
  
  return 'Unknown file type';
}

export async function processFile(file: File): Promise<FileInfo> {
  const uploadResult = await uploadFile(file);
  const fileType = getFileType(file.name);
  const content = await readFileContent(uploadResult.path);
  
  return {
    name: file.name,
    path: uploadResult.path,
    type: fileType,
    content
  };
} 