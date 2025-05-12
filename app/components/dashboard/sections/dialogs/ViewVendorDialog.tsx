import type { Vendor } from '../schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '~/components/dashboard/ui/dialog';
import { Button } from '~/components/dashboard/ui/button';
import { cn } from '~/lib/utils';

interface ViewVendorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vendor: Vendor | null;
    backgroundColor?: string;
}

export function ViewVendorDialog({ open, onOpenChange, vendor, backgroundColor }: ViewVendorDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn('sm:max-w-[500px]', backgroundColor)}>
                <DialogHeader>
                    <DialogTitle>查看供应商</DialogTitle>
                </DialogHeader>

                {vendor ? (
                    <div className="space-y-4">
                        <div className="grid w-full gap-2">
                            <div className="font-medium">供应商名称</div>
                            <div className="rounded-md border border-gray-200 bg-white p-2">{vendor.name}</div>
                        </div>

                        <div className="grid w-full gap-2">
                            <div className="font-medium">联系人</div>
                            <div className="rounded-md border border-gray-200 bg-white p-2">{vendor.contactPerson}</div>
                        </div>

                        <div className="grid w-full gap-2">
                            <div className="font-medium">联系电话</div>
                            <div className="rounded-md border border-gray-200 bg-white p-2">{vendor.phone}</div>
                        </div>

                        <div className="grid w-full gap-2">
                            <div className="font-medium">邮箱</div>
                            <div className="rounded-md border border-gray-200 bg-white p-2">{vendor.email}</div>
                        </div>

                        <div className="grid w-full gap-2">
                            <div className="font-medium">地址</div>
                            <div className="rounded-md border border-gray-200 bg-white p-2">{vendor.address || '--'}</div>
                        </div>

                        <div className="grid w-full gap-2">
                            <div className="font-medium">备注</div>
                            <div className="rounded-md border border-gray-200 bg-white p-2 min-h-[60px]">{vendor.remarks || '--'}</div>
                        </div>

                        <div className="grid w-full gap-2">
                            <div className="font-medium">状态</div>
                            <div className="rounded-md border border-gray-200 bg-white p-2">{vendor.status}</div>
                        </div>
                    </div>
                ) : (
                    <p className="text-center">未找到供应商信息</p>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        返回
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 