import React, { useState } from 'react';
import { Button, Card, Col, Row, Space, Table, Input, Select, Modal, Drawer, Form, message, Popconfirm } from 'antd'; // Assuming Ant Design is used based on other files
import { SettingOutlined, PlusOutlined, SearchOutlined, RedoOutlined } from '@ant-design/icons'; // Example icons
import { ClientOnly } from 'remix-utils/client-only'; // May need this if child components are client-only

// Placeholder data types (replace with actual types later)
type SceneInfoType = {
  verificationLevel?: string;
  standard?: string;
  productName?: string;
};

type ModelScoreType = {
  completeness?: { score: number; total: number };
  traceability?: { score: number; total: number };
  massBalance?: { score: number; total: number };
  validation?: { score: number; total: number };
};

type EmissionSource = {
  id: string;
  name: string;
  category: string;
  activityData: number;
  activityUnit: string;
  conversionFactor: number;
  factorName: string;
  factorUnit: string;
  factorSource: string;
  updatedAt: string;
  updatedBy: string;
};

const lifecycleStages = [
  '原材料获取阶段',
  '生产阶段',
  '分销运输阶段',
  '使用阶段',
  '寿命终止阶段',
];

const emissionCategories = ['原材料', '包装材料', '能耗', '运输', '废弃物'];

