import React from 'react';
import type { MetaFunction } from '@remix-run/node';
import FileUploadDialogTest from '~/components/chat/file/FileUploadDialogTest';
import 'antd/dist/reset.css';

export const meta: MetaFunction = () => {
  return [
    { title: "文件上传测试" },
    { name: "description", content: "文件上传功能测试页面" },
  ];
};

export default function FileUploadTest() {
  console.log('Rendering FileUploadTest component');

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          文件上传测试页面
        </h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <FileUploadDialogTest />
        </div>
      </div>

      <style>
        {`
          :root {
            --carbon-green-primary: #10B981;
            --carbon-green-dark: #059669;
          }
        `}
      </style>
    </div>
  );
} 