import React, { useState } from 'react';
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { Card, Descriptions, Table, Tag, Button, Select, Input, Typography, Space, Tooltip } from 'antd';
import { DownloadOutlined, EyeOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

// --- Mock Data Structures ---
interface MockAuditDocument {
  key: string; // For table
  requirementName: string;
  isMandatory: boolean;
  submittedFileName: string | null;
  submittedFilePath: string | null; // For download/preview simulation
  auditStatus: 'Pending' | 'Approved' | 'Rejected' | 'Clarification Needed';
  auditComment: string | null;
}

interface MockCertificationDetail {
  recordId: string;
  requestingCompanyName: string;
  projectName: string;
  productIdentifier: string; // e.g., Model Number
  certificationStandard: string;
  currentOverallStatus: string; // e.g., '审核中'
  initiatedAt: string;
  documents: MockAuditDocument[];
}

// --- Mock Loader ---
export async function loader({ params }: LoaderFunctionArgs) {
  const recordId = params.recordId;

  // TODO: Replace with actual backend data fetching based on recordId
  const mockDetailData: MockCertificationDetail = {
    recordId: recordId || 'mock-record-id',
    requestingCompanyName: '气候印记科技有限公司',
    projectName: '产品A碳足迹评估 (模拟)',
    productIdentifier: '型号 XYZ-123',
    certificationStandard: 'ISO 14067',
    currentOverallStatus: '审核中',
    initiatedAt: '2024-04-10',
    documents: [
      { key: 'doc-1', requirementName: 'LCA 报告', isMandatory: true, submittedFileName: '产品A_LCA报告_v1.2.pdf', submittedFilePath: '/mock/lca_report.pdf', auditStatus: 'Pending', auditComment: null },
      { key: 'doc-2', requirementName: '数据收集表', isMandatory: true, submittedFileName: '产品A_数据收集表_final.xlsx', submittedFilePath: '/mock/data_sheet.xlsx', auditStatus: 'Pending', auditComment: null },
      { key: 'doc-3', requirementName: '排放因子来源证明', isMandatory: true, submittedFileName: '排放因子截图汇总.zip', submittedFilePath: '/mock/ef_proof.zip', auditStatus: 'Pending', auditComment: null },
      { key: 'doc-4', requirementName: '管理体系文件 (可选)', isMandatory: false, submittedFileName: null, submittedFilePath: null, auditStatus: 'Pending', auditComment: null }, // Example of not submitted optional doc
      { key: 'doc-5', requirementName: '第三方验证声明 (若有)', isMandatory: false, submittedFileName: 'Previous_Verification.pdf', submittedFilePath: '/mock/prev_verification.pdf', auditStatus: 'Approved', auditComment: '符合要求' }, // Example of pre-approved optional doc
    ],
  };

  return json({ certificationDetail: mockDetailData });
}

// --- Page Component ---
export default function CertificationAuditPage() {
  const { certificationDetail } = useLoaderData<typeof loader>();
  const [documentsData, setDocumentsData] = useState<MockAuditDocument[]>(certificationDetail.documents);

  // Placeholder handlers for audit actions (will update state locally for now)
  const handleStatusChange = (key: string, newStatus: MockAuditDocument['auditStatus']) => {
    setDocumentsData(prevData =>
      prevData.map(doc => (doc.key === key ? { ...doc, auditStatus: newStatus } : doc))
    );
    console.log(`Status changed for ${key}: ${newStatus}`); // Simulate saving
  };

  const handleCommentChange = (key: string, newComment: string) => {
    setDocumentsData(prevData =>
      prevData.map(doc => (doc.key === key ? { ...doc, auditComment: newComment } : doc))
    );
    console.log(`Comment changed for ${key}: ${newComment}`); // Simulate saving
  };

  // Placeholder handlers for file actions
  const handlePreview = (fileName: string, filePath: string) => {
    console.log(`Previewing file: ${fileName} from path: ${filePath}`);
    alert(`模拟预览文件: ${fileName}`); // Simple alert for MVP
  };

  const handleDownload = (fileName: string, filePath: string) => {
    console.log(`Downloading file: ${fileName} from path: ${filePath}`);
    alert(`模拟下载文件: ${fileName}`); // Simple alert for MVP
  };


  // Define table columns for the audit checklist
  const columns = [
    {
      title: '文件要求',
      dataIndex: 'requirementName',
      key: 'requirementName',
      render: (text: string, record: MockAuditDocument) => (
        <Space>
          {text}
          {!record.isMandatory && <Tag>可选</Tag>}
        </Space>
      ),
    },
    {
        title: '已提交文件',
        dataIndex: 'submittedFileName',
        key: 'submittedFileName',
        render: (fileName: string | null, record: MockAuditDocument) => {
            if (!fileName || !record.submittedFilePath) {
                return <Text type="secondary">未提交</Text>;
            }
            return (
                <Space>
                    <Text>{fileName}</Text>
                    <Tooltip title="预览">
                        <Button 
                            icon={<EyeOutlined />} 
                            size="small" 
                            type="text" 
                            onClick={() => handlePreview(fileName, record.submittedFilePath!)}
                        />
                    </Tooltip>
                    <Tooltip title="下载">
                        <Button 
                            icon={<DownloadOutlined />} 
                            size="small" 
                            type="text" 
                            onClick={() => handleDownload(fileName, record.submittedFilePath!)}
                        />
                     </Tooltip>
                </Space>
            );
        }
    },
    {
      title: '审核状态',
      dataIndex: 'auditStatus',
      key: 'auditStatus',
      width: 180, // Adjust width as needed
      render: (status: MockAuditDocument['auditStatus'], record: MockAuditDocument) => (
        <Select
          value={status}
          style={{ width: '100%' }}
          onChange={(value) => handleStatusChange(record.key, value)}
          disabled={!record.submittedFileName} // Disable if no file submitted
        >
          <Select.Option value="Pending">待审核</Select.Option>
          <Select.Option value="Approved">符合</Select.Option>
          <Select.Option value="Rejected">不符合</Select.Option>
          <Select.Option value="Clarification Needed">需澄清</Select.Option>
        </Select>
      ),
    },
    {
      title: '审核意见',
      dataIndex: 'auditComment',
      key: 'auditComment',
      render: (comment: string | null, record: MockAuditDocument) => (
        <TextArea
          rows={2}
          value={comment || ''}
          onChange={(e) => handleCommentChange(record.key, e.target.value)}
          placeholder="输入审核意见..."
          disabled={!record.submittedFileName} // Disable if no file submitted
        />
      ),
    },
  ];


  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
       <Title level={2}>认证详情审核</Title>

        <Card title="基础信息">
            <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="企业名称">{certificationDetail.requestingCompanyName}</Descriptions.Item>
                <Descriptions.Item label="项目/产品名称">{certificationDetail.projectName}</Descriptions.Item>
                <Descriptions.Item label="产品标识">{certificationDetail.productIdentifier}</Descriptions.Item>
                <Descriptions.Item label="认证标准">{certificationDetail.certificationStandard}</Descriptions.Item>
                <Descriptions.Item label="发起日期">{certificationDetail.initiatedAt}</Descriptions.Item>
                <Descriptions.Item label="当前状态">
                    <Tag color="processing">{certificationDetail.currentOverallStatus}</Tag>
                </Descriptions.Item>
            </Descriptions>
        </Card>

      <Card title="核验清单与文件审核">
        <Table
          columns={columns}
          dataSource={documentsData} // Use state for interactive updates
          pagination={false}
          size="small"
          locale={{ emptyText: "无文件要求" }}
        />
      </Card>

        {/* Placeholder for future overall actions */}
       {/* <Card>
            <Space>
                <Button type="primary" disabled>提交整体审核结果 (V1+)</Button>
                <Button disabled>保存草稿 (V1+)</Button>
            </Space>
       </Card> */}
    </Space>
  );
} 