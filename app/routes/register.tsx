import type { MetaFunction } from "@remix-run/node";
import { Typography } from "antd";
import { RegisterForm } from "../components/auth/RegisterForm";
import { AuthProvider } from "../contexts/AuthContext";

const { Title, Paragraph } = Typography;

export const meta: MetaFunction = () => {
  return [
    { title: "注册 - Climate Seal" },
    { name: "description", content: "注册Climate Seal账号，开始使用碳足迹管理平台。" },
  ];
};

export default function RegisterPage() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      {/* 左侧表单区域 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px",
          background: "#ffffff",
        }}
      >
        <div style={{ width: "100%", maxWidth: 500 }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <img
              src="/images/logo.png"
              alt="Climate Seal Logo"
              style={{ height: "60px" }}
            />
          </div>
          
          <AuthProvider>
            <RegisterForm />
          </AuthProvider>
        </div>
      </div>

      {/* 右侧品牌信息区域 - 使用视频背景 */}
      <div
        style={{
          flex: 2,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          backgroundColor: 'rgba(0,0,0,0.7)',
        }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        >
          <source src="/images/2711134-uhd_3840_2160_24fps.mp4" type="video/mp4" />
        </video>
        
        {/* 注册页特定内容 */}
        <div style={{
          position: 'relative', 
          zIndex: 1, 
          color: 'white',
          textAlign: 'center',
          padding: '40px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderRadius: '8px',
          maxWidth: '80%'
        }}>
          <Title level={2} style={{ color: 'white', marginBottom: '20px' }}>
            为什么加入Climate Seal?
          </Title>
          <Paragraph style={{ fontSize: '16px', lineHeight: '1.8', color: 'white', marginBottom: '20px' }}>
            ✓ 全面的碳足迹数据分析和管理工具
          </Paragraph>
          <Paragraph style={{ fontSize: '16px', lineHeight: '1.8', color: 'white', marginBottom: '20px' }}>
            ✓ 符合国际标准的碳足迹计算方法
          </Paragraph>
          <Paragraph style={{ fontSize: '16px', lineHeight: '1.8', color: 'white', marginBottom: '20px' }}>
            ✓ AI辅助的碳减排策略建议
          </Paragraph>
          <Paragraph style={{ fontSize: '16px', lineHeight: '1.8', color: 'white', marginBottom: '20px' }}>
            ✓ 专业的碳管理咨询服务
          </Paragraph>
          <Paragraph style={{ fontSize: '16px', lineHeight: '1.8', color: 'white' }}>
            ✓ 多样化的可持续发展解决方案
          </Paragraph>
          <Title level={3} style={{ color: 'white', marginTop: '30px' }}>
            注册即可获得14天免费试用！
          </Title>
        </div>
      </div>
    </div>
  );
} 