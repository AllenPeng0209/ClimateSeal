import React, { useEffect, useState } from 'react';
import { useCarbonFlowStore } from '~/components/workbench/CarbonFlow/CarbonFlowStore';
import { Layout } from 'antd';
import { useTranslation } from 'react-i18next';
import { ClientOnly } from 'remix-utils/client-only';

// 导入类型
import type { PanelProps, DataItem, FormValues } from '~/components/workbench/CarbonFlow/panel/types';

// 导入常量
import { KEY_CARBON_PANEL_COLLAPSE } from '~/components/workbench/CarbonFlow/panel/constants';

// 导入组件
import {
  ScenarioInfoCard,
  FileUploadCard,
  EmissionSourceTable,
  EmissionSourceForm,
  ScenarioFormModal,
} from '~/components/workbench/CarbonFlow/panel/components';

// 导入钩子
import {
  useEmissionSource,
  useScenario,
} from '~/components/workbench/CarbonFlow/panel/hooks';

// 导入工具函数
import { getLocalStorage, setLocalStorage } from '~/components/workbench/CarbonFlow/panel/utils';

// 导入样式
import '~/components/workbench/CarbonFlow/panel/styles.css';

const { Sider } = Layout;

/**
 * 碳计算面板组件
 */
const CarbonCalculatorPanel: React.FC<PanelProps> = (props) => {
  const { t } = useTranslation();
  
  // 管理面板折叠状态
  const [collapsed, setCollapsed] = useState<boolean>(false);
  
  // 使用钩子
  const {
    scenarioInfo,
    modalVisible: scenarioModalVisible,
    confirmLoading: scenarioConfirmLoading,
    handleEdit: handleEditScenario,
    handleSubmit: handleSubmitScenario,
    handleCancel: handleCancelScenario,
  } = useScenario();
  
  const {
    dataSource,
    loading,
    formVisible,
    formTitle,
    confirmLoading,
    editingRecord,
    handleAdd,
    handleEdit,
    handleSubmit,
    handleDelete,
    handleCancel,
  } = useEmissionSource();
  
  // 处理面板收起/展开
  const toggleCollapse = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    setLocalStorage(KEY_CARBON_PANEL_COLLAPSE, newCollapsed);
  };
  
  // 加载本地存储的面板状态
  useEffect(() => {
    const savedCollapsed = getLocalStorage(KEY_CARBON_PANEL_COLLAPSE, false);
    if (savedCollapsed !== collapsed) {
      setCollapsed(savedCollapsed);
    }
  }, [collapsed]);
  
  return (
    <div className="carbon-panel-container">
      {/* 场景信息卡片 */}
      <ScenarioInfoCard 
        scenarioInfo={scenarioInfo}
        onEdit={handleEditScenario}
      />
      
      {/* 文件上传卡片 */}
      <FileUploadCard 
        onUpload={async (file) => {
          // 处理文件上传
          console.log('文件上传', file);
          // 实际上传逻辑需在此实现
        }}
      />
      
      {/* 排放源表格 */}
      <EmissionSourceTable 
        dataSource={dataSource}
        loading={loading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      
      {/* 排放源表单模态框 */}
      <EmissionSourceForm 
        visible={formVisible}
        title={formTitle}
        initialValues={editingRecord as Partial<FormValues> | undefined}
        confirmLoading={confirmLoading}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
      />
      
      {/* 场景表单模态框 */}
      <ScenarioFormModal 
        visible={scenarioModalVisible}
        title={t('编辑场景信息')}
        initialValues={scenarioInfo}
        confirmLoading={scenarioConfirmLoading}
        onCancel={handleCancelScenario}
        onSubmit={handleSubmitScenario}
      />
    </div>
  );
};

/**
 * 碳计算面板客户端组件
 * 用于在客户端渲染碳计算面板
 */
export const CarbonCalculatorPanelClient = () => {
  return (
    <ClientOnly fallback={<div>Loading Carbon Flow Panel...</div>}>
      {() => <CarbonCalculatorPanel />}
    </ClientOnly>
  );
};

export default CarbonCalculatorPanel; 