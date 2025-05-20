import React from 'react';
import { Card, Table, Checkbox, Popconfirm, Button, Empty } from 'antd';
import type { TableProps } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useCarbonFlowStore } from '~/components/workbench/CarbonFlow/CarbonFlowStore'; // Adjusted path
import type { Task } from '~/types/task';

// 1. Define props interface
interface TaskProgressCardProps {
  className?: string;
}

// 2. Accept props
export function TaskProgressCard({ className }: TaskProgressCardProps) {
  const storeTasks = useCarbonFlowStore((state) => state.tasks) || [];
  const toggleTaskStatus = useCarbonFlowStore((state) => state.toggleTaskStatus);
  const deleteTask = useCarbonFlowStore((state) => state.deleteTask);

  const taskTableColumns: TableProps<Task>['columns'] = [
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: Task['status'], record: Task) => (
        <Checkbox
          checked={status === 'completed'}
          onChange={() => toggleTaskStatus(record.id)}
        />
      ),
    },
    {
      title: '任务描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string, record: Task) => (
        <span style={{ textDecoration: record.status === 'completed' ? 'line-through' : 'none' }}>
          {text}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      align: 'center',
      render: (_, record: Task) => (
        <Popconfirm title="确定删除此任务吗?" onConfirm={() => deleteTask(record.id)} okText="删除" cancelText="取消">
          <Button type="link" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card
      title="当前任务进程"
      size="small"
      className={`flex-grow min-h-0 bg-bolt-elements-background-depth-1 border border-bolt-primary/30 flex flex-col ${className || ''}`}
      bodyStyle={{ flexGrow: 1, overflow: 'auto', padding: '8px' }}
    >
      <Table
        columns={taskTableColumns}
        dataSource={storeTasks}
        rowKey="id"
        size="small"
        pagination={false}
        locale={{ emptyText: <Empty description="暂无进行中的任务" /> }}
        scroll={{ y: 'calc(100% - 30px)' }} // Example scroll, might need adjustment
      />
    </Card>
  );
}
