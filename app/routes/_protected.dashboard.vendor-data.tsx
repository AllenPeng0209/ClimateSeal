import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, useLoaderData } from "@remix-run/react";
import VendorDataSection from "~/components/dashboard/sections/VendorDataSection";

export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get("q") || "";
    const industryFilter = url.searchParams.get("industry") || "";

    // TODO: 从后端获取实际数据
    const vendorDataTasks = [
        {
            id: "vt-1",
            vendor: "供应商A",
            product: "原材料X",
            status: "待提交" as const,
            deadline: "2024-04-15",
            submittedAt: null,
            dataQuality: null
        },
        {
            id: "vt-2",
            vendor: "供应商B",
            product: "原材料Y",
            status: "已提交" as const,
            deadline: "2024-04-10",
            submittedAt: "2024-04-08",
            dataQuality: "良好"
        }
    ];

    return json({
        vendorDataTasks,
    });
}


export default function DashboardVendorData() {
    const { vendorDataTasks } = useLoaderData<typeof loader>();

    return (
        <VendorDataSection
            vendorTasks={vendorDataTasks}
            onAddTask={(task) => {
                // TODO: 实现添加任务的逻辑
                console.log('添加任务:', task);
            }}
            onEditTask={(id, task) => {
                // TODO: 实现编辑任务的逻辑
                console.log('编辑任务:', id, task);
            }}
            onDeleteTask={(id) => {
                // TODO: 实现删除任务的逻辑
                console.log('删除任务:', id);
            }}
        />
    );
} 