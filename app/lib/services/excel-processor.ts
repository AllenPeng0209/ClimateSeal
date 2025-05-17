import * as XLSX from 'xlsx';
import type { VendorImport } from '~/components/dashboard/sections/schema';
import { vendorImportSchema } from '~/components/dashboard/sections/schema';
import { findVendorByName } from '~/lib/persistence/vendor';
import { findPurchaseGoodByCodeAndName } from '~/lib/persistence/purchase-good';

/**
 * Parse an Excel file into vendor import data
 * @param file The Excel file to parse
 * @returns Array of vendor import data and validation errors
 */
export async function parseVendorImportExcel(file: File): Promise<{
    data: VendorImport[];
    errors: { row: number; message: string }[];
}> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const data: VendorImport[] = [];
        const errors: { row: number; message: string }[] = [];

        jsonData.forEach((row: any, index: number) => {
            try {
                // Map Excel columns to our schema
                const vendorImport = {
                    vendorName: row['供应商名称'] || '',
                    contactPerson: row['联系人'] || '',
                    phone: row['联系电话'] || '',
                    email: row['邮箱'] || '',
                    address: row['地址'] || '',
                    purchaseGoodCode: row['采购产品代码'] || '',
                    purchaseGoodName: row['采购产品名称'] || '',
                    remarks: row['备注'] || ''
                };

                // Validate the data
                const result = vendorImportSchema.safeParse(vendorImport);
                if (!result.success) {
                    result.error.errors.forEach(err => {
                        errors.push({
                            row: index + 2, // +2 because Excel is 1-indexed and we have a header row
                            message: `${err.path.join('.')}：${err.message}`
                        });
                    });
                } else {
                    data.push(result.data);
                }
            } catch (error) {
                errors.push({
                    row: index + 2,
                    message: `解析错误：${error instanceof Error ? error.message : String(error)}`
                });
            }
        });

        return { data, errors };
    } catch (error) {
        throw new Error(`Excel 解析错误：${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Process vendor import data and check for existing records
 * @param data Array of vendor import data
 * @returns Results of processing each row
 */
export async function processVendorImportData(data: VendorImport[]): Promise<{
    results: {
        data: VendorImport;
        vendorExists: boolean;
        purchaseGoodExists: boolean;
        relationshipExists: boolean;
        errorMessage?: string;
    }[];
    successCount: number;
    failureCount: number;
}> {
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const item of data) {
        try {
            // Check if vendor exists
            const { data: existingVendor } = await findVendorByName(item.vendorName);
            const vendorExists = !!existingVendor;

            // Check if purchase good exists
            const { data: existingPurchaseGood } = await findPurchaseGoodByCodeAndName(
                item.purchaseGoodCode,
                item.purchaseGoodName
            );
            const purchaseGoodExists = !!existingPurchaseGood;

            // Check if relationship exists (if both vendor and purchase good exist)
            let relationshipExists = false;
            if (vendorExists && purchaseGoodExists && existingVendor && existingPurchaseGood) {
                relationshipExists = existingPurchaseGood.vendorIds.includes(existingVendor.id);
            }

            const result = {
                data: item,
                vendorExists,
                purchaseGoodExists,
                relationshipExists
            };

            // If relationship already exists, mark as failure
            if (relationshipExists) {
                failureCount++;
                results.push({
                    ...result,
                    errorMessage: '已存在关联'
                });
            } else {
                successCount++;
                results.push(result);
            }
        } catch (error) {
            failureCount++;
            results.push({
                data: item,
                vendorExists: false,
                purchaseGoodExists: false,
                relationshipExists: false,
                errorMessage: `处理错误：${error instanceof Error ? error.message : String(error)}`
            });
        }
    }

    return { results, successCount, failureCount };
}

/**
 * Generate an error Excel file with reasons
 * @param results Processing results with error messages
 * @returns Excel file as a Blob
 */
export function generateErrorExcel(results: {
    data: VendorImport;
    success: boolean;
    errorMessage?: string;
}[]): Blob {
    // Filter only the rows with errors
    const errorRows = results.filter(r => r.errorMessage);

    // Create worksheet data
    const wsData = errorRows.map(row => ({
        '供应商名称': row.data.vendorName,
        '联系人': row.data.contactPerson,
        '联系电话': row.data.phone,
        '邮箱': row.data.email,
        '地址': row.data.address,
        '采购产品代码': row.data.purchaseGoodCode,
        '采购产品名称': row.data.purchaseGoodName,
        '备注': row.data.remarks,
        '错误原因': row.errorMessage
    }));

    // Create a new workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(wsData);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, '导入错误数据');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
} 