import { Handle, Position } from 'reactflow';
import { Card } from 'antd';
import type { NodeData } from '../CarbonFlow';

interface UsageNodeProps {
  data: NodeData;
}

export const UsageNode = ({ data }: UsageNodeProps) => {
  return (
    <Card
      className="usage-node"
      title={data.label}
      size="small"
      style={{ 
        width: 250,
        backgroundColor: '#f6ffed',
        borderColor: '#b7eb8f',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#b7eb8f' }} />
      
      <div className="node-content">
        <div className="node-info">
          <div className="info-item">
            <span className="label">阶段:</span>
            <span className="value">{data.lifecycleStage}</span>
          </div>
          <div className="info-item">
            <span className="label">排放类型:</span>
            <span className="value">{data.emissionType}</span>
          </div>
          <div className="info-item">
            <span className="label">碳因子:</span>
            <span className="value">{data.carbonFactor}</span>
          </div>
          <div className="info-item">
            <span className="label">数据来源:</span>
            <span className="value">{data.activitydataSource}</span>
          </div>
          <div className="info-item">
            <span className="label">评分:</span>
            <span className="value">{data.activityScore}</span>
          </div>
          <div className="info-item">
            <span className="label">碳足迹:</span>
            <span className="value">{data.carbonFootprint}</span>
          </div>
          <div className="info-item">
            <span className="label">状态:</span>
            <span className="value">{data.verificationStatus}</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: '#b7eb8f' }} />
    </Card>
  );
}; 