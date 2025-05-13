import React, { useState } from 'react';
import { Table, Input, Button, Space, Tooltip, Popconfirm } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import type { DataItem, ColumnSearchProps } from '~/components/workbench/CarbonFlow/panel/types';
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZES } from '~/components/workbench/CarbonFlow/panel/constants';
import '~/components/workbench/CarbonFlow/panel/styles.css';

interface EmissionSourceTableProps {
  dataSource: DataItem[];
  loading?: boolean;
  onAdd: () => void;
  onEdit: (record: DataItem) => void;
  onDelete: (id: string) => Promise<void>;
}

/**
 * 排放源表格组件
 */
const EmissionSourceTable: React.FC<EmissionSourceTableProps> = ({
  dataSource,
  loading = false,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  
  // 表格筛选方法
  const getColumnSearchProps = (dataIndex: string): ColumnSearchProps => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={t('搜索 {{field}}', { field: dataIndex })}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          className="search-input"
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
          >
            {t('搜索')}
          </Button>
          <Button
            onClick={() => handleReset(clearFilters!)}
            size="small"
          >
            {t('重置')}
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value, record) => {
      const val = (record as any)[dataIndex];
      return val ? val.toString().toLowerCase().includes((value as string).toLowerCase()) : false;
    },
    filteredValue: searchedColumn === dataIndex ? [searchText] : null,
  });
  
  // 处理搜索
  const handleSearch = (selectedKeys: string[], confirm: () => void, dataIndex: string) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };
  
  // 处理重置
  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
  };
  
  // 表格列定义
  const columns: ColumnsType<DataItem> = [
    {
      title: t('名称'),
      dataIndex: 'name',
      key: 'name',
      ...getColumnSearchProps('name'),
      render: (text) => <span>{text}</span>,
    },
    {
      title: t('排放源'),
      dataIndex: 'emissionSource',
      key: 'emissionSource',
      ...getColumnSearchProps('emissionSource'),
    },
    {
      title: t('碳足迹'),
      dataIndex: 'carbonFootprint',
      key: 'carbonFootprint',
      sorter: (a, b) => a.carbonFootprint - b.carbonFootprint,
      render: (text, record) => `${text} ${record.unit}`,
    },
    {
      title: t('数据质量'),
      dataIndex: 'dataQuality',
      key: 'dataQuality',
      filters: [
        { text: t('高'), value: 'high' },
        { text: t('中'), value: 'medium' },
        { text: t('低'), value: 'low' },
      ],
      onFilter: (value, record) => record.dataQuality === value,
    },
    {
      title: t('状态'),
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: t('草稿'), value: 'draft' },
        { text: t('已提交'), value: 'submitted' },
        { text: t('已批准'), value: 'approved' },
        { text: t('已拒绝'), value: 'rejected' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: t('操作'),
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title={t('编辑')}>
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => onEdit(record)} 
            />
          </Tooltip>
          <Popconfirm
            title={t('确定要删除吗？')}
            onConfirm={() => onDelete(record.id)}
            okText={t('确定')}
            cancelText={t('取消')}
          >
            <Tooltip title={t('删除')}>
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />} 
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  
  return (
    <div className="table-container">
      <div className="button-group">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onAdd}
        >
          {t('添加排放源')}
        </Button>
      </div>
      
      <Table
        rowKey="id"
        dataSource={dataSource}
        columns={columns}
        loading={loading}
        pagination={{
          defaultPageSize: DEFAULT_PAGE_SIZE,
          pageSizeOptions: DEFAULT_PAGE_SIZES.map(String),
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => t('共 {{total}} 条记录', { total }),
        }}
      />
    </div>
  );
};

export default EmissionSourceTable; 