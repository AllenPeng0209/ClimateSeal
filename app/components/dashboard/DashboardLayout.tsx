import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { Link, Outlet, useLocation } from '@remix-run/react';
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
} from '@ant-design/icons';
import './DashboardLayout.css';

const { Header, Sider, Content } = Layout;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">工作台</Link>,
    },
    {
      key: '/dashboard/tasks',
      icon: <CheckSquareOutlined />,
      label: <Link to="/dashboard/tasks">任务管理</Link>,
    },
    {
      key: 'carbon-footprint',
      icon: <CloudOutlined />,
      label: '产品碳足迹',
      children: [
        {
          key: '/dashboard/products',
          label: <Link to="/dashboard/products">产品管理</Link>,
        },
        {
          key: '/dashboard/ai-modeling',
          label: <Link to="/dashboard/ai-modeling">AI建模核算</Link>,
        },
        {
          key: '/dashboard/carbon-results',
          label: <Link to="/dashboard/carbon-results">碳足迹结果生成</Link>,
        },
      ],
    },
    {
      key: '/dashboard/suppliers',
      icon: <ShopOutlined />,
      label: <Link to="/dashboard/suppliers">供应商管理</Link>,
    },
    {
      key: '/dashboard/ai-knowledge',
      icon: <RobotOutlined />,
      label: <Link to="/dashboard/ai-knowledge">AI知识库</Link>,
    },
    {
      key: '/dashboard/organization',
      icon: <TeamOutlined />,
      label: <Link to="/dashboard/organization">组织管理</Link>,
    },
    {
      key: '/dashboard/downloads',
      icon: <DownloadOutlined />,
      label: <Link to="/dashboard/downloads">下载管理</Link>,
    },
    {
      key: '/dashboard/logs',
      icon: <HistoryOutlined />,
      label: <Link to="/dashboard/logs">操作日志</Link>,
    },
  ];

  return (
    <Layout className="dashboard-layout">
      <Header className="dashboard-header">
        <div className="logo">碳足迹管理系统</div>
        <div className="header-right">
          <span className="user-info">管理员</span>
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