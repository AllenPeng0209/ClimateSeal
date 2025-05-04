import React, { useEffect, useState } from 'react';
import {
  Card,
  Typography,
  Button,
  Input,
  Select,
  List,
  Tag,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReconciliationOutlined,
  SafetyOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { Workflow } from '~/types/dashboard';
import { supabase } from '~/lib/supabase';

const { Title } = Typography;

interface WorkbenchSectionProps {
  filteredWorkflows: Workflow[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  industryFilter: string;
  setIndustryFilter: (industry: string) => void;
  navigateToWorkflow: (id: string, route: "workflow" | "report") => void;
  showDeleteModal: (workflow: Workflow) => void;
}

const PAGE_SIZE = 10;

const WorkbenchSection: React.FC<WorkbenchSectionProps> = ({
  filteredWorkflows,
  searchQuery,
  setSearchQuery,
  industryFilter,
  setIndustryFilter,
  navigateToWorkflow,
  showDeleteModal
}) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user?.id) setUserId(data.user.id);
    }
    fetchUser();
  }, []);

  useEffect(() => {
    async function fetchWorkflows() {
      if (!userId) return;
      setLoading(true);
      const { data, error, count } = await supabase
        .from('workflows')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
      setLoading(false);
      if (!error) {
        setWorkflows(data || []);
        setTotal(count || 0);
      }
    }
    fetchWorkflows();
  }, [userId, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <Title level={2} style={{ color: 'var(--carbon-green-dark)', borderBottom: '2px solid var(--carbon-border)', paddingBottom: '12px' }}>
        <ReconciliationOutlined style={{ marginRight: 12, color: 'var(--carbon-green-primary)' }} />
        碳足迹工作台
      </Title>

      <Card
        title={
          <span>
            <ReconciliationOutlined style={{ marginRight: 8 }} />
            产品碳足迹工作流
          </span>
        }
        className="carbon-card"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigateToWorkflow("new", "workflow")}
          >
            创建新工作流
          </Button>
        }
      >
        <div style={{ marginBottom: "16px" }}>
          <Row gutter={16}>
            <Col span={16}>
              <Input
                prefix={<SearchOutlined />}
                placeholder="搜索工作流"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={8}>
              <Select
                style={{ width: "100%" }}
                placeholder="按行业筛选"
                value={industryFilter}
                onChange={(value) => setIndustryFilter(value)}
                options={[
                  { value: 'all', label: '全部行业' },
                  { value: '电子制造', label: '电子制造' },
                  { value: '纺织业', label: '纺织业' },
                  { value: '汽车制造', label: '汽车制造' },
                  { value: '食品加工', label: '食品加工' },
                  { value: '化工', label: '化工' },
                ]}
              />
            </Col>
          </Row>
        </div>

        <List
          dataSource={workflows}
          locale={{ emptyText: "暂无工作流，请点击\"创建新工作流\"开始使用" }}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              actions={[
                <Button
                  type="link"
                  onClick={() => navigateToWorkflow(item.id, "workflow")}
                  style={{ color: 'var(--carbon-green-primary)' }}
                >
                  编辑
                </Button>,
                <Button
                  type="link"
                  onClick={() => navigateToWorkflow(item.id, "report")}
                  style={{ color: 'var(--carbon-blue)' }}
                >
                  查看报告
                </Button>,
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => showDeleteModal(item)}
                >
                  删除
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <SafetyOutlined
                    style={{ 
                      fontSize: "24px", 
                      color: "var(--carbon-green-primary)",
                      background: "rgba(46, 139, 87, 0.1)",
                      padding: "8px",
                      borderRadius: "50%"  
                    }}
                  />
                }
                title={
                  <>
                    {item.name}
                    {item.industry_type && (
                      <Tag color="blue" style={{ marginLeft: "8px" }}>
                        {item.industry_type}
                      </Tag>
                    )}
                  </>
                }
                description={
                  <>
                    <div>{item.description || "暂无描述"}</div>
                    <div style={{ marginTop: "8px", color: "var(--carbon-text-light)" }}>
                      创建时间: {new Date(item.created_at).toLocaleDateString()}
                      <span style={{ marginLeft: "16px" }}>
                        碳足迹: {item.total_carbon_footprint?.toFixed(2) || "0.00"} kgCO₂e
                      </span>
                      {
                        <span style={{ marginLeft: "16px" }}>
                          更新时间: {new Date(item.updated_at).toLocaleDateString()}
                        </span>
                      }
                    </div>
                  </>
                }
              />
            </List.Item>
          )}
        />

        <div style={{ marginTop: 8 }}>
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>上一页</button>
          <span style={{ margin: '0 8px' }}>{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>下一页</button>
        </div>
      </Card>
    </>
  );
};

export default WorkbenchSection; 