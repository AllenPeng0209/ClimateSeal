import { useState, useEffect } from 'react';
import { api } from '../services/api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  company?: string;
  role?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = async () => {
    try {
      console.log('开始验证用户状态...');
      const result = await api.auth.validateToken();
      console.log('验证结果:', result);
      
      if (result.valid && result.user) {
        setUser(result.user);
        setError(null);
      } else {
        setUser(null);
        setError('未登录或会话已过期');
      }
    } catch (err: any) {
      console.error('验证用户状态时发生错误:', err);
      setError(err.message || '验证失败');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.auth.login(email, password);
      setUser(result.user);
      return { success: true };
    } catch (err: any) {
      setError(err.message || '登录失败');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName: string, email: string, password: string, company?: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.auth.register(fullName, email, password, company);
      return { success: true, data: result };
    } catch (err: any) {
      setError(err.message || '注册失败');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.auth.logout();
      setUser(null);
      return { success: true };
    } catch (err: any) {
      setError(err.message || '登出失败');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.auth.loginWithGoogle();
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Google登录失败');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    loginWithGoogle,
    checkAuth,
  };
} 