export function CarbonCalculatorPanel() {
  const [sceneInfo, setSceneInfo] = useState<SceneInfoType>({}); // Placeholder state
  const [modelScore, setModelScore] = useState<ModelScoreType>({}); // Placeholder state
  const [selectedStage, setSelectedStage] = useState<string>(lifecycleStages[0]);
  const [emissionSources, setEmissionSources] = useState<EmissionSource[]>([]); // Placeholder state
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isEmissionDrawerVisible, setIsEmissionDrawerVisible] = useState(false);
  const [editingEmissionSource, setEditingEmissionSource] = useState<EmissionSource | null>(null);

  // --- Placeholder functions ---
  const handleAIComplete = () => {
    console.log('一键AI补全 clicked');
    alert('功能待实现');
  };

  const handleCheckpointManage = () => {
    console.log('检查点管理 clicked');
    alert('功能待实现');
  };

  const handleOpenSettings = () => setIsSettingsModalVisible(true);
  const handleCloseSettings = () => setIsSettingsModalVisible(false);
  const handleSaveSettings = (values: any) => {
    console.log('Saving settings:', values);
    // TODO: API call to save settings
    setSceneInfo({
        verificationLevel: values.verificationLevel,
        standard: values.standard,
        productName: values.productName,
    });
    message.success('场景信息已保存');
    handleCloseSettings();
  };


  const handleStageSelect = (stage: string) => {
    setSelectedStage(stage);
    // TODO: Fetch emission sources for the selected stage
    console.log('Selected stage:', stage);
    // Placeholder: Clear sources on stage change
    setEmissionSources([]);
  };

  const handleAddEmissionSource = () => {
    setEditingEmissionSource(null);
    setIsEmissionDrawerVisible(true);
  };

  const handleEditEmissionSource = (record: EmissionSource) => {
    setEditingEmissionSource(record);
    setIsEmissionDrawerVisible(true);
  };

  const handleDeleteEmissionSource = (id: string) => {
    console.log('Deleting emission source:', id);
    // TODO: API call to delete emission source
    setEmissionSources(prev => prev.filter(item => item.id !== id));
    message.success('排放源已删除');
  };

   const handleCloseEmissionDrawer = () => {
    setIsEmissionDrawerVisible(false);
    setEditingEmissionSource(null);
   };

   const handleSaveEmissionSource = (values: any) => {
     console.log('Saving emission source:', values);
     if (editingEmissionSource) {
       // TODO: API call to update
       setEmissionSources(prev => prev.map(item => item.id === editingEmissionSource.id ? { ...item, ...values, id: item.id, updatedAt: new Date().toISOString(), updatedBy: 'User' } : item));
       message.success('排放源已更新');
     } else {
       // TODO: API call to create
       const newSource: EmissionSource = {
         ...values,
         id: Date.now().toString(), // Temporary ID
         updatedAt: new Date().toISOString(),
         updatedBy: 'User'
       };
       setEmissionSources(prev => [...prev, newSource]);
       message.success('排放源已添加');
     }
     handleCloseEmissionDrawer();
   };

  // --- Render functions ---

  const renderScore = (scoreData?: { score: number; total: number }) => {
    if (!scoreData) return 'N/A';
    return `${scoreData.score}/${scoreData.total}分`;
  };

  const emissionTableColumns = [
      { title: '序号', dataIndex: 'index', key: 'index', render: (_: any, __: any, index: number) => index + 1, width: 60 },
      { title: '排放源名称', dataIndex: 'name', key: 'name' },
      { title: '排放源类别', dataIndex: 'category', key: 'category' },
      { title: '活动数据', dataIndex: 'activityData', key: 'activityData' },
      { title: '活动数据单位', dataIndex: 'activityUnit', key: 'activityUnit' },
      { title: '单位转换系数', dataIndex: 'conversionFactor', key: 'conversionFactor' },
      { title: '排放因子名称', dataIndex: 'factorName', key: 'factorName' },
      { title: '排放因子单位', dataIndex: 'factorUnit', key: 'factorUnit' },
      { title: '排放因子来源', dataIndex: 'factorSource', key: 'factorSource' },
      { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', render: (ts: string) => new Date(ts).toLocaleString() },
      { title: '更新人', dataIndex: 'updatedBy', key: 'updatedBy' },
      {
          title: '操作',
          key: 'action',
          fixed: 'right' as 'right',
          width: 150,
          render: (_: any, record: EmissionSource) => (
              <Space size="middle">
                  <Button type="link" onClick={() => handleEditEmissionSource(record)}>编辑</Button>
                  {/* <Button type="link">查看</Button> */}
                  <Popconfirm title="确定删除吗?" onConfirm={() => handleDeleteEmissionSource(record.id)}>
                      <Button type="link" danger>删除</Button>
                  </Popconfirm>
              </Space>
          ),
      },
  ];


  return (
    <div className="flex flex-col h-full p-4 space-y-4 bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary">
      {/* 1. Top Buttons */}
      <Row gutter={16} className="flex-shrink-0">
        <Col>
          <Button type="primary" onClick={handleAIComplete}>一键AI补全</Button>
        </Col>
        {/* 移除检查点管理按钮 */}
        {/* <Col>
          <Button onClick={handleCheckpointManage}>检查点管理</Button>
        </Col> */}
      </Row>

      {/* 2. Upper Row */}
      <Row gutter={16} className="flex-shrink-0">
        {/* 2.1 Scene Info (Top Left) */}
        <Col span={12}>
          <Card
            title="场景信息"
            size="small"
            extra={<Button type="link" icon={<SettingOutlined />} onClick={handleOpenSettings}>设置</Button>}
            className="h-full bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor"
          >
            <Space direction="vertical" className="w-full">
              <div>预期核验等级: {sceneInfo.verificationLevel || '未设置'}</div>
              <div>满足标准: {sceneInfo.standard || '未设置'}</div>
              <div>核算产品: {sceneInfo.productName || '未设置'}</div>
            </Space>
          </Card>
        </Col>

        {/* 2.2 Model Score (Top Right) */}
        <Col span={12}>
          <Card
            title="模型评分"
            size="small"
            className="h-full bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor"
            >
             <Space direction="vertical" className="w-full">
                <div>模型完整度评分: {renderScore(modelScore.completeness)}</div>
                <div>数据可追溯性评分: {renderScore(modelScore.traceability)}</div>
                <div>质量平衡评分: {renderScore(modelScore.massBalance)}</div>
                <div>数据验证评分: {renderScore(modelScore.validation)}</div>
             </Space>
          </Card>
        </Col>
      </Row>

      {/* 3. Lower Row */}
      <Row gutter={16} className="flex-grow min-h-0"> {/* flex-grow + min-h-0 allows flex item to shrink/grow */}
         {/* 3.1 Lifecycle Navigation (Bottom Left) */}
         <Col span={6} className="flex flex-col h-full">
           <Card title="生命周期阶段" size="small" className="flex-grow flex flex-col min-h-0 bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor">
                <div className="flex-grow overflow-y-auto"> {/* Scrollable list */}
                 <Space direction="vertical" className="w-full">
                    {lifecycleStages.map(stage => (
                      <Button
                        key={stage}
                        type={selectedStage === stage ? 'primary' : 'text'}
                        onClick={() => handleStageSelect(stage)}
                        block
                        className="text-left"
                      >
                        {stage}
                      </Button>
                    ))}
                 </Space>
                 </div>
           </Card>
         </Col>

         {/* 3.2 Emission Source List (Bottom Right) */}
         <Col span={18} className="flex flex-col h-full">
           <Card title={`排放源清单 - ${selectedStage}`} size="small" className="flex-grow flex flex-col min-h-0 bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor">
                {/* Filters */}
                <Space className="mb-4 flex-shrink-0">
                    <Input placeholder="排放源名称" prefix={<SearchOutlined />} />
                    <Select placeholder="排放源类别" allowClear style={{width: 150}}>
                        {emissionCategories.map(cat => <Select.Option key={cat} value={cat}>{cat}</Select.Option>)}
                    </Select>
                    <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                    <Button icon={<RedoOutlined />}>重置</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddEmissionSource}>新增排放源</Button>
                </Space>
                {/* Table */}
                <div className="flex-grow overflow-auto"> {/* Scrollable table area */}
                    <Table
                        columns={emissionTableColumns}
                        dataSource={emissionSources}
                        rowKey="id"
                        size="small"
                        pagination={{ pageSize: 10 }} // Example pagination
                        scroll={{ x: 1500, y: 'calc(100vh - 500px)' }} // Adjust scroll values as needed
                    />
                </div>
           </Card>
         </Col>
      </Row>

      {/* Modals and Drawers */}
      <Modal
        title="设置场景信息"
        open={isSettingsModalVisible}
        onCancel={handleCloseSettings}
        footer={null} // Use Form's footer
      >
            <Form layout="vertical" onFinish={handleSaveSettings} initialValues={sceneInfo}>
                <Form.Item name="verificationLevel" label="预期核验等级" rules={[{ required: true, message: '请选择核验等级' }]}>
                    <Select placeholder="选择核验等级">
                        <Select.Option value="准核验级别">准核验级别</Select.Option>
                        <Select.Option value="披露级别">披露级别</Select.Option>
                    </Select>
                </Form.Item>
                 <Form.Item name="standard" label="满足标准" rules={[{ required: true, message: '请选择满足标准' }]}>
                    <Select placeholder="选择满足标准">
                        <Select.Option value="ISO14067">ISO14067</Select.Option>
                        <Select.Option value="欧盟电池法">欧盟电池法</Select.Option>
                    </Select>
                </Form.Item>
                 <Form.Item name="productName" label="核算产品" rules={[{ required: true, message: '请输入核算产品名称' }]}>
                    <Input placeholder="输入产品名称" />
                </Form.Item>
                 <Form.Item className="text-right">
                     <Space>
                        <Button onClick={handleCloseSettings}>取消</Button>
                        <Button type="primary" htmlType="submit">保存</Button>
                     </Space>
                 </Form.Item>
            </Form>
      </Modal>

       <Drawer
        title={editingEmissionSource ? "编辑排放源" : "新增排放源"}
        width={500}
        onClose={handleCloseEmissionDrawer}
        open={isEmissionDrawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
        footer={null} // Using Form footer
      >
        <Form layout="vertical" onFinish={handleSaveEmissionSource} initialValues={editingEmissionSource || {}}>
           <Form.Item name="name" label="排放源名称" rules={[{ required: true, message: '请输入排放源名称' }]}>
              <Input placeholder="请输入排放源名称" />
           </Form.Item>
            <Form.Item name="category" label="排放源类别" rules={[{ required: true, message: '请选择排放源类别' }]}>
              <Select placeholder="请选择排放源类别">
                 {emissionCategories.map(cat => <Select.Option key={cat} value={cat}>{cat}</Select.Option>)}
              </Select>
           </Form.Item>
           <Form.Item name="activityData" label="活动数据" rules={[{ required: true, message: '请输入活动数据' }]}>
              <Input type="number" step="0.0000000001" placeholder="请输入活动数据" />
           </Form.Item>
            <Form.Item name="activityUnit" label="活动数据单位" rules={[{ required: true, message: '请输入活动数据单位' }]}>
              <Input placeholder="请输入活动数据单位" />
           </Form.Item>
           <Form.Item name="conversionFactor" label="单位转换系数" rules={[{ required: true, message: '请输入单位转换系数' }]}>
              <Input type="number" step="0.0000000001" placeholder="请输入单位转换系数" />
           </Form.Item>
           <Form.Item name="factorName" label="排放因子名称" rules={[{ required: true, message: '请输入排放因子名称' }]}>
              <Input placeholder="请输入排放因子名称" />
           </Form.Item>
            <Form.Item name="factorUnit" label="排放因子单位" rules={[{ required: true, message: '请输入排放因子单位' }]}>
              <Input placeholder="请输入排放因子单位" />
           </Form.Item>
           <Form.Item name="factorSource" label="排放因子来源" rules={[{ required: true, message: '请输入排放因子来源' }]}>
              <Input placeholder="请输入排放因子来源" />
           </Form.Item>
           <Form.Item className="text-right">
             <Space>
                 <Button onClick={handleCloseEmissionDrawer}>取消</Button>
                 <Button type="primary" htmlType="submit">保存</Button>
             </Space>
            </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

// 恢复 CarbonCalculatorPanelClient 原始导出
export const CarbonCalculatorPanelClient = () => (
  <ClientOnly fallback={<div>Loading Panel...</div>}>
    {() => <CarbonCalculatorPanel />}
  </ClientOnly>
); 