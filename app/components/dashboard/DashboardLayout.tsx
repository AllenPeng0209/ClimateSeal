import React, { useState } from 'react';
import { Layout, Menu, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { Link, Outlet, useLocation, useNavigate } from '@remix-run/react';
import {
  DashboardOutlined,
  CloudOutlined,
  BookOutlined,
  TeamOutlined,
  DownloadOutlined,
  FileSearchOutlined,
  AppstoreOutlined,
  HistoryOutlined,
  ShopOutlined,
  RobotOutlined,
  FileTextOutlined,
  SettingOutlined,
  CheckSquareOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import './DashboardLayout.css';

const { Header, Sider, Content } = Layout;

interface DashboardLayoutProps {
  children: React.ReactNode;
  menuItems: MenuProps['items'];
  onMenuClick: MenuProps['onClick'];
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  menuItems,
  onMenuClick 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // 用户下拉菜单项
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'account',
      icon: <SettingOutlined />,
      label: '账户管理',
      onClick: () => navigate('/account'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        // 这里添加登出逻辑
        navigate('/landing');
      },
    },
  ];

  return (
    <Layout className="dashboard-layout">
      <Header className="dashboard-header">
        <div className="logo">碳足迹管理系统</div>
        <div className="header-right">
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="user-info">
              <UserOutlined style={{ marginRight: 8 }} />
              管理员
            </div>
          </Dropdown>
        </div>
      </Header>
      <Layout>
        <Sider 
          width={220} 
          className="dashboard-sider"
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            defaultOpenKeys={['carbon-footprint']}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            onClick={onMenuClick}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content className="dashboard-content">
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout; 