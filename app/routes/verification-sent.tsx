import type { MetaFunction } from "@remix-run/node";
import { useLocation, useNavigate } from "@remix-run/react";
import { Result, Button, Typography } from "antd";
import { MailOutlined } from "@ant-design/icons";

const { Paragraph } = Typography;

export const meta: MetaFunction = () => {
  return [
    { title: "验证邮件已发送 - Climate Seal" },
    { name: "description", content: "验证邮件已发送到您的邮箱，请查收并完成验证。" },
  ];
};

export default function VerificationSentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "您的邮箱";

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      background: "#f0f2f5",
      padding: "20px"
    }}>
      <Result
        icon={<MailOutlined style={{ color: "#52c41a" }} />}
        title="验证邮件已发送"
        subTitle={`我们已向 ${email} 发送了一封验证邮件，请查收并点击邮件中的链接完成注册。`}
        extra={[
          <Paragraph key="tip" style={{ textAlign: "center", maxWidth: "500px", margin: "0 auto 24px" }}>
            如果您没有收到邮件，请检查您的垃圾邮件文件夹，或尝试重新注册。
            验证邮件有效期为24小时。
          </Paragraph>,
          <Button type="primary" key="login" onClick={() => navigate("/login")}>
            返回登录页
          </Button>,
        ]}
      />
    </div>
  );
} 