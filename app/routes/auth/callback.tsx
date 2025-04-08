import type { MetaFunction } from "@remix-run/node";
import { useNavigate, useLocation } from "@remix-run/react";
import { Spin, Result, Button } from "antd";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export const meta: MetaFunction = () => {
  return [
    { title: "登录验证中 - Climate Seal" },
    { name: "description", content: "处理外部认证登录，请稍候..." },
  ];
};

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // SSR检查
    if (typeof window === "undefined") return;

    const handleAuthCallback = async () => {
      try {
        setStatus("loading");
        console.log("处理Auth回调...");

        // 处理URL中的hash片段
        if (location.hash) {
          console.log("找到hash参数", location.hash);
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            console.error("获取会话失败", error);
            setStatus("error");
            setErrorMessage("认证过程中出错: " + error.message);
            return;
          }

          if (data.session) {
            console.log("认证成功，获取到会话");
            
            // 保存token
            if (data.session.access_token && typeof localStorage !== 'undefined') {
              localStorage.setItem("auth_token", data.session.access_token);
              console.log("已保存token");
            }

            // 延迟一下，确保token已保存
            setTimeout(() => {
              setStatus("success");
              // 从state或本地存储获取重定向URL
              const redirectTo = typeof sessionStorage !== 'undefined' ? 
                sessionStorage.getItem("redirectTo") || "/dashboard" : "/dashboard";
              
              if (typeof sessionStorage !== 'undefined') {
                sessionStorage.removeItem("redirectTo"); // 清除stored path
              }
              
              navigate(redirectTo, { replace: true });
            }, 1000);
          } else {
            console.error("没有获取到会话");
            setStatus("error");
            setErrorMessage("登录成功但未获取到会话信息");
          }
        } else {
          console.log("未找到hash参数");
          setStatus("error");
          setErrorMessage("未找到必要的认证参数");
        }
      } catch (err) {
        console.error("处理Auth回调时发生错误", err);
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "处理认证过程中发生未知错误"
        );
      }
    };

    handleAuthCallback();
  }, [location, navigate]);

  if (status === "loading") {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "#f0f2f5"
      }}>
        <Spin size="large" />
        <div style={{ marginTop: 24, color: "#666" }}>
          正在处理认证，请稍候...
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <Result
        status="error"
        title="认证失败"
        subTitle={errorMessage || "处理您的登录请求时发生错误"}
        extra={[
          <Button 
            type="primary" 
            key="login" 
            onClick={() => navigate("/login")}
          >
            返回登录
          </Button>,
        ]}
      />
    );
  }

  // 成功状态 (实际上应该会导航走，不会看到这个)
  return (
    <Result
      status="success"
      title="认证成功"
      subTitle="您已成功登录，正在跳转..."
    />
  );
} 