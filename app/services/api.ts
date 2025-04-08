/**
 * API客戶端服務
 * 用於與FastAPI後端通信
 */

import { supabase } from '../lib/supabase';

// 獲取API基礎URL
const API_BASE_URL = typeof window !== 'undefined' 
  ? import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
  : process.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// 定义 API 响应类型
interface ApiError {
  detail: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

/**
 * 發送請求到API
 */
async function fetchApi(endpoint: string, options: RequestInit = {}) {
  try {
    // 添加認證令牌（如果存在）
    const token = typeof localStorage !== 'undefined' 
      ? localStorage.getItem('auth_token') 
      : null;
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`API Request to: ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // 檢查響應狀態
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as ApiError;
      throw new Error(errorData.detail || `API請求失敗: ${response.status}`);
    }

    // 檢查是否需要解析JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error('API請求錯誤:', error);
    throw error;
  }
}

/**
 * 認證相關的API方法
 */
export const authApi = {
  /**
   * 用戶登錄
   */
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    // 获取用户信息
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      throw new Error(userError.message);
    }

    return {
      access_token: data.session?.access_token,
      token_type: 'bearer',
      user: {
        id: user?.id,
        email: user?.email,
        name: user?.user_metadata?.full_name || user?.email?.split('@')[0],
        company: user?.user_metadata?.company,
      }
    };
  },

  /**
   * 用戶註冊
   */
  async register(fullName: string, email: string, password: string, company?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * 用戶登出
   */
  async logout() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return { success: true };
  },

  /**
   * 獲取當前用戶信息
   */
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return user;
  },

  /**
   * 驗證令牌是否有效
   */
  async validateToken() {
    try {
      const user = await this.getCurrentUser();
      return { valid: true, user };
    } catch (error) {
      return { valid: false, user: null };
    }
  },

  /**
   * Google 登錄
   */
  async loginWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
};

/**
 * 通用API方法
 */
export const api = {
  get: async (endpoint: string) => {
    const { data, error } = await supabase.from(endpoint).select();
    if (error) throw new Error(error.message);
    return data;
  },
  post: async (endpoint: string, data: any) => {
    const { data: response, error } = await supabase.from(endpoint).insert(data);
    if (error) throw new Error(error.message);
    return response;
  },
  put: async (endpoint: string, data: any) => {
    const { data: response, error } = await supabase.from(endpoint).update(data);
    if (error) throw new Error(error.message);
    return response;
  },
  delete: async (endpoint: string) => {
    const { error } = await supabase.from(endpoint).delete();
    if (error) throw new Error(error.message);
  },
  auth: authApi,
}; 