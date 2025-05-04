#!/usr/bin/env python3
import json
import requests
import logging
import sys

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_match(search_term):
    """测试碳因子匹配API"""
    try:
        # 构建请求体
        request_body = {
            "labels": [search_term],
            "top_k": 3,
            "min_score": 0.3,
            "embedding_model": "dashscope_v3",
            "search_method": "script_score"
        }
        
        logger.info(f"发送请求到 http://localhost:9000/match")
        logger.info(f"请求体: {json.dumps(request_body, ensure_ascii=False, indent=2)}")
        
        # 发送请求
        response = requests.post(
            "http://localhost:9000/match",
            headers={"Content-Type": "application/json"},
            json=request_body,
            timeout=30
        )
        
        logger.info(f"响应状态码: {response.status_code}")
        
        if response.ok:
            data = response.json()
            logger.info(f"响应内容: {json.dumps(data, ensure_ascii=False, indent=2)}")
            
            # 检查响应内容中是否有匹配结果
            if data.get("results") and len(data["results"]) > 0:
                result = data["results"][0]
                
                if result.get("matches") and len(result["matches"]) > 0:
                    match = result["matches"][0]
                    logger.info(f"最佳匹配: {match.get('activity_name', '未知')} ({match.get('kg_co2eq', 0)} kg CO2e/{match.get('reference_product_unit', 'kg')})")
                else:
                    logger.warning("没有找到匹配结果")
            else:
                logger.warning("响应中没有结果数据")
        else:
            logger.error(f"请求失败: {response.text}")
            
    except Exception as e:
        logger.error(f"测试匹配失败: {str(e)}", exc_info=True)

if __name__ == "__main__":
    # 从命令行参数获取搜索词
    if len(sys.argv) > 1:
        search_term = sys.argv[1]
    else:
        search_term = input("请输入要匹配的关键词: ")
    
    test_match(search_term) 