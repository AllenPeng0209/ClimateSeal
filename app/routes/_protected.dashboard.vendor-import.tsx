import { useState, useEffect } from 'react';
import {
    json,
    redirect,
    unstable_parseMultipartFormData,
    unstable_createMemoryUploadHandler,
} from '@remix-run/node';
import {
    useLoaderData,
    useActionData,
    useNavigation,
    useFetcher,
    Link
} from '@remix-run/react';
import type {
    LoaderFunctionArgs,
    ActionFunctionArgs,
    UploadHandler
} from '@remix-run/node';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '~/components/dashboard/ui/table';
import { Button } from '~/components/dashboard/ui/button';
import { Alert, AlertDescription } from '~/components/dashboard/ui/alert';
import { Loader2, DownloadCloud, Upload, FileUp } from 'lucide-react';
import { ImportConfirmDialog } from '~/components/dashboard/sections/dialogs';
import { parseVendorImportExcel, processVendorImportData, generateErrorExcel } from '~/lib/services/excel-processor';
import { importVendorsAndPurchaseGoods } from '~/lib/services/vendor-import';
import {
    uploadFile,
    fetchImportResults,
    saveImportResult,
    saveUploadRecord,
    fetchFileById,
    deleteFileAndRecord,
} from '~/lib/persistence/import';
import type { VendorImportResult } from '~/components/dashboard/sections/schema';

// Define types for our loader data
interface LoaderData {
    importResults: VendorImportResult[];
    error: string | null;
}

// Define types for our action data
interface ActionData {
    success: boolean;
    error?: string;
    fileUrl?: string;
    fileName?: string;
    processedData?: {
        data: any[];
        successCount: number;
        failureCount: number;
    };
    fileId?: string;
}

// Server-side loader function to fetch import results
export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const { data, error } = await fetchImportResults();

        if (error) {
            return json<LoaderData>({
                importResults: [],
                error: `Error loading import results: ${error.message}`
            });
        }

        return json<LoaderData>({
            importResults: data || [],
            error: null
        });
    } catch (error) {
        return json<LoaderData>({
            importResults: [],
            error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
        });
    }
}

