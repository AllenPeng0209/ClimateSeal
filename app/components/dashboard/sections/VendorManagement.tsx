import { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/dashboard/ui/table"
import { Input } from '~/components/dashboard/ui/input';
import { Button } from '~/components/dashboard/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/dashboard/ui/select';
import { Alert, AlertDescription } from '~/components/dashboard/ui/alert';
import { Loader2 } from 'lucide-react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { Vendor } from './schema';
import { AddVendorDialog } from './dialogs/AddVendorDialog';
import { EditVendorDialog } from './dialogs/EditVendorDialog';
import { DeleteDialog } from './dialogs/DeleteVendorDialog';
import { StatusDialog } from './dialogs/StatusDialog';
import { vendorSchema } from './schema';
import { useVendorData } from '~/lib/hooks/useVendorData';

export default function VendorManagement() {
    // Use our custom hook for vendor data
    const {
        vendors: dbVendors,
        isLoading,
        error: dbError,
        addVendor,
        updateVendor,
        deleteVendor,
        toggleVendorStatus,
        loadVendors
    } = useVendorData();

    // Use database vendors if available, otherwise use fallback
    const vendors = dbVendors.length > 0 || isLoading ? dbVendors : []

    const [filteredVendors, setFilteredVendors] = useState<Vendor[]>(vendors);
    const [nameFilter, setNameFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [currentVendor, setCurrentVendor] = useState<Vendor | null>(null);

    const form = useForm<z.infer<typeof vendorSchema>>({
        resolver: zodResolver(vendorSchema),
        defaultValues: {
            name: '',
            contactPerson: '',
            phone: '',
            email: '',
            address: '',
            remarks: '',
            status: '启用'
        }
    });

    // Update filtered vendors when vendors change
    useEffect(() => {
        if (vendors) {
            applyFilters();
        }
    }, [vendors, nameFilter, statusFilter]);

    const applyFilters = () => {
        let filtered = [...vendors];

        if (nameFilter) {
            filtered = filtered.filter(v => v.name.includes(nameFilter));
        }

        if (statusFilter && statusFilter !== 'all') {
            filtered = filtered.filter(v => v.status === statusFilter);
        }

        setFilteredVendors(filtered);
    };

    const handleFilterChange = () => {
        applyFilters();
    };

    const resetFilters = () => {
        setNameFilter('');
        setStatusFilter('');
        setFilteredVendors(vendors);
    };

    const openAddDialog = () => {
        form.reset({
            name: '',
            contactPerson: '',
            phone: '',
            email: '',
            address: '',
            remarks: '',
            status: '启用'
        });
        setIsAddDialogOpen(true);
    };

    const openImportDialog = () => {
        setIsImportDialogOpen(true);
    };

    const openEditDialog = (vendor: Vendor) => {
        setCurrentVendor(vendor);
        setIsEditDialogOpen(true);
    };

    const openDeleteDialog = (vendor: Vendor) => {
        setCurrentVendor(vendor);
        setIsDeleteDialogOpen(true);
    };

    const openStatusDialog = (vendor: Vendor) => {
        setCurrentVendor(vendor);
        setIsStatusDialogOpen(true);
    };

    const handleAddVendor = async (data: z.infer<typeof vendorSchema>) => {
        const result = await addVendor(data);

        if (result) {
            setIsAddDialogOpen(false);
        }
    };

    const handleEditVendor = async (data: z.infer<typeof vendorSchema>) => {
        if (!currentVendor) return;

        const result = await updateVendor(currentVendor.id, data);

        if (result) {
            setIsEditDialogOpen(false);
        }
    };

    const handleDeleteVendor = async () => {
        if (!currentVendor) return;

        const success = await deleteVendor(currentVendor.id);

        if (success) {
            setIsDeleteDialogOpen(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!currentVendor) return;

        const newStatus = currentVendor.status === '启用' ? '禁用' : '启用';
        const result = await toggleVendorStatus(currentVendor.id, newStatus);

        if (result) {
            setIsStatusDialogOpen(false);
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-4">供应商信息管理</h1>

            {dbError && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>
                        加载供应商数据失败: {dbError}
                    </AlertDescription>
                </Alert>
            )}

            <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <span>供应商名称:</span>
                    <Input
                        className="w-64"
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
                        <SelectContent className="bg-blue-50">
                            <SelectItem value="all">全部</SelectItem>
                            <SelectItem value="启用">启用</SelectItem>
                            <SelectItem value="禁用">禁用</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button variant="outline" onClick={handleFilterChange}>查询</Button>
                <Button variant="outline" onClick={resetFilters}>重置</Button>

                <div className="ml-auto flex items-center gap-2">
                    <Button onClick={openImportDialog}>导入</Button>
                    <Button onClick={openAddDialog}>新增</Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="ml-2">加载供应商数据中...</span>
                </div>
            ) : (
                <Table className="mt-6 border-collapse border border-gray-200">
                    <TableHeader>
                        <TableRow className="border border-gray-200">
                            {(() => {
                                const tableHeadClass = "border border-gray-200 text-center";
                                return (
                                    <>
                                        <TableHead className={`w-12 ${tableHeadClass}`}>序号</TableHead>
                                        <TableHead className={tableHeadClass}>供应商名称</TableHead>
                                        <TableHead className={tableHeadClass}>联系人</TableHead>
                                        <TableHead className={tableHeadClass}>联系电话</TableHead>
                                        <TableHead className={tableHeadClass}>邮箱</TableHead>
                                        <TableHead className={tableHeadClass}>地址</TableHead>
                                        <TableHead className={tableHeadClass}>状态</TableHead>
                                        <TableHead className={tableHeadClass}>更新人</TableHead>
                                        <TableHead className={tableHeadClass}>更新时间</TableHead>
                                        <TableHead className={`w-64 ${tableHeadClass}`}>操作</TableHead>
                                    </>
                                );
                            })()}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredVendors.map((vendor, index) => (
                            <TableRow key={vendor.id} className="border border-gray-200">
                                {(() => {
                                    const tableCellClass = "border border-gray-200";
                                    return (
                                        <>
                                            <TableCell className={tableCellClass}>{index + 1}</TableCell>
                                            <TableCell className={tableCellClass}>{vendor.name}</TableCell>
                                            <TableCell className={tableCellClass}>{vendor.contactPerson}</TableCell>
                                            <TableCell className={tableCellClass}>{vendor.phone}</TableCell>
                                            <TableCell className={tableCellClass}>{vendor.email}</TableCell>
                                            <TableCell className={tableCellClass}>{vendor.address}</TableCell>
                                            <TableCell className={tableCellClass}>{vendor.status}</TableCell>
                                            <TableCell className={tableCellClass}>{vendor.updatedBy}</TableCell>
                                            <TableCell className={tableCellClass}>{vendor.updatedAt}</TableCell>
                                            <TableCell className={`flex gap-1 ${tableCellClass}`}>
                                                <Button size="sm" variant="outline">采购产品</Button>
                                                <Button size="sm" variant="outline" onClick={() => openEditDialog(vendor)}>编辑</Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openStatusDialog(vendor)}
                                                >
                                                    {vendor.status === '启用' ? '禁用' : '启用'}
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => openDeleteDialog(vendor)}>删除</Button>
                                                <Button size="sm" variant="outline">查看</Button>
                                            </TableCell>
                                        </>
                                    );
                                })()}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            <AddVendorDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onSubmit={handleAddVendor}
                backgroundColor="bg-blue-50"
            />

            <EditVendorDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onSubmit={handleEditVendor}
                vendor={currentVendor}
                backgroundColor="bg-blue-50"
            />

            <DeleteDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDeleteVendor}
                backgroundColor="bg-blue-50"
            />

            <StatusDialog
                open={isStatusDialogOpen}
                onOpenChange={setIsStatusDialogOpen}
                onConfirm={handleToggleStatus}
                currentStatus={currentVendor?.status}
                backgroundColor="bg-blue-50"
            />
        </div>
    )
}
