import React from 'react';
import { useParams } from '@remix-run/react';
import { Card, Typography } from 'antd';

export default function WorkflowDashboard() {
  const { workflowId } = useParams();

  return (
    <div style={{ padding: 32 }}>
      <Card>
        <Typography.Title level={3}>工作流专属仪表盘</Typography.Title>
        <Typography.Paragraph>
          当前工作流ID：<b>{workflowId}</b>
        </Typography.Paragraph>
        {/* TODO: 在此处集成LCA分析、碳足迹、生命周期、热点、对比等可视化组件 */}
      </Card>
    </div>
  );
} 