import { useState } from 'react';
import { json, redirect } from '@remix-run/node';
import { useLoaderData, useActionData, Form, useNavigation } from '@remix-run/react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { Button } from '~/components/dashboard/ui/button';
import { Input } from '~/components/dashboard/ui/input';
import { Textarea } from '~/components/dashboard/ui/textarea';
import { Alert, AlertDescription } from '~/components/dashboard/ui/alert';
import { Loader2, Upload, X } from 'lucide-react';

// Supabase client
// TODO: shaobo322
const HARDCODED_SUPABASE_URL = 'https://xkcdlulngazdosqvwnsc.supabase.co';
const HARDCODED_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrY2RsdWxuZ2F6ZG9zcXZ3bnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMzQ5MzUsImV4cCI6MjA1ODkxMDkzNX0.9gyLSGLhLYxUZWcbUQe6CwEXx5Lpbyqzzpw8ygWvQ0Q';
const supabase = createClient(
    HARDCODED_SUPABASE_URL,
    HARDCODED_SUPABASE_ANON_KEY
);


// Helper functions for case conversion
function camelToSnake(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    const converted: any = {};
    Object.keys(obj).forEach(key => {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        converted[snakeKey] = obj[key];
    });

    return converted;
}

function snakeToCamel(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    const converted: any = {};
    Object.keys(obj).forEach(key => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        converted[camelKey] = obj[key];
    });

    return converted;
}

// Schema for vendor data submission
const vendorDataSubmissionSchema = z.object({
    value: z.string().refine(val => {
        // Allow numbers with up to 10 decimal places, including negative numbers
        return /^-?\d+(\.\d{1,10})?$/.test(val);
    }, {
        message: "数值必须是数字，最多保留10位小数",
    }),
    unit: z.string().min(1, "单位不能为空"),
});

type VendorDataSubmission = z.infer<typeof vendorDataSubmissionSchema>;

// Define types for our loader data
interface LoaderData {
    vendorData: {
        id: number;
        vendorName: string;
        emissionSourceName: string;
        deadline: string;
        remarks: string | null;
        status: string;
    } | null;
    error: string | null;
}

// Define types for our action data
interface ActionData {
    success: boolean;
    error?: string;
    fieldErrors?: {
        value?: string[];
        unit?: string[];
        evidenceFile?: string[];
    };
}

// Server-side loader function to fetch vendor data
export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const name = url.searchParams.get('name');

    if (!token) {
        return json<LoaderData>({
            vendorData: null,
            error: "无效的链接"
        });
    }

    try {
        // TODO: shaobo322
        // Fetch vendor data using the token
        const { data, error } = await supabase
            .from('vendor_data')
            .select('*')
            .like('data_submission_url', `%${token}%`)
            .single();

        if (error) {
            console.log('data_submission_url:', token);
            console.log('name:', name);
            console.error('Error fetching vendor data:', error);
            return json<LoaderData>({
                vendorData: null,
                error: `无法找到相关数据: ${error.message}`
            });
        }

        // Check if the data is already closed or responded
        if (data.status !== '待回复') {
            return json<LoaderData>({
                vendorData: null,
                error: "该数据已回复或已关闭，无法再次提交"
            });
        }

        // Check if deadline has passed
        const deadline = new Date(data.deadline);
        const now = new Date();
        if (now > deadline) {
            return json<LoaderData>({
                vendorData: null,
                error: "提交截止时间已过"
            });
        }

        // Convert snake_case to camelCase
        const convertedData = snakeToCamel(data);

        return json<LoaderData>({
            vendorData: {
                id: convertedData.id,
                vendorName: convertedData.vendorName,
                emissionSourceName: convertedData.emissionSourceName,
                deadline: convertedData.deadline,
                remarks: convertedData.remarks,
                status: convertedData.status
            },
            error: null
        });
    } catch (error) {
        return json<LoaderData>({
            vendorData: null,
            error: `加载数据失败: ${error instanceof Error ? error.message : String(error)}`
        });
    }
}

// Server-side action function to handle form submission
export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const token = formData.get('token') as string;
    const value = formData.get('value') as string;
    const unit = formData.get('unit') as string;
    const evidenceFile = formData.get('evidenceFile') as File;
    const respondentName = formData.get('respondentName') as string;

    // Validate form data
    try {
        vendorDataSubmissionSchema.parse({ value, unit });
    } catch (error) {
        if (error instanceof z.ZodError) {
            const fieldErrors = error.flatten().fieldErrors;
            return json<ActionData>({
                success: false,
                fieldErrors: fieldErrors as any
            });
        }
    }

    if (!evidenceFile || evidenceFile.size === 0) {
        return json<ActionData>({
            success: false,
            fieldErrors: {
                evidenceFile: ["请上传证明材料"]
            }
        });
    }

    try {
        // First, fetch the vendor data to ensure it exists and is still open
        const { data: vendorData, error: fetchError } = await supabase
            .from('vendor_data')
            .select('*')
            .eq('token', token)
            .single();

        if (fetchError || !vendorData) {
            return json<ActionData>({
                success: false,
                error: "无法找到相关数据"
            });
        }

        if (vendorData.status !== '待回复') {
            return json<ActionData>({
                success: false,
                error: "该数据已回复或已关闭，无法再次提交"
            });
        }

        // Upload the evidence file
        const fileExt = evidenceFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('vendor')
            .upload(filePath, evidenceFile);

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return json<ActionData>({
                success: false,
                error: `上传文件失败: ${uploadError.message}`
            });
        }

        // Get the public URL for the uploaded file
        // Make sure to await the getPublicUrl operation
        const { data: urlData } = await supabase.storage
            .from('vendor')
            .getPublicUrl(filePath);

        // Debug bucket name and file path
        console.log('Bucket:', 'vendor');
        console.log('File path:', filePath);
        console.log('urlData:', urlData);

        // Check if the bucket exists
        const { data: buckets } = await supabase.storage.listBuckets();
        console.log('Available buckets:', buckets?.map(b => b.name));

        const publicUrl = urlData.publicUrl;

        // Update the vendor data with submission
        const { error: updateError } = await supabase
            .from('vendor_data')
            .update({
                value: parseFloat(value),
                unit: unit,
                evidence_file: publicUrl,
                respondent: respondentName || "匿名用户",
                response_time: new Date().toISOString(),
                status: '已回复',
                updated_at: new Date().toISOString()
            })
            .eq('id', vendorData.id);

        if (updateError) {
            return json<ActionData>({
                success: false,
                error: `提交数据失败: ${updateError.message}`
            });
        }

        // Redirect to success page
        return redirect('/dashboard/vendor-data-submission/success');
    } catch (error) {
        return json<ActionData>({
            success: false,
            error: `提交失败: ${error instanceof Error ? error.message : String(error)}`
        });
    }
}

// Success component
function SuccessPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                <div className="mb-6 text-green-500 flex justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold mb-4">提交成功，感谢您的关注！</h2>
                <p className="text-gray-600 mb-6">您的数据已成功提交，我们将尽快处理。</p>
            </div>
        </div>
    );
}

// Main component
export default function VendorDataSubmission() {
    const { vendorData, error } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === 'submitting';

    const [files, setFiles] = useState<File[]>([]);
    const [respondentName, setRespondentName] = useState('');

    // If we're on the success page
    if (navigation.location?.pathname === '/dashboard/vendor-data-submission/success') {
        return <SuccessPage />;
    }

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            // Limit to 5 files
            const newFiles = Array.from(e.target.files).slice(0, 5 - files.length);
            setFiles(prev => [...prev, ...newFiles].slice(0, 5));
        }
    };

    // Remove a file
    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <p className="text-center mt-4">请联系管理员获取有效链接</p>
                </div>
            </div>
        );
    }

    if (!vendorData) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-2">加载中...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-start min-h-screen bg-gray-50 p-4 pt-8">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl w-full">
                <h1 className="text-2xl font-bold mb-6 text-center">Climate Seal</h1>

                <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-2">公司名称: XXXXX</h2>

                    <p className="text-gray-700 text-sm mb-6">
                        为响应国家及行业对可持续发展和碳减排的要求，同时进一步加强我司在环境管理与绿色供应链建设方面的工作，我们正在开展碳足迹相关数据的收集工作。此项工作旨在全面了解并评估产品或服务在生命周期各阶段的碳排放情况，以便我们在后续的碳管理与减排措施制定中，能够更科学地识别重点环节、优化资源配置，并共同提升整体的环保绩效。
                    </p>

                    <p className="text-gray-700 text-sm mb-6">
                        因此，诚挚邀请贵司配合提供相关碳足迹数据。我们承诺，所有收集的数据将仅用于本次环境评估及改进分析，并严格按照保密原则处理。
                    </p>

                    <p className="font-medium text-gray-800">
                        请在下方如实填写数据和内容，感谢。
                    </p>
                </div>

                <Form method="post" encType="multipart/form-data" className="space-y-6">
                    <input type="hidden" name="token" value={new URL(window.location.href).searchParams.get('token') || ''} />

                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">排放源名称</label>
                            <div className="p-2 bg-gray-100 rounded-md">{vendorData.emissionSourceName}</div>
                        </div>

                        {vendorData.remarks && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                                <div className="p-2 bg-gray-100 rounded-md whitespace-pre-wrap">{vendorData.remarks}</div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">填报截止时间</label>
                            <div className="p-2 bg-gray-100 rounded-md">{vendorData.deadline}</div>
                        </div>

                        <div>
                            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
                                排放数值 <span className="text-red-500">*</span>
                            </label>
                            <Input
                                id="value"
                                name="value"
                                type="text"
                                placeholder="请输入数值"
                                required
                                className={actionData?.fieldErrors?.value ? "border-red-500" : ""}
                            />
                            {actionData?.fieldErrors?.value && (
                                <p className="text-red-500 text-xs mt-1">{actionData.fieldErrors.value[0]}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                                排放源单位 <span className="text-red-500">*</span>
                            </label>
                            <Input
                                id="unit"
                                name="unit"
                                type="text"
                                placeholder="请输入单位"
                                required
                                className={actionData?.fieldErrors?.unit ? "border-red-500" : ""}
                            />
                            {actionData?.fieldErrors?.unit && (
                                <p className="text-red-500 text-xs mt-1">{actionData.fieldErrors.unit[0]}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                证明材料 <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                            <span>上传文件</span>
                                            <input
                                                id="file-upload"
                                                name="evidenceFile"
                                                type="file"
                                                className="sr-only"
                                                onChange={handleFileChange}
                                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                            />
                                        </label>
                                        <p className="pl-1">或拖拽文件到此处</p>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        支持PDF、Word、Excel、图片等格式，最多上传5个文件
                                    </p>
                                </div>
                            </div>

                            {files.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-sm font-medium text-gray-700 mb-1">已选文件：</p>
                                    <ul className="space-y-2">
                                        {files.map((file, index) => (
                                            <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                                <span className="text-sm truncate">{file.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(index)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {actionData?.fieldErrors?.evidenceFile && (
                                <p className="text-red-500 text-xs mt-1">{actionData.fieldErrors.evidenceFile[0]}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="respondentName" className="block text-sm font-medium text-gray-700 mb-1">
                                填报人姓名
                            </label>
                            <Input
                                id="respondentName"
                                name="respondentName"
                                type="text"
                                placeholder="请输入您的姓名（选填）"
                                value={respondentName}
                                onChange={(e) => setRespondentName(e.target.value)}
                            />
                        </div>
                    </div>

                    {actionData?.error && (
                        <Alert variant="destructive">
                            <AlertDescription>{actionData.error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex justify-center pt-4">
                        <Button
                            type="submit"
                            className="w-full sm:w-auto"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    提交中...
                                </>
                            ) : '确认提交'}
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
} 