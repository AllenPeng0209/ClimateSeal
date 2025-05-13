import { useState, useCallback } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import type { DataItem, FormValues } from '~/components/workbench/CarbonFlow/panel/types';

/**
 * 排放源管理钩子
 */
export const useEmissionSource = (initialData: DataItem[] = []) => {
  const { t } = useTranslation();
  const [dataSource, setDataSource] = useState<DataItem[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [editingRecord, setEditingRecord] = useState<DataItem | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  
  // 打开添加表单
  const handleAdd = useCallback(() => {
    setFormTitle(t('添加排放源'));
    setEditingRecord(null);
    setFormVisible(true);
  }, [t]);
  
  // 打开编辑表单
  const handleEdit = useCallback((record: DataItem) => {
    setFormTitle(t('编辑排放源'));
    setEditingRecord(record);
    setFormVisible(true);
  }, [t]);
  
  // 处理表单提交
  const handleSubmit = useCallback((values: FormValues) => {
    setConfirmLoading(true);
    
    setTimeout(() => {
      if (editingRecord) {
        // 更新现有记录
        setDataSource(prev => 
          prev.map(item => 
            item.id === editingRecord.id 
              ? { ...item, ...values } 
              : item
          )
        );
        message.success(t('更新成功'));
      } else {
        // 添加新记录
        const newItem: DataItem = {
          key: uuidv4(),
          id: uuidv4(),
          ...values
        };
        setDataSource(prev => [...prev, newItem]);
        message.success(t('添加成功'));
      }
      
      setFormVisible(false);
      setConfirmLoading(false);
      setEditingRecord(null);
    }, 500); // 模拟异步操作
  }, [editingRecord, t]);
  
  // 处理删除
  const handleDelete = useCallback(async (id: string) => {
    setLoading(true);
    
    try {
      // 模拟异步操作
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setDataSource(prev => prev.filter(item => item.id !== id));
      message.success(t('删除成功'));
    } catch (error) {
      message.error(t('删除失败'));
      console.error('删除数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [t]);
  
  // 关闭表单
  const handleCancel = useCallback(() => {
    setFormVisible(false);
    setEditingRecord(null);
  }, []);
  
  return {
    dataSource,
    loading,
    formVisible,
    formTitle,
    editingRecord,
    confirmLoading,
    handleAdd,
    handleEdit,
    handleSubmit,
    handleDelete,
    handleCancel,
    setDataSource,
    setLoading,
  };
};

export default useEmissionSource; 