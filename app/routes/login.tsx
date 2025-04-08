import { LoginForm } from "../components/auth/LoginForm";
import { Typography } from "antd";

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
          
          <LoginForm />
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
        
        {/* 核心理念内容 */}
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
            Climate Seal 核心理念
          </Title>
          <Paragraph style={{ fontSize: '16px', lineHeight: '1.8', color: 'white', marginBottom: '20px' }}>
            我们致力于通过创新科技赋能企业碳管理，提供端到端的产品碳足迹解决方案，帮助企业实现可持续发展目标。
          </Paragraph>
          <Paragraph style={{ fontSize: '16px', lineHeight: '1.8', color: 'white', marginBottom: '20px' }}>
            通过AI驱动的智能分析，我们简化了复杂的碳足迹计算流程，让企业能够轻松获取准确的碳排放数据，识别减排机会，制定有效的环保战略。
          </Paragraph>
          <Paragraph style={{ fontSize: '16px', lineHeight: '1.8', color: 'white' }}>
            加入Climate Seal，共同打造绿色未来，实现环境与经济的双赢。
          </Paragraph>
          <Title level={2} style={{ color: 'white', marginBottom: '30px' }}>
            行动起来！留给下一代更好的地球 
          </Title>
        </div>
      </div>
    </div>
  );
} 