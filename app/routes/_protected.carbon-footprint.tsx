import { Outlet } from "@remix-run/react";
import { Layout } from "antd";
import "~/styles/workbench.css";

const { Content } = Layout;

export default function CarbonFootprint() {
  return (
    <Content className="carbon-footprint-container">
      <Outlet />
    </Content>
  );
} 