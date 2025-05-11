import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '~/components/dashboard/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '~/components/dashboard/ui/form';
import { Input } from '~/components/dashboard/ui/input';
import { Textarea } from '~/components/dashboard/ui/textarea';
import { Button } from '~/components/dashboard/ui/button';
import { vendorSchema } from '../schema';
import { cn } from '~/lib/utils';

type AddVendorDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: z.infer<typeof vendorSchema>) => void;
    backgroundColor?: string;
};

export function AddVendorDialog({ open, onOpenChange, onSubmit, backgroundColor }: AddVendorDialogProps) {
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

    const handleSubmit = (data: z.infer<typeof vendorSchema>) => {
        onSubmit(data);
        form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn("sm:max-w-[500px]", backgroundColor)}>
                <DialogHeader>
                    <DialogTitle>新增供应商</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>供应商名称</FormLabel>
                                    <FormControl>
                                        <Input placeholder="请输入供应商名称" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="contactPerson"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>联系人</FormLabel>
                                    <FormControl>
                                        <Input placeholder="请输入联系人" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>联系电话</FormLabel>
                                    <FormControl>
                                        <Input placeholder="请输入联系电话" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>邮箱</FormLabel>
                                    <FormControl>
                                        <Input placeholder="请输入邮箱" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>地址</FormLabel>
                                    <FormControl>
                                        <Input placeholder="请输入地址" {...field} />
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