import { z } from 'zod';

export const vendorSchema = z.object({
    name: z.string().min(1, '供应商名称不能为空').max(50, '供应商名称最多50个字符'),
    contactPerson: z.string().min(1, '联系人不能为空').max(20, '联系人最多20个字符'),
    phone: z.string().min(1, '联系电话不能为空').regex(/^[0-9+-]{5,20}$/, '联系电话格式不正确'),
    email: z.string().min(1, '邮箱不能为空').email('邮箱格式不正确'),
    address: z.string().max(200, '地址最多200个字符').optional(),
    remarks: z.string().max(500, '备注最多500个字符').optional(),
    status: z.enum(['启用', '禁用'])
});

export type Vendor = z.infer<typeof vendorSchema> & {
    id: number;
    updatedBy: string;
    updatedAt: string;
};

export const purchaseGoodSchema = z.object({
    code: z.string().min(1, '采购产品代码不能为空').max(50, '采购产品代码最多50个字符'),
    name: z.string().min(1, '采购产品名称不能为空').max(100, '采购产品名称最多100个字符'),
    remarks: z.string().max(500, '备注最多500个字符').optional(),
    status: z.enum(['启用', '禁用'])
});

export type PurchaseGood = z.infer<typeof purchaseGoodSchema> & {
    id: number;
    updatedBy: string;
    updatedAt: string;
    vendorIds: number[];
}; 