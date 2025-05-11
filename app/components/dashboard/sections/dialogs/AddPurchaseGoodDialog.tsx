import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '~/components/dashboard/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '~/components/dashboard/ui/form';
import { Input } from '~/components/dashboard/ui/input';
import { Textarea } from '~/components/dashboard/ui/textarea';
import { Button } from '~/components/dashboard/ui/button';
import { purchaseGoodSchema } from '../schema';
import { cn } from '~/lib/utils';

type AddPurchaseGoodDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: z.infer<typeof purchaseGoodSchema>) => void;
    backgroundColor?: string;
};

export function AddPurchaseGoodDialog({ open, onOpenChange, onSubmit, backgroundColor }: AddPurchaseGoodDialogProps) {
    const form = useForm<z.infer<typeof purchaseGoodSchema>>({
        resolver: zodResolver(purchaseGoodSchema),
        defaultValues: {
            code: '',
            name: '',
            remarks: '',
            status: '启用'
        }
    });

    const handleSubmit = (data: z.infer<typeof purchaseGoodSchema>) => {
        onSubmit(data);
        form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn("sm:max-w-[500px]", backgroundColor)}>
                <DialogHeader>
                    <DialogTitle>新增采购商品</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>采购产品代码</FormLabel>
                                    <FormControl>
                                        <Input placeholder="请输入采购产品代码" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>采购产品名称</FormLabel>
                                    <FormControl>
                                        <Input placeholder="请输入采购产品名称" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="remarks"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>备注</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="请输入备注" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
                            <Button type="submit">确认</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
} 