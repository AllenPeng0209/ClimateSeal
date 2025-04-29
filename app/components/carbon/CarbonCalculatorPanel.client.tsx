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

// Define a type for individual scores (0-1 range) based on AISummary logic
type AIScoreType = {
    score: number; // Score between 0 and 1
};

// Update ModelScoreType to use AIScoreType for sub-scores and store overall score (0-1)
type ModelScoreType = {
    credibilityScore?: number; // Overall score (assume 0-1 from calculation)
    completeness?: AIScoreType;
    traceability?: AIScoreType;
    massBalance?: AIScoreType;
    validation?: AIScoreType; // Maps to "数据准确性"
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

  // Updated renderScore to return the score value (0-100, rounded) or 0 if invalid/missing/zero
  const renderScore = (scoreData?: AIScoreType): number => {
    if (!scoreData || typeof scoreData.score !== 'number' || isNaN(scoreData.score)) {
        return 0; // Return 0 if data is missing/invalid
    }
    // Convert 0-1 score to 0-100 score, rounded. Handles score === 0 correctly.
    return Math.round(scoreData.score * 100);
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
        <Col>
          <Button onClick={handleCheckpointManage}>检查点管理</Button>
        </Col>
      </Row>

      {/* 2. Upper Row */}
      <Row gutter={16} className="flex-shrink-0">
        {/* 2.1 Scene Info (Top Left) - Adjusted span to 6 */}
        <Col span={6}>
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

        {/* 2.2 Model Score (Top Right) - Adjusted span to 9 and updated content */}
        <Col span={9}>
          <Card
            title="模型评分"
            size="small"
            className="h-full bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor flex flex-col" // Added flex for layout
            bodyStyle={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} // Make body grow and use flex
            >
             {/* Centered Credibility Score - Updated to display actual score */}
             <div className="text-center mb-4 flex-grow flex flex-col justify-center">
                <div className="text-sm text-bolt-elements-textSecondary mb-1">可信得分</div>
                <div className="text-4xl font-bold text-bolt-elements-textPrimary">
                    {/* Display overall score (0-1 converted to 0-100, rounded), or 0 if unavailable/invalid/zero */}
                    {typeof modelScore.credibilityScore === 'number' && !isNaN(modelScore.credibilityScore)
                        ? Math.round(modelScore.credibilityScore * 100)
                        : 0}
                </div>
             </div>

             {/* Sub Scores - 2x2 Grid - Updated to use renderScore with actual data */}
             <div className="flex-shrink-0">
                 <Row gutter={[16, 8]}> {/* Add vertical gutter */}
                    <Col span={12} className="text-xs text-bolt-elements-textSecondary">
                        模型完整度: {renderScore(modelScore.completeness)}/100
                    </Col>
                    <Col span={12} className="text-xs text-bolt-elements-textSecondary">
                        数据可追溯性: {renderScore(modelScore.traceability)}/100
                    </Col>
                    <Col span={12} className="text-xs text-bolt-elements-textSecondary">
                        质量平衡: {renderScore(modelScore.massBalance)}/100
                    </Col>
                    <Col span={12} className="text-xs text-bolt-elements-textSecondary">
                        {/* Changed from validation to accuracy as per image */}
                        数据准确性: {renderScore(modelScore.validation)}/100 {/* Assuming validation score maps to accuracy */}
                    </Col>
                 </Row>
             </div>
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
           <Card title={`排放源清单 - ${selectedStage}`} size="small" className="flex-grow flex flex-col min-h-0 bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor emission-source-table">
                {/* Filters: Use flex justify-between, wrap left items in Space */}
                <div className="mb-4 flex-shrink-0 filter-controls flex justify-between items-center">
                    <Space> {/* Wrap left-aligned items */}
                        <Input placeholder="排放源名称" prefix={<SearchOutlined />} style={{width: 150}} />
                        <Select placeholder="排放源类别" allowClear style={{width: 150}}>
                            {emissionCategories.map(cat => <Select.Option key={cat} value={cat}>{cat}</Select.Option>)}
                        </Select>
                        <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                        <Button icon={<RedoOutlined />}>重置</Button>
                    </Space>
                    {/* Right-aligned button */}
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddEmissionSource}>新增排放源</Button>
                </div>
                {/* Table */}
                <div className="flex-grow overflow-auto emission-source-table-scroll-container"> {/* Add class for scrollbar styling */}
                    <Table
                        className="emission-source-table"
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

// 在文件末尾添加 CSS 样式
const customStyles = `
/* Set explicit dark background for the table */
.emission-source-table .ant-table {
  background: var(--bolt-elements-background-depth-2, #1e1e1e) !important; /* Explicit dark background */
}

.emission-source-table .ant-table-thead > tr > th {
  background: var(--bolt-elements-background-depth-2, #1e1e1e) !important; /* Match table background */
  color: var(--bolt-elements-textSecondary) !important;
  border-bottom: 1px solid var(--bolt-elements-borderColor) !important;
}

.emission-source-table .ant-table-tbody > tr > td {
  background: transparent !important; /* Keep cell background transparent to inherit from row */
  border-bottom: 1px solid var(--bolt-elements-borderColor) !important;
  color: var(--bolt-elements-textPrimary) !important;
}

/* Target potential inner cell wrappers */
.emission-source-table .ant-table-cell {
    background: inherit !important; /* Inherit from td/th */
}

/* Row background - set here so cells inherit */
.emission-source-table .ant-table-tbody > tr {
    background: var(--bolt-elements-background-depth-2, #1e1e1e) !important;
}

/* 悬停和选中行的背景色 - Apply to the row */
.emission-source-table .ant-table-tbody > tr:hover > td {
  background: var(--bolt-hover-background, rgba(255, 255, 255, 0.1)) !important; /* Slightly lighter on hover */
}
.emission-source-table .ant-table-tbody > tr.ant-table-row-selected > td {
    background: rgba(var(--bolt-primary-rgb, 81, 101, 249), 0.2) !important; /* Use theme primary (with fallback) - slightly more opaque */
}

/* Ensure pagination elements match the theme */
.emission-source-table .ant-pagination {
    background: var(--bolt-elements-background-depth-2, #1e1e1e) !important;
    padding: 8px;
    border-radius: 4px;
    margin-top: 16px !important; /* Add some space */
}
.emission-source-table .ant-pagination-item a,
.emission-source-table .ant-pagination-item-link,
.emission-source-table .ant-pagination-item-ellipsis {
    color: var(--bolt-elements-textSecondary) !important;
}
.emission-source-table .ant-pagination-item-active a {
    color: var(--bolt-primary, #5165f9) !important;
    /* background: var(--bolt-primary-background, rgba(81, 101, 249, 0.1)) !important; */
    border-color: var(--bolt-primary, #5165f9) !important;
}
.emission-source-table .ant-pagination-item-active {
    border-color: var(--bolt-primary, #5165f9) !important;
}
.emission-source-table .ant-pagination-disabled .ant-pagination-item-link {
    color: var(--bolt-elements-textDisabled) !important;
}
.emission-source-table .ant-select-selector {
    background-color: var(--bolt-elements-background-depth-1, #2a2a2a) !important;
    border-color: var(--bolt-elements-borderColor) !important;
    color: var(--bolt-elements-textPrimary) !important;
}
.emission-source-table .ant-select-arrow {
    color: var(--bolt-elements-textSecondary) !important;
}

/* 空状态的样式 */
.emission-source-table .ant-empty-description {
    color: var(--bolt-elements-textSecondary) !important;
}

/* --- Dark Scrollbar Styles --- */
/* Class added to the scrollable container div */
.emission-source-table-scroll-container::-webkit-scrollbar {
  width: 8px;  /* Width of vertical scrollbar */
  height: 8px; /* Height of horizontal scrollbar */
}

.emission-source-table-scroll-container::-webkit-scrollbar-track {
  background: var(--bolt-elements-background-depth-1, #2a2a2a); /* Track color slightly lighter than deep background */
  border-radius: 4px;
}

.emission-source-table-scroll-container::-webkit-scrollbar-thumb {
  background-color: var(--bolt-elements-textDisabled, #555); /* Thumb color */
  border-radius: 4px;
  border: 2px solid var(--bolt-elements-background-depth-1, #2a2a2a); /* Creates padding around thumb */
}

.emission-source-table-scroll-container::-webkit-scrollbar-thumb:hover {
  background-color: var(--bolt-elements-textSecondary, #777); /* Thumb color on hover */
}

/* Firefox Scrollbar Styles */
.emission-source-table-scroll-container {
  scrollbar-width: thin; /* "auto" or "thin" */
  scrollbar-color: var(--bolt-elements-textDisabled, #555) var(--bolt-elements-background-depth-1, #2a2a2a); /* thumb color track color */
}

/* --- Filter Control Height Adjustment & Hover Glow --- */

/* Base styles + transition for smooth effect */
.filter-controls .ant-input-affix-wrapper,
.filter-controls .ant-select-selector,
.filter-controls .ant-btn {
    height: 32px !important; /* Standard Antd default height */
    display: flex !important; /* Helps vertical alignment */
    align-items: center !important;
    box-sizing: border-box !important;
    border-color: var(--bolt-elements-borderColor) !important; /* Consistent border color */
    background-color: var(--bolt-elements-background-depth-1, #2a2a2a) !important; /* Consistent background */
    color: var(--bolt-elements-textPrimary) !important; /* Consistent text color for input/select */
    transition: border-color 0.2s ease-out, box-shadow 0.2s ease-out !important; /* Added transition */
}

/* Hover State for Input/Select */
.filter-controls .ant-input-affix-wrapper:hover,
.filter-controls .ant-select-selector:hover {
    border-color: var(--bolt-primary, #5165f9) !important;
    /* Added Glow Effect */
    box-shadow: 0 0 5px 1px rgba(var(--bolt-primary-rgb, 81, 101, 249), 0.5) !important;
}

/* Hover State for Buttons in Filter Controls */
.filter-controls .ant-btn:hover {
    border-color: var(--bolt-primary, #5165f9) !important;
     /* Added Glow Effect - Adjust color/opacity slightly for buttons if desired */
    box-shadow: 0 0 5px 1px rgba(var(--bolt-primary-rgb, 81, 101, 249), 0.5) !important;
    /* Optional: Slightly brighten background on hover for default buttons */
    /* background-color: var(--bolt-hover-background) !important; */
}
/* Keep primary button background on hover, but apply glow */
.filter-controls .ant-btn-primary:hover {
    /* background-color: var(--bolt-primary-hover, #4155e7) !important; /* Antd might handle this */
    border-color: var(--bolt-primary-hover, #4155e7) !important; /* Darker border for primary */
    box-shadow: 0 0 5px 1px rgba(var(--bolt-primary-rgb, 81, 101, 249), 0.7) !important; /* Slightly stronger glow */
}

/* Focus State for Input/Select (Keep existing focus ring style) */
.filter-controls .ant-input-affix-wrapper-focused,
.filter-controls .ant-select-focused .ant-select-selector {
    border-color: var(--bolt-primary, #5165f9) !important;
    box-shadow: 0 0 0 2px rgba(var(--bolt-primary-rgb, 81, 101, 249), 0.2) !important; /* Consistent focus ring */
}

/* --- Glow Effect for Top Buttons --- */

/* Base transition for top buttons */
.p-4 > .ant-row:first-child .ant-btn {
    transition: border-color 0.2s ease-out, box-shadow 0.2s ease-out, background-color 0.2s ease-out !important;
}

/* Hover state for top buttons */
.p-4 > .ant-row:first-child .ant-btn:hover {
    border-color: var(--bolt-primary, #5165f9) !important;
    box-shadow: 0 0 5px 1px rgba(var(--bolt-primary-rgb, 81, 101, 249), 0.5) !important;
}

/* Adjust primary top button hover if needed */
.p-4 > .ant-row:first-child .ant-btn-primary:hover {
    border-color: var(--bolt-primary-hover, #4155e7) !important;
    box-shadow: 0 0 5px 1px rgba(var(--bolt-primary-rgb, 81, 101, 249), 0.7) !important;
}

/* --- Drawer Dark Theme Styles --- */

.ant-drawer-content-wrapper {
  /* Match card background */
  background-color: var(--bolt-elements-background-depth-2, #1e1e1e) !important;
}

.ant-drawer-header {
  background-color: var(--bolt-elements-background-depth-2, #1e1e1e) !important;
  border-bottom: 1px solid var(--bolt-elements-borderColor, #333) !important;
}

.ant-drawer-title {
  color: var(--bolt-elements-textPrimary, #fff) !important;
}

.ant-drawer-close {
  color: var(--bolt-elements-textSecondary, #ccc) !important;
}
.ant-drawer-close:hover {
  color: var(--bolt-elements-textPrimary, #fff) !important;
}

.ant-drawer-body {
  background-color: var(--bolt-elements-background-depth-2, #1e1e1e) !important;
  color: var(--bolt-elements-textPrimary, #fff) !important; /* Default text color in body */
}

/* Style form elements within the drawer */
.ant-drawer-body .ant-form-item-label > label {
    color: var(--bolt-elements-textSecondary, #ccc) !important; /* Lighter label color */
}

/* Force styling on ALL relevant input/select elements within the drawer's form items */
.ant-drawer-body .ant-form-item .ant-input,
.ant-drawer-body .ant-form-item .ant-input-affix-wrapper,
.ant-drawer-body .ant-form-item .ant-input-number,
.ant-drawer-body .ant-form-item .ant-select-selector {
    background-color: var(--bolt-elements-background-depth-1, #2a2a2a) !important;
    border-color: var(--bolt-elements-borderColor, #333) !important;
    color: var(--bolt-elements-textPrimary, #fff) !important;
}
/* Ensure the input element *inside* the affix wrapper also gets the styles */
.ant-drawer-body .ant-form-item .ant-input-affix-wrapper input.ant-input {
    background-color: transparent !important; /* Let wrapper handle background */
    color: var(--bolt-elements-textPrimary, #fff) !important;
    border: none !important; /* Remove border as wrapper has it */
}

/* Placeholders */
.ant-drawer-body .ant-form-item .ant-input-affix-wrapper input::placeholder, /* Specificity for placeholder in wrapper */
.ant-drawer-body .ant-input-number::placeholder,
.ant-drawer-body .ant-select-selection-placeholder {
    color: var(--bolt-elements-textDisabled, #555) !important; /* Dimmer placeholder */
}

/* Style buttons in the drawer footer area (even if footer is null, the Form.Item acts like one) */
.ant-drawer-body .ant-form-item:last-child {
     /* You might need a specific class if this isn't always the last item */
    background-color: var(--bolt-elements-background-depth-2, #1e1e1e) !important; /* Match drawer body */
    margin-top: 24px; /* Add some space above buttons */
    padding-top: 10px; /* Padding like a footer */
    border-top: 1px solid var(--bolt-elements-borderColor, #333) !important; /* Separator line */
}

.ant-drawer-body .ant-btn {
     /* Standard button styling */
}
.ant-drawer-body .ant-btn-primary {
     /* Primary button styling (might inherit theme) */
}
.ant-drawer-body .ant-btn-default {
     background-color: var(--bolt-elements-background-depth-1, #2a2a2a) !important;
     border-color: var(--bolt-elements-borderColor, #333) !important;
     color: var(--bolt-elements-textPrimary, #fff) !important;
}
.ant-drawer-body .ant-btn-default:hover {
    border-color: var(--bolt-primary, #5165f9) !important;
    color: var(--bolt-primary, #5165f9) !important;
}


`;

// 注入样式到 head
if (typeof window !== 'undefined') {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = customStyles;
    document.head.appendChild(styleTag);
}

// 添加 ClientOnly 包装器，如果需要确保此组件仅在客户端渲染
export const CarbonCalculatorPanelClient = () => (
  <ClientOnly fallback={<div>Loading Panel...</div>}>
    {() => <CarbonCalculatorPanel />}
  </ClientOnly>
); 