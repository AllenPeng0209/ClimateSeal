import type { Node } from 'reactflow';
import type { NodeData } from '~/types/nodes';

export interface CarbonFactorResult {
  factor: number;
  activityName: string;
  unit: string;
}

/**
 * 碳因子匹配服务
 * 提供与碳因子匹配相关的API调用和数据处理
 */
export class CarbonFactorService {
  private readonly API_URL = 'https://api.climateseals.com/match';
  private readonly API_TIMEOUT = 15000; // 15秒超时

  /**
   * 从API获取碳因子
   * @param node 节点数据
   * @returns 碳因子结果或null
   */
  public async fetchCarbonFactor(node: Node<NodeData>): Promise<CarbonFactorResult | null> {
    try {
      // 获取节点标签作为查询参数
      const label = node.data.label || '';
      if (!label || label.trim() === '') {
        console.warn(`节点 ${node.id} 没有有效的标签用于碳因子查询`);
        return null;
      }

      console.log(`尝试为节点 ${node.id} (${label}) 从API获取碳因子`);
        
      // 构建请求体
      const requestBody = {
        labels: [label],
        top_k: 3, // 获取最匹配的三个结果
        min_score: 0.3, // 最小匹配分数阈值
        embedding_model: 'dashscope_v3', // 使用默认的嵌入模型
        search_method: 'script_score' // 使用默认的搜索方法
      };

      console.log('请求参数:', requestBody);
      
      // 使用AbortController设置超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.API_TIMEOUT);
      
      try {
        // 调用API
        const response = await fetch(this.API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId); // 清除超时
        
        // 检查响应状态
        if (!response.ok) {
          throw new Error(`API返回错误状态: ${response.status}`);
        }
        
        // 尝试解析响应
        let data;
        try {
          data = await response.json();
          console.log('碳因子API响应:', data);
        } catch (parseError) {
          console.error('解析API响应失败:', parseError);
          throw new Error('解析响应失败');
        }

        // 验证响应格式
        if (data.results && 
            data.results.length > 0 && 
            data.results[0].matches && 
            data.results[0].matches.length > 0) {
          // 正确访问匹配结果
          const bestMatch = data.results[0].matches[0];
          return {
            factor: bestMatch.kg_co2eq || 0,
            activityName: bestMatch.activity_name || '未知活动', 
            unit: bestMatch.reference_product_unit || 'kg'
          };
        } else {
          // API没有返回匹配结果，返回默认值而不是null
          console.warn('API没有返回匹配结果，使用默认值');
          return {
            factor: 1.0, // 默认碳因子值
            activityName: `${label}(默认)`, 
            unit: 'kg'
          };
        }
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          console.error('API请求超时');
          // 超时时返回默认值而不是null
          return {
            factor: 1.0,
            activityName: `${label}(默认值-请求超时)`,
            unit: 'kg'
          };
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('获取碳因子失败:', error);
      return null;
    }
  }

  /**
   * 批量匹配碳因子
   * @param nodes 节点列表
   * @returns 匹配结果字典，键为节点ID
   */
  public async batchMatchCarbonFactors(nodes: Node<NodeData>[]): Promise<Record<string, CarbonFactorResult | null>> {
    const results: Record<string, CarbonFactorResult | null> = {};
    
    // 并行处理所有节点的匹配请求
    const matchPromises = nodes.map(async (node) => {
      const result = await this.fetchCarbonFactor(node);
      results[node.id] = result;
    });
    
    await Promise.all(matchPromises);
    return results;
  }
}

// 导出单例实例以方便使用
export const carbonFactorService = new CarbonFactorService(); 