// Server-side action function to handle file uploads and imports
export async function action({ request }: ActionFunctionArgs) {
    try {
        const uploadHandler: UploadHandler = unstable_createMemoryUploadHandler({
            maxPartSize: 50_000_000, // 50MB
        });
        // TODO: shaobo(params check, and error handling)
        const formData = await unstable_parseMultipartFormData(request, uploadHandler);
        let intent = formData.get('intent') as string | null;
        if (!intent) {
            console.error('Intent is null or undefined and could not be inferred');
            return json<ActionData>({
                success: false,
                error: '操作失败: 未知的操作'
            });
        }

        switch (intent) {
            case 'upload': {
                const file = formData.get('file') as File | null;
                const existingFileId = formData.get('fileId') as string | null;
                if (!file) {
                    console.error('File is null');
                    return json<ActionData>({
                        success: false,
                        error: '文件不能为空'
                    });
                }
                // existingFileId is the fileId of the previous file, means this is a re upload operation
                // Delete the existing file and its record before uploading new one
                // Continue with upload even if deletion fails
                if (existingFileId) {
                    const { success, error: deleteError } = await deleteFileAndRecord(existingFileId);
                    if (!success) {
                        console.error('Failed to delete existing file:', deleteError?.message);
                    } else {
                        console.log(`Successfully deleted previous file with ID: ${existingFileId}`);
                    }
                }

                const timestamp = new Date().getTime();
                const path = `vendor_imports/${timestamp}.xlsx`;
                console.log('File path:', path);
                const { url, error: uploadError } = await uploadFile(file, path);

                if (uploadError) {
                    console.error('Upload error:', uploadError.message);
                    return json<ActionData>({
                        success: false,
                        error: `文件上传失败: ${uploadError.message}`
                    });
                }
                // Save the upload record to the database and get fileId
                const fileId = await saveUploadRecord({
                    fileName: file.name,
                    filePath: path,
                });

                return json<ActionData>({
                    success: true,
                    fileUrl: url || undefined,
                    fileName: file.name,
                    processedData: {
                        data: [],
                        successCount: 0,
                        failureCount: 0
                    },
                    fileId
                });
            }

            case 'import': {
                const fileId = formData.get('fileId') as string;
                if (!fileId) {
                    return json<ActionData>({
                        success: false,
                        error: '没有找到文件ID'
                    });
                }
                // Fetch the file from Supabase using fileId
                const { file, error: fetchError } = await fetchFileById(fileId);
                if (fetchError || !file) {
                    return json<ActionData>({
                        success: false,
                        error: `文件获取失败: ${fetchError?.message || '文件不存在'}`
                    });
                }
                // Parse the Excel file
                const { data, errors } = await parseVendorImportExcel(file);
                if (errors.length > 0) {
                    return json<ActionData>({
                        success: false,
                        error: `Excel 文件包含 ${errors.length} 个错误，请检查格式是否正确`
                    });
                }
                // Process the data to check for existing records
                const processResult = await processVendorImportData(data);
                const fileName = file.name;
                const timestamp = new Date().getTime();
                const filePath = `vendor-imports/${timestamp}-${fileName}`;

                if (!fileName) {
                    return json<ActionData>({
                        success: false,
                        error: '文件名缺失'
                    });
                }

                // Import the data
                const importResult = await importVendorsAndPurchaseGoods(processResult.results);

                // Generate error file if needed
                let errorFilePath: string | undefined;
                if (importResult.failureCount > 0) {
                    const errorBlob = generateErrorExcel(importResult.results.filter(r => !r.success));
                    const errorFile = new File([errorBlob], `errors-${fileName}`, {
                        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    });
                    const timestamp = new Date().getTime();
                    const path = `vendor-imports/errors/${timestamp}-errors-${fileName}`;
                    const { url } = await uploadFile(errorFile, path);
                    errorFilePath = url || undefined;
                }

                // Save import result
                await saveImportResult({
                    fileName,
                    successCount: importResult.successCount,
                    failureCount: importResult.failureCount,
                    status: importResult.failureCount > 0 ? '导入失败' : '导入成功',
                    createdAt: new Date().toISOString(),
                    sourceFilePath: filePath,
                    errorFilePath
                });

                return redirect('/dashboard/vendor-import');
            }

            default:
                return json<ActionData>({
                    success: false,
                    error: `Unknown action: ${intent}`
                });
        }
    } catch (error) {
        console.error('Action error:', error);
        return json<ActionData>({
            success: false,
            error: `Action error: ${error instanceof Error ? error.message : String(error)}`
        });
    }
}

