import type { VendorImport } from '~/components/dashboard/sections/schema';
import { findVendorByName, addVendor } from '~/lib/persistence/vendor';
import { findPurchaseGoodByCodeAndName, addPurchaseGood, linkPurchaseGoodToVendor } from '~/lib/persistence/purchase-good';

/**
 * Import vendors and purchase goods from parsed data
 * @param data The processed import data
 * @returns Results of the import operation
 */
export async function importVendorsAndPurchaseGoods(data: {
    data: VendorImport;
    vendorExists: boolean;
    purchaseGoodExists: boolean;
    relationshipExists: boolean;
    errorMessage?: string;
}[]): Promise<{
    successCount: number;
    failureCount: number;
    results: {
        data: VendorImport;
        success: boolean;
        errorMessage?: string;
    }[];
}> {
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const item of data) {
        // Skip items that already have an error
        if (item.errorMessage) {
            failureCount++;
            results.push({
                data: item.data,
                success: false,
                errorMessage: item.errorMessage
            });
            continue;
        }

        try {
            // Get or create vendor
            let vendorId: number;
            if (item.vendorExists) {
                const { data: existingVendor } = await findVendorByName(item.data.vendorName);
                vendorId = existingVendor!.id;
            } else {
                const { data: newVendor, error: vendorError } = await addVendor({
                    name: item.data.vendorName,
                    contactPerson: item.data.contactPerson,
                    phone: item.data.phone,
                    email: item.data.email,
                    address: item.data.address,
                    remarks: item.data.remarks,
                    status: '启用'
                });

                if (vendorError || !newVendor) {
                    throw new Error(`创建供应商失败: ${vendorError?.message || '未知错误'}`);
                }

                vendorId = newVendor.id;
            }

            // Get or create purchase good
            let purchaseGoodId: number;
            if (item.purchaseGoodExists) {
                const { data: existingPurchaseGood } = await findPurchaseGoodByCodeAndName(
                    item.data.purchaseGoodCode,
                    item.data.purchaseGoodName
                );
                purchaseGoodId = existingPurchaseGood!.id;
            } else {
                const { data: newPurchaseGood, error: purchaseGoodError } = await addPurchaseGood({
                    code: item.data.purchaseGoodCode,
                    name: item.data.purchaseGoodName,
                    remarks: item.data.remarks,
                    status: '启用'
                });

                if (purchaseGoodError || !newPurchaseGood) {
                    throw new Error(`创建采购产品失败: ${purchaseGoodError?.message || '未知错误'}`);
                }

                purchaseGoodId = newPurchaseGood.id;
            }

            // Link vendor and purchase good
            const { success, error: linkError } = await linkPurchaseGoodToVendor(purchaseGoodId, vendorId);

            if (!success) {
                throw new Error(`关联供应商和采购产品失败: ${linkError?.message || '未知错误'}`);
            }

            successCount++;
            results.push({
                data: item.data,
                success: true
            });
        } catch (error) {
            failureCount++;
            results.push({
                data: item.data,
                success: false,
                errorMessage: error instanceof Error ? error.message : String(error)
            });
        }
    }

    return {
        successCount,
        failureCount,
        results
    };
} 