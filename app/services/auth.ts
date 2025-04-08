import { supabase } from "../lib/supabase";

// 定义认证事件类型
type AuthChangeEvent = 
  | 'INITIAL_SESSION'
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'PASSWORD_RECOVERY'
  | 'TOKEN_REFRESHED';

// 定义用户信息接口
interface UserInfo {
  id: string;
  email: string;
  full_name?: string;
  company?: string;
  created_at: string;
  last_sign_in_at: string;
}

// 定义认证状态接口
interface AuthState {
  user: UserInfo | null;
  session: any | null;
  loading: boolean;
  error: Error | null;
}

// 常量定义
const TOKEN_KEY = 'auth_token';
const USER_INFO_KEY = 'user_info';
const TOKEN_REFRESH_INTERVAL = 1000 * 60 * 60; // 1小时

class AuthService {
  private state: AuthState = {
    user: null,
    session: null,
    loading: true,
    error: null
  };

  private refreshInterval: number | null = null;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // 从本地存储恢复用户信息
      const savedUserInfo = localStorage.getItem(USER_INFO_KEY);
      if (savedUserInfo) {
        this.state.user = JSON.parse(savedUserInfo);
      }

      // 获取当前会话
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session) {
        this.state.session = session;
        this.setupSessionRefresh();
      }

      // 监听认证状态变化
      supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: any) => {
        this.handleAuthChange(event, session);
      });

    } catch (error) {
      console.error('Auth initialization error:', error);
      this.state.error = error as Error;
    } finally {
      this.state.loading = false;
    }
  }

  private handleAuthChange(event: AuthChangeEvent, session: any) {
    switch (event) {
      case 'SIGNED_IN':
        this.state.session = session;
        this.state.user = session?.user;
        this.saveUserInfo();
        this.setupSessionRefresh();
        break;
      
      case 'SIGNED_OUT':
        this.state.session = null;
        this.state.user = null;
        this.clearUserInfo();
        this.clearRefreshInterval();
        break;
      
      case 'TOKEN_REFRESHED':
        this.state.session = session;
        break;
      
      case 'USER_UPDATED':
        this.state.user = session?.user;
        this.saveUserInfo();
        break;
    }
  }

  private setupSessionRefresh() {
    this.clearRefreshInterval();
    
    this.refreshInterval = window.setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.refreshSession();
        
        if (error) throw error;
        
        if (session) {
          this.state.session = session;
        }
      } catch (error) {
        console.error('Session refresh error:', error);
        this.handleAuthError(error);
      }
    }, TOKEN_REFRESH_INTERVAL);
  }

  private clearRefreshInterval() {
    if (this.refreshInterval) {
      window.clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  private saveUserInfo() {
    if (this.state.user) {
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(this.state.user));
    }
  }

  private clearUserInfo() {
    localStorage.removeItem(USER_INFO_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }

  private handleAuthError(error: any) {
    console.error('Auth error:', error);
    this.state.error = error;
    
    // 处理特定错误类型
    if (error.message?.includes('JWT expired')) {
      this.logout();
    }
  }

  async login(email: string, password: string) {
    try {
      this.state.loading = true;
      this.state.error = null;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.user || !data.session) {
        throw new Error('登录返回数据不完整');
      }

      this.state.user = data.user;
      this.state.session = data.session;
      this.saveUserInfo();

      return { success: true };
    } catch (error) {
      this.handleAuthError(error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '登录失败' 
      };
    } finally {
      this.state.loading = false;
    }
  }

  async logout() {
    try {
      this.state.loading = true;
      this.state.error = null;

      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      this.clearUserInfo();
      this.clearRefreshInterval();

      return { success: true };
    } catch (error) {
      this.handleAuthError(error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '登出失败' 
      };
    } finally {
      this.state.loading = false;
    }
  }

  getCurrentUser() {
    return this.state.user;
  }

  getSession() {
    return this.state.session;
  }

  isLoading() {
    return this.state.loading;
  }

  getError() {
    return this.state.error;
  }
}

export const authService = new AuthService(); 