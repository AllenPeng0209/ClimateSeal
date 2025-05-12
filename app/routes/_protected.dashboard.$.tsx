import { Link } from "@remix-run/react";

export default function DashboardNotFound() {
    return (
        <div className="text-center py-12">
            <h2 className="text-xl font-bold mb-4">页面开发中</h2>
            <p>您请求的功能页面正在开发中，请稍后再试。</p>
            <Link
                to="/dashboard"
                className="inline-block mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                返回仪表盘
            </Link>
        </div>
    );
} 