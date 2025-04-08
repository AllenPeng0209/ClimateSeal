import { useState, useEffect } from "react";
import type { DashboardData, Workflow, Product, VendorTask } from "~/types/dashboard";

interface UseDashboardDataProps {
  initialData: {
    workflows: Workflow[];
    products: Product[];
    vendorTasks: VendorTask[];
  };
}

export function useDashboardData({ initialData }: UseDashboardDataProps) {
  const [loading, setLoading] = useState(true);
  const [workflowsLoading, setWorkflowsLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState<string>("");
  const [workflows, setWorkflows] = useState<Workflow[]>(initialData.workflows);
  const [products, setProducts] = useState<Product[]>(initialData.products);
  const [vendorTasks, setVendorTasks] = useState<VendorTask[]>(initialData.vendorTasks);

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = !industryFilter || workflow.industry === industryFilter;
    return matchesSearch && matchesIndustry;
  });

  const refreshData = async () => {
    setLoading(true);
    try {
      // TODO: 实现实际的数据刷新逻辑
      // const response = await fetch('/api/dashboard-data');
      // const data = await response.json();
      // setWorkflows(data.workflows);
      // setProducts(data.products);
      // setVendorTasks(data.vendorTasks);
    } catch (error) {
      console.error("刷新数据失败:", error);
    } finally {
      setLoading(false);
      setWorkflowsLoading(false);
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return {
    workflows,
    products,
    vendorTasks,
    loading,
    workflowsLoading,
    productsLoading,
    filteredWorkflows,
    searchQuery,
    setSearchQuery,
    industryFilter,
    setIndustryFilter,
    refreshData,
  };
} 