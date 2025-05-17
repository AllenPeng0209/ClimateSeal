import { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/dashboard/ui/table";
import { Input } from "~/components/dashboard/ui/input";
import { Button } from "~/components/dashboard/ui/button";
import { Alert, AlertDescription } from "~/components/dashboard/ui/alert";
import { Loader2 } from 'lucide-react';
import {
    Link,
    useLoaderData,
    useFetcher,
    useNavigation,
    json,
    // redirect // Not used yet
} from '@remix-run/react';
import type {
    LoaderFunctionArgs,
    ActionFunctionArgs
} from '@remix-run/node';

// 定义产品类型
interface Product {
    id: string; // 产品ID
    name: string; // 产品名称
    createdAt: string; // 创建时间
    updatedAt: string; // 更新时间
    updatedBy: string; // 更新人
}

// Loader数据类型
interface LoaderData {
    products: Product[];
    error: string | null;
}

// Action数据类型
interface ActionData {
    success: boolean;
    error?: string;
    product?: Product;
}

// 服务端 loader 函数获取产品列表
export async function loader({ request }: LoaderFunctionArgs) {
    try {
        // TODO: 从数据库获取产品数据
        const mockProducts: Product[] = [
            // 示例数据，后续替换为真实数据
            { id: '1', name: '产品示例A', createdAt: '2025/05/10 00:00:00', updatedAt: '2025/05/10 00:00:00', updatedBy: '张三' },
            { id: '2', name: '产品示例B', createdAt: '2025/05/11 00:00:00', updatedAt: '2025/05/11 00:00:00', updatedBy: '李四' },
        ];
        return json<LoaderData>({
            products: mockProducts,
            error: null
        });
    } catch (error) {
        return json<LoaderData>({
            products: [],
            error: `加载产品数据出错: ${error instanceof Error ? error.message : String(error)}`
        });
    }
}

// 服务端 action 函数处理操作
export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const intent = formData.get('intent') as string;

    try {
        switch (intent) {
            case 'add': {
                // TODO: 实现添加产品逻辑
                console.log('Add action triggered', Object.fromEntries(formData));
                return json<ActionData>({ success: true });
            }
            case 'delete': {
                // TODO: 实现删除产品逻辑
                const id = formData.get('id');
                console.log('Delete action triggered for id:', id);
                return json<ActionData>({ success: true });
            }
            // 其他操作如 'edit', 'viewConfig' 可以后续添加
            default:
                return json<ActionData>({
                    success: false,
                    error: `未知操作: ${intent}`
                });
        }
    } catch (error) {
        return json<ActionData>({
            success: false,
            error: `操作失败: ${error instanceof Error ? error.message : String(error)}`
        });
    }
}

export default function ProductManagement() {
    const { products, error: dbError } = useLoaderData<typeof loader>();
    const fetcher = useFetcher<typeof action>();
    const navigation = useNavigation();

    const isLoading = navigation.state === 'loading' || fetcher.state !== 'idle';

    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // TODO: 添加产品、编辑产品、删除产品的对话框状态和处理函数

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">产品管理</h1>
                {/* TODO: 添加 "新增" 按钮和对应的对话框 */}
                <Button>新增产品</Button>
            </div>

            <div className="flex space-x-2 mb-4">
                <Input
                    placeholder="按产品名称搜索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            {dbError && (
                <Alert variant="destructive">
                    <AlertDescription>{dbError}</AlertDescription>
                </Alert>
            )}

            {fetcher.data && !fetcher.data.success && (
                <Alert variant="destructive">
                    <AlertDescription>{fetcher.data.error}</AlertDescription>
                </Alert>
            )}
             {fetcher.data && fetcher.data.success && (
                <Alert variant="default">
                    <AlertDescription>操作成功！</AlertDescription>
                </Alert>
            )}

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>序号</TableHead>
                            <TableHead>产品名称</TableHead>
                            <TableHead>创建时间</TableHead>
                            <TableHead>更新时间</TableHead>
                            <TableHead>更新人</TableHead>
                            <TableHead>操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> 加载中...
                                </TableCell>
                            </TableRow>
                        )}
                        {!isLoading && filteredProducts.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">
                                    没有找到产品。
                                </TableCell>
                            </TableRow>
                        )}
                        {!isLoading && filteredProducts.map((product, index) => (
                            <TableRow key={product.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>{product.createdAt}</TableCell>
                                <TableCell>{product.updatedAt}</TableCell>
                                <TableCell>{product.updatedBy}</TableCell>
                                <TableCell>
                                    <fetcher.Form method="post" className="inline-block">
                                        <input type="hidden" name="id" value={product.id} />
                                        {/* TODO: 实现配置产品信息、删除、查看功能 */}
                                        <Button variant="link" type="button" onClick={() => alert('配置产品信息: ' + product.name)}>配置产品信息</Button>
                                        <Button variant="link" type="submit" name="intent" value="delete" className="text-red-500">删除</Button>
                                        <Button variant="link" type="button" onClick={() => alert('查看产品: ' + product.name)}>查看</Button>
                                    </fetcher.Form>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {/* TODO: 添加、编辑、删除确认对话框组件 */}
        </div>
    );
} 