import React, { useState } from "react";
import { Alert, Button, Form, Input, Divider, Typography, Checkbox } from "antd";
import { useNavigate } from "@remix-run/react";
import { GoogleOutlined } from "@ant-design/icons";
import { useAuthContext } from "../../contexts/AuthContext";

// 错误消息映射
const ERROR_MESSAGES: { [key: string]: string } = {
  "User already registered": "该邮箱已注册，请直接登录",
  "Signup disabled": "注册功能暂时关闭，请联系管理员",
  "Email already in use": "该邮箱已被使用，请更换邮箱或直接登录",
};

interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  company?: string;
  agreement: boolean;
}

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async (values: RegisterFormData) => {
    try {
      if (!values.agreement) {
        setError("必须同意服务条款和隐私政策才能注册");
        return;
      }

      setLoading(true);
      setError(null);

      const result = await register(
        values.fullName,
        values.email,
        values.password,
        values.company
      );

      if (!result.success) {
        throw new Error(result.error || "注册失败");
      }

      // 注册成功，跳转到提示页面
      navigate("/verification-sent", { 
        state: { email: values.email } 
      });
    } catch (err: any) {
      console.error("Register error:", err);
      
      // 翻译错误消息
      const errorMessage = err.message && ERROR_MESSAGES[err.message]
        ? ERROR_MESSAGES[err.message]
        : err.message || "注册失败，请重试";
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 跳转到登录页面
  const handleLogin = () => {
    navigate("/login");
  };

  // 处理Google登录
  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError(null);
      await loginWithGoogle();
      // GoogleOAuth将处理重定向
    } catch (err: any) {
      console.error("Google登录错误:", err);
      setError(err.message || "Google登录失败，请重试");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Form
      name="register"
      initialValues={{ agreement: false }}
      onFinish={onFinish}
      layout="vertical"
      className="login-form" // 复用同样的样式
    >
      <Form.Item
        name="fullName"
        label="姓名"
        rules={[
          { required: true, message: "请输入姓名!" },
          { min: 2, message: "姓名至少2个字符!" },
        ]}
      >
        <Input
          size="large"
          placeholder="请输入姓名"
          autoComplete="name"
        />
      </Form.Item>

      <Form.Item
        name="email"
        label="邮箱"
        rules={[
          { required: true, message: "请输入邮箱!" },
          { type: "email", message: "请输入有效的邮箱地址!" },
        ]}
      >
        <Input
          size="large"
          placeholder="请输入邮箱"
          autoComplete="email"
        />
      </Form.Item>

      <Form.Item
        name="company"
        label="公司/组织（选填）"
      >
        <Input
          size="large"
          placeholder="请输入您的公司或组织名称"
          autoComplete="organization"
        />
      </Form.Item>

      <Form.Item
        name="password"
        label="密码"
        rules={[
          { required: true, message: "请输入密码!" },
          { min: 6, message: "密码至少6个字符!" },
        ]}
        hasFeedback
      >
        <Input.Password
          size="large"
          placeholder="请输入密码"
          autoComplete="new-password"
        />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        label="确认密码"
        dependencies={['password']}
        hasFeedback
        rules={[
          { required: true, message: "请确认密码!" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('两次输入的密码不一致!'));
            },
          }),
        ]}
      >
        <Input.Password
          size="large"
          placeholder="请再次输入密码"
          autoComplete="new-password"
        />
      </Form.Item>

      <Form.Item
        name="agreement"
        valuePropName="checked"
        rules={[
          {
            validator: (_, value) =>
              value
                ? Promise.resolve()
                : Promise.reject(new Error('请阅读并同意服务条款和隐私政策')),
          },
        ]}
      >
        <Checkbox>
          我已阅读并同意 <a href="/terms">服务条款</a> 和 <a href="/privacy">隐私政策</a>
        </Checkbox>
      </Form.Item>

      {error && (
        <Form.Item>
          <Alert message={error} type="error" showIcon />
        </Form.Item>
      )}

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          size="large"
        >
          注册
        </Button>
      </Form.Item>

      <Divider plain>
        <Typography.Text type="secondary">或</Typography.Text>
      </Divider>

      <Form.Item>
        <Button 
          icon={<GoogleOutlined />}
          onClick={handleGoogleLogin}
          loading={googleLoading}
          block
          size="large"
          className="google-login-button"
        >
          使用Google账号注册/登录
        </Button>
      </Form.Item>

      <Form.Item>
        <Button type="link" onClick={handleLogin} block>
          已有账号？立即登录
        </Button>
      </Form.Item>
    </Form>
  );
}; 