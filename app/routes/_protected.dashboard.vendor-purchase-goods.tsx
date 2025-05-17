import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/dashboard/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/dashboard/ui/select';
import { Input } from '~/components/dashboard/ui/input';
import { Button } from '~/components/dashboard/ui/button';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { Vendor, PurchaseGood } from '~/components/dashboard/sections/schema';
import {
    AddPurchaseGoodDialog,
    EditPurchaseGoodDialog,
    DeleteDialog,
    StatusDialog,
    ViewPurchaseGoodDialog,
    SupplierVendorsDialog,
    SelectVendorsDialog
} from '~/components/dashboard/sections/dialogs';
import { purchaseGoodSchema } from '~/components/dashboard/sections/schema';

const initialPurchaseGoods: PurchaseGood[] = [
    {
        id: 1,
        code: '123456485678',
        name: '采购商品名称采购商品名称采购商品名称',
        status: '启用',
        updatedBy: '',
        updatedAt: '',
        remarks: '',
        vendorIds: [1]
    },
    {
        id: 2,
        code: '123456485678',
        name: '采购商品名称采购商品名称采购商品名称',
        status: '启用',
        updatedBy: '',
        updatedAt: '',
        remarks: '',
        vendorIds: [1, 2]
    },
    {
        id: 3,
        code: '123456485678',
        name: '采购商品名称采购商品名称采购商品名称',
        status: '禁用',
        updatedBy: '',
        updatedAt: '',
        remarks: '',
        vendorIds: [3]
    }
];

const initialVendors: Vendor[] = [
    {
        id: 1,
        name: '供应商1',
        contactPerson: '联系人',
        phone: '12345678901',
        email: '123456@126.com',
        address: '地址地址地址地址地址',
        status: '启用',
        updatedBy: '张三',
        updatedAt: '2023-05-20',
        remarks: ''
    },
    {
        id: 2,
        name: '供应商2',
        contactPerson: '联系人',
        phone: '12345678901',
        email: '123456@126.com',
        address: '地址地址地址地址地址',
        status: '启用',
        updatedBy: '张三',
        updatedAt: '2023-05-20',
        remarks: ''
    },
    {
        id: 3,
        name: '供应商3',
        contactPerson: '联系人',
        phone: '12345678901',
        email: '123456@126.com',
        address: '地址地址地址地址地址',
        status: '启用',
        updatedBy: '张三',
        updatedAt: '2023-05-20',
        remarks: ''
    }
];

