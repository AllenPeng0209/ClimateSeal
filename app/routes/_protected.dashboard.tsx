import { type MetaFunction } from "@remix-run/node";
import { Navigate, Outlet, useLocation, useNavigate, Link } from "@remix-run/react";
import { useState, useEffect } from "react";
import { Layout, Menu, Button, Typography, Space, Dropdown, Avatar } from "antd";
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

  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    // TODO: Implement logout logic
    console.log("Logging out");
  };

  const menuItems = [
    {
      key: 'dashboard:dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard/overview">仪表盘</Link>,
    },
    {
      key: 'workbench',
      icon: <ToolOutlined />,
      label: '工作台',
      children: [
        {
          key: 'dashboard:workbench-main',
          label: <Link to="/dashboard/workbench">产品碳足迹管理</Link>,
        },
        {
          key: 'dashboard:vendor-data',
          label: <Link to="/dashboard/vendor-data">供应商数据收集</Link>,
        },
        {
          key: 'dashboard:carbon-factor-search',
          label: <Link to="/dashboard/carbon-factor-search">碳排因子搜索</Link>,
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
          label: <Link to="/dashboard/vendor-information">供应商信息管理</Link>,
        },
        {
          key: 'dashboard:vendor-purchase-goods',
          label: <Link to="/dashboard/vendor-purchase-goods">采购商品管理</Link>,
        },
        {
          key: 'dashboard:vendor-data-info',
          label: <Link to="/dashboard/vendor-data-info">供应商数据</Link>,
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
          label: <Link to="/dashboard/enterprise-knowledge">企业知识库</Link>,
        },
        {
          key: 'dashboard:industry-knowledge',
          label: <Link to="/dashboard/industry-knowledge">行业知识库</Link>,
        },
        {
          key: 'dashboard:policy-knowledge',
          label: <Link to="/dashboard/policy-knowledge">政策法规库</Link>,
        }
      ]
    },
    {
      key: 'dashboard:settings',
      icon: <SettingOutlined />,
      label: <Link to="/dashboard/settings">设置</Link>,
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to="/dashboard/settings">个人资料</Link>,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: <Link to="/dashboard/settings">账号设置</Link>,
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

    </Layout>
  );
}