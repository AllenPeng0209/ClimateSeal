import { Outlet } from "@remix-run/react";
import { Layout } from "antd";
import "~/styles/tasks.css";

const { Content } = Layout;

export default function TasksLayout() {
  return (
    <Content className="tasks-container">
      <Outlet />
    </Content>
  );
} 