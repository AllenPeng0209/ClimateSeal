import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { useLoaderData, useSearchParams, useRevalidator, useNavigate } from "@remix-run/react";
import { useState, useEffect } from "react";
import { Modal, message, Layout, Menu, Button, Typography, Card, Row, Col, Statistic, Avatar, Dropdown, Space } from "antd";
import { ensureUUID } from "~/utils/uuid";
import type { Workflow, VendorTask } from "~/types/dashboard";
import { workflowTasks, vendorDataTasks, carbonReductionTasks, carbonTrendData } from "~/utils/mockData";
import DashboardSection from "~/components/dashboard/DashboardSection";
import WorkbenchSection from "~/components/dashboard/sections/WorkbenchSection";
import PolicyKnowledgeSection from "~/components/dashboard/sections/PolicyKnowledgeSection";
import SettingsSection from "~/components/dashboard/sections/SettingsSection";
import VendorDataSection from "~/components/dashboard/sections/VendorDataSection";
import CarbonFactorSearchSection from "~/components/dashboard/sections/CarbonFactorSearchSection";
import EnterpriseKnowledgeSection from "~/components/dashboard/sections/EnterpriseKnowledgeSection";
import IndustryKnowledgeSection from "~/components/dashboard/sections/IndustryKnowledgeSection";
import "~/styles/dashboard.css";
import { useAuthContext } from "~/contexts/AuthContext";
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
  const [collapsed, setCollapsed] = useState(false);

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
        }
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
                {user && <span>{user.name || user.email}</span>}
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
  );
}