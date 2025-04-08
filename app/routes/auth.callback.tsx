import { useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { supabase } from '~/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('开始监听认证状态变化...');
    
    // 获取当前会话状态
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('获取会话状态失败:', error.message);
      } else {
        console.log('当前会话状态:', session ? '已登录' : '未登录');
        if (session) {
          console.log('用户信息:', session.user);
        }
      }
    });

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('认证状态变化:', {
        event,
        userId: session?.user?.id,
        email: session?.user?.email,
      });

      if (event === 'SIGNED_IN') {
        console.log('用户已登录，准备跳转到仪表板...');
        navigate('/dashboard');
      } else if (event === 'SIGNED_OUT') {
        console.log('用户已登出，准备跳转到登录页面...');
        navigate('/login');
      }
    });

    // 清理订阅
    return () => {
      console.log('清理认证状态监听...');
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">正在处理认证...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  );
} 