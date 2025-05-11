import { createClient } from '@supabase/supabase-js';

import type { Vendor } from '~/components/dashboard/sections/schema';
import { z } from 'zod';

// Table name constants
const VENDORS_TABLE = 'vendors';

// TODO: shaobo322
const supabase = createClient(
    "https://gteroiyixmumpmokkezy.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0ZXJvaXlpeG11bXBtb2trZXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5NDEyODcsImV4cCI6MjA2MjUxNzI4N30.zidwpurKw-DaAlW6v4p9OcksRYWF0nRqIFiRLTo8xw8"
);


// 将驼峰命名转换为下划线命名
function camelToSnake(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    const converted: any = {};

    Object.keys(obj).forEach(key => {
        // 驼峰转下划线: contactPerson -> contact_person
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
        // 下划线转驼峰: contact_person -> contactPerson
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        converted[camelKey] = obj[key];
    });

    return converted;
}

/**
 * Fetch all vendors from the database
 * @returns Promise with vendor array or error
 */
export async function fetchVendors(): Promise<{ data: Vendor[] | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from(VENDORS_TABLE)
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        // 将数据库字段名(下划线)转换为代码使用的属性名(驼峰)
        const convertedData = data ? data.map(item => snakeToCamel(item)) : null;

        return { data: convertedData as Vendor[], error: null };
    } catch (error) {
        console.error('Error fetching vendors:', error);
        return { data: null, error: error as Error };
    }
}

/**
 * Add a new vendor to the database
 * @param vendor The vendor object to add (without id, updatedBy and updatedAt)
 * @returns Promise with the created vendor or error
 */
export async function addVendor(
    vendor: Omit<Vendor, 'id' | 'updatedBy' | 'updatedAt'>
): Promise<{ data: Vendor | null; error: Error | null }> {
    try {
        // Get the current user info (simplified for demo - you might want to get from auth)
        const currentUser = '当前用户';

        const newVendor = {
            ...vendor,
            updatedBy: currentUser,
            updatedAt: new Date().toISOString().split('T')[0]
        };

        // 转换为数据库字段名(下划线)
        const snakeVendor = camelToSnake(newVendor);

        const { data, error } = await supabase
            .from(VENDORS_TABLE)
            .insert(snakeVendor)
            .select()
            .single();

        if (error) throw error;

        // 转换回属性名(驼峰)
        return { data: snakeToCamel(data) as Vendor, error: null };
    } catch (error) {
        console.error('Error adding vendor:', error);
        return { data: null, error: error as Error };
    }
}

/**
 * Update an existing vendor in the database
 * @param id The ID of the vendor to update
 * @param vendor The vendor data to update
 * @returns Promise with the updated vendor or error
 */
export async function updateVendor(
    id: number,
    vendor: Omit<Vendor, 'id' | 'updatedBy' | 'updatedAt'>
): Promise<{ data: Vendor | null; error: Error | null }> {
    try {
        // Get the current user info (simplified for demo)
        const currentUser = '当前用户';

        const updatedVendor = {
            ...vendor,
            updatedBy: currentUser,
            updatedAt: new Date().toISOString().split('T')[0]
        };

        // 转换为数据库字段名(下划线)
        const snakeVendor = camelToSnake(updatedVendor);

        const { data, error } = await supabase
            .from(VENDORS_TABLE)
            .update(snakeVendor)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // 转换回属性名(驼峰)
        return { data: snakeToCamel(data) as Vendor, error: null };
    } catch (error) {
        console.error('Error updating vendor:', error);
        return { data: null, error: error as Error };
    }
}

/**
 * Delete a vendor from the database
 * @param id The ID of the vendor to delete
 * @returns Promise with success status or error
 */
export async function deleteVendor(
    id: number
): Promise<{ success: boolean; error: Error | null }> {
    try {
        const { error } = await supabase
            .from(VENDORS_TABLE)
            .delete()
            .eq('id', id);

        if (error) throw error;

        return { success: true, error: null };
    } catch (error) {
        console.error('Error deleting vendor:', error);
        return { success: false, error: error as Error };
    }
}

/**
 * Update vendor status (enable/disable)
 * @param id The ID of the vendor
 * @param status The new status ('启用' or '禁用')
 * @returns Promise with the updated vendor or error
 */
export async function updateVendorStatus(
    id: number,
    status: '启用' | '禁用'
): Promise<{ data: Vendor | null; error: Error | null }> {
    try {
        // Get the current user info (simplified for demo)
        const currentUser = '当前用户';

        const { data, error } = await supabase
            .from(VENDORS_TABLE)
            .update({
                status,
                updated_by: currentUser,
                updated_at: new Date().toISOString().split('T')[0]
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // 转换回属性名(驼峰)
        return { data: snakeToCamel(data) as Vendor, error: null };
    } catch (error) {
        console.error('Error updating vendor status:', error);
        return { data: null, error: error as Error };
    }
} 