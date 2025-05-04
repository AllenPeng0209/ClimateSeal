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
});

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