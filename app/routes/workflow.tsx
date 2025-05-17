import { Outlet } from '@remix-run/react';

export default function WorkflowLayout() {
  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <Outlet />
    </div>
  );
} 