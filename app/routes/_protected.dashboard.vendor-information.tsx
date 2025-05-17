import { useState, useEffect } from 'react';
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
import { Alert, AlertDescription } from '~/components/dashboard/ui/alert';
import { Loader2 } from 'lucide-react';
import {
    Link,
    useLoaderData,
    useActionData,
    useFetcher,
    useNavigation,
    json,
    redirect
} from '@remix-run/react';
import type {
    LoaderFunctionArgs,
    ActionFunctionArgs
} from '@remix-run/node';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { Vendor } from '~/components/dashboard/sections/schema';
import { vendorSchema } from '~/components/dashboard/sections/schema';
import { AddVendorDialog } from '~/components/dashboard/sections/dialogs/AddVendorDialog';
import { EditVendorDialog } from '~/components/dashboard/sections/dialogs/EditVendorDialog';
import { DeleteDialog } from '~/components/dashboard/sections/dialogs/DeleteVendorDialog';
import { StatusDialog } from '~/components/dashboard/sections/dialogs/StatusDialog';
import { ViewVendorDialog } from '~/components/dashboard/sections/dialogs/ViewVendorDialog';
import {
    fetchVendors,
    addVendor as addVendorToDb,
    updateVendor as updateVendorInDb,
    deleteVendor as deleteVendorFromDb,
    updateVendorStatus as updateVendorStatusInDb
} from '~/lib/persistence/vendor';

// Define types for our loader data
interface LoaderData {
    vendors: Vendor[];
    error: string | null;
}

// Define types for our action data
interface ActionData {
    success: boolean;
    error?: string;
    vendor?: Vendor;
}

// Server-side loader function to fetch vendors
export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const { data, error } = await fetchVendors();

        if (error) {
            return json<LoaderData>({
                vendors: [],
                error: `Error loading vendors: ${error.message}`
            });
        }

        return json<LoaderData>({
            vendors: data || [],
            error: null
        });
    } catch (error) {
        return json<LoaderData>({
            vendors: [],
            error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
        });
    }
}

// Server-side action function to handle mutations
export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const intent = formData.get('intent') as string;

    try {
        // Handle different actions based on the intent
        switch (intent) {
            case 'add': {
                const vendorData = JSON.parse(formData.get('vendorData') as string);
                const { data, error } = await addVendorToDb(vendorData);

                if (error) {
                    return json<ActionData>({
                        success: false,
                        error: `Failed to add vendor: ${error.message}`
                    });
                }

                return json<ActionData>({
                    success: true,
                    vendor: data || undefined
                });
            }

            case 'update': {
                const id = Number(formData.get('id'));
                const vendorData = JSON.parse(formData.get('vendorData') as string);
                const { data, error } = await updateVendorInDb(id, vendorData);

                if (error) {
                    return json<ActionData>({
                        success: false,
                        error: `Failed to update vendor: ${error.message}`
                    });
                }

                return json<ActionData>({
                    success: true,
                    vendor: data || undefined
                });
            }

            case 'delete': {
                const id = Number(formData.get('id'));
                const { success, error } = await deleteVendorFromDb(id);

                if (error) {
                    return json<ActionData>({
                        success: false,
                        error: `Failed to delete vendor: ${error.message}`
                    });
                }

                return json<ActionData>({ success });
            }

            case 'toggle-status': {
                const id = Number(formData.get('id'));
                const status = formData.get('status') as '启用' | '禁用';
                const { data, error } = await updateVendorStatusInDb(id, status);

                if (error) {
                    return json<ActionData>({
                        success: false,
                        error: `Failed to update vendor status: ${error.message}`
                    });
                }

                return json<ActionData>({
                    success: true,
                    vendor: data || undefined
                });
            }

            default:
                return json<ActionData>({
                    success: false,
                    error: `Unknown action: ${intent}`
                });
        }
    } catch (error) {
        return json<ActionData>({
            success: false,
            error: `Action error: ${error instanceof Error ? error.message : String(error)}`
        });
    }
}

