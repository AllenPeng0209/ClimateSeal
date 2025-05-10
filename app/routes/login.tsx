import { LoginForm } from "../components/auth/LoginForm";
import { Typography } from "antd";
import { AuthProvider } from "../contexts/AuthContext";

const { Title, Paragraph } = Typography;

// 簡化版的登錄頁面
export default function Login() {
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
        <div style={{ width: "100%", maxWidth: 400 }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <img
              src="/images/logo.png"
              alt="Climate Seal Logo"
              style={{ height: "60px" }}
            />
          </div>
          
          <AuthProvider>
            <LoginForm />
          </AuthProvider>
        </div>
      </div>

      {/* 右侧品牌信息区域 - 使用视频背景 */}
      <div
        style={{
          flex: 1,
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#001529",
          color: "white",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(rgba(0, 21, 41, 0.8), rgba(0, 21, 41, 0.8))",
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 2,
            textAlign: "center",
            padding: "40px",
          }}
        >
          <Title level={2} style={{ color: 'white', marginBottom: '30px' }}>
            行动起来！留给下一代更好的地球 
          </Title>
        </div>
      </div>
    </div>
  );
} 