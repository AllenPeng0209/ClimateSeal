import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Divider,
  Row,
  Col,
  Radio,
  Space,
  Collapse,
  Avatar,
  message,
  Upload,
  Badge,
  Tooltip,
  Table,
  Modal,
  Drawer,
  Tag,
  Alert,
  Spin,
} from 'antd';
import {
  SettingOutlined,
  UserOutlined,
  LockOutlined,
  TeamOutlined,
  BellOutlined,
  GlobalOutlined,
  CloudOutlined,
  UploadOutlined,
  SecurityScanOutlined,
  ApiOutlined,
  ExperimentOutlined,
  NotificationOutlined,
  SaveOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  EditOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  InfoCircleOutlined,
  DeleteOutlined,
  PlusOutlined,
  MailOutlined,
} from '@ant-design/icons';
import './SettingsSection.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;
const { Password } = Input;

const customPanelStyle = {
  borderRadius: '8px',
  marginBottom: '16px',
  border: '1px solid var(--carbon-border)',
  overflow: 'hidden',
};

interface UserType {
  id: string;
  username: string;
  email: string;
  role: string;
  status: boolean;
  createTime: string;
  updateTime: string;
  updatedBy: string;
  isEmailVerified: boolean;
}

const SettingsSection: React.FC = () => {
  const [form] = Form.useForm();
  const [userForm] = Form.useForm();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [userDrawerVisible, setUserDrawerVisible] = useState(false);
  const [userDrawerMode, setUserDrawerMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<{ value: string; label: string; }[]>([]);
  
  const handleSaveSettings = (sectionKey: string) => {
    message.success(`${sectionKey}设置已保存`);
  };

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('获取用户列表失败');
      }
      const data = await response.json();
      setUsers(data as UserType[]);
    } catch (error) {
      message.error('获取用户列表失败');
      console.error('获取用户列表错误:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取角色列表
  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      if (!response.ok) {
        throw new Error('获取角色列表失败');
      }
      const data = await response.json();
      setRoles(data as { value: string; label: string; }[]);
    } catch (error) {
      message.error('获取角色列表失败');
      console.error('获取角色列表错误:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // 发送验证邮件
  const sendVerificationEmail = async (email: string) => {
    try {
      const response = await fetch('/api/users/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error('发送验证邮件失败');
      }
      
      message.success(`验证邮件已发送至 ${email}`);
    } catch (error) {
      message.error('发送验证邮件失败');
      console.error('发送验证邮件错误:', error);
    }
  };

  // 用户管理相关函数
  const handleAddUser = () => {
    setUserDrawerMode('create');
    userForm.resetFields();
    setUserDrawerVisible(true);
  };

  const handleEditUser = (record: UserType) => {
    setUserDrawerMode('edit');
    setSelectedUser(record);
    userForm.setFieldsValue(record);
    setUserDrawerVisible(true);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('删除用户失败');
      }

      message.success('用户已删除');
      fetchUsers(); // 重新获取用户列表
    } catch (error) {
      message.error('删除用户失败');
      console.error('删除用户错误:', error);
    }
  };

  const handleUserStatusChange = async (userId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: enabled }),
      });

      if (!response.ok) {
        throw new Error('更新用户状态失败');
      }

      message.success(`用户已${enabled ? '启用' : '禁用'}`);
      fetchUsers(); // 重新获取用户列表
    } catch (error) {
      message.error('更新用户状态失败');
      console.error('更新用户状态错误:', error);
    }
  };

  const handleSaveUser = async () => {
    try {
      const values = await userForm.validateFields();
      const url = userDrawerMode === 'create' ? '/api/users' : `/api/users/${selectedUser?.id}`;
      const method = userDrawerMode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error(userDrawerMode === 'create' ? '创建用户失败' : '更新用户失败');
      }

      if (userDrawerMode === 'create') {
        await sendVerificationEmail(values.email);
      }

      message.success(userDrawerMode === 'create' ? '用户创建成功，已发送验证邮件' : '用户更新成功');
      setUserDrawerVisible(false);
      fetchUsers(); // 重新获取用户列表
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
      console.error('保存用户错误:', error);
    }
  };

  return (
    <div className="settings-container">
      <Title level={2} style={{ color: 'var(--carbon-green-dark)', borderBottom: '2px solid var(--carbon-border)', paddingBottom: '12px', marginBottom: '24px' }}>
        <SettingOutlined style={{ marginRight: 12, color: 'var(--carbon-green-primary)' }} />
        系统设置
      </Title>

      <Collapse 
        bordered={false}
        expandIconPosition="end"
        className="settings-collapse"
        defaultActiveKey={['users']}
      >
        {/* 用户管理 */}
        <Panel 
          header={
            <div className="panel-header">
              <TeamOutlined className="panel-icon" />
              <span className="panel-title">用户管理</span>
              <Text type="secondary" className="panel-description">管理系统用户、角色和权限</Text>
            </div>
          } 
          key="users"
          style={customPanelStyle}
        >
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddUser}
              style={{ 
                backgroundColor: 'var(--carbon-green-primary)',
                borderColor: 'var(--carbon-green-dark)'
              }}
            >
              新增用户
            </Button>
          </div>

          <Table
            loading={loading}
            dataSource={users}
            rowKey="id"
            columns={[
              {
                title: '用户名',
                dataIndex: 'username',
                key: 'username',
              },
              {
                title: '邮箱',
                dataIndex: 'email',
                key: 'email',
                render: (email: string, record: UserType) => (
                  <Space>
                    {email}
                    {!record.isEmailVerified && (
                      <Tag color="warning" icon={<MailOutlined />}>
                        待验证
                      </Tag>
                    )}
                  </Space>
                ),
              },
              {
                title: '角色',
                dataIndex: 'role',
                key: 'role',
              },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                render: (status: boolean) => (
                  <Tag color={status ? 'success' : 'error'}>
                    {status ? '已启用' : '已禁用'}
                  </Tag>
                ),
              },
              {
                title: '创建时间',
                dataIndex: 'createTime',
                key: 'createTime',
              },
              {
                title: '更新时间',
                dataIndex: 'updateTime',
                key: 'updateTime',
              },
              {
                title: '更新人',
                dataIndex: 'updatedBy',
                key: 'updatedBy',
              },
              {
                title: '操作',
                key: 'action',
                render: (_, record: UserType) => (
                  <Space size="middle">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleEditUser(record)}
                    >
                      编辑
                    </Button>
                    {!record.isEmailVerified && (
                      <Button
                        type="text"
                        icon={<MailOutlined />}
                        onClick={() => sendVerificationEmail(record.email)}
                      >
                        重发验证邮件
                      </Button>
                    )}
                    <Switch
                      checked={record.status}
                      onChange={(checked) => handleUserStatusChange(record.id, checked)}
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteUser(record.id)}
                    >
                      删除
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
        </Panel>

        {/* 个人资料设置 */}
        <Panel 
          header={
            <div className="panel-header">
              <UserOutlined className="panel-icon" />
              <span className="panel-title">个人资料</span>
              <Text type="secondary" className="panel-description">更新您的个人信息和头像</Text>
            </div>
          } 
          key="profile"
          style={customPanelStyle}
        >
          <Form
            layout="vertical"
            initialValues={{
              email: "user@example.com",
              username: "张三",
              company: "绿色科技有限公司",
              role: "可持续发展经理",
            }}
          >
            <Row gutter={24} align="middle">
              <Col xs={24} sm={6} style={{ textAlign: 'center', marginBottom: '20px' }}>
                <Avatar size={100} style={{ 
                  backgroundColor: "var(--carbon-green-primary)",
                  boxShadow: '0 4px 12px rgba(46, 139, 87, 0.2)'
                }}>
                  <UserOutlined />
                </Avatar>
                <div style={{ marginTop: "16px" }}>
                  <Upload
                    name="avatar"
                    showUploadList={false}
                    beforeUpload={() => false}
                  >
                    <Button 
                      icon={<UploadOutlined />}
                      style={{ 
                        borderColor: 'var(--carbon-green-primary)', 
                        color: 'var(--carbon-green-primary)' 
                      }}
                    >
                      更换头像
                    </Button>
                  </Upload>
                </div>
              </Col>
              
              <Col xs={24} sm={18}>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item label="用户名" name="username">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="电子邮箱" name="email">
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item label="公司名称" name="company">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="职位" name="role">
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
            </Row>
            
            <Form.Item style={{ marginTop: '12px', textAlign: 'right' }}>
              <Button 
                type="primary" 
                icon={<SaveOutlined />}
                onClick={() => handleSaveSettings('个人资料')}
                style={{ 
                  backgroundColor: 'var(--carbon-green-primary)',
                  borderColor: 'var(--carbon-green-dark)'
                }}
              >
                保存个人资料
              </Button>
            </Form.Item>
          </Form>
        </Panel>

        {/* 账户安全设置 */}
        <Panel 
          header={
            <div className="panel-header">
              <SecurityScanOutlined className="panel-icon" />
              <span className="panel-title">账户安全</span>
              <Text type="secondary" className="panel-description">修改密码和安全设置</Text>
            </div>
          } 
          key="security"
          style={customPanelStyle}
        >
          <Form layout="vertical">
            <Row gutter={24}>
              <Col xs={24} sm={12}>
                <Form.Item 
                  label="当前密码" 
                  name="currentPassword"
                  rules={[{ required: true, message: '请输入当前密码' }]}
                >
                  <Password 
                    placeholder="输入当前密码"
                    iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col xs={24} sm={12}>
                <Form.Item 
                  label="新密码" 
                  name="newPassword"
                  rules={[{ required: true, message: '请输入新密码' }]}
                >
                  <Password 
                    placeholder="输入新密码"
                    iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item 
                  label="确认新密码" 
                  name="confirmPassword"
                  rules={[
                    { required: true, message: '请确认新密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('两次输入的密码不匹配'));
                      },
                    }),
                  ]}
                >
                  <Password 
                    placeholder="再次输入新密码"
                    iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider dashed />

            <Row gutter={24}>
              <Col xs={24} sm={12}>
                <Form.Item 
                  label="双因素认证" 
                  name="twoFactorAuth"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item 
                  label="登录通知" 
                  name="loginNotification"
                  valuePropName="checked"
                  initialValue={true}
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item style={{ marginTop: '12px', textAlign: 'right' }}>
              <Button 
                type="primary" 
                icon={<SaveOutlined />}
                onClick={() => handleSaveSettings('账户安全')}
                style={{ 
                  backgroundColor: 'var(--carbon-green-primary)',
                  borderColor: 'var(--carbon-green-dark)'
                }}
              >
                保存安全设置
              </Button>
            </Form.Item>
          </Form>
        </Panel>

        {/* API 设置 */}
        <Panel 
          header={
            <div className="panel-header">
              <ApiOutlined className="panel-icon" />
              <span className="panel-title">API 设置</span>
              <Text type="secondary" className="panel-description">管理您的 API 密钥和集成</Text>
            </div>
          } 
          key="api"
          style={customPanelStyle}
        >
          <Form layout="vertical">
            <Row gutter={24}>
              <Col xs={24} sm={12}>
                <Form.Item 
                  label="API 密钥" 
                  name="apiKey"
                  extra={
                    <Tooltip title="用于访问 API 的密钥，请妥善保管">
                      <InfoCircleOutlined style={{ color: 'var(--carbon-text-light)' }} />
                    </Tooltip>
                  }
                >
                  <div className="api-key-input">
                    <Password
                      placeholder="输入 API 密钥"
                      value="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      iconRender={(visible) => (
                        visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                      )}
                    />
                  </div>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item 
                  label="API 密钥状态" 
                  name="apiKeyStatus"
                >
                  <Badge status="success" text="有效" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item style={{ marginTop: '12px', textAlign: 'right' }}>
              <Button 
                type="primary" 
                icon={<SaveOutlined />}
                onClick={() => handleSaveSettings('API')}
                style={{ 
                  backgroundColor: 'var(--carbon-green-primary)',
                  borderColor: 'var(--carbon-green-dark)'
                }}
              >
                保存 API 设置
              </Button>
            </Form.Item>
          </Form>
        </Panel>

        {/* 通知设置 */}
        <Panel 
          header={
            <div className="panel-header">
              <NotificationOutlined className="panel-icon" />
              <span className="panel-title">通知设置</span>
              <Text type="secondary" className="panel-description">配置您的通知偏好</Text>
            </div>
          } 
          key="notifications"
          style={customPanelStyle}
        >
          <div className="notification-list">
            <div className="notification-item">
              <div>
                <Text>工作流完成通知</Text>
                <Text type="secondary" style={{ display: 'block' }}>
                  当工作流完成时发送通知
                </Text>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="notification-item">
              <div>
                <Text>数据更新通知</Text>
                <Text type="secondary" style={{ display: 'block' }}>
                  当数据有更新时发送通知
                </Text>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="notification-item">
              <div>
                <Text>系统维护通知</Text>
                <Text type="secondary" style={{ display: 'block' }}>
                  接收系统维护和更新通知
                </Text>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <Form.Item style={{ marginTop: '12px', textAlign: 'right' }}>
            <Button 
              type="primary" 
              icon={<SaveOutlined />}
              onClick={() => handleSaveSettings('通知')}
              style={{ 
                backgroundColor: 'var(--carbon-green-primary)',
                borderColor: 'var(--carbon-green-dark)'
              }}
            >
              保存通知设置
            </Button>
          </Form.Item>
        </Panel>
      </Collapse>

      {/* 用户管理抽屉 */}
      <Drawer
        title={userDrawerMode === 'create' ? '新增用户' : '编辑用户'}
        width={520}
        open={userDrawerVisible}
        onClose={() => setUserDrawerVisible(false)}
        extra={
          <Space>
            <Button onClick={() => setUserDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleSaveUser}>
              确定
            </Button>
          </Space>
        }
      >
        <Form
          form={userForm}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 1, max: 32, message: '用户名长度在1-32个字符之间' },
              { pattern: /^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/, message: '用户名只能包含中英文、数字、下划线、中划线' },
            ]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
              { min: 1, max: 64, message: '邮箱长度在1-64个字符之间' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              {roles.map(role => (
                <Option key={role.value} value={role.value}>{role.label}</Option>
              ))}
            </Select>
          </Form.Item>

          {userDrawerMode === 'create' && (
            <Alert
              message="提示"
              description="创建用户后，系统将向用户邮箱发送验证邮件。用户需要通过邮箱验证后才能登录系统。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
        </Form>
      </Drawer>
    </div>
  );
};

export default SettingsSection; 