export default function VendorManagement() {
    // Use Remix hooks instead of custom hooks
    const { vendors, error: dbError } = useLoaderData<typeof loader>();
    const fetcher = useFetcher<typeof action>();
    const navigation = useNavigation();

    const isLoading = navigation.state === 'loading';

    // Local state for UI
    const [filteredVendors, setFilteredVendors] = useState<Vendor[]>(vendors);
    const [nameFilter, setNameFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
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

    const openViewDialog = (vendor: Vendor) => {
        setCurrentVendor(vendor);
        setIsViewDialogOpen(true);
    };

    const handleAddVendor = async (data: z.infer<typeof vendorSchema>) => {
        fetcher.submit(
            {
                intent: 'add',
                vendorData: JSON.stringify(data)
            },
            { method: 'post' }
        );

        if (fetcher.data?.success) {
            setIsAddDialogOpen(false);
        }
    };

    const handleEditVendor = async (data: z.infer<typeof vendorSchema>) => {
        if (!currentVendor) return;

        fetcher.submit(
            {
                intent: 'update',
                id: String(currentVendor.id),
                vendorData: JSON.stringify(data)
            },
            { method: 'post' }
        );

        if (fetcher.data?.success) {
            setIsEditDialogOpen(false);
        }
    };

    const handleDeleteVendor = async () => {
        if (!currentVendor) return;

        fetcher.submit(
            {
                intent: 'delete',
                id: String(currentVendor.id)
            },
            { method: 'post' }
        );

        if (fetcher.data?.success) {
            setIsDeleteDialogOpen(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!currentVendor) return;

        const newStatus = currentVendor.status === '启用' ? '禁用' : '启用';

        fetcher.submit(
            {
                intent: 'toggle-status',
                id: String(currentVendor.id),
                status: newStatus
            },
            { method: 'post' }
        );

        if (fetcher.data?.success) {
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

            {fetcher.data?.error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>
                        操作失败: {fetcher.data.error}
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
                    <Button asChild>
                        <Link to="/dashboard/vendor-import" prefetch="intent">导入</Link>
                    </Button>
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
                            <TableHead className="w-12 border border-gray-200 text-center">序号</TableHead>
                            <TableHead className="border border-gray-200 text-center">供应商名称</TableHead>
                            <TableHead className="border border-gray-200 text-center">联系人</TableHead>
                            <TableHead className="border border-gray-200 text-center">联系电话</TableHead>
                            <TableHead className="border border-gray-200 text-center">邮箱</TableHead>
                            <TableHead className="border border-gray-200 text-center">地址</TableHead>
                            <TableHead className="border border-gray-200 text-center">状态</TableHead>
                            <TableHead className="border border-gray-200 text-center">更新人</TableHead>
                            <TableHead className="border border-gray-200 text-center">更新时间</TableHead>
                            <TableHead className="w-64 border border-gray-200 text-center">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredVendors.map((vendor, index) => (
                            <TableRow key={vendor.id} className="border border-gray-200">
                                <TableCell className="border border-gray-200">{index + 1}</TableCell>
                                <TableCell className="border border-gray-200">{vendor.name}</TableCell>
                                <TableCell className="border border-gray-200">{vendor.contactPerson}</TableCell>
                                <TableCell className="border border-gray-200">{vendor.phone}</TableCell>
                                <TableCell className="border border-gray-200">{vendor.email}</TableCell>
                                <TableCell className="border border-gray-200">{vendor.address}</TableCell>
                                <TableCell className="border border-gray-200">{vendor.status}</TableCell>
                                <TableCell className="border border-gray-200">{vendor.updatedBy}</TableCell>
                                <TableCell className="border border-gray-200">{vendor.updatedAt}</TableCell>
                                <TableCell className="flex gap-1 border border-gray-200">
                                    <Button size="sm" variant="outline" asChild>
                                        <Link to={`/dashboard/vendor-purchase-goods?vendorId=${vendor.id}`} prefetch="intent">采购产品</Link>
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => openEditDialog(vendor)}>编辑</Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openStatusDialog(vendor)}
                                    >
                                        {vendor.status === '启用' ? '禁用' : '启用'}
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => openDeleteDialog(vendor)}>删除</Button>
                                    <Button size="sm" variant="outline" onClick={() => openViewDialog(vendor)}>查看</Button>
                                </TableCell>
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

            <ViewVendorDialog
                open={isViewDialogOpen}
                onOpenChange={setIsViewDialogOpen}
                vendor={currentVendor}
                backgroundColor="bg-blue-50"
            />
        </div>
    )
}
