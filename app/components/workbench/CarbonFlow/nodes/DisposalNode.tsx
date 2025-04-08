import { Handle, Position } from 'reactflow';
import { Card } from 'antd';

interface DisposalNodeProps {
  data: {
    label: string;
    nodeName: string;
    lifecycleStage: string;
    emissionType: string;
    carbonFactor: number;
    activitydataSource: string;
    activityScore: number;
    carbonFootprint: number;
    recyclingRate: number;
    landfillPercentage: number;
    incinerationPercentage: number;
    compostPercentage: number;
    reusePercentage: number;
  };
}

export const DisposalNode = ({ data }: DisposalNodeProps) => {
  return (
    <Card
      className="disposal-node"
      title={data.label}
      size="small"
      style={{ width: 200 }}
    >
      <Handle type="target" position={Position.Top} />
      
      <div className="node-content">
        <div className="node-info">
          <div className="info-item">
            <span className="label">阶段:</span>
            <span className="value">{data.lifecycleStage}</span>
          </div>
          <div className="info-item">
            <span className="label">回收率:</span>
            <span className="value">{data.recyclingRate}%</span>
          </div>
          <div className="info-item">
            <span className="label">填埋比例:</span>
            <span className="value">{data.landfillPercentage}%</span>
          </div>
          <div className="info-item">
            <span className="label">焚烧比例:</span>
            <span className="value">{data.incinerationPercentage}%</span>
          </div>
          <div className="info-item">
            <span className="label">堆肥比例:</span>
            <span className="value">{data.compostPercentage}%</span>
          </div>
          <div className="info-item">
            <span className="label">重复使用比例:</span>
            <span className="value">{data.reusePercentage}%</span>
          </div>
          <div className="info-item">
            <span className="label">碳足迹:</span>
            <span className="value">{data.carbonFootprint}</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
}; 