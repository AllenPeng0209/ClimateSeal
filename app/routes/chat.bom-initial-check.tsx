import React from 'react';
import { BaseChat } from '~/components/chat/BaseChat';
import type { MetaFunction } from '@remix-run/node';

export const meta: MetaFunction = () => {
  return [
    { title: 'BOM初始检查 - ClimateSeal' },
    { name: 'description', content: 'BOM数据初始检查与分析' },
  ];
};

export default function BOMInitialCheck() {
  return (
    <div className="h-full">
      <BaseChat />
    </div>
  );
} 