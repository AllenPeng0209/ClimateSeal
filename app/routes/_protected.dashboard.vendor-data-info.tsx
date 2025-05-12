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

import { z } from 'zod';
import {
    fetchVendorData,
    updateVendorDataStatus,
    type VendorData
} from '~/lib/persistence/vendor-data';

// Dialog component for confirming closure
function CloseDialog({
    open,
    onOpenChange,
    onConfirm,
    backgroundColor = "bg-white"
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    backgroundColor?: string;
}) {
    if (!open) return null;

    return (
        <dialog open={open} className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${backgroundColor}`}>
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">确认关闭</h2>
                <p className="mb-6">确定要关闭此数据吗？关闭后供应商将无法提交数据。</p>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
                    <Button onClick={() => {
                        onConfirm();
                        onOpenChange(false);
                    }}>确认</Button>
                </div>
            </div>
        </dialog>
    );
}

// Define types for our loader data
interface LoaderData {
    vendorData: VendorData[];
    error: string | null;
}

// Define types for our action data
interface ActionData {
    success: boolean;
    error?: string;
    vendorData?: VendorData;
}

// Server-side loader function to fetch vendor data
export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const { data, error } = await fetchVendorData();

        if (error) {
            return json<LoaderData>({
                vendorData: [],
                error: `Error loading vendor data: ${error.message}`
            });
        }

        return json<LoaderData>({
            vendorData: data || [],
            error: null
        });
    } catch (error) {
        return json<LoaderData>({
            vendorData: [],
            error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
        });
    }
}

// Server-side action function to handle mutations
export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const intent = formData.get('intent') as string;

    try {
        switch (intent) {
            case 'close': {
                const id = Number(formData.get('id'));
                const { data, error } = await updateVendorDataStatus(id, '已关闭');

                if (error) {
                    return json<ActionData>({
                        success: false,
                        error: `Failed to close vendor data: ${error.message}`
                    });
                }

                if (!data) {
                    return json<ActionData>({
                        success: false,
                        error: 'No data returned after update'
                    });
                }

                return json<ActionData>({
                    success: true,
                    vendorData: data
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

export default function VendorDataInfo() {
    // Use Remix hooks
    const { vendorData, error: dbError } = useLoaderData<typeof loader>();
    const fetcher = useFetcher<typeof action>();
    const navigation = useNavigation();

    const isLoading = navigation.state === 'loading';

    // Local state for UI
    const [filteredData, setFilteredData] = useState<VendorData[]>(vendorData);
    const [dataTypeFilter, setDataTypeFilter] = useState('all');
    const [vendorNameFilter, setVendorNameFilter] = useState('');
    const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
    const [currentData, setCurrentData] = useState<VendorData | null>(null);

    // Update filtered data when vendor data changes
    useEffect(() => {
        if (vendorData) {
            applyFilters();
        }
    }, [vendorData, dataTypeFilter, vendorNameFilter]);

    const applyFilters = () => {
        let filtered = [...vendorData];

        if (dataTypeFilter && dataTypeFilter !== 'all') {
            filtered = filtered.filter(v => v.dataType === dataTypeFilter);
        }

        if (vendorNameFilter) {
            filtered = filtered.filter(v => v.vendorName.includes(vendorNameFilter));
        }

        setFilteredData(filtered);
    };

    const handleFilterChange = () => {
        applyFilters();
    };

    const resetFilters = () => {
        setDataTypeFilter('all');
        setVendorNameFilter('');
        setFilteredData(vendorData);
    };

    const openCloseDialog = (data: VendorData) => {
        setCurrentData(data);
        setIsCloseDialogOpen(true);
    };

    const handleCloseData = async () => {
        if (!currentData) return;

        fetcher.submit(
            {
                intent: 'close',
                id: String(currentData.id)
            },
            { method: 'post' }
        );

        if (fetcher.data?.success) {
            setIsCloseDialogOpen(false);
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-4">供应商数据信息</h1>

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
                    <span>供应商数据类型:</span>
                    <Select
                        value={dataTypeFilter}
                        onValueChange={setDataTypeFilter}
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="请选择" />
                        </SelectTrigger>
                        <SelectContent className="bg-blue-50">
                            <SelectItem value="all">全部</SelectItem>
                            <SelectItem value="供应商因子">供应商因子</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <span>供应商名称:</span>
                    <Input
                        className="w-64"
                        placeholder="请输入"
                        value={vendorNameFilter}
                        onChange={(e) => setVendorNameFilter(e.target.value)}
                    />
                </div>

                <Button variant="outline" onClick={handleFilterChange}>查询</Button>
                <Button variant="outline" onClick={resetFilters}>重置</Button>

                <div className="ml-auto">
                    <Button asChild>
                        <Link to="/dashboard/vendor-data-create">新增数据请求</Link>
                    </Button>
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
                            <TableHead className="border border-gray-200 text-center">供应商数据类型</TableHead>
                            <TableHead className="border border-gray-200 text-center">供应商名称</TableHead>
                            <TableHead className="border border-gray-200 text-center">截止时间</TableHead>
                            <TableHead className="border border-gray-200 text-center">邮箱</TableHead>
                            <TableHead className="border border-gray-200 text-center">排放源名称</TableHead>
                            <TableHead className="border border-gray-200 text-center">数值</TableHead>
                            <TableHead className="border border-gray-200 text-center">单位</TableHead>
                            <TableHead className="border border-gray-200 text-center">证明材料</TableHead>
                            <TableHead className="border border-gray-200 text-center">数据填报链接</TableHead>
                            <TableHead className="border border-gray-200 text-center">状态</TableHead>
                            <TableHead className="border border-gray-200 text-center">回复人</TableHead>
                            <TableHead className="border border-gray-200 text-center">回复时间</TableHead>
                            <TableHead className="w-24 border border-gray-200 text-center">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.map((data, index) => (
                            <TableRow key={data.id} className="border border-gray-200">
                                <TableCell className="border border-gray-200">{index + 1}</TableCell>
                                <TableCell className="border border-gray-200">{data.dataType}</TableCell>
                                <TableCell className="border border-gray-200">{data.vendorName}</TableCell>
                                <TableCell className="border border-gray-200">{data.deadline}</TableCell>
                                <TableCell className="border border-gray-200">{data.email}</TableCell>
                                <TableCell className="border border-gray-200">{data.emissionSourceName}</TableCell>
                                <TableCell className="border border-gray-200">{data.value}</TableCell>
                                <TableCell className="border border-gray-200">{data.unit}</TableCell>
                                <TableCell className="border border-gray-200">
                                    {data.evidenceFile && (
                                        <a href={data.evidenceFile} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                            查看材料
                                        </a>
                                    )}
                                </TableCell>
                                <TableCell className="border border-gray-200">
                                    <a href={data.dataSubmissionUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                        填报链接
                                    </a>
                                </TableCell>
                                <TableCell className="border border-gray-200">
                                    <span className={`px-2 py-1 rounded text-sm ${data.status === '待回复' ? 'bg-yellow-100 text-yellow-800' :
                                        data.status === '已回复' ? 'bg-green-100 text-green-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {data.status}
                                    </span>
                                </TableCell>
                                <TableCell className="border border-gray-200">{data.respondent}</TableCell>
                                <TableCell className="border border-gray-200">{data.responseTime}</TableCell>
                                <TableCell className="border border-gray-200">
                                    {data.status === '待回复' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openCloseDialog(data)}
                                        >
                                            关闭
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            <CloseDialog
                open={isCloseDialogOpen}
                onOpenChange={setIsCloseDialogOpen}
                onConfirm={handleCloseData}
                backgroundColor="bg-blue-50"
            />
        </div>
    );
}

