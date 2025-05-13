import React, { useState } from 'react';
import { Card, Typography, Upload, Button, message } from 'antd';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import '~/components/workbench/CarbonFlow/panel/styles.css';

const { Title, Text } = Typography;
const { Dragger } = Upload;

interface FileUploadCardProps {
  onUpload: (file: File) => Promise<void>;
  acceptedFileTypes?: string;
  maxFileSize?: number; // 单位: MB
}

/**
 * 文件上传卡片组件
 */
const FileUploadCard: React.FC<FileUploadCardProps> = ({
  onUpload,
  acceptedFileTypes = '.xlsx,.csv',
  maxFileSize = 10,
}) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  
  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    
    // 检查文件大小
    if (file.size > maxFileSize * 1024 * 1024) {
      message.error(t('文件大小超过限制，最大支持 {{size}}MB', { size: maxFileSize }));
      onError();
      return;
    }
    
    try {
      setUploading(true);
      await onUpload(file);
      onSuccess();
      message.success(t('文件上传成功'));
    } catch (error) {
      console.error('文件上传失败:', error);
      message.error(t('文件上传失败'));
      onError();
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <Card className="panel-card" title={<Title level={5}>{t('数据导入')}</Title>}>
      <Dragger
        name="file"
        multiple={false}
        customRequest={handleUpload}
        showUploadList={false}
        accept={acceptedFileTypes}
        disabled={uploading}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">{t('点击或拖拽文件至此区域上传')}</p>
        <p className="ant-upload-hint">
          {t('支持 {{types}} 文件，单个文件不超过 {{size}}MB', { 
            types: acceptedFileTypes.replace(/\./g, '').toUpperCase(), 
            size: maxFileSize 
          })}
        </p>
      </Dragger>
      
      <Button
        type="primary"
        icon={<UploadOutlined />}
        loading={uploading}
        style={{ marginTop: '16px', width: '100%' }}
        onClick={() => document.querySelector('.ant-upload input')?.click()}
      >
        {uploading ? t('上传中...') : t('选择文件')}
      </Button>
    </Card>
  );
};

export default FileUploadCard; 