import { useLoaderData, useOutletContext } from "@remix-run/react";
import DashboardSection from "~/components/dashboard/sections/DashboardSection";
import type { Product, WorkflowTask, VendorDataTask, CarbonReductionTask, CarbonTrendData } from "~/types";
import { json, type LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get("q") || "";
    const industryFilter = url.searchParams.get("industry") || "";

    // TODO: 从后端获取实际数据
    const workflows = [
        {
            id: "wf-1",
            name: "碳足迹评估工作流",
            status: "active" as const,
            industry: "制造业",
            type: "assessment" as const,
            createdAt: "2024-04-01",
            updatedAt: "2024-04-07"
        },
        {
            id: "wf-2",
            name: "供应商数据收集",
            status: "pending" as const,
            industry: "制造业",
            type: "collection" as const,
            createdAt: "2024-04-02",
            updatedAt: "2024-04-07"
        }
    ];

    const products = [
        {
            id: "p-1",
            name: "产品A",
            carbonFootprint: 100,
            unit: "tCO2e",
            category: "电子产品",
            reductionTarget: 20,
            progress: 65
        },
        {
            id: "p-2",
            name: "产品B",
            carbonFootprint: 150,
            unit: "tCO2e",
            category: "机械设备",
            reductionTarget: 15,
            progress: 45
        }
    ];

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

    // Mock data for workflowTasks
    const workflowTasks = [
        {
            id: "wt-1",
            title: "数据收集",
            status: "进行中" as const,
            priority: "high" as const,
            deadline: "2024-04-20",
            progress: 65
        },
        {
            id: "wt-2",
            title: "碳足迹计算",
            status: "未开始" as const,
            priority: "medium" as const,
            deadline: "2024-04-25",
            progress: 20
        }
    ];

    // Mock data for carbonReductionTasks
    const carbonReductionTasks = [
        {
            id: "crt-1",
            title: "能源效率提升项目",
            target: "25%",
            status: "规划中" as const,
            responsible: "运营部",
            deadline: "2024-06-30",
            progress: 30
        },
        {
            id: "crt-2",
            title: "材料替代方案",
            target: "15%",
            status: "已完成" as const,
            responsible: "研发部",
            deadline: "2024-05-15",
            progress: 75
        }
    ];

    // Mock data for carbonTrendData
    const carbonTrendData = {
        months: ["一月", "二月", "三月", "四月", "五月", "六月"],
        values: [120, 115, 110, 105, 100, 95],
        industryAvg: [130, 128, 126, 125, 123, 120],
        leadingAvg: [100, 98, 95, 93, 90, 88],
        ourCompany: [120, 115, 110, 105, 100, 95]
    };

    // 过滤工作流
    const filteredWorkflows = workflows.filter(workflow => {
        const matchesSearch = workflow.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesIndustry = !industryFilter || workflow.industry === industryFilter;
        return matchesSearch && matchesIndustry;
    });

    return json({
        workflows: filteredWorkflows,
        products,
        vendorDataTasks,
        workflowTasks,
        carbonReductionTasks,
        carbonTrendData,
        searchQuery,
        industryFilter
    });
}

export default function DashboardOverview() {
    const loaderData = useLoaderData<typeof loader>();
    const {
        products,
        workflowTasks,
        vendorDataTasks,
        carbonReductionTasks,
        carbonTrendData
    } = loaderData;

    return (
        <DashboardSection
            products={products as Product[]}
            workflowTasks={workflowTasks as WorkflowTask[]}
            vendorDataTasks={vendorDataTasks as VendorDataTask[]}
            carbonReductionTasks={carbonReductionTasks as CarbonReductionTask[]}
            carbonTrendData={carbonTrendData as CarbonTrendData}
        />
    );
} 