import { useState } from "react";
import { json, useLoaderData } from "@remix-run/react";
import WorkbenchSection from "~/components/dashboard/sections/WorkbenchSection";
import type { LoaderFunctionArgs } from "@remix-run/node";
import type { Workflow } from "~/types/dashboard";

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

    // 过滤工作流
    const filteredWorkflows = workflows.filter(workflow => {
        const matchesSearch = workflow.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesIndustry = !industryFilter || workflow.industry === industryFilter;
        return matchesSearch && matchesIndustry;
    });

    return json({
        workflows: filteredWorkflows,
    });
}


export default function DashboardWorkbench() {
    const [searchQuery, setSearchQuery] = useState("");
    const [industryFilter, setIndustryFilter] = useState("");
    const { workflows } = useLoaderData<typeof loader>();

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        // Ideally, this would trigger a server-side search
        console.log("Searching for:", value);
    };

    const handleIndustryFilter = (value: string) => {
        setIndustryFilter(value);
        // Ideally, this would trigger a server-side filter
        console.log("Filtering by industry:", value);
    };

    const navigateToWorkflow = (id: string, route: "workflow" | "report" = "workflow") => {
        // TODO: Implement navigation
        console.log(`Navigating to workflow ${id} via ${route}`);
    };

    const showDeleteModal = (workflow: Workflow) => {
        // TODO: Implement delete modal
        console.log("Showing delete modal for workflow:", workflow.id);
    };

    return (
        <WorkbenchSection
            filteredWorkflows={workflows}
            searchQuery={searchQuery}
            setSearchQuery={handleSearch}
            industryFilter={industryFilter}
            setIndustryFilter={handleIndustryFilter}
            navigateToWorkflow={navigateToWorkflow}
            showDeleteModal={showDeleteModal}
        />
    );
} 