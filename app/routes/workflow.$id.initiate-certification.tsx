import React from 'react';
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useParams } from '@remix-run/react';
import { Button, Card, List, Typography, Alert, Checkbox } from 'antd';

const { Title, Text } = Typography;

// --- Mock Loader for the confirmation page ---
export async function loader({ params }: LoaderFunctionArgs) {
  const workflowId = params.id; 
  // TODO: Fetch workflow details and standard requirements based on ID
  // For now, return mock data
  const mockWorkflowName = `工作流 ${workflowId?.substring(0, 4)}...`; 
  const mockStandard = 'ISO 14067 (模拟)';
  const mockChecklist = [
    { key: 'req-1', name: 'LCA 报告', isMandatory: true, suggestedFile: 'workflow_lca_report.pdf' },
    { key: 'req-2', name: '数据收集表', isMandatory: true, suggestedFile: 'data_collection.xlsx' },
    { key: 'req-3', name: '排放因子来源', isMandatory: true, suggestedFile: null }, // Example where no file is auto-suggested
    { key: 'req-4', name: '管理体系文件', isMandatory: false, suggestedFile: 'quality_manual.docx' },
  ];

  return json({ workflowId, mockWorkflowName, mockStandard, mockChecklist });
}

// --- Placeholder Page Component ---
export default function InitiateCertificationPage() {
  const { workflowId, mockWorkflowName, mockStandard, mockChecklist } = useLoaderData<typeof loader>();
  const params = useParams();
  const actualWorkflowId = params.id; // Get ID from params for consistency

  // TODO: Implement state and logic for file selection/confirmation

  const handleSubmit = () => {
    // TODO: Implement actual submission logic
    console.log(`Submitting certification request for workflow: ${actualWorkflowId}`);
    alert(`模拟提交认证请求 for ${actualWorkflowId}`);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <Title level={2}>发起认证 - {mockWorkflowName}</Title>
      <Text type="secondary">认证标准: {mockStandard}</Text>
      
      <Alert 
        message="请确认或提供以下核验清单所需的文件。"
        description="系统已尝试根据工作流内容自动建议文件，您可以手动选择或替换。"
        type="info"
        showIcon
        style={{ margin: '1rem 0' }}
      />

      <Card title="核验清单与文件确认">
        <List
          dataSource={mockChecklist}
          renderItem={(item) => (
            <List.Item key={item.key}>
              <List.Item.Meta
                title={<>{item.name} {item.isMandatory ? <Text type="danger">*</Text> : ''}</>}
                description={item.suggestedFile 
                  ? `建议文件: ${item.suggestedFile}` 
                  : '未找到建议文件，请手动提供'}
              />
              <div>
                {/* TODO: Add file selection/upload component here */}
                <Button size="small" style={{ marginRight: '8px' }}>选择文件 (占位)</Button>
                {item.suggestedFile && <Checkbox defaultChecked>使用建议文件</Checkbox>}
              </div>
            </List.Item>
          )}
        />
      </Card>

      <Button 
        type="primary" 
        style={{ marginTop: '1.5rem' }} 
        onClick={handleSubmit}
        // TODO: Disable button until all mandatory files are confirmed
        // disabled={!isReadyToSubmit}
      >
        确认并提交认证申请
      </Button>
    </div>
  );
} 