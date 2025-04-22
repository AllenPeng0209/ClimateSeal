import React, { useState } from 'react';
import { Card, Button, message } from 'antd';
import EnhancedFileUpload from './EnhancedFileUpload';

const FilePreviewTest: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [imageDataList, setImageDataList] = useState<string[]>([]);

  const handleFileChange = (newFiles: File[]) => {
    setFiles(newFiles);
    message.success(`已更新文件列表，共${newFiles.length}个文件`);
  };

  const handleImageDataChange = (newImageDataList: string[]) => {
    setImageDataList(newImageDataList);
    message.success(`已更新图片数据，共${newImageDataList.length}张图片`);
  };

  return (
    <div className="p-4">
      <Card title="文件上传预览测试" className="mb-4">
        <EnhancedFileUpload
          onFileChange={handleFileChange}
          onImageDataChange={handleImageDataChange}
          maxFileSize={20}
          multiple={true}
        />
      </Card>

      <Card title="文件列表">
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center">
                <span className="mr-2">{file.name}</span>
                <span className="text-gray-500 text-sm">
                  {(file.size / 1024).toFixed(2)} KB
                </span>
              </div>
              <div className="text-gray-500 text-sm">
                {file.type}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <style>
        {`
          .ant-card {
            margin-bottom: 16px;
          }
          .ant-card-head {
            background: #fafafa;
          }
        `}
      </style>
    </div>
  );
};

export default FilePreviewTest; 