import React from 'react';
import { Layout, Menu } from 'antd';
import { Link, Outlet, useLocation } from '@remix-run/react';
import {
  DashboardOutlined,
  CloudOutlined,
  BookOutlined,
  FileTextOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import './DashboardLayout.css';

const { Header, Sider, Content } = Layout;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">仪表板</Link>,
    },
    {
      key: '/dashboard/emission',
      icon: <CloudOutlined />,
      label: <Link to="/dashboard/emission">碳排放管理</Link>,
    },
    {
      key: '/dashboard/industry',
      icon: <BookOutlined />,
      label: <Link to="/dashboard/industry">行业知识库</Link>,
    },
    {
      key: '/dashboard/policy',
      icon: <FileTextOutlined />,
      label: <Link to="/dashboard/policy">政策知识库</Link>,
    },
    {
      key: '/dashboard/carbon-factor',
      icon: <SearchOutlined />,
      label: <Link to="/dashboard/carbon-factor">碳因子查询</Link>,
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
        <Sider width={200} className="dashboard-sider">
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
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