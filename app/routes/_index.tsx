import { redirect } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { json, type MetaFunction } from '@remix-run/cloudflare';

export const meta: MetaFunction = () => {
  return [
    { title: 'Bolt' }, 
    { name: 'description', content: 'Talk with Bolt, an AI assistant from StackBlitz' }
  ];
};

export const loader: LoaderFunction = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 如果是工作流相关的路径，重定向到工作流页面
    if (pathname === '/workflow') {
      return redirect("/workflow/new");
    }

    // 重定向到 landing 页面
    return redirect("/landing");
  } catch (error) {
    console.error("重定向时发生错误:", error);
    return json(
      { error: "页面加载失败" },
      { status: 500 }
    );
  }
};

/**
 * Landing page component for Bolt
 * Note: Settings functionality should ONLY be accessed through the sidebar menu.
 * Do not add settings button/panel to this landing page as it was intentionally removed
 * to keep the UI clean and consistent with the design system.
 */
export default function Index() {
  return null;
}
