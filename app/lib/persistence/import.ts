import { createClient } from '@supabase/supabase-js';
import type { VendorImportResult, Vendor, VendorImport } from '~/components/dashboard/sections/schema';


const VENDOR_IMPORT_BUCKET = 'vendor';
const UPLOADS_TABLE = 'vendor_import_records';
/**
 * Convert camelCase object keys to snake_case
 */
function camelToSnake(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    const converted: any = {};

    Object.keys(obj).forEach(key => {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        converted[snakeKey] = obj[key];
    });

    return converted;
}

/**
 * Convert snake_case object keys to camelCase
 */
function snakeToCamel(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    const converted: any = {};

    Object.keys(obj).forEach(key => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        converted[camelKey] = obj[key];
    });

    return converted;
}

// Table name constants
const IMPORT_RESULTS_TABLE = 'vendor_import_results';

const HARDCODED_SUPABASE_URL = 'https://xkcdlulngazdosqvwnsc.supabase.co';
const HARDCODED_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrY2RsdWxuZ2F6ZG9zcXZ3bnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMzQ5MzUsImV4cCI6MjA1ODkxMDkzNX0.9gyLSGLhLYxUZWcbUQe6CwEXx5Lpbyqzzpw8ygWvQ0Q';

const supabase = createClient(
    HARDCODED_SUPABASE_URL,
    HARDCODED_SUPABASE_ANON_KEY
);

/**
 * Save import result to the database
 * @param result The import result to save
 * @returns Promise with the saved import result or error
 */
export async function saveImportResult(
    result: Omit<VendorImportResult, 'id'>
): Promise<{ data: VendorImportResult | null; error: Error | null }> {
    try {
        // 转换为数据库字段名(下划线)
        const snakeResult = camelToSnake(result);

        const { data, error } = await supabase
            .from(IMPORT_RESULTS_TABLE)
            .insert(snakeResult)
            .select()
            .single();

        if (error) throw error;

        // 转换回属性名(驼峰)
        return { data: snakeToCamel(data) as VendorImportResult, error: null };
    } catch (error) {
        console.error('Error saving import result:', error);
        return { data: null, error: error as Error };
    }
}

/**
 * Fetch all import results from the database
 * @returns Promise with import results array or error
 */
export async function fetchImportResults(): Promise<{ data: VendorImportResult[] | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from(IMPORT_RESULTS_TABLE)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 将数据库字段名(下划线)转换为代码使用的属性名(驼峰)
        const convertedData = data ? data.map(item => snakeToCamel(item)) : null;

        return { data: convertedData as VendorImportResult[], error: null };
    } catch (error) {
        console.error('Error fetching import results:', error);
        return { data: null, error: error as Error };
    }
}

/**
 * Upload a file to Supabase storage
 * @param file The file to upload
 * @param path The path to store the file
 * @returns Promise with the file URL or error
 */
export async function uploadFile(
    file: File,
    path: string
): Promise<{ url: string | null; error: Error | null }> {
    try {
        const { data, error } = await supabase.storage
            .from(VENDOR_IMPORT_BUCKET)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true
            });
        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from(VENDOR_IMPORT_BUCKET)
            .getPublicUrl(data.path);

        return {
            url: urlData.publicUrl,
            error: null
        };
    } catch (error) {
        console.error('Error uploading file:', error);
        return {
            url: null,
            error: error as Error
        };
    }
}

/**
 * Get a signed URL for a file in Supabase storage
 * @param path The path of the file
 * @returns Promise with the signed URL or error
 */
export async function getFileUrl(
    path: string
): Promise<{ url: string | null; error: Error | null }> {
    try {
        const { data, error } = await supabase.storage
            .from(VENDOR_IMPORT_BUCKET)
            .createSignedUrl(path, 60 * 60); // 1 hour expiry

        if (error) throw error;

        return { url: data.signedUrl, error: null };
    } catch (error) {
        console.error('Error getting file URL:', error);
        return { url: null, error: error as Error };
    }
}

// Implement saveUploadRecord to save the upload record and return fileId
export async function saveUploadRecord({ fileName, filePath }: { fileName: string; filePath: string }): Promise<string> {
    try {
        const { data, error } = await supabase
            .from(UPLOADS_TABLE)
            .upsert({
                file_name: fileName,
                file_path: filePath
            }, { onConflict: 'id' })
            .select('id')
            .single();

        if (error) throw error;

        return data.id;
    } catch (error) {
        console.error('Error saving upload record:', error);
        throw error;
    }
}

// Implement fetchFileById to retrieve the file from Supabase using fileId
export async function fetchFileById(fileId: string): Promise<{ file: File | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from(UPLOADS_TABLE)
            .select('file_path')
            .eq('id', fileId)
            .single();

        if (error) throw error;

        const { data: fileData, error: fileError } = await supabase.storage
            .from(VENDOR_IMPORT_BUCKET)
            .download(data.file_path);

        if (fileError) throw fileError;

        // Ensure fileData is not null before creating the File object
        if (!fileData) {
            return { file: null, error: new Error('Failed to download file data') };
        }

        const file = new File([fileData], data.file_path.split('/').pop() || 'downloaded-file', {
            type: fileData.type
        });

        return { file, error: null };
    } catch (error) {
        console.error('Error fetching file by ID:', error);
        return { file: null, error: error as Error };
    }
}

/**
 * Delete a file and its record by fileId
 * @param fileId The ID of the file to delete
 * @returns Promise with success status and error if any
 */
export async function deleteFileAndRecord(fileId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
        // First fetch the file record to get the path
        const { data, error: fetchError } = await supabase
            .from(UPLOADS_TABLE)
            .select('file_path')
            .eq('id', fileId)
            .single();

        if (fetchError) throw fetchError;

        if (!data || !data.file_path) {
            return { success: false, error: new Error('File record not found or path is empty') };
        }

        // Delete the file from storage
        const { error: storageError } = await supabase.storage
            .from(VENDOR_IMPORT_BUCKET)
            .remove([data.file_path]);

        if (storageError) throw storageError;

        // Delete the record from the database
        const { error: deleteError } = await supabase
            .from(UPLOADS_TABLE)
            .delete()
            .eq('id', fileId);

        if (deleteError) throw deleteError;

        return { success: true, error: null };
    } catch (error) {
        console.error('Error deleting file and record:', error);
        return { success: false, error: error as Error };
    }
} 