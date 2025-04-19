import { useState } from "react";
import { Form, Input, Button, Typography, Card, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import { EditOutlined, SaveOutlined } from "@ant-design/icons";
import "~/styles/account-settings.css";

const { Title } = Typography;
const { TextArea } = Input;

// 模拟数据
const mockUserData = {
  username: "admin",
  email: "admin@example.com",
  companyName: "示例企业",
  companyDescription: "这是一个示例企业描述...",
  industry: "制造业"
};

export default function AccountSettings() {
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);

  // 处理编辑按钮点击
  const handleEdit = () => {
    setIsEditing(true);
  };

  // 处理保存按钮点击
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      // 在实际应用中，这里应该调用API保存数据
      console.log('保存的值:', values);
      setIsEditing(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <div className="account-settings-container">
      <Title level={2}>账户管理</Title>

      <Form
        form={form}
        layout="vertical"
        initialValues={mockUserData}
      >
        {/* 用户信息部分 */}
        <Card title="用户信息" className="settings-card">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input disabled={!isEditing} />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input disabled={!isEditing} />
          </Form.Item>
        </Card>

        {/* 租户信息部分 */}
        <Card title="租户信息" className="settings-card" style={{ marginTop: 24 }}>
          <Form.Item
            name="companyName"
            label="企业名称"
            rules={[{ required: true, message: '请输入企业名称' }]}
          >
            <Input disabled={!isEditing} />
          </Form.Item>

          <Form.Item
            name="companyDescription"
            label="企业描述"
          >
            <TextArea 
              rows={4} 
              disabled={!isEditing}
              placeholder="请输入企业描述"
            />
          </Form.Item>

          <Form.Item
            name="industry"
            label="所处行业"
            rules={[{ required: true, message: '请选择所处行业' }]}
          >
            <Select
              disabled={!isEditing}
              options={[
                { value: '制造业', label: '制造业' },
                { value: '服务业', label: '服务业' },
                { value: '能源业', label: '能源业' },
                { value: '其他', label: '其他' },
              ]}
            />
          </Form.Item>
        </Card>

        {/* 操作按钮 */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          {!isEditing ? (
            <Button 
              type="primary" 
              icon={<EditOutlined />}
              onClick={handleEdit}
            >
              编辑
            </Button>
          ) : (
            <Button 
              type="primary" 
              icon={<SaveOutlined />}
              onClick={handleSave}
            >
              保存
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
} 