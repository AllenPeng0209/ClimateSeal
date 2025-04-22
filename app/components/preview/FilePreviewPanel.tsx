import React from 'react';
import { Empty } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';

interface FilePreviewPanelProps {
  currentFile?: UploadFile;
  imageDataUrl?: string;
}

const FilePreviewPanel: React.FC<FilePreviewPanelProps> = ({
  currentFile,
  imageDataUrl
}) => {
  if (!currentFile) {
    return (
      <div className="h-full flex items-center justify-center">
        <Empty description="请选择要预览的文件" />
      </div>
    );
  }

  const renderPreview = () => {
    const fileType = currentFile.type || '';

    if (fileType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-full">
          <img 
            src={imageDataUrl} 
            alt={currentFile.name}
            className="max-w-full max-h-full object-contain" 
          />
        </div>
      );
    }

    if (fileType.includes('pdf')) {
      return (
        <div className="h-full">
          <iframe
            src={URL.createObjectURL(currentFile.originFileObj as Blob)}
            className="w-full h-full"
            title={currentFile.name}
          />
        </div>
      );
    }

    if (fileType.includes('excel') || fileType.includes('spreadsheet') || fileType.includes('csv')) {
      return (
        <div className="p-4">
          <div className="text-lg mb-4">Excel/CSV 预览</div>
          {/* 这里可以集成Excel预览组件 */}
          <div className="text-gray-500">
            正在开发Excel预览功能，目前可以通过点击文件名打开新窗口查看
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-lg mb-2">{currentFile.name}</div>
          <div className="text-gray-500">
            该文件类型暂不支持预览，请下载后查看
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-white dark:bg-gray-800">
      {renderPreview()}
    </div>
  );
};

export default FilePreviewPanel; 