import React from 'react';
import { Card, Typography, Descriptions, Button } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { formatDate } from '~/components/workbench/CarbonFlow/panel/utils';
import type { ScenarioInfo } from '~/components/workbench/CarbonFlow/panel/types';

import '~/components/workbench/CarbonFlow/panel/styles.css';

const { Title } = Typography;

interface ScenarioInfoCardProps {
  scenarioInfo: ScenarioInfo;
  onEdit: () => void;
}

/**
 * 场景信息卡片组件
 */
const ScenarioInfoCard: React.FC<ScenarioInfoCardProps> = ({ scenarioInfo, onEdit }) => {
  const { t } = useTranslation();
  
  return (
    <Card
      className="scenario-info-card"
      title={<Title level={5}>{t('场景信息')}</Title>}
      extra={<Button type="text" icon={<EditOutlined />} onClick={onEdit} aria-label="编辑场景" />}
    >
      <Descriptions column={1}>
        <Descriptions.Item label={t('名称')}>{scenarioInfo.name}</Descriptions.Item>
        <Descriptions.Item label={t('描述')}>{scenarioInfo.desc || '暂无描述'}</Descriptions.Item>
        <Descriptions.Item label={t('创建时间')}>{formatDate(scenarioInfo.createdAt)}</Descriptions.Item>
        <Descriptions.Item label={t('更新时间')}>{formatDate(scenarioInfo.updatedAt)}</Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

export default ScenarioInfoCard; 