import React, { useState } from 'react';
import { Modal, Button, message } from 'antd';
import EnhancedFileUpload from './EnhancedFileUpload';
import type { UploadFile } from 'antd/es/upload/interface';

interface FileUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (files: UploadFile<any>[], imageDataList: string[]) => void;
  title?: string;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  multiple?: boolean;
}

const FileUploadDialog: React.FC<FileUploadDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '上传文件',
  maxFileSize,
  allowedFileTypes,
  multiple
}) => {
  const [files, setFiles] = useState<UploadFile<any>[]>([]);
  const [imageDataList, setImageDataList] = useState<string[]>([]);

  const handleChange = (newFiles: UploadFile<any>[], newImageDataList: string[]) => {
    setFiles(newFiles);
    setImageDataList(newImageDataList);
  };

  const handleConfirm = () => {
    if (files.length === 0) {
      message.warning('请先上传文件');
      return;
    }
    onConfirm(files, imageDataList);
    onClose();
  };

  return (
    <Modal
      title={title}
      open={isOpen}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="confirm" type="primary" onClick={handleConfirm}>
          确认
        </Button>
      ]}
    >
      <div style={{ minHeight: '300px' }}>
        <EnhancedFileUpload
          onChange={handleChange}
          maxFileSize={maxFileSize}
          allowedFileTypes={allowedFileTypes}
          multiple={multiple}
          files={files}
          imageDataList={imageDataList}
        />
      </div>
    </Modal>
  );
};

export default FileUploadDialog; 