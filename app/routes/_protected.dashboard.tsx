import type { MetaFunction } from "@remix-run/node";
import { Button, Typography, Card, Row, Col, Statistic } from "antd";
import { useNavigate } from "@remix-run/react";
import { useAuthContext } from "../contexts/AuthContext";
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <Title level={2}>
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

      <Paragraph>
        这是一个受保护的路由，只有登录后才能访问。以下是您的碳足迹管理概览。
      </Paragraph>

      <Row gutter={[16, 16]} style={{ marginTop: "24px" }}>
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

      <Card style={{ marginTop: "24px" }}>
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
    </div>
  );
} 