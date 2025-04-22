import React, { useState } from 'react';
import FileUploadDialog from './FileUploadDialog';

const FileUploadDialogTest: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleFileConfirm = (files: File[]) => {
    console.log('上传的文件:', files);
    // 这里可以添加文件处理逻辑
  };

  return (
    <div className="file-upload-dialog-test">
      <button 
        onClick={() => setIsDialogOpen(true)}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        打开文件上传对话框
      </button>

      <FileUploadDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleFileConfirm}
        title="测试文件上传"
      />

      <style>
        {`
          .file-upload-dialog-test {
            padding: 24px;
            text-align: center;
          }
        `}
      </style>
    </div>
  );
};

export default FileUploadDialogTest; 