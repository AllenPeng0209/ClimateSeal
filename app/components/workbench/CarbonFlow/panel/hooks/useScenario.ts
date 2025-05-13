import { useState, useCallback } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import type { ScenarioInfo } from '~/components/workbench/CarbonFlow/panel/types';

/**
 * 场景管理钩子
 */
export const useScenario = (initialData?: ScenarioInfo) => {
  const { t } = useTranslation();
  const [scenarioInfo, setScenarioInfo] = useState<ScenarioInfo>(
    initialData || {
      id: uuidv4(),
      name: t('默认场景'),
      desc: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );
  
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  
  // 打开编辑模态框
  const handleEdit = useCallback(() => {
    setModalVisible(true);
  }, []);
  
  // 处理模态框提交
  const handleSubmit = useCallback((values: { name: string; desc: string }) => {
    setConfirmLoading(true);
    
    // 模拟异步操作
    setTimeout(() => {
      setScenarioInfo(prev => ({
        ...prev,
        ...values,
        updatedAt: new Date().toISOString(),
      }));
      
      setModalVisible(false);
      setConfirmLoading(false);
      message.success(t('场景信息更新成功'));
    }, 500);
  }, [t]);
  
  // 关闭模态框
  const handleCancel = useCallback(() => {
    setModalVisible(false);
  }, []);
  
  return {
    scenarioInfo,
    setScenarioInfo,
    modalVisible,
    confirmLoading,
    handleEdit,
    handleSubmit,
    handleCancel,
  };
};

export default useScenario; 