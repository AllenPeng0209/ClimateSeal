import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { useLoaderData, useSearchParams, useRevalidator, useNavigate } from "@remix-run/react";
import { useState } from "react";
import { Modal, message, Layout, Menu, Button, Typography, Space, Dropdown, Avatar } from "antd";
import { ensureUUID } from "~/utils/uuid";
import type { Workflow, VendorTask, VendorDataTask } from "~/types/dashboard";
import { workflowTasks, vendorDataTasks, carbonReductionTasks, carbonTrendData } from "~/utils/mockData";
import DashboardSection from "~/components/dashboard/sections/DashboardSection";
import WorkbenchSection from "~/components/dashboard/sections/WorkbenchSection";
import PolicyKnowledgeSection from "~/components/dashboard/sections/PolicyKnowledgeSection";
import SettingsSection from "~/components/dashboard/sections/SettingsSection";
import VendorDataSection from "~/components/dashboard/sections/VendorDataSection";
import CarbonFactorSearchSection from "~/components/dashboard/sections/CarbonFactorSearchSection";
import EnterpriseKnowledgeSection from "~/components/dashboard/sections/EnterpriseKnowledgeSection";
import IndustryKnowledgeSection from "~/components/dashboard/sections/IndustryKnowledgeSection";
import "~/styles/dashboard.css";
import { useAuth } from '../components/auth/AuthProvider';
import { PrivateRoute } from '../components/auth/PrivateRoute';
import {
  LogoutOutlined,
  DashboardOutlined,
  BarChartOutlined,
  FileTextOutlined,
  SettingOutlined,
  TeamOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  ExperimentOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  BulbOutlined,
  ToolOutlined,
  BookOutlined,
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

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

  const vendorTasks: VendorDataTask[] = [
    {
      id: "vt-1",
      vendor: "供应商A",
      product: "原材料X",
      status: "待提交",
      deadline: "2024-04-15",
      submittedAt: null,
      dataQuality: null
    },
    {
      id: "vt-2",
      vendor: "供应商B",
      product: "原材料Y",
      status: "已提交",
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
  const { authState } = useAuth();
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
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);
  const [selectedKey, setSelectedKey] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    // TODO: Implement logout logic
    console.log("Logging out");
  };

  const navigateToWorkflow = (id: string, route: "workflow" | "report") => {
    // 如果是创建新工作流，直接导航
    if (id === "new") {
      navigate(`/${route}/new`);
      return;
    }

    // 对于其他情况，验证UUID格式
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
      // revalidator.revalidate();
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
    // TODO: Implement search logic
    console.log("Searching for:", value);
  };

  const handleIndustryFilter = (value: string) => {
    // TODO: Implement industry filter logic
    console.log("Filtering by industry:", value);
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    // 处理子菜单项
    if (key.startsWith('dashboard:')) {
      const section = key.split(':')[1];
      setSelectedKey(section);
      return;
    }
    
    // 处理主菜单项
    setSelectedKey(key);
  };

  const menuItems = [
    {
      key: 'dashboard:dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: 'workbench',
      icon: <ToolOutlined />,
      label: '工作台',
      children: [
        {
          key: 'dashboard:workbench-main',
          label: '产品碳足迹管理',
        },
        {
          key: 'dashboard:vendor-data',
          label: '供应商数据收集',
        },
        {
          key: 'dashboard:carbon-factor-search',
          label: '碳排因子搜索',
        },
      ]
    },
    {
      key: 'knowledge',
      icon: <BookOutlined />,
      label: '知识库',
      children: [
        {
          key: 'dashboard:enterprise-knowledge',
          label: '企业知识库',
        },
        {
          key: 'dashboard:industry-knowledge',
          label: '行业知识库',
        },
        {
          key: 'dashboard:policy-knowledge',
          label: '政策法规库',
        }
      ]
    },
    {
      key: 'dashboard:settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => setSelectedKey('settings'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '账号设置',
      onClick: () => setSelectedKey('settings'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const renderContent = () => {
    switch (selectedKey) {
      case "dashboard":
        return (
          <DashboardSection 
            products={products}
            workflowTasks={workflowTasks}
            vendorDataTasks={vendorTasks}
            carbonReductionTasks={carbonReductionTasks}
            carbonTrendData={carbonTrendData}
          />
        );
      case "workbench-main":
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
      case "vendor-data":
        return (
          <VendorDataSection
            vendorTasks={vendorTasks}
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
      case "carbon-factor-search":
        return <CarbonFactorSearchSection />;
      case "enterprise-knowledge":
        return <EnterpriseKnowledgeSection />;
      case "industry-knowledge":
        return <IndustryKnowledgeSection />;
      case "policy-knowledge":
        return <PolicyKnowledgeSection />;
      case "settings":
        return <SettingsSection />;
      default:
        return <div>功能开发中...</div>;
    }
  };

  return (
    <PrivateRoute>
      <Layout style={{ minHeight: '100vh' }}>
        <Layout.Sider 
          trigger={null} 
          collapsible 
          collapsed={collapsed}
          style={{
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1,
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
          }}
        >
          <div style={{ 
            height: '64px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '0',
            margin: '16px 0',
          }}>
            {collapsed ? (
              <Avatar shape="square" size="large" src="/images/logo.png" />
            ) : (
              <Text style={{ color: 'rgba(230, 230, 230, 0.85)', fontSize: '25px', fontWeight: 'bold' }}>氣候印信</Text>
            )}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[`dashboard:${selectedKey}`]}
            defaultOpenKeys={['workbench', 'knowledge']}
            items={menuItems}
            onClick={handleMenuClick}
          />
        </Layout.Sider>
        <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
          <Layout.Header style={{ 
            padding: '0 16px', 
            background: '#fff', 
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />

            <Space>
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar icon={<UserOutlined />} />
                  {authState.user && <span>{authState.user.email}</span>}
                </Space>
              </Dropdown>
            </Space>
          </Layout.Header>
          <Layout.Content style={{ 
            margin: '24px 16px', 
            padding: 24, 
            background: '#fff',
            minHeight: 280,
            borderRadius: '4px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          }}>
            {renderContent()}
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
    </PrivateRoute>
  );
}