export default function VendorPurchaseGoods() {
    const [purchaseGoods, setPurchaseGoods] = useState<PurchaseGood[]>(initialPurchaseGoods);
    const [filteredPurchaseGoods, setFilteredPurchaseGoods] = useState<PurchaseGood[]>(purchaseGoods);
    const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
    const [codeFilter, setCodeFilter] = useState('');
    const [nameFilter, setNameFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isSupplierVendorsDialogOpen, setIsSupplierVendorsDialogOpen] = useState(false);
    const [isSelectVendorsDialogOpen, setIsSelectVendorsDialogOpen] = useState(false);
    const [currentPurchaseGood, setCurrentPurchaseGood] = useState<PurchaseGood | null>(null);

    const form = useForm<z.infer<typeof purchaseGoodSchema>>({
        resolver: zodResolver(purchaseGoodSchema),
        defaultValues: {
            code: '',
            name: '',
            remarks: '',
            status: '启用'
        }
    });

    const applyFilters = () => {
        let filtered = [...purchaseGoods];

        if (codeFilter) {
            filtered = filtered.filter(p => p.code.includes(codeFilter));
        }

        if (nameFilter) {
            filtered = filtered.filter(p => p.name.includes(nameFilter));
        }

        if (statusFilter && statusFilter !== 'all') {
            filtered = filtered.filter(p => p.status === statusFilter);
        }

        setFilteredPurchaseGoods(filtered);
    };

    const handleFilterChange = () => {
        applyFilters();
    };

    const resetFilters = () => {
        setCodeFilter('');
        setNameFilter('');
        setStatusFilter('');
        setFilteredPurchaseGoods(purchaseGoods);
    };

    const openAddDialog = () => {
        form.reset({
            code: '',
            name: '',
            remarks: '',
            status: '启用'
        });
        setIsAddDialogOpen(true);
    };

    const openEditDialog = (purchaseGood: PurchaseGood) => {
        setCurrentPurchaseGood(purchaseGood);
        setIsEditDialogOpen(true);
    };

    const openDeleteDialog = (purchaseGood: PurchaseGood) => {
        setCurrentPurchaseGood(purchaseGood);
        setIsDeleteDialogOpen(true);
    };

    const openStatusDialog = (purchaseGood: PurchaseGood) => {
        setCurrentPurchaseGood(purchaseGood);
        setIsStatusDialogOpen(true);
    };

    const openViewDialog = (purchaseGood: PurchaseGood) => {
        setCurrentPurchaseGood(purchaseGood);
        setIsViewDialogOpen(true);
    };

    const openSupplierVendorsDialog = (purchaseGood: PurchaseGood) => {
        setCurrentPurchaseGood(purchaseGood);
        setIsSupplierVendorsDialogOpen(true);
    };

    const openSelectVendorsDialog = () => {
        if (!currentPurchaseGood) return;
        setIsSupplierVendorsDialogOpen(false);
        setIsSelectVendorsDialogOpen(true);
    };

    const handleAddPurchaseGood = (data: z.infer<typeof purchaseGoodSchema>) => {
        const newPurchaseGood: PurchaseGood = {
            ...data,
            id: purchaseGoods.length > 0 ? Math.max(...purchaseGoods.map(p => p.id)) + 1 : 1,
            updatedBy: '当前用户',
            updatedAt: new Date().toISOString().split('T')[0],
            vendorIds: []
        };

        const updatedPurchaseGoods = [...purchaseGoods, newPurchaseGood];
        setPurchaseGoods(updatedPurchaseGoods);
        setFilteredPurchaseGoods(updatedPurchaseGoods);
        setIsAddDialogOpen(false);
    };

    const handleEditPurchaseGood = (data: z.infer<typeof purchaseGoodSchema>) => {
        if (!currentPurchaseGood) return;

        const updatedPurchaseGoods = purchaseGoods.map(p =>
            p.id === currentPurchaseGood.id
                ? {
                    ...p,
                    ...data,
                    updatedBy: '当前用户',
                    updatedAt: new Date().toISOString().split('T')[0]
                }
                : p
        );

        setPurchaseGoods(updatedPurchaseGoods);
        setFilteredPurchaseGoods(updatedPurchaseGoods);
        setIsEditDialogOpen(false);
    };

    const handleDeletePurchaseGood = () => {
        if (!currentPurchaseGood) return;

        const updatedPurchaseGoods = purchaseGoods.filter(p => p.id !== currentPurchaseGood.id);
        setPurchaseGoods(updatedPurchaseGoods);
        setFilteredPurchaseGoods(updatedPurchaseGoods);
        setIsDeleteDialogOpen(false);
    };

    const handleToggleStatus = () => {
        if (!currentPurchaseGood) return;

        const newStatus = currentPurchaseGood.status === '启用' ? '禁用' : '启用';

        const updatedPurchaseGoods = purchaseGoods.map(p =>
            p.id === currentPurchaseGood.id
                ? {
                    ...p,
                    status: newStatus as '启用' | '禁用',
                    updatedBy: '当前用户',
                    updatedAt: new Date().toISOString().split('T')[0]
                }
                : p
        );

        setPurchaseGoods(updatedPurchaseGoods);
        setFilteredPurchaseGoods(updatedPurchaseGoods);
        setIsStatusDialogOpen(false);
    };

    const handleSelectVendors = (selectedVendorIds: number[]) => {
        if (!currentPurchaseGood) return;

        const updatedPurchaseGoods = purchaseGoods.map(p =>
            p.id === currentPurchaseGood.id
                ? {
                    ...p,
                    vendorIds: [...new Set([...p.vendorIds, ...selectedVendorIds])],
                    updatedBy: '当前用户',
                    updatedAt: new Date().toISOString().split('T')[0]
                }
                : p
        );

        setPurchaseGoods(updatedPurchaseGoods);
        setFilteredPurchaseGoods(updatedPurchaseGoods);
        setIsSelectVendorsDialogOpen(false);
    };

    const getEnabledVendors = () => {
        return vendors.filter(v => v.status === '启用');
    };

    const getVendorsByIds = (ids: number[]) => {
        return vendors.filter(v => ids.includes(v.id) && v.status === '启用');
    };

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-4">采购商品管理</h1>

            <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <span>采购商品代码:</span>
                    <Input
                        className="w-48"
                        placeholder="请输入"
                        value={codeFilter}
                        onChange={(e) => setCodeFilter(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span>采购商品名称:</span>
                    <Input
                        className="w-48"
                        placeholder="请输入"
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span>状态:</span>
                    <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="请选择" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全部</SelectItem>
                            <SelectItem value="启用">启用</SelectItem>
                            <SelectItem value="禁用">禁用</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button variant="outline" onClick={handleFilterChange}>查询</Button>
                <Button variant="outline" onClick={resetFilters}>重置</Button>

                <div className="ml-auto flex items-center gap-2">
                    <Button onClick={openAddDialog}>新增</Button>
                </div>
            </div>

            <Table className="mt-6 border-collapse border border-gray-200">
                <TableHeader>
                    <TableRow className="border border-gray-200">
                        <TableHead className="w-12 border border-gray-200 text-center">序号</TableHead>
                        <TableHead className="border border-gray-200 text-center">采购商品代码</TableHead>
                        <TableHead className="border border-gray-200 text-center">采购商品名称</TableHead>
                        <TableHead className="border border-gray-200 text-center">状态</TableHead>
                        <TableHead className="border border-gray-200 text-center">更新人</TableHead>
                        <TableHead className="border border-gray-200 text-center">更新时间</TableHead>
                        <TableHead className="w-64 border border-gray-200 text-center">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredPurchaseGoods.map((purchaseGood, index) => (
                        <TableRow key={purchaseGood.id} className="border border-gray-200">
                            <TableCell className="border border-gray-200">{index + 1}</TableCell>
                            <TableCell className="border border-gray-200">{purchaseGood.code}</TableCell>
                            <TableCell className="border border-gray-200">{purchaseGood.name}</TableCell>
                            <TableCell className="border border-gray-200">{purchaseGood.status}</TableCell>
                            <TableCell className="border border-gray-200">{purchaseGood.updatedBy}</TableCell>
                            <TableCell className="border border-gray-200">{purchaseGood.updatedAt}</TableCell>
                            <TableCell className="flex gap-1 border border-gray-200">
                                <Button size="sm" variant="outline" onClick={() => openSupplierVendorsDialog(purchaseGood)}>供货供应商</Button>
                                <Button size="sm" variant="outline" onClick={() => openEditDialog(purchaseGood)}>编辑</Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openStatusDialog(purchaseGood)}
                                >
                                    {purchaseGood.status === '启用' ? '禁用' : '启用'}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => openDeleteDialog(purchaseGood)}>删除</Button>
                                <Button size="sm" variant="outline" onClick={() => openViewDialog(purchaseGood)}>查看</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <AddPurchaseGoodDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onSubmit={handleAddPurchaseGood}
                backgroundColor="bg-blue-50"
            />

            <EditPurchaseGoodDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onSubmit={handleEditPurchaseGood}
                purchaseGood={currentPurchaseGood}
                backgroundColor="bg-blue-50"
            />

            <DeleteDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDeletePurchaseGood}
                backgroundColor="bg-blue-50"
            />

            <StatusDialog
                open={isStatusDialogOpen}
                onOpenChange={setIsStatusDialogOpen}
                onConfirm={handleToggleStatus}
                currentStatus={currentPurchaseGood?.status}
                backgroundColor="bg-blue-50"
            />

            <ViewPurchaseGoodDialog
                open={isViewDialogOpen}
                onOpenChange={setIsViewDialogOpen}
                purchaseGood={currentPurchaseGood}
                backgroundColor="bg-blue-50"
            />

            <SupplierVendorsDialog
                open={isSupplierVendorsDialogOpen}
                onOpenChange={setIsSupplierVendorsDialogOpen}
                onSelectVendors={openSelectVendorsDialog}
                vendors={currentPurchaseGood ? getVendorsByIds(currentPurchaseGood.vendorIds) : []}
                backgroundColor="bg-blue-50"
            />

            <SelectVendorsDialog
                open={isSelectVendorsDialogOpen}
                onOpenChange={setIsSelectVendorsDialogOpen}
                onConfirm={handleSelectVendors}
                vendors={getEnabledVendors()}
                selectedVendorIds={currentPurchaseGood?.vendorIds || []}
                backgroundColor="bg-blue-50"
            />
        </div>
    );
}