import { redirect } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { json, type MetaFunction } from '@remix-run/cloudflare';

export const meta: MetaFunction = () => {
  return [
    { title: 'Bolt' }, 
    { name: 'description', content: 'Talk with Bolt, an AI assistant from StackBlitz' }
  ];
};

export const loader: LoaderFunction = async () => {
  try {
    // 重定向到 landing 頁面
    return redirect("/landing");
  } catch (error) {
    console.error("重定向到 landing 頁面時發生錯誤:", error);
    // 如果重定向失敗，返回一個錯誤響應
    return json(
      { error: "頁面加載失敗" },
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
