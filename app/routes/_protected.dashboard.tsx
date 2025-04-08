import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { useLoaderData, useSearchParams, useRevalidator, useNavigate } from "@remix-run/react";
import { useState } from "react";
import { Modal, message, Spin, Layout, Menu, Button, Typography, Card, Row, Col, Statistic } from "antd";
import { ensureUUID } from "~/utils/uuid";
import type { Workflow, VendorTask } from "~/types/dashboard";
import { workflowTasks, vendorDataTasks, carbonReductionTasks, carbonTrendData } from "~/utils/mockData";
import DashboardSection from "~/components/dashboard/DashboardSection";
import "~/styles/dashboard.css";
import { useAuthContext } from "~/contexts/AuthContext";
import {
  LogoutOutlined,
  DashboardOutlined,
  BarChartOutlined,
  FileTextOutlined
} from "@ant-design/icons";

const { Title, Paragraph } = Typography;

export const meta: MetaFunction = () => {
  return [
    { title: "仪表板 - Climate Seal" },
    { name: "description", content: "Climate Seal碳足迹管理系统仪表板" },
  ];
};

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
      type: "assessment",
      createdAt: "2024-04-01",
      updatedAt: "2024-04-07"
    },
    {
      id: "wf-2",
      name: "供应商数据收集",
      status: "pending" as const,
      industry: "制造业",
      type: "collection",
      createdAt: "2024-04-02",
      updatedAt: "2024-04-07"
    }
  ];

  const products = [
    {
      id: "p-1",
      name: "产品A",
      carbonFootprint: 100,
      unit: "tCO2e"
    },
    {
      id: "p-2",
      name: "产品B",
      carbonFootprint: 150,
      unit: "tCO2e"
    }
  ];

  const vendorTasks: VendorTask[] = [
    {
      id: "vt-1",
      name: "收集供应商A的排放数据",
      status: "pending",
      dueDate: "2024-04-15",
      assignedTo: "张三"
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
    products,
    vendorTasks,
    workflowTasks,
    carbonReductionTasks,
    carbonTrendData,
    searchQuery,
    industryFilter
  });
}

export default function Dashboard() {
  const { 
    workflows,
    products,
    vendorTasks,
    workflowTasks,
    carbonReductionTasks,
    carbonTrendData,
    searchQuery,
    industryFilter
  } = useLoaderData<typeof loader>();
  
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const revalidator = useRevalidator();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);
  const [selectedKey, setSelectedKey] = useState("dashboard");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navigateToWorkflow = (id: string, route: "workflow" | "report") => {
    const formattedId = ensureUUID(id);
    
    if (!formattedId) {
      message.error("无效的工作流ID格式");
      return;
    }
    
    navigate(`/${route}/${formattedId}`);
  };

  const handleDeleteWorkflow = async (workflow: Workflow) => {
    try {
      // TODO: 实现删除工作流的action
      message.success(`工作流 "${workflow.name}" 已删除`);
      revalidator.revalidate();
      setDeleteModalVisible(false);
    } catch (error) {
      console.error("删除工作流失败:", error);
      message.error("删除工作流失败，请稍后重试");
    }
  };

  const showDeleteModal = (workflow: Workflow) => {
    setWorkflowToDelete(workflow);
    setDeleteModalVisible(true);
  };

  const handleSearch = (value: string) => {
    setSearchParams(prev => {
      prev.set("q", value);
      return prev;
    });
  };

  const handleIndustryFilter = (value: string) => {
    setSearchParams(prev => {
      if (value) {
        prev.set("industry", value);
      } else {
        prev.delete("industry");
      }
      return prev;
    });
  };

  const menuItems = [
    {
      key: "dashboard",
      label: "概览",
    },
    {
      key: "workbench",
      label: "工作台",
    },
    {
      key: "vendor-data",
      label: "供应商数据",
    },
    {
      key: "carbon-factor",
      label: "碳因子查询",
    },
    {
      key: "enterprise-knowledge",
      label: "企业知识库",
    },
    {
      key: "industry-knowledge",
      label: "行业知识库",
    },
    {
      key: "policy-knowledge",
      label: "政策知识库",
    },
    {
      key: "settings",
      label: "设置",
    },
  ];

  return (
    <Layout className="dashboard-layout">
      <Layout.Header className="dashboard-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Title level={4} style={{ margin: 0 }}>
            <DashboardOutlined /> 欢迎回来，{user?.name || "用户"}
          </Title>
          <Button 
            type="primary" 
            danger 
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
          >
            登出
          </Button>
        </div>
      </Layout.Header>
      
      <Layout>
        <Layout.Sider width={200} className="dashboard-sider">
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={({ key }) => setSelectedKey(key)}
            style={{ height: "100%" }}
          />
        </Layout.Sider>
        
        <Layout.Content className="dashboard-content">
          {selectedKey === "dashboard" ? (
            <>
              <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="本月碳排放量"
                      value={125.8}
                      precision={1}
                      valueStyle={{ color: '#3f8600' }}
                      suffix="吨CO₂e"
                      prefix={<BarChartOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="同比上月"
                      value={-12.3}
                      precision={1}
                      valueStyle={{ color: '#3f8600' }}
                      suffix="%"
                      prefix={<BarChartOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="完成的碳盘查任务"
                      value={8}
                      prefix={<FileTextOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="待办事项"
                      value={5}
                      prefix={<FileTextOutlined />}
                    />
                  </Card>
                </Col>
              </Row>

              <Card style={{ marginBottom: "24px" }}>
                <Title level={4}>系统公告</Title>
                <Paragraph>
                  1. 系统已更新到最新版本，包含多项功能改进和bug修复。
                </Paragraph>
                <Paragraph>
                  2. 新增产品碳足迹计算模块将于下周上线。
                </Paragraph>
                <Paragraph>
                  3. 请及时更新您的企业信息，以便我们提供更精准的服务。
                </Paragraph>
              </Card>

              <DashboardSection 
                products={products}
                workflowTasks={workflowTasks}
                vendorDataTasks={vendorTasks}
                carbonReductionTasks={carbonReductionTasks}
                carbonTrendData={carbonTrendData}
              />
            </>
          ) : (
            <div>其他功能开发中...</div>
          )}
        </Layout.Content>
      </Layout>
      
      <Modal
        title="确认删除"
        open={deleteModalVisible}
        onOk={() => workflowToDelete && handleDeleteWorkflow(workflowToDelete)}
        onCancel={() => setDeleteModalVisible(false)}
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>
          确定要删除工作流 "{workflowToDelete?.name}" 吗？此操作不可撤销。
        </p>
      </Modal>
    </Layout>
  );
}