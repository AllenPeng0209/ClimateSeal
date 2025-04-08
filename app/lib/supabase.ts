import { createClient } from '@supabase/supabase-js';

// 获取Supabase配置
// 在Remix+Vite项目中，環境變量的獲取优先顺序：
// 1. import.meta.env.VITE_* (客户端)
// 2. process.env (服务端)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 验证配置
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// 调试输出
console.log('Supabase初始化配置 - URL:', supabaseUrl);

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey); 