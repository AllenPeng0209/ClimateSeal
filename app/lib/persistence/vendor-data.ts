import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Define the vendor data schema
export const vendorDataSchema = z.object({
    id: z.number().optional(),
    dataType: z.string(), // 供应商数据类型 (e.g., 供应商因子)
    vendorName: z.string(), // 供应商名称
    deadline: z.string(), // 截止时间
    email: z.string().email(), // 邮箱
    emissionSourceName: z.string(), // 排放源名称
    value: z.number().nullable(), // 数值
    unit: z.string().nullable(), // 单位
    evidenceFile: z.string().nullable(), // 证明材料
    dataSubmissionUrl: z.string(), // 数据填报链接
    status: z.enum(['待回复', '已回复', '已关闭']), // 状态
    respondent: z.string().nullable(), // 回复人
    responseTime: z.string().nullable(), // 回复时间
    token: z.string(), // 用于验证的唯一令牌
    remarks: z.string().nullable(), // 备注
    createdAt: z.string().optional(), // 创建时间
    updatedAt: z.string().optional(), // 更新时间
    createdBy: z.string().optional(), // 创建人
    updatedBy: z.string().optional(), // 更新人
});

export type VendorData = z.infer<typeof vendorDataSchema>;

// Table name constants
const VENDOR_DATA_TABLE = 'vendor_data';

// TODO: shaobo322
const HARDCODED_SUPABASE_URL = 'https://xkcdlulngazdosqvwnsc.supabase.co';
const HARDCODED_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrY2RsdWxuZ2F6ZG9zcXZ3bnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMzQ5MzUsImV4cCI6MjA1ODkxMDkzNX0.9gyLSGLhLYxUZWcbUQe6CwEXx5Lpbyqzzpw8ygWvQ0Q';

// TODO: Replace with actual Supabase credentials
const supabase = createClient(
    HARDCODED_SUPABASE_URL,
    HARDCODED_SUPABASE_ANON_KEY
);

// 将驼峰命名转换为下划线命名
function camelToSnake(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    const converted: any = {};

    Object.keys(obj).forEach(key => {
        // 驼峰转下划线: dataType -> data_type
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        converted[snakeKey] = obj[key];
    });

    return converted;
}

// 将下划线命名转换为驼峰命名
function snakeToCamel(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    const converted: any = {};

    Object.keys(obj).forEach(key => {
        // 下划线转驼峰: data_type -> dataType
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        converted[camelKey] = obj[key];
    });

    return converted;
}

/**
 * Generate a unique token for vendor data submission link
 * @returns A unique token string
 */
function generateUniqueToken(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Fetch all vendor data from the database
 * @returns Promise with vendor data array or error
 */
export async function fetchVendorData(): Promise<{ data: VendorData[] | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from(VENDOR_DATA_TABLE)
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        // 将数据库字段名(下划线)转换为代码使用的属性名(驼峰)
        const convertedData = data ? data.map(item => snakeToCamel(item)) : null;

        return { data: convertedData as VendorData[], error: null };
    } catch (error) {
        console.error('Error fetching vendor data:', error);
        return { data: null, error: error as Error };
    }
}

/**
 * Fetch vendor data by ID
 * @param id The ID of the vendor data to fetch
 * @returns Promise with vendor data or error
 */
export async function fetchVendorDataById(id: number): Promise<{ data: VendorData | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from(VENDOR_DATA_TABLE)
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        // 将数据库字段名(下划线)转换为代码使用的属性名(驼峰)
        const convertedData = data ? snakeToCamel(data) : null;

        return { data: convertedData as VendorData, error: null };
    } catch (error) {
        console.error(`Error fetching vendor data with ID ${id}:`, error);
        return { data: null, error: error as Error };
    }
}

/**
 * Fetch vendor data by token
 * @param token The token of the vendor data to fetch
 * @returns Promise with vendor data or error
 */
export async function fetchVendorDataByToken(token: string): Promise<{ data: VendorData | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from(VENDOR_DATA_TABLE)
            .select('*')
            .eq('token', token)
            .single();

        if (error) throw error;

        // 将数据库字段名(下划线)转换为代码使用的属性名(驼峰)
        const convertedData = data ? snakeToCamel(data) : null;

        return { data: convertedData as VendorData, error: null };
    } catch (error) {
        console.error(`Error fetching vendor data with token ${token}:`, error);
        return { data: null, error: error as Error };
    }
}

/**
 * Add new vendor data to the database
 * @param vendorData The vendor data object to add (without id)
 * @returns Promise with the created vendor data or error
 */
export async function addVendorData(
    vendorData: Omit<VendorData, 'id' | 'createdAt' | 'updatedAt' | 'token'>
): Promise<{ data: VendorData | null; error: Error | null }> {
    try {
        // Get the current user info (simplified for demo - you might want to get from auth)
        const currentUser = '当前用户';

        // Generate a unique token for the submission link
        const token = generateUniqueToken();

        // Create the data submission URL
        const dataSubmissionUrl = `/vendor-data-submission?token=${token}&name=${vendorData.vendorName}`;

        const newVendorData = {
            ...vendorData,
            token,
            dataSubmissionUrl,
            status: '待回复',
            createdBy: currentUser,
            updatedBy: currentUser,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // 转换为数据库字段名(下划线)
        const snakeVendorData = camelToSnake(newVendorData);

        const { data, error } = await supabase
            .from(VENDOR_DATA_TABLE)
            .insert(snakeVendorData)
            .select()
            .single();

        if (error) throw error;

        // 转换回属性名(驼峰)
        return { data: snakeToCamel(data) as VendorData, error: null };
    } catch (error) {
        console.error('Error adding vendor data:', error);
        return { data: null, error: error as Error };
    }
}

/**
 * Update vendor data in the database
 * @param id The ID of the vendor data to update
 * @param vendorData The vendor data to update
 * @returns Promise with the updated vendor data or error
 */
export async function updateVendorData(
    id: number,
    vendorData: Partial<VendorData>
): Promise<{ data: VendorData | null; error: Error | null }> {
    try {
        // Get the current user info (simplified for demo)
        const currentUser = '当前用户';

        const updatedVendorData = {
            ...vendorData,
            updatedBy: currentUser,
            updatedAt: new Date().toISOString()
        };

        // 转换为数据库字段名(下划线)
        const snakeVendorData = camelToSnake(updatedVendorData);

        const { data, error } = await supabase
            .from(VENDOR_DATA_TABLE)
            .update(snakeVendorData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // 转换回属性名(驼峰)
        return { data: snakeToCamel(data) as VendorData, error: null };
    } catch (error) {
        console.error(`Error updating vendor data with ID ${id}:`, error);
        return { data: null, error: error as Error };
    }
}

/**
 * Update vendor data status
 * @param id The ID of the vendor data
 * @param status The new status ('待回复', '已回复', or '已关闭')
 * @returns Promise with the updated vendor data or error
 */
export async function updateVendorDataStatus(
    id: number,
    status: '待回复' | '已回复' | '已关闭'
): Promise<{ data: VendorData | null; error: Error | null }> {
    try {
        // Get the current user info (simplified for demo)
        const currentUser = '当前用户';

        const { data, error } = await supabase
            .from(VENDOR_DATA_TABLE)
            .update({
                status,
                updated_by: currentUser,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // 转换回属性名(驼峰)
        return { data: snakeToCamel(data) as VendorData, error: null };
    } catch (error) {
        console.error(`Error updating vendor data status with ID ${id}:`, error);
        return { data: null, error: error as Error };
    }
}

/**
 * Submit vendor data response
 * @param token The token of the vendor data
 * @param response The response data including value, unit, evidence file URL, and respondent
 * @returns Promise with the updated vendor data or error
 */
export async function submitVendorDataResponse(
    token: string,
    response: {
        value: number;
        unit: string;
        evidenceFile: string;
        respondent: string | null;
    }
): Promise<{ data: VendorData | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from(VENDOR_DATA_TABLE)
            .update({
                value: response.value,
                unit: response.unit,
                evidence_file: response.evidenceFile,
                respondent: response.respondent || '匿名用户',
                response_time: new Date().toISOString(),
                status: '已回复',
                updated_at: new Date().toISOString()
            })
            .eq('token', token)
            .select()
            .single();

        if (error) throw error;

        // 转换回属性名(驼峰)
        return { data: snakeToCamel(data) as VendorData, error: null };
    } catch (error) {
        console.error(`Error submitting vendor data response with token ${token}:`, error);
        return { data: null, error: error as Error };
    }
} 