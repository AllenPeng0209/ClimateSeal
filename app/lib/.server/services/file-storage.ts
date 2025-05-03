import { supabase } from '~/lib/supabase';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('file-storage');

export interface FileMetadata {
  id: string;
  name: string;
  path: string;
  type: string;
  size: number;
  created_at: string;
  updated_at: string;
}

export async function saveFile(file: File, workflowId: string): Promise<FileMetadata> {
  try {

    logger.debug('Starting file save process', { 
      fileName: file.name, 
      workflowId,
      fileSize: file.size,
      fileType: file.type
    });

    // 2. 检查文件是否已存在
    logger.debug('Checking if file exists in database', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });
    
    // 生成带时间戳的文件名
    const timestamp = new Date().getTime();
    const fileExtension = file.name.split('.').pop();
    const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
    const uniqueFileName = `${baseName}_${timestamp}.${fileExtension}`;
    
    // 构建完整的文件路径
    const filePath = `files/${workflowId}/${uniqueFileName}`;
    
    const { data: existingFiles, error: listError } = await supabase
      .from('files')
      .select('*')
      .eq('path', filePath)
      .single();

    if (listError) {
      if (listError.code === 'PGRST116') {
        logger.debug('File not found in database, proceeding with upload');
      } else {
        logger.error('Failed to check existing files', { 
          error: listError,
          errorMessage: listError.message
        });
        throw listError;
      }
    } else {
      logger.debug('Found existing file in database', { 
        fileId: existingFiles.id,
        path: existingFiles.path
      });
    }

    let fileData: FileMetadata;

    if (existingFiles) {
      // 检查Storage中文件是否存在
      logger.debug('Checking if file exists in storage', {
        filePath
      });
      
      const { data: storageData, error: storageError } = await supabase.storage
        .from('files')
        .list(`files/${workflowId}`, {
          search: uniqueFileName
        });

      if (storageError) {
        logger.error('Failed to check storage files', { 
          error: storageError,
          errorMessage: storageError.message
        });
        throw storageError;
      }

      if (storageData && storageData.length > 0) {
        logger.debug('File exists in both database and storage', { 
          fileId: existingFiles.id,
          storagePath: storageData[0].name
        });
        fileData = existingFiles;
      } else {
        logger.debug('File exists in database but not in storage, re-uploading', { 
          fileId: existingFiles.id
        });
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('files')
          .upload(filePath, file, {
            upsert: true
          });

        if (uploadError) {
          logger.error('Failed to re-upload file to storage', { 
            error: uploadError,
            errorMessage: uploadError.message,
            filePath,
            bucket: 'files'
          });
          throw uploadError;
        }

        logger.debug('File re-uploaded successfully', { uploadData });

        // 更新数据库中的文件路径
        logger.debug('Updating file path in database', {
          fileId: existingFiles.id,
          newPath: uploadData.path
        });
        
        const { data: updatedFile, error: updateError } = await supabase
          .from('files')
          .update({ path: uploadData.path })
          .eq('id', existingFiles.id)
          .select()
          .single();

        if (updateError) {
          logger.error('Failed to update file path', { 
            error: updateError,
            errorMessage: updateError.message
          });
          throw updateError;
        }

        fileData = updatedFile;
        logger.debug('File path updated successfully', { fileData });
      }
    } else {
      // 3. 如果文件不存在，上传到存储
      logger.debug('Uploading file to storage', { filePath });
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          metadata: {
            owner_id: (await supabase.auth.getUser()).data.user?.id
          }
        });

      if (uploadError) {
        logger.error('Failed to upload file to storage', { 
          error: uploadError,
          errorMessage: uploadError.message,
          filePath,
          bucket: 'files'
        });
        throw uploadError;
      }

      logger.debug('File uploaded successfully to storage', { uploadData });

      // 保存文件元数据到数据库
      logger.debug('Attempting to save file metadata to database', {
        fileName: uniqueFileName,
        path: uploadData.path,
        type: file.type,
        size: file.size
      });
      
      const { data: newFileData, error: dbError } = await supabase
        .from('files')
        .insert({
          name: uniqueFileName,
          path: uploadData.path,
          type: file.type,
          size: file.size,
          mime_type: file.type || 'application/octet-stream'  // 确保 mime_type 不为 null
        })
        .select()
        .single();

      if (dbError) {
        logger.error('Failed to save file metadata', { 
          error: dbError,
          errorMessage: dbError.message,
          fileName: uniqueFileName,
          filePath: uploadData.path
        });
        throw dbError;
      }

      fileData = newFileData;
      logger.debug('File metadata saved successfully', { fileData });
    }

    // 3. 创建文件与workflow的关联
    logger.debug('Attempting to create workflow file relation');
    logger.debug('workflowId', workflowId);
    logger.debug('fileData.id', fileData.id);

    const { error: relationError } = await supabase
      .from('workflow_files')
      .insert({
        workflow_id: workflowId,
        file_id: fileData.id,
      });

    if (relationError) {
      logger.error('Failed to create workflow file relation', { 
        error: relationError,
        errorCode: relationError.code,
        errorMessage: relationError.message,
        workflowId,
        fileId: fileData.id
      });
      throw relationError;
    }

    logger.info('File saved successfully', { 
      fileName: file.name, 
      workflowId,
      fileId: fileData.id,
      filePath: fileData.path
    });

    return fileData;
  } catch (error) {
    logger.error('Failed to save file', { 
      error, 
      fileName: file.name,
      workflowId,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorCode: error instanceof Error ? (error as any).code : undefined
    });
    throw error;
  }
}

export async function getFilesByWorkflow(workflowId: string): Promise<FileMetadata[]> {
  try {
    const { data, error } = await supabase
      .from('workflow_files')
      .select(`
        file_id,
        files:files (
          id,
          name,
          path,
          type,
          size,
          created_at,
          updated_at
        )
      `)
      .eq('workflow_id', workflowId);

    if (error) throw error;

    return (data as any[]).map((item) => item.files as FileMetadata);
  } catch (error) {
    logger.error('Failed to get files by workflow', { error, workflowId });
    throw error;
  }
}

export async function getFileUrl(filePath: string): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from('files')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    logger.error('Failed to get file URL', { error, filePath });
    throw error;
  }
} 