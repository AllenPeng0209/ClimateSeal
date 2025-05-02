import { createCookieSessionStorage } from '@remix-run/node';
import { supabase } from './supabase';

// Create a session storage
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'session',
    secure: process.env.NODE_ENV === 'production',
    secrets: [process.env.SESSION_SECRET || 'default-secret'],
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
  },
});

export async function getSession(request: Request) {
  const cookieHeader = request.headers.get('Cookie');
  console.log('Session: Cookie header:', cookieHeader);
  
  // 尝试从 cookie 中获取 Supabase token
  const cookies = cookieHeader?.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name.startsWith('sb-') && name.endsWith('-auth-token')) {
      try {
        const tokenData = JSON.parse(decodeURIComponent(value));
        if (tokenData[0]) {
          const token = tokenData[0];
          acc.access_token = token;
        }
      } catch (e) {
        console.error('Failed to parse Supabase token:', e);
      }
    }
    return acc;
  }, {} as { access_token?: string });

  console.log('Session: Parsed Supabase token:', cookies?.access_token);

  // 如果找到了 Supabase token，创建一个包含它的 session
  if (cookies?.access_token) {
    const session = await sessionStorage.getSession();
    session.set('access_token', cookies.access_token);
    return session;
  }

  // 否则尝试从 cookie 中获取 session
  const session = await sessionStorage.getSession(cookieHeader);
  console.log('Session: Session data:', session.data);
  return session;
}

export async function createUserSession(
  request: Request,
  userId: string,
  accessToken: string,
  refreshToken: string
) {
  const session = await getSession(request);
  session.set('userId', userId);
  session.set('access_token', accessToken);
  session.set('refresh_token', refreshToken);
  const cookie = await sessionStorage.commitSession(session);
  console.log('Session: Created new session with cookie:', cookie);
  return cookie;
}

export async function destroyUserSession(request: Request) {
  const session = await getSession(request);
  return sessionStorage.destroySession(session);
} 