import { Handle, Position } from 'reactflow';
import { Card } from 'antd';

interface ProductNodeProps {
  data: {
    label: string;
    nodeName: string;
    lifecycleStage: string;
    emissionType: string;
    carbonFactor: number;
    activitydataSource: string;
    activityScore: number;
    carbonFootprint: number;
  };
}

export const ProductNode = ({ data }: ProductNodeProps) => {
  return (
    <Card
      className="product-node"
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
            <span className="label">排放类型:</span>
            <span className="value">{data.emissionType}</span>
          </div>
          <div className="info-item">
            <span className="label">碳因子:</span>
            <span className="value">{data.carbonFactor}</span>
          </div>
          <div className="info-item">
            <span className="label">评分:</span>
            <span className="value">{data.activityScore}</span>
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