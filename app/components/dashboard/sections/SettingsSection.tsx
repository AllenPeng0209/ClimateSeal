import React, { useState } from 'react';
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
} from '@ant-design/icons';
import './SettingsSection.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;
const { Password } = Input;

const SettingsSection: React.FC = () => {
  const [form] = Form.useForm();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  
  const handleSaveSettings = (sectionKey: string) => {
    message.success(`${sectionKey}设置已保存`);
  };

  const customPanelStyle = {
    borderRadius: '8px',
    marginBottom: '16px',
    border: '1px solid var(--carbon-border)',
    overflow: 'hidden',
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
      >
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
    </div>
  );
};

export default SettingsSection; 