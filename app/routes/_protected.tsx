import { Outlet } from "@remix-run/react";
import { PrivateRoute } from "~/components/auth/PrivateRoute";
import DashboardLayout from "~/components/dashboard/DashboardLayout";
import { 
  AppstoreOutlined,
  CheckSquareOutlined,
  CloudOutlined,
  ShopOutlined,
  RobotOutlined,
  TeamOutlined,
  DownloadOutlined,
  HistoryOutlined
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Menu } from "antd";
import { useNavigate } from "@remix-run/react";

const menuItems = [
  {
    key: '/dashboard',
    icon: <AppstoreOutlined />,
    label: '工作台',
  },
  {
    key: '/tasks',
    icon: <CheckSquareOutlined />,
    label: '任务管理',
  },
  {
    key: 'carbon-footprint',
    icon: <CloudOutlined />,
    label: '产品碳足迹',
    children: [
      {
        key: '/carbon-footprint/products',
        label: '产品管理',
      },
      {
        key: '/carbon-footprint/ai-modeling',
        label: 'AI建模核算',
      },
      {
        key: '/carbon-footprint/results',
        label: '碳足迹结果生成',
      },
    ],
  },
  {
    key: '/suppliers',
    icon: <ShopOutlined />,
    label: '供应商管理',
  },
  {
    key: '/ai-knowledge',
    icon: <RobotOutlined />,
    label: 'AI知识库',
  },
  {
    key: '/organization',
    icon: <TeamOutlined />,
    label: '组织管理',
  },
  {
    key: '/downloads',
    icon: <DownloadOutlined />,
    label: '下载管理',
  },
  {
    key: '/logs',
    icon: <HistoryOutlined />,
    label: '操作日志',
  },
];

export default function ProtectedLayout() {
  const navigate = useNavigate();

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    navigate(key);
  };

  return (
    <PrivateRoute>
      <DashboardLayout menuItems={menuItems} onMenuClick={handleMenuClick}>
        <Outlet />
      </DashboardLayout>
    </PrivateRoute>
  );
} 