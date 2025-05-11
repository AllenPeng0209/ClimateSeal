import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '~/components/dashboard/ui/alert-dialog';
import { cn } from '~/lib/utils';

type StatusDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    currentStatus?: '启用' | '禁用';
    backgroundColor?: string;
};

export function StatusDialog({ open, onOpenChange, onConfirm, currentStatus, backgroundColor }: StatusDialogProps) {
    const newStatus = currentStatus === '启用' ? '禁用' : '启用';

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className={cn(backgroundColor)}>
                <AlertDialogHeader>
                    <AlertDialogTitle>确认{newStatus}</AlertDialogTitle>
                </AlertDialogHeader>
                <div className="py-4">
                    确定要{newStatus}该供应商吗？
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>确认</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
} 