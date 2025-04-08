import React from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { FinalProductNodeData } from '../types';

export const FinalProductNode: React.FC<NodeProps<FinalProductNodeData>> = ({ data }) => {
  return (
    <div className="node final-product-node">
      <Handle type="target" position={Position.Top} />
      <div className="node-content">
        <div className="node-header">
          <div className="node-title">{data.label}</div>
          <div className="node-type">最終產品</div>
        </div>
        <div className="node-body">
          <div className="node-info">
            <div className="info-item">
              <span className="label">產品名稱:</span>
              <span className="value">{data.nodeName}</span>
            </div>
            <div className="info-item">
              <span className="label">生命週期階段:</span>
              <span className="value">{data.lifecycleStage}</span>
            </div>
            <div className="info-item">
              <span className="label">碳排放量:</span>
              <span className="value">{data.carbonFootprint} kgCO2e</span>
            </div>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}; 