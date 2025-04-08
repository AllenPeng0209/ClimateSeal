import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import PolicyKnowledgeSection from "~/components/dashboard/sections/PolicyKnowledgeSection";
import "~/components/dashboard/sections/PolicyKnowledgeSection.css";

export const loader = async () => {
  // 这里可以添加数据获取逻辑
  return json({});
};

export default function KnowledgePage() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="dashboard-layout">
      <PolicyKnowledgeSection />
    </div>
  );
} 