import React from 'react';
import { FileImageOutlined, FileExcelOutlined, FilePdfOutlined, FileWordOutlined, FileOutlined } from '@ant-design/icons';

interface FilePreviewProps {
  files: File[];
  imageDataList: string[];
  onRemove: (index: number) => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ files, imageDataList, onRemove }) => {
  if (!files || files.length === 0) {
    return null;
  }

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith('image/')) {
      return <FileImageOutlined className="text-blue-500 text-xl" />;
    } else if (type.includes('excel') || type.includes('spreadsheet') || type.includes('csv')) {
      return <FileExcelOutlined className="text-green-500 text-xl" />;
    } else if (type.includes('pdf')) {
      return <FilePdfOutlined className="text-red-500 text-xl" />;
    } else if (type.includes('word')) {
      return <FileWordOutlined className="text-blue-600 text-xl" />;
    }
    return <FileOutlined className="text-gray-500 text-xl" />;
  };

  return (
    <div className="flex flex-row flex-wrap gap-2 -mt-2">
      {files.map((file, index) => (
        <div key={file.name + file.size} className="relative">
          <div className="relative pt-4 pr-4">
            {file.type.startsWith('image/') && imageDataList[index] ? (
              <img src={imageDataList[index]} alt={file.name} className="max-h-20" />
            ) : (
              <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                {getFileIcon(file)}
                <span className="text-sm text-gray-700 dark:text-gray-300 max-w-[150px] truncate">
                  {file.name}
                </span>
              </div>
            )}
            <button
              onClick={() => onRemove(index)}
              className="absolute top-1 right-1 z-10 bg-black rounded-full w-5 h-5 shadow-md hover:bg-gray-900 transition-colors flex items-center justify-center"
            >
              <div className="i-ph:x w-3 h-3 text-gray-200" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FilePreview;
