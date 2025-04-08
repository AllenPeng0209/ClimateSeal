import React from 'react';
import { Navigate, useLocation } from '@remix-run/react';
import { useAuthContext } from '../../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, loading } = useAuthContext();
  const location = useLocation();

  if (loading) {
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

  if (!user) {
    // 保存用户尝试访问的路径
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirectTo', location.pathname);
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}; 