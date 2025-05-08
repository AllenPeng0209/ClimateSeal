import { createClient } from '@supabase/supabase-js';

// 备用的硬编码值
const HARDCODED_SUPABASE_URL = 'https://xkcdlulngazdosqvwnsc.supabase.co';
const HARDCODED_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrY2RsdWxuZ2F6ZG9zcXZ3bnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMzQ5MzUsImV4cCI6MjA1ODkxMDkzNX0.9gyLSGLhLYxUZWcbUQe6CwEXx5Lpbyqzzpw8ygWvQ0Q';

let supabaseUrl: string | undefined;
let supabaseAnonKey: string | undefined;

// 尝试从环境变量获取 (适用于不同环境)
if (typeof process !== 'undefined' && process.env) { // 服务器端 Node.js 环境
  supabaseUrl = process.env.VITE_SUPABASE_URL;
  supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
} else if (typeof import.meta !== 'undefined' && import.meta.env) { // 客户端 Vite 环境
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
}

// 如果环境变量中没有找到，则使用硬编码的备用值
if (!supabaseUrl) {
  console.warn('Supabase URL not found in environment variables, using hardcoded fallback.');
  supabaseUrl = HARDCODED_SUPABASE_URL;
}

if (!supabaseAnonKey) {
  console.warn('Supabase Anon Key not found in environment variables, using hardcoded fallback.');
  supabaseAnonKey = HARDCODED_SUPABASE_ANON_KEY;
}

// 最终验证，确保我们有值可用
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is still missing after checking environment and hardcoded fallbacks.');
}

// 创建并导出 Supabase 客户端
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