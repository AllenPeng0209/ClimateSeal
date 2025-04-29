import { BaseProviderChecker } from '~/components/@settings/tabs/providers/service-status/base-provider';
import type { StatusCheckResult } from '~/components/@settings/tabs/providers/service-status/types';

export class AliyunStatusChecker extends BaseProviderChecker {
  async checkStatus(): Promise<StatusCheckResult> {
    try {
      // 检查阿里云通义千问API状态 - 使用OpenAI兼容模式端点
      const apiEndpoint = 'https://dashscope.aliyuncs.com/compatible-mode/v1/models';
      const apiStatus = await this.checkApiEndpoint(
        apiEndpoint,
        this.config.headers,
        this.config.testModel
      );

      // 检查阿里云服务状态页面
      const statusPageResponse = await fetch('https://status.aliyun.com/');
      const text = await statusPageResponse.text();

      // 解析服务状态
      const services = {
        dashscope: {
          operational: text.includes('通义千问 ? 正常'),
          degraded: text.includes('通义千问 ? 性能下降'),
          outage: text.includes('通义千问 ? 服务中断') || text.includes('通义千问 ? 部分中断'),
        },
      };

      // 提取最近事件
      const incidents: string[] = [];
      const incidentMatches = text.match(/最近事件(.*?)(?=\w+ \d+, \d{4})/s);

      if (incidentMatches) {
        const recentIncidents = incidentMatches[1]
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line && line.includes('202'));

        incidents.push(...recentIncidents.slice(0, 5));
      }

      // 确定整体状态
      let status: StatusCheckResult['status'] = 'operational';
      const messages: string[] = [];

      if (services.dashscope.outage) {
        status = 'down';
        messages.push('通义千问: 服务中断');
      } else if (services.dashscope.degraded) {
        status = 'degraded';
        messages.push('通义千问: 性能下降');
      } else if (services.dashscope.operational) {
        messages.push('通义千问: 正常运行');
      }

      // 如果状态页面检查失败，回退到端点检查
      if (!statusPageResponse.ok) {
        return {
          status: apiStatus.ok ? 'operational' : 'degraded',
          message: `API状态: ${apiStatus.ok ? '正常' : '异常'}`,
          incidents: ['注意: 由于CORS限制，状态信息有限'],
        };
      }

      return {
        status,
        message: messages.join(', ') || '状态未知',
        incidents,
      };
    } catch (error) {
      console.error('检查阿里云状态时出错:', error);

      // 回退到基本端点检查
      const apiEndpoint = 'https://dashscope.aliyuncs.com/compatible-mode/v1/models';
      const apiStatus = await this.checkApiEndpoint(
        apiEndpoint,
        this.config.headers,
        this.config.testModel
      );

      return {
        status: apiStatus.ok ? 'operational' : 'degraded',
        message: `API状态: ${apiStatus.ok ? '正常' : '异常'}`,
        incidents: ['注意: 由于CORS限制，状态信息有限'],
      };
    }
  }
} 