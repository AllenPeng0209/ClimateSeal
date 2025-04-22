import React, { useState } from 'react';
import { Upload, Button, message, Modal } from 'antd';
import { UploadOutlined, FileImageOutlined, FileExcelOutlined, FilePdfOutlined, FileWordOutlined } from '@ant-design/icons';
import type { UploadProps, UploadFile } from 'antd/es/upload/interface';
import type { RcFile } from 'antd/es/upload/interface';

export interface EnhancedFileUploadProps {
  onChange: (files: UploadFile<any>[], imageDataList: string[]) => void;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  multiple?: boolean;
  files: UploadFile<any>[];
  imageDataList: string[];
}

const EnhancedFileUpload: React.FC<EnhancedFileUploadProps> = ({
  onChange,
  files,
  imageDataList: initialImageDataList,
  maxFileSize = 50,
  allowedFileTypes = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv'],
  multiple = true
}) => {
  const [fileList, setFileList] = useState<UploadFile<any>[]>(files);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [imageDataList, setImageDataList] = useState<string[]>(initialImageDataList);

  const getFileIcon = (file: UploadFile<any>) => {
    const fileName = file.name.toLowerCase();
    if (/\.(jpg|jpeg|png|gif|bmp|webp)$/.test(fileName)) {
      return <FileImageOutlined />;
    } else if (/\.(xls|xlsx|csv)$/.test(fileName)) {
      return <FileExcelOutlined />;
    } else if (/\.pdf$/.test(fileName)) {
      return <FilePdfOutlined />;
    } else if (/\.(doc|docx)$/.test(fileName)) {
      return <FileWordOutlined />;
    }
    return <UploadOutlined />;
  };

  const handlePreview = async (file: UploadFile<any>) => {
    if (!file.originFileObj) return;
    
    if (/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.name)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
        setPreviewVisible(true);
      };
      reader.readAsDataURL(file.originFileObj);
    } else {
      window.open(URL.createObjectURL(file.originFileObj));
    }
  };

  const handleFileChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    const typedFileList = newFileList as UploadFile<any>[];
    setFileList(typedFileList);
    
    const promises = typedFileList.map(file => {
      if (/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.name)) {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          if (file.originFileObj) {
            reader.readAsDataURL(file.originFileObj);
          } else {
            resolve('');
          }
        });
      }
      return Promise.resolve('');
    });

    Promise.all(promises).then(newImageDataList => {
      setImageDataList(newImageDataList);
      onChange(typedFileList, newImageDataList);
    });
  };

  const beforeUpload = (file: RcFile) => {
    const fileName = file.name.toLowerCase();
    const isAllowedType = allowedFileTypes.some(ext => 
      fileName.endsWith(ext.toLowerCase())
    );
    
    if (!isAllowedType) {
      message.error(`不支持的文件格式: ${file.name}`);
      return Upload.LIST_IGNORE;
    }

    const isLtMaxSize = file.size / 1024 / 1024 < maxFileSize;
    if (!isLtMaxSize) {
      message.error(`文件大小不能超过 ${maxFileSize}MB!`);
      return Upload.LIST_IGNORE;
    }

    return true;
  };

  const uploadProps: UploadProps = {
    beforeUpload,
    onChange: handleFileChange,
    multiple,
    showUploadList: {
      showPreviewIcon: true,
      showRemoveIcon: true,
      previewIcon: (file: UploadFile<any>) => (
        <Button
          type="text"
          icon={getFileIcon(file)}
          onClick={() => handlePreview(file)}
        />
      ),
    },
    fileList,
  };

  return (
    <div className="enhanced-file-upload">
      <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        支持的文件格式：
        <ul className="mt-1 list-disc list-inside">
          <li>图片：JPG、PNG、GIF、BMP、WebP</li>
          <li>文档：PDF、Word (DOC/DOCX)</li>
          <li>表格：Excel (XLS/XLSX)、CSV</li>
        </ul>
        <div className="mt-1">
          单个文件大小限制：{maxFileSize}MB
        </div>
      </div>

      <Upload {...uploadProps}>
        <Button icon={<UploadOutlined />}>上传文件</Button>
      </Upload>
      
      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <img alt="预览" style={{ width: '100%' }} src={previewImage} />
      </Modal>

      <style>{`
        .enhanced-file-upload {
          margin: 16px 0;
        }
        :global(.ant-upload-list) {
          margin-top: 8px;
        }
        :global(.ant-upload-list-item) {
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
};

export default EnhancedFileUpload; 