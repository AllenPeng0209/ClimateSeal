import React from 'react';
import { Navigate, useLocation } from '@remix-run/react';
import { useAuth } from './AuthProvider';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { authState } = useAuth();
  const location = useLocation();

  if (authState.loading) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <div>加载中...</div>
      </div>
    );
  }

  if (!authState.user) {
    // 保存用户尝试访问的路径
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirectTo', location.pathname);
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}; 