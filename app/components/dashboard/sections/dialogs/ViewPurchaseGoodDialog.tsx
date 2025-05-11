import { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '~/components/dashboard/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl } from '~/components/dashboard/ui/form';
import { Input } from '~/components/dashboard/ui/input';
import { Textarea } from '~/components/dashboard/ui/textarea';
import { Button } from '~/components/dashboard/ui/button';
import { purchaseGoodSchema, type PurchaseGood } from '../schema';
import { cn } from '~/lib/utils';

type ViewPurchaseGoodDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    purchaseGood: PurchaseGood | null;
    backgroundColor?: string;
};

export function ViewPurchaseGoodDialog({ open, onOpenChange, purchaseGood, backgroundColor }: ViewPurchaseGoodDialogProps) {
    const form = useForm<z.infer<typeof purchaseGoodSchema>>({
        resolver: zodResolver(purchaseGoodSchema),
        defaultValues: {
            code: '',
            name: '',
            remarks: '',
            status: '启用'
        }
    });

    useEffect(() => {
        if (purchaseGood) {
            form.reset({
                code: purchaseGood.code,
                name: purchaseGood.name,
                remarks: purchaseGood.remarks || '',
                status: purchaseGood.status
            });
        }
    }, [purchaseGood, form]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn("sm:max-w-[500px]", backgroundColor)}>
                <DialogHeader>
                    <DialogTitle>查看采购商品</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>采购产品代码</FormLabel>
                                    <FormControl>
                                        <Input placeholder="请输入采购产品代码" {...field} disabled />
                                    </FormControl>
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
                                        <Input placeholder="请输入采购产品名称" {...field} disabled />
                                    </FormControl>
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
                                        <Textarea placeholder="请输入备注" {...field} disabled />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" onClick={() => onOpenChange(false)}>关闭</Button>
                        </DialogFooter>
                    </div>
                </Form>
            </DialogContent>
        </Dialog>
    );
} 