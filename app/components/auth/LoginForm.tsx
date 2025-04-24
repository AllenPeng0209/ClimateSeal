import React, { useState } from "react";
import { Alert, Button, Form, Input, Divider, Typography } from "antd";
import { useNavigate, useLocation } from "@remix-run/react";
import { GoogleOutlined } from "@ant-design/icons";
import { useAuth } from "./AuthProvider";
import { supabase } from "../../lib/supabase";
import "../../styles/auth/login-form.css";

// 错误消息映射
const ERROR_MESSAGES: { [key: string]: string } = {
  "Invalid login credentials": "邮箱或密码错误",
  "Email not confirmed": "邮箱未验证，请检查邮箱完成验证",
  "Invalid email or password": "邮箱或密码错误",
};

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, authState } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      setError(null);
      await login(values);
      // 登录成功，获取重定向路径
      const from = location.state?.from || "/dashboard";
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMessage = err.message && ERROR_MESSAGES[err.message]
        ? ERROR_MESSAGES[err.message]
        : err.message || "登录失败，请重试";
      setError(errorMessage);
    }
  };

  // 处理Google登录
  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
      
    } catch (err: any) {
      console.error("Google登录错误:", err);
      setError(err.message || "Google登录失败，请重试");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Form
      name="login"
      onFinish={onFinish}
      layout="vertical"
      className="login-form"
    >
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
        name="password"
        label="密码"
        rules={[{ required: true, message: "请输入密码!" }]}
      >
        <Input.Password
          size="large"
          placeholder="请输入密码"
          autoComplete="current-password"
        />
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
          loading={authState?.loading}
          block
          size="large"
        >
          登录
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
          使用Google账号登录
        </Button>
      </Form.Item>

      <Form.Item>
        <Button type="link" onClick={() => navigate("/register")} block>
          还没有账号？立即注册
        </Button>
      </Form.Item>
    </Form>
  );
}; 