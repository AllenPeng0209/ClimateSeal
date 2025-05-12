import { type MetaFunction } from "@remix-run/node";
import { Navigate, Outlet, useLocation, useNavigate } from "@remix-run/react";
import React, { useState, useEffect } from "react";
import { Modal, message, Layout, Menu, Button, Typography, Space, Dropdown, Avatar } from "antd";
import { ensureUUID } from "~/utils/uuid";
import type { Workflow } from "~/types/dashboard";
import {
  LogoutOutlined,
  DashboardOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  ToolOutlined,
  BookOutlined,
  TruckOutlined
} from "@ant-design/icons";
import "~/styles/dashboard.css";
import { useAuthContext } from '~/contexts/AuthContext';

const { Text } = Typography;

export const meta: MetaFunction = () => {
  return [
    { title: "仪表板 - Climate Seal" },
    { name: "description", content: "Climate Seal碳足迹管理系统仪表板" },
  ];
};

// Map path segments to menu keys for selection highlighting
const pathToMenuKeyMap: Record<string, string> = {
  '': 'dashboard',
  'overview': 'dashboard',
  'workbench': 'workbench-main',
  'vendor-data': 'vendor-data',
  'carbon-factor-search': 'carbon-factor-search',
  'vendor-information': 'vendor-information',
  'vendor-purchase-goods': 'vendor-purchase-goods',
  'vendor-data-info': 'vendor-data-info',
  'enterprise-knowledge': 'enterprise-knowledge',
  'industry-knowledge': 'industry-knowledge',
  'policy-knowledge': 'policy-knowledge',
  'settings': 'settings'
};

export default function Dashboard() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to overview if at dashboard root
  useEffect(() => {
    if (location.pathname === "/dashboard") {
      navigate("/dashboard/overview");
    }
  }, [location.pathname, navigate]);

  // Get the current path segment to determine selected menu item
  const pathSegment = location.pathname.split('/').pop() || '';
  // If at the root dashboard path, default to 'dashboard'
  const selectedKey = pathSegment === 'dashboard' ? 'dashboard' : (pathToMenuKeyMap[pathSegment] || 'dashboard');

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);
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
      setDeleteModalVisible(false);
    } catch (error) {
      console.error("删除工作流失败:", error);
      message.error("删除工作流失败，请稍后重试");
    }
  };


  const handleMenuClick = ({ key }: { key: string }) => {
    // 处理子菜单项
    if (key.startsWith('dashboard:')) {
      const section = key.split(':')[1];

      // Map menu key to route path
      let path = '/dashboard';
      switch (section) {
        case 'dashboard':
          path = '/dashboard/overview';
          break;
        case 'workbench-main':
          path = '/dashboard/workbench';
          break;
        case 'vendor-data':
          path = '/dashboard/vendor-data';
          break;
        case 'carbon-factor-search':
          path = '/dashboard/carbon-factor-search';
          break;
        case 'vendor-information':
          path = '/dashboard/vendor-information';
          break;
        case 'vendor-purchase-goods':
          path = '/dashboard/vendor-purchase-goods';
          break;
        case 'vendor-data-info':
          path = '/dashboard/vendor-data-info';
          break;
        case 'enterprise-knowledge':
          path = '/dashboard/enterprise-knowledge';
          break;
        case 'industry-knowledge':
          path = '/dashboard/industry-knowledge';
          break;
        case 'policy-knowledge':
          path = '/dashboard/policy-knowledge';
          break;
        case 'settings':
          path = '/dashboard/settings';
          break;
        default:
          path = '/dashboard';
      }

      navigate(path);
      return;
    }
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
      key: "vendor",
      icon: <TruckOutlined />,
      label: '供应商管理',
      children: [
        {
          key: 'dashboard:vendor-information',
          label: '供应商信息管理',
        },
        {
          key: 'dashboard:vendor-purchase-goods',
          label: '采购商品管理',
        },
        {
          key: 'dashboard:vendor-data-info',
          label: '供应商数据',
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
      onClick: () => navigate('/dashboard/settings'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '账号设置',
      onClick: () => navigate('/dashboard/settings'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

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
          defaultOpenKeys={['workbench', 'knowledge', 'vendor']}
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
                {user && <span>{user.email}</span>}
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
          {location.pathname === "/dashboard" ? (
            // 如果是根路径，直接渲染Overview组件内容
            <Navigate to="/dashboard/overview" replace />
          ) : (
            <Outlet />
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