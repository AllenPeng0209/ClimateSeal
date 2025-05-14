import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '~/components/dashboard/ui/dialog';
import { Button } from '~/components/dashboard/ui/button';
import { Loader2 } from 'lucide-react';

interface ImportConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    fileName: string;
    totalCount: number;
    backgroundColor?: string;
}

export function ImportConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    fileName,
    totalCount,
    backgroundColor = 'bg-white'
}: ImportConfirmDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await onConfirm();
        } finally {
            setIsSubmitting(false);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-md ${backgroundColor}`}>
                <DialogHeader>
                    <DialogTitle>确认导入</DialogTitle>
                    <DialogDescription>
                        您确定要导入文件 <strong>{fileName}</strong> 吗？
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <p>该文件共包含 <strong>{totalCount}</strong> 条数据，导入后将自动创建或更新供应商和采购产品信息。</p>
                    <p className="mt-2 text-sm text-gray-500">注意：如果数据中存在错误，将会跳过错误数据，但仍会导入其他正确的数据。</p>
                </div>
                <DialogFooter className="sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        取消
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                导入中...
                            </>
                        ) : '确认导入'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 