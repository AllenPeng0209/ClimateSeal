import React from 'react';

interface FilePreviewProps {
  files: File[];
  imageDataList: string[];
  onRemove: (index: number) => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ files, imageDataList, onRemove }) => {
  if (!files || files.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-row overflow-x-auto -mt-2">
      {files.map((file, index) => (
        <div key={file.name + file.size} className="mr-2 relative">
          {imageDataList[index] ? (
            <div className="relative pt-4 pr-4">
              <img src={imageDataList[index]} alt={file.name} className="max-h-20" />
              <button
                onClick={() => onRemove(index)}
                className="absolute top-1 right-1 z-10 bg-black rounded-full w-5 h-5 shadow-md hover:bg-gray-900 transition-colors flex items-center justify-center"
              >
                <div className="i-ph:x w-3 h-3 text-gray-200" />
              </button>
            </div>
          ) : file.type === 'text/csv' || file.name.endsWith('.csv') ? (
            <div className="relative pt-4 pr-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center">
                <div className="i-ph:file-csv w-6 h-6 text-green-500 mr-2" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
              </div>
              <button
                onClick={() => onRemove(index)}
                className="absolute top-1 right-1 z-10 bg-black rounded-full w-5 h-5 shadow-md hover:bg-gray-900 transition-colors flex items-center justify-center"
              >
                <div className="i-ph:x w-3 h-3 text-gray-200" />
              </button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

export default FilePreview;
