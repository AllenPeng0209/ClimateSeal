import React from 'react';
import { Form, Input, Select, InputNumber, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { DATA_QUALITY_OPTIONS, STATUS_OPTIONS, UNIT_OPTIONS, EMISSION_SOURCE_OPTIONS } from '~/components/workbench/CarbonFlow/panel/constants';
import type { FormValues } from '~/components/workbench/CarbonFlow/panel/types';
import '~/components/workbench/CarbonFlow/panel/styles.css';

interface EmissionSourceFormProps {
  visible: boolean;
  title: string;
  initialValues?: Partial<FormValues>;
  confirmLoading: boolean;
  onCancel: () => void;
  onSubmit: (values: FormValues) => void;
}

/**
 * 排放源表单组件
 */
const EmissionSourceForm: React.FC<EmissionSourceFormProps> = ({
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
          label={t('名称')}
          className="form-item"
          rules={[{ required: true, message: t('请输入名称') }]}
        >
          <Input placeholder={t('请输入名称')} />
        </Form.Item>
        
        <Form.Item
          name="emissionSource"
          label={t('排放源')}
          className="form-item"
          rules={[{ required: true, message: t('请选择排放源') }]}
        >
          <Select placeholder={t('请选择排放源')}>
            {EMISSION_SOURCE_OPTIONS.map(option => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item
          name="unit"
          label={t('单位')}
          className="form-item"
          rules={[{ required: true, message: t('请选择单位') }]}
        >
          <Select placeholder={t('请选择单位')}>
            {UNIT_OPTIONS.map(option => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item
          name="carbonFootprint"
          label={t('碳足迹')}
          className="form-item"
          rules={[{ required: true, message: t('请输入碳足迹值') }]}
        >
          <InputNumber
            min={0}
            step={0.01}
            precision={2}
            style={{ width: '100%' }}
            placeholder={t('请输入碳足迹值')}
          />
        </Form.Item>
        
        <Form.Item
          name="dataQuality"
          label={t('数据质量')}
          className="form-item"
          rules={[{ required: true, message: t('请选择数据质量') }]}
        >
          <Select placeholder={t('请选择数据质量')}>
            {DATA_QUALITY_OPTIONS.map(option => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item
          name="status"
          label={t('状态')}
          className="form-item"
          rules={[{ required: true, message: t('请选择状态') }]}
        >
          <Select placeholder={t('请选择状态')}>
            {STATUS_OPTIONS.map(option => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EmissionSourceForm; 