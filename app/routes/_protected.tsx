import { Outlet } from "@remix-run/react";
import { PrivateRoute } from "../components/auth/PrivateRoute";

export default function ProtectedLayout() {
  return (
    <PrivateRoute>
      <Outlet />
    </PrivateRoute>
  );
} 