import { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/dashboard/ui/table";
import { Input } from '~/components/dashboard/ui/input';
import { Button } from '~/components/dashboard/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/dashboard/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "~/components/dashboard/ui/alert-dialog";


// 模拟数据，后续会替换为API获取
const mockVendorData = [
    {
        id: 1,
        supplierDataType: '供应商因子',
        supplierName: '供应商名称示例1',
        deadline: '2025/05/10 00:00:00',
        email: '1234234@124.com',
        emissionSourceName: '排放源名称示例1',
        value: '-',
        unit: '-',
        proofMaterial: '-',
        dataLink: '/supplier_data_form.html',
        status: '待回复',
        replier: '-',
        replyTime: '-',
    },
    {
        id: 2,
        supplierDataType: '供应商因子',
        supplierName: '供应商名称示例2',
        deadline: '2025/05/10 00:00:00',
        email: '1234234@124.com',
        emissionSourceName: '排放源名称示例2',
        value: '12346',
        unit: 'kg',
        proofMaterial: '证明材料.pdf',
        dataLink: '/supplier_data_form.html',
        status: '已回复',
        replier: '张三',
        replyTime: '2025/05/10 00:00:00',
    },
    {
        id: 3,
        supplierDataType: '供应商因子',
        supplierName: '供应商名称示例3',
        deadline: '2025/05/10 00:00:00',
        email: '1234234@124.com',
        emissionSourceName: '排放源名称示例3',
        value: '12346',
        unit: 'kg',
        proofMaterial: '证明材料.pdf',
        dataLink: '/supplier_data_form.html',
        status: '已关闭',
        replier: '张三',
        replyTime: '2025/05/10 00:00:00',
    },
];

type VendorDataType = typeof mockVendorData[0];

export default function VendorData() {
    const [vendorData, setVendorData] = useState<VendorDataType[]>(mockVendorData);
    const [filteredVendorData, setFilteredVendorData] = useState<VendorDataType[]>(mockVendorData);
    const [supplierDataTypeFilter, setSupplierDataTypeFilter] = useState<string>('');
    const [supplierNameFilter, setSupplierNameFilter] = useState<string>('');

    useEffect(() => {
        applyFilters();
    }, [supplierDataTypeFilter, supplierNameFilter, vendorData]);

    const applyFilters = () => {
        let filtered = [...vendorData];

        if (supplierDataTypeFilter && supplierDataTypeFilter !== 'all') {
            filtered = filtered.filter(v => v.supplierDataType === supplierDataTypeFilter);
        }

        if (supplierNameFilter) {
            filtered = filtered.filter(v => v.supplierName.includes(supplierNameFilter));
        }
        setFilteredVendorData(filtered);
    };

    const handleFilterChange = () => {
        applyFilters();
    };

    const resetFilters = () => {
        setSupplierDataTypeFilter('');
        setSupplierNameFilter('');
        setFilteredVendorData(vendorData);
    };
    
    const handleCloseTask = (id: number) => {
        // 后续替换为API调用
        setVendorData(prevData => 
            prevData.map(item => 
                item.id === id ? { ...item, status: '已关闭' } : item
            )
        );
    };

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-4">供应商数据</h1>

            <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <span>供应商数据类型:</span>
                    <Select
                        value={supplierDataTypeFilter}
                        onValueChange={setSupplierDataTypeFilter}
                    >
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="请选择" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全部</SelectItem>
                            <SelectItem value="供应商因子">供应商因子</SelectItem>
                            {/* 根据PRD，目前只有供应商因子 */}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <span>供应商名称:</span>
                    <Input
                        className="w-64"
                        placeholder="请输入"
                        value={supplierNameFilter}
                        onChange={(e) => setSupplierNameFilter(e.target.value)}
                    />
                </div>
                <Button variant="outline" onClick={handleFilterChange}>查询</Button>
                <Button variant="outline" onClick={resetFilters}>重置</Button>
            </div>

            <Table className="mt-6 border-collapse border border-gray-200">
                <TableHeader>
                    <TableRow className="border border-gray-200">
                        <TableHead className="border border-gray-200 text-center">序号</TableHead>
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
                        <TableHead className="border border-gray-200 text-center">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredVendorData.map((item, index) => (
                        <TableRow key={item.id} className="border border-gray-200">
                            <TableCell className="border border-gray-200 text-center">{index + 1}</TableCell>
                            <TableCell className="border border-gray-200 text-center">{item.supplierDataType}</TableCell>
                            <TableCell className="border border-gray-200 text-center">{item.supplierName}</TableCell>
                            <TableCell className="border border-gray-200 text-center">{item.deadline}</TableCell>
                            <TableCell className="border border-gray-200 text-center">{item.email}</TableCell>
                            <TableCell className="border border-gray-200 text-center">{item.emissionSourceName}</TableCell>
                            <TableCell className="border border-gray-200 text-center">{item.value}</TableCell>
                            <TableCell className="border border-gray-200 text-center">{item.unit}</TableCell>
                            <TableCell className="border border-gray-200 text-center">
                                {item.proofMaterial !== '-' ? (
                                    <a href="#" className="text-blue-500 hover:underline">{item.proofMaterial}</a>
                                ) : '-'}
                            </TableCell>
                            <TableCell className="border border-gray-200 text-center">
                                <a href={item.dataLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                    {item.dataLink}
                                </a>
                            </TableCell>
                            <TableCell className="border border-gray-200 text-center">{item.status}</TableCell>
                            <TableCell className="border border-gray-200 text-center">{item.replier}</TableCell>
                            <TableCell className="border border-gray-200 text-center">{item.replyTime}</TableCell>
                            <TableCell className="border border-gray-200 text-center">
                                {item.status === '待回复' && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="link" className="text-blue-500 p-0 h-auto">关闭</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>确认关闭</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    您确定要关闭此供应商数据任务吗？关闭后将无法再次填写。
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>取消</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleCloseTask(item.id)}>确认</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
} 