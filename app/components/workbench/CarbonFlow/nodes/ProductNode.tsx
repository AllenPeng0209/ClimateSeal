import { Handle, Position } from 'reactflow';
import { Card } from 'antd';

interface ProductNodeProps {
  data: {
    label: string;
    nodeName: string;
    quantity: number;
    lifecycleStage: string;
    emissionType: string;
    carbonFactor: number;
    activitydataSource: string;
    activityScore: number;
    carbonFootprint: number;
    activityScorelevel?: '高' | '中' | '低' | '空';
  };
}

export const ProductNode = ({ data }: ProductNodeProps) => {
  const getActivityScore = (level?: string) => {
    switch (level) {
      case '高': return 'high';
      case '中': return 'medium';
      case '低': return 'low';
      case '空': return 'very-low';
      default: return 'very-low';
    }
  };

  return (
    <div 
      className="node product-node"
      data-activity-score={getActivityScore(data.activityScorelevel)}
    >
      <Handle type="target" position={Position.Top} />
      
      <div className="node-content">
        <div className="node-header">
          <div className="node-title">{data.label}</div>
          <div className="node-type">原材料节点</div>
        </div>
        <div className="node-info">
          <div className="info-item">
            <span className="label">原材料名称:</span>
            <span className="value">{data.nodeName}</span>
          </div>
          <div className="info-item">
            <span className="label">生命週期阶段:</span>
            <span className="value">{data.lifecycleStage}</span>
          </div>
          <div className="info-item">
            <span className="label">排放类型:</span>
            <span className="value">{data.emissionType}</span>
          </div>
          <div className="info-item">
            <span className="label">数量:</span>
            <span className="value">{data.quantity}</span>
          </div>  
          <div className="info-item">
            <span className="label">碳排放因子:</span>
            <span className="value">{data.carbonFactor}</span>
          </div>
          
          <div className="info-item">
            <span className="label">碳排放量:</span>
            <span className="value">{data.carbonFootprint}</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}; 