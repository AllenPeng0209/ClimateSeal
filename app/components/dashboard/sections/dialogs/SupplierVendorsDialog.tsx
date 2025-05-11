import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '~/components/dashboard/ui/dialog';
import { Button } from '~/components/dashboard/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/dashboard/ui/table";
import type { Vendor } from '../schema';
import { cn } from '~/lib/utils';

type SupplierVendorsDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectVendors: () => void;
    vendors: Vendor[];
    backgroundColor?: string;
};

export function SupplierVendorsDialog({ open, onOpenChange, onSelectVendors, vendors, backgroundColor }: SupplierVendorsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn("sm:max-w-[700px]", backgroundColor)}>
                <DialogHeader>
                    <DialogTitle>供货供应商</DialogTitle>
                </DialogHeader>

                <Table className="border-collapse border border-gray-200">
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
                                    </>
                                );
                            })()}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {vendors.length > 0 ? (
                            vendors.map((vendor, index) => (
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
                                            </>
                                        );
                                    })()}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-4">暂无供应商数据</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>返回</Button>
                    <Button onClick={onSelectVendors}>选择供应商</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 