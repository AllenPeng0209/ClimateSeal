import React from 'react';
import { Card, Table, Tag, Button, Typography } from 'antd';
import { FileProtectOutlined } from '@ant-design/icons';
import { useNavigate } from '@remix-run/react';

const { Title } = Typography;

// Mock data structure matching PRD V0.4.2 requirements
interface MockCertificationRecord {
  key: string; // Required by Ant Design Table
  recordId: string;
  requestingCompanyName: string;
  projectName: string;
  certificationStandard: string;
  status: '准备中' | '审核中' | '已完成' | '已拒绝';
  initiatedAt: string;
}

// Mock data for the table
const mockData: MockCertificationRecord[] = [
  {
    key: '1',
    recordId: 'cert-record-001',
    requestingCompanyName: '气候印记科技有限公司',
    projectName: '产品A碳足迹评估',
    certificationStandard: 'ISO 14067',
    status: '审核中',
    initiatedAt: '2024-04-10',
  },
  {
    key: '2',
    recordId: 'cert-record-002',
    requestingCompanyName: '示例制造有限公司',
    projectName: '产品B碳足迹评估',
    certificationStandard: 'PAS 2050',
    status: '准备中',
    initiatedAt: '2024-04-11',
  },
  {
    key: '3',
    recordId: 'cert-record-003',
    requestingCompanyName: '气候印记科技有限公司',
    projectName: '产品C子供应商数据收集',
    certificationStandard: 'ISO 14067',
    status: '已完成',
    initiatedAt: '2024-03-15',
  },
];

const CertificationCenterSection: React.FC = () => {
  const navigate = useNavigate();

  const columns = [
    {
      title: '企业名称',
      dataIndex: 'requestingCompanyName',
      key: 'requestingCompanyName',
    },
    {
      title: '项目/产品名称',
      dataIndex: 'projectName',
      key: 'projectName',
    },
    {
      title: '认证标准',
      dataIndex: 'certificationStandard',
      key: 'certificationStandard',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: MockCertificationRecord['status']) => {
        let color = 'default';
        if (status === '审核中') {
          color = 'processing';
        } else if (status === '已完成') {
          color = 'success';
        } else if (status === '已拒绝') {
            color = 'error';
        } else if (status === '准备中') {
            color = 'warning';
        }
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: '发起日期',
      dataIndex: 'initiatedAt',
      key: 'initiatedAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: MockCertificationRecord) => (
        <Button 
          type="link"
          onClick={() => navigate(`/certification/${record.recordId}/audit`)}
        > 
          详情
        </Button>
      ),
    },
  ];

  return (
    <>
      <Title level={2} style={{ color: 'var(--carbon-green-dark)', borderBottom: '2px solid var(--carbon-border)', paddingBottom: '12px' }}>
        <FileProtectOutlined style={{ marginRight: 12, color: 'var(--carbon-green-primary)' }} />
        第三方认证中心
      </Title>

      <Card className="carbon-card">
        <Table 
          columns={columns} 
          dataSource={mockData} 
          pagination={false} // Disable pagination for MVP simplicity
          locale={{ emptyText: "暂无认证记录" }}
        />
      </Card>
    </>
  );
};

export default CertificationCenterSection; 