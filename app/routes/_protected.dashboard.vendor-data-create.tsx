import { useState } from 'react';
import { json, redirect } from '@remix-run/node';
import { useLoaderData, useActionData, Form, useNavigation } from '@remix-run/react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { Button } from '~/components/dashboard/ui/button';
import { Input } from '~/components/dashboard/ui/input';
import { Textarea } from '~/components/dashboard/ui/textarea';
import { Alert, AlertDescription } from '~/components/dashboard/ui/alert';
import { Loader2 } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/dashboard/ui/select';
import { addVendorData } from '~/lib/persistence/vendor-data';

// Schema for vendor data creation
const vendorDataCreateSchema = z.object({
    dataType: z.string().min(1, "供应商数据类型不能为空"),
    vendorName: z.string().min(1, "供应商名称不能为空"),
    deadline: z.string().min(1, "截止时间不能为空"),
    email: z.string().email("邮箱格式不正确"),
    emissionSourceName: z.string().min(1, "排放源名称不能为空"),
    remarks: z.string().optional(),
});

type VendorDataCreate = z.infer<typeof vendorDataCreateSchema>;

// Define types for our action data
interface ActionData {
    success: boolean;
    error?: string;
    fieldErrors?: {
        dataType?: string[];
        vendorName?: string[];
        deadline?: string[];
        email?: string[];
        emissionSourceName?: string[];
    };
}

// Server-side action function to handle form submission
export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const dataType = formData.get('dataType') as string;
    const vendorName = formData.get('vendorName') as string;
    const deadline = formData.get('deadline') as string;
    const email = formData.get('email') as string;
    const emissionSourceName = formData.get('emissionSourceName') as string;
    const remarks = formData.get('remarks') as string;

    // Validate form data
    try {
        vendorDataCreateSchema.parse({
            dataType,
            vendorName,
            deadline,
            email,
            emissionSourceName,
            remarks,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            const fieldErrors = error.flatten().fieldErrors;
            return json<ActionData>({
                success: false,
                fieldErrors: fieldErrors as any
            });
        }
    }

    try {
        // Create new vendor data
        const { data, error } = await addVendorData({
            dataType,
            vendorName,
            deadline,
            email,
            emissionSourceName,
            remarks: remarks || null,
            value: null,
            unit: null,
            evidenceFile: null,
            dataSubmissionUrl: '', // This will be set in the addVendorData function
            status: '待回复',
            respondent: null,
            responseTime: null,
        });

        if (error) {
            return json<ActionData>({
                success: false,
                error: `创建供应商数据失败: ${error.message}`
            });
        }

        // Redirect to vendor data info page
        return redirect('/dashboard/vendor-data-info');
    } catch (error) {
        return json<ActionData>({
            success: false,
            error: `提交失败: ${error instanceof Error ? error.message : String(error)}`
        });
    }
}

export default function VendorDataCreate() {
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === 'submitting';

    const [dataType, setDataType] = useState('供应商因子');
    const [vendorName, setVendorName] = useState('');
    const [deadline, setDeadline] = useState('');
    const [email, setEmail] = useState('');
    const [emissionSourceName, setEmissionSourceName] = useState('');
    const [remarks, setRemarks] = useState('');

    // Format today's date as YYYY-MM-DD for the date input min value
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-6">创建供应商数据请求</h1>

            <Form method="post" className="max-w-2xl space-y-6">
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label htmlFor="dataType" className="block text-sm font-medium text-gray-700 mb-1">
                            供应商数据类型 <span className="text-red-500">*</span>
                        </label>
                        <Select
                            value={dataType}
                            onValueChange={setDataType}
                            name="dataType"
                        >
                            <SelectTrigger className={actionData?.fieldErrors?.dataType ? "border-red-500" : ""}>
                                <SelectValue placeholder="请选择数据类型" />
                            </SelectTrigger>
                            <SelectContent className="bg-blue-50">
                                <SelectItem value="供应商因子">供应商因子</SelectItem>
                            </SelectContent>
                        </Select>
                        {actionData?.fieldErrors?.dataType && (
                            <p className="text-red-500 text-xs mt-1">{actionData.fieldErrors.dataType[0]}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="vendorName" className="block text-sm font-medium text-gray-700 mb-1">
                            供应商名称 <span className="text-red-500">*</span>
                        </label>
                        <Input
                            id="vendorName"
                            name="vendorName"
                            value={vendorName}
                            onChange={(e) => setVendorName(e.target.value)}
                            placeholder="请输入供应商名称"
                            className={actionData?.fieldErrors?.vendorName ? "border-red-500" : ""}
                        />
                        {actionData?.fieldErrors?.vendorName && (
                            <p className="text-red-500 text-xs mt-1">{actionData.fieldErrors.vendorName[0]}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                            截止时间 <span className="text-red-500">*</span>
                        </label>
                        <Input
                            id="deadline"
                            name="deadline"
                            type="datetime-local"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            min={today}
                            className={actionData?.fieldErrors?.deadline ? "border-red-500" : ""}
                        />
                        {actionData?.fieldErrors?.deadline && (
                            <p className="text-red-500 text-xs mt-1">{actionData.fieldErrors.deadline[0]}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            邮箱 <span className="text-red-500">*</span>
                        </label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="请输入供应商联系邮箱"
                            className={actionData?.fieldErrors?.email ? "border-red-500" : ""}
                        />
                        {actionData?.fieldErrors?.email && (
                            <p className="text-red-500 text-xs mt-1">{actionData.fieldErrors.email[0]}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="emissionSourceName" className="block text-sm font-medium text-gray-700 mb-1">
                            排放源名称 <span className="text-red-500">*</span>
                        </label>
                        <Input
                            id="emissionSourceName"
                            name="emissionSourceName"
                            value={emissionSourceName}
                            onChange={(e) => setEmissionSourceName(e.target.value)}
                            placeholder="请输入排放源名称"
                            className={actionData?.fieldErrors?.emissionSourceName ? "border-red-500" : ""}
                        />
                        {actionData?.fieldErrors?.emissionSourceName && (
                            <p className="text-red-500 text-xs mt-1">{actionData.fieldErrors.emissionSourceName[0]}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">
                            备注
                        </label>
                        <Textarea
                            id="remarks"
                            name="remarks"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="请输入备注信息（选填）"
                            rows={5}
                        />
                    </div>
                </div>

                {actionData?.error && (
                    <Alert variant="destructive">
                        <AlertDescription>{actionData.error}</AlertDescription>
                    </Alert>
                )}

                <div className="flex gap-4">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                提交中...
                            </>
                        ) : '创建请求'}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.history.back()}
                    >
                        取消
                    </Button>
                </div>
            </Form>
        </div>
    );
} 