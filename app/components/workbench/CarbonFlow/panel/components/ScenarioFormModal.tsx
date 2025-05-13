import React from 'react';
import { Modal, Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ScenarioInfo } from '~/components/workbench/CarbonFlow/panel/types';
import '~/components/workbench/CarbonFlow/panel/styles.css';

const { TextArea } = Input;

interface ScenarioFormModalProps {
  visible: boolean;
  title: string;
  initialValues?: Partial<ScenarioInfo>;
  confirmLoading: boolean;
  onCancel: () => void;
  onSubmit: (values: { name: string; desc: string }) => void;
}

/**
 * 场景表单模态框组件
 */
const ScenarioFormModal: React.FC<ScenarioFormModalProps> = ({
  visible,
  title,
  initialValues,
  confirmLoading,
  onCancel,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  
  // 处理表单提交
  const handleOk = () => {
    form.validateFields()
      .then(values => {
        onSubmit(values);
      })
      .catch(info => {
        console.log('表单验证失败:', info);
      });
  };
  
  // 关闭时重置表单字段
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };
  
  return (
    <Modal
      open={visible}
      title={title}
      okText={t('确定')}
      cancelText={t('取消')}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={confirmLoading}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
      >
        <Form.Item
          name="name"
          label={t('场景名称')}
          className="form-item"
          rules={[{ required: true, message: t('请输入场景名称') }]}
        >
          <Input placeholder={t('请输入场景名称')} />
        </Form.Item>
        
        <Form.Item
          name="desc"
          label={t('场景描述')}
          className="form-item"
        >
          <TextArea
            rows={4}
            placeholder={t('请输入场景描述（可选）')}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ScenarioFormModal; 