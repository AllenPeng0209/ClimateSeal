import { createClient } from '@supabase/supabase-js';

// 获取Supabase配置
// 在Remix+Vite项目中，環境變量的獲取优先顺序：
// 1. import.meta.env.VITE_* (客户端)
// 2. process.env (服务端)
const supabaseUrl = typeof window !== 'undefined'
  ? import.meta.env.VITE_SUPABASE_URL
  : process.env.VITE_SUPABASE_URL;

const supabaseAnonKey = typeof window !== 'undefined'
  ? import.meta.env.VITE_SUPABASE_ANON_KEY
  : process.env.VITE_SUPABASE_ANON_KEY;

// 验证配置
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token',
  },
  global: {
    // 减少超时，加速失败检测
    fetch: (url, options) => {
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), 8000); // 8秒超时

      return fetch(url, {
        ...options,
        signal: timeoutController.signal,
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    },
    headers: {
      'X-Client-Info': 'ClimateSeal'
    }
  }
});

// 添加缓存层，避免重复请求
const cacheMap = new Map();

// 创建带缓存的查询辅助函数
export const supabaseCache = {
  // 获取用户信息并缓存
  async getUser() {
    if (cacheMap.has('currentUser')) {
      return cacheMap.get('currentUser');
    }
    
    const result = await supabase.auth.getUser();
    
    if (result.data.user) {
      cacheMap.set('currentUser', result);
      // 缓存5分钟
      setTimeout(() => cacheMap.delete('currentUser'), 5 * 60 * 1000);
    }
    
    return result;
  },
  
  // 清除缓存
  clearCache() {
    cacheMap.clear();
  }
}

// Storage 策略配置
export const storageConfig = {
  bucket: 'files',
  policies: {
    // 允许认证用户上传文件
    upload: {
      name: 'Allow authenticated users to upload files',
      policy: `(auth.role() = 'authenticated')`,
    },
    // 允许文件所有者访问自己的文件
    access: {
      name: 'Allow file owners to access their files',
      policy: `(auth.uid() = owner_id)`,
    },
    // 允许文件所有者删除自己的文件
    delete: {
      name: 'Allow file owners to delete their files',
      policy: `(auth.uid() = owner_id)`,
    },
  },
}; 