export default function VendorImport() {
    const { importResults, error: loaderError } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const fetcher = useFetcher<typeof action>();

    const isUploading = navigation.state === 'submitting' && navigation.formData?.get('intent') === 'upload';
    const isImporting = navigation.state === 'submitting' && navigation.formData?.get('intent') === 'import';
    const isLoading = navigation.state === 'loading';

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<{
        url: string;
        name: string;
        processedData: any;
        fileId?: string;
    } | null>(null);

    // Update uploadedFile when action data changes
    useEffect(() => {
        if (actionData?.success && actionData.fileUrl && actionData.fileName && actionData.processedData) {
            setUploadedFile({
                url: actionData.fileUrl,
                name: actionData.fileName,
                processedData: actionData.processedData,
                fileId: actionData.fileId || ''
            });
        }
    }, [actionData]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
        }
    };

    const handleUpload = () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('intent', 'upload');
        formData.append('file', selectedFile);
        if (uploadedFile?.fileId) {
            formData.append('fileId', uploadedFile.fileId);
        }

        fetcher.submit(formData, { method: 'post', encType: 'multipart/form-data' });
    };

    const handleImport = () => {
        if (!uploadedFile) return;

        const formData = new FormData();
        formData.append('intent', 'import');
        formData.append('fileId', uploadedFile.fileId || '');

        fetcher.submit(formData, { method: 'post', encType: 'multipart/form-data' });
        setIsConfirmDialogOpen(false);
    };

    const downloadTemplate = () => {
        // Template is in the public directory
        window.open('/供应商及采购商品导入模板.xlsx', '_blank');
    };

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-4">供应商导入</h1>

            {loaderError && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>
                        加载导入结果失败: {loaderError}
                    </AlertDescription>
                </Alert>
            )}

            {fetcher.data?.error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>
                        操作失败: {fetcher.data.error}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border rounded-lg p-4 bg-white">
                    <h2 className="text-lg font-semibold mb-2">下载模板</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        请先下载模板，按照模板格式填写供应商及采购商品信息。
                    </p>
                    <Button onClick={downloadTemplate}>
                        <DownloadCloud className="mr-2 h-4 w-4" />
                        下载模板
                    </Button>
                </div>

                <div className="border rounded-lg p-4 bg-white">
                    <h2 className="text-lg font-semibold mb-2">上传文件</h2>
                    <div className="file-upload-container">
                        <div className="flex items-center mb-4">
                            <input
                                type="file"
                                id="file-upload"
                                name="file"
                                className="hidden"
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                {uploadedFile ? '重新上传' : '选择文件'}
                            </label>
                            {selectedFile && (
                                <span className="ml-2 text-sm text-gray-500">
                                    已选择: {selectedFile.name}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center">
                            <Button
                                onClick={handleUpload}
                                type="button"
                                disabled={!selectedFile || isUploading}
                                className="mr-2"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        上传中...
                                    </>
                                ) : (
                                    <>
                                        <FileUp className="mr-2 h-4 w-4" />
                                        上传
                                    </>
                                )}
                            </Button>

                            <Button
                                onClick={() => setIsConfirmDialogOpen(true)}
                                disabled={!uploadedFile || isImporting}
                                variant={uploadedFile ? 'default' : 'outline'}
                                type="button"
                            >
                                {isImporting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        导入中...
                                    </>
                                ) : '导入'}
                            </Button>
                        </div>
                    </div>

                    {uploadedFile && (
                        <div className="mt-4">
                            <p className="text-sm text-gray-600">
                                已上传文件: <a href={uploadedFile.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{uploadedFile.name}</a>
                            </p>
                            <p className="text-sm text-gray-600">
                                共 {uploadedFile.processedData.successCount + uploadedFile.processedData.failureCount} 条数据，
                                其中 {uploadedFile.processedData.successCount} 条可导入，
                                {uploadedFile.processedData.failureCount} 条异常
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <h2 className="text-lg font-semibold mb-2">导入历史</h2>
            {isLoading ? (
                <div className="flex justify-center items-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="ml-2">加载导入历史中...</span>
                </div>
            ) : (
                <Table className="border-collapse border border-gray-200">
                    <TableHeader>
                        <TableRow className="border border-gray-200">
                            <TableHead className="border border-gray-200 text-center">序号</TableHead>
                            <TableHead className="border border-gray-200 text-center">文件名称</TableHead>
                            <TableHead className="border border-gray-200 text-center">导入成功条数</TableHead>
                            <TableHead className="border border-gray-200 text-center">导入失败个数</TableHead>
                            <TableHead className="border border-gray-200 text-center">导入状态</TableHead>
                            <TableHead className="border border-gray-200 text-center">创建时间</TableHead>
                            <TableHead className="border border-gray-200 text-center">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {importResults.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-4">
                                    暂无导入记录
                                </TableCell>
                            </TableRow>
                        ) : (
                            importResults.map((result, index) => (
                                <TableRow key={result.id} className="border border-gray-200">
                                    <TableCell className="border border-gray-200">{index + 1}</TableCell>
                                    <TableCell className="border border-gray-200">{result.fileName}</TableCell>
                                    <TableCell className="border border-gray-200 text-center">{result.successCount}</TableCell>
                                    <TableCell className="border border-gray-200 text-center">{result.failureCount}</TableCell>
                                    <TableCell className="border border-gray-200 text-center">
                                        <span className={result.status === '导入成功' ? 'text-green-500' : 'text-red-500'}>
                                            {result.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="border border-gray-200">
                                        {new Date(result.createdAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="border border-gray-200">
                                        <div className="flex gap-2">
                                            {result.errorFilePath && (
                                                <a
                                                    href={result.errorFilePath}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    异常数据
                                                </a>
                                            )}
                                            <a
                                                href={result.sourceFilePath}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline ml-2"
                                            >
                                                源文件
                                            </a>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            )}

            <div className="mt-4">
                <Button variant="outline" asChild>
                    <Link to="/dashboard/vendor-information">返回供应商管理</Link>
                </Button>
            </div>

            <ImportConfirmDialog
                open={isConfirmDialogOpen}
                onOpenChange={setIsConfirmDialogOpen}
                onConfirm={handleImport}
                fileName={uploadedFile?.name || ''}
                totalCount={(uploadedFile?.processedData?.successCount || 0) + (uploadedFile?.processedData?.failureCount || 0)}
                backgroundColor="bg-blue-50"
            />
        </div>
    );
} 