import React from 'react';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useStore } from '@nanostores/react';
import PreviewManager from '~/components/preview/PreviewManager';
import { previewStore } from '~/lib/stores/preview';
import type { MetaFunction } from '@remix-run/node';

export const meta: MetaFunction = () => {
  return [
    { title: '文件预览 - ClimateSeal' },
    { name: 'description', content: '查看和分析上传的文件' },
  ];
};

export const loader = async () => {
  return json({
    files: [], // 这里将从会话或状态管理中获取文件列表
    imageDataList: [], // 这里将从会话或状态管理中获取图片数据列表
  });
};

export default function Preview() {
  const { files, imageDataList } = useStore(previewStore);

  if (files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="text-lg text-gray-500 dark:text-gray-400">
            暂无文件可预览
          </div>
          <div className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            请先上传文件
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-gray-900">
      <PreviewManager files={files} imageDataList={imageDataList} />
    </div>
  );
} 