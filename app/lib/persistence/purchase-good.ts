import { createClient } from '@supabase/supabase-js';

import type { PurchaseGood } from '~/components/dashboard/sections/schema';

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
const PURCHASE_GOODS_TABLE = 'purchase_goods';
const VENDOR_PURCHASE_GOODS_TABLE = 'vendor_purchase_goods';

const HARDCODED_SUPABASE_URL = 'https://xkcdlulngazdosqvwnsc.supabase.co';
const HARDCODED_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrY2RsdWxuZ2F6ZG9zcXZ3bnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMzQ5MzUsImV4cCI6MjA1ODkxMDkzNX0.9gyLSGLhLYxUZWcbUQe6CwEXx5Lpbyqzzpw8ygWvQ0Q';

const supabase = createClient(
    HARDCODED_SUPABASE_URL,
    HARDCODED_SUPABASE_ANON_KEY
);

/**
 * Find a purchase good by code and name
 * @param code The code of the purchase good
 * @param name The name of the purchase good
 * @returns Promise with the found purchase good or error
 */
export async function findPurchaseGoodByCodeAndName(
    code: string,
    name: string
): Promise<{ data: PurchaseGood | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from(PURCHASE_GOODS_TABLE)
            .select('*')
            .eq('code', code)
            .eq('name', name)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
            throw error;
        }

        if (!data) {
            return { data: null, error: null };
        }

        // Get vendor IDs for this purchase good
        const { data: relationData, error: relationError } = await supabase
            .from(VENDOR_PURCHASE_GOODS_TABLE)
            .select('vendor_id')
            .eq('purchase_good_id', data.id);

        if (relationError) throw relationError;

        const vendorIds = relationData ? relationData.map(item => item.vendor_id) : [];

        // 转换回属性名(驼峰)
        const purchaseGood = snakeToCamel(data) as PurchaseGood;
        purchaseGood.vendorIds = vendorIds;

        return { data: purchaseGood, error: null };
    } catch (error) {
        console.error('Error finding purchase good:', error);
        return { data: null, error: error as Error };
    }
}

/**
 * Add a new purchase good to the database
 * @param purchaseGood The purchase good to add
 * @param vendorIds Array of vendor IDs to associate with this purchase good
 * @returns Promise with the created purchase good or error
 */
export async function addPurchaseGood(
    purchaseGood: Omit<PurchaseGood, 'id' | 'updatedBy' | 'updatedAt' | 'vendorIds'>,
    vendorIds: number[] = []
): Promise<{ data: PurchaseGood | null; error: Error | null }> {
    try {
        // Get the current user info (simplified for demo)
        const currentUser = '当前用户';

        const newPurchaseGood = {
            ...purchaseGood,
            updatedBy: currentUser,
            updatedAt: new Date().toISOString().split('T')[0]
        };

        // 转换为数据库字段名(下划线)
        const snakePurchaseGood = camelToSnake(newPurchaseGood);

        // Start a transaction
        const { data, error } = await supabase
            .from(PURCHASE_GOODS_TABLE)
            .insert(snakePurchaseGood)
            .select()
            .single();

        if (error) throw error;

        // If there are vendor IDs, create the relationships
        if (vendorIds.length > 0) {
            const relationships = vendorIds.map(vendorId => ({
                purchase_good_id: data.id,
                vendor_id: vendorId
            }));

            const { error: relationError } = await supabase
                .from(VENDOR_PURCHASE_GOODS_TABLE)
                .insert(relationships);

            if (relationError) throw relationError;
        }

        // 转换回属性名(驼峰)
        const result = snakeToCamel(data) as PurchaseGood;
        result.vendorIds = vendorIds;

        return { data: result, error: null };
    } catch (error) {
        console.error('Error adding purchase good:', error);
        return { data: null, error: error as Error };
    }
}

/**
 * Link a purchase good to a vendor
 * @param purchaseGoodId The ID of the purchase good
 * @param vendorId The ID of the vendor
 * @returns Promise with success status or error
 */
export async function linkPurchaseGoodToVendor(
    purchaseGoodId: number,
    vendorId: number
): Promise<{ success: boolean; error: Error | null }> {
    try {
        // Check if the relationship already exists
        const { data: existingData, error: existingError } = await supabase
            .from(VENDOR_PURCHASE_GOODS_TABLE)
            .select('*')
            .eq('purchase_good_id', purchaseGoodId)
            .eq('vendor_id', vendorId)
            .single();

        if (existingError && existingError.code !== 'PGRST116') {
            throw existingError;
        }

        // If the relationship already exists, return success
        if (existingData) {
            return { success: true, error: null };
        }

        // Create the relationship
        const { error } = await supabase
            .from(VENDOR_PURCHASE_GOODS_TABLE)
            .insert({
                purchase_good_id: purchaseGoodId,
                vendor_id: vendorId
            });

        if (error) throw error;

        return { success: true, error: null };
    } catch (error) {
        console.error('Error linking purchase good to vendor:', error);
        return { success: false, error: error as Error };
    }
}

/**
 * Check if a purchase good is linked to a vendor
 * @param purchaseGoodId The ID of the purchase good
 * @param vendorId The ID of the vendor
 * @returns Promise with boolean result or error
 */
export async function isPurchaseGoodLinkedToVendor(
    purchaseGoodId: number,
    vendorId: number
): Promise<{ linked: boolean; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from(VENDOR_PURCHASE_GOODS_TABLE)
            .select('*')
            .eq('purchase_good_id', purchaseGoodId)
            .eq('vendor_id', vendorId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return { linked: !!data, error: null };
    } catch (error) {
        console.error('Error checking purchase good link:', error);
        return { linked: false, error: error as Error };
    }
} 