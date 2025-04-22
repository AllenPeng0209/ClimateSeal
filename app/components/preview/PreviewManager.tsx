import React, { useState } from 'react';
import { Tabs, List } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import FilePreviewPanel from './FilePreviewPanel';

interface PreviewManagerProps {
  files: UploadFile[];
  imageDataList: string[];
}

const PreviewManager: React.FC<PreviewManagerProps> = ({
  files,
  imageDataList
}) => {
  const [currentFile, setCurrentFile] = useState<UploadFile | undefined>();
  const [currentImageData, setCurrentImageData] = useState<string>();

  const handleFileSelect = (file: UploadFile, index: number) => {
    setCurrentFile(file);
    if (file.type?.startsWith('image/')) {
      setCurrentImageData(imageDataList[index]);
    }
  };

  return (
    <div className="h-full flex">
      {/* 文件列表侧边栏 */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <List
          dataSource={files}
          renderItem={(file, index) => (
            <List.Item
              className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2 ${
                currentFile?.uid === file.uid ? 'bg-blue-50 dark:bg-blue-900' : ''
              }`}
              onClick={() => handleFileSelect(file, index)}
            >
              <div className="truncate">
                {file.name}
              </div>
            </List.Item>
          )}
        />
      </div>

      {/* 预览面板 */}
      <div className="flex-1 overflow-hidden">
        <FilePreviewPanel
          currentFile={currentFile}
          imageDataUrl={currentImageData}
        />
      </div>
    </div>
  );
};

export default PreviewManager; 