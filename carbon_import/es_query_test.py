import requests
import json
import logging
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Optional
from sentence_transformers import SentenceTransformer
from IPython import embed
# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'es_query_{datetime.now().strftime("%Y%m%d")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ESQueryTester:
    def __init__(self, es_endpoint: str, index_name: str, username: str, password: str):
        self.es_endpoint = es_endpoint.rstrip('/')
        self.index_name = index_name
        self.auth = (username, password)
        self.headers = {'Content-Type': 'application/json'}
        # 初始化多语言向量模型
        self.model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

    def execute_query(self, query: Dict[str, Any]) -> Dict:
        """执行查询并返回结果"""
        url = f"{self.es_endpoint}/{self.index_name}/_search"
        try:
            response = requests.post(
                url,
                headers=self.headers,
                auth=self.auth,
                json=query,
                verify=False
            )
            return response.json()
        except Exception as e:
            logger.error(f"查询执行错误: {str(e)}")
            return {}

    def print_results(self, results: Dict, query_name: str):
        """格式化打印结果"""
        logger.info(f"\n=== {query_name} ===")
        hits = results.get('hits', {}).get('hits', [])
        total = results.get('hits', {}).get('total', {}).get('value', 0)
        logger.info(f"找到 {total} 条匹配记录")
        
        if hits:
            logger.info("\n前3条记录:")
            for hit in hits[:3]:
                logger.info(f"\n文档ID: {hit['_id']}")
                logger.info(f"Score: {hit['_score']}")
                logger.info(json.dumps(hit['_source'], indent=2, ensure_ascii=False))
        logger.info("=" * 50)

    def test_match_query(self, field: str, value: str):
        """精确匹配查询"""
        query = {
            "query": {
                "match": {
                    field: value
                }
            }
        }
        results = self.execute_query(query)
        self.print_results(results, f"字段 '{field}' 匹配 '{value}'")

    def test_term_query(self, field: str, value: str):
        """关键词精确匹配"""
        query = {
            "query": {
                "term": {
                    field: value
                }
            }
        }
        results = self.execute_query(query)
        self.print_results(results, f"字段 '{field}' 精确匹配 '{value}'")

    def test_range_query(self, field: str, gte: float = None, lte: float = None):
        """范围查询"""
        range_params = {}
        if gte is not None:
            range_params["gte"] = gte
        if lte is not None:
            range_params["lte"] = lte

        query = {
            "query": {
                "range": {
                    field: range_params
                }
            }
        }
        results = self.execute_query(query)
        self.print_results(results, f"字段 '{field}' 范围查询 {range_params}")

    def test_multi_match_query(self, search_term: str, fields: list):
        """多字段匹配查询"""
        query = {
            "query": {
                "multi_match": {
                    "query": search_term,
                    "fields": fields
                }
            }
        }
        results = self.execute_query(query)
        self.print_results(results, f"多字段匹配 '{search_term}' in {fields}")

    def test_fuzzy_search(self, field: str, value: str, fuzziness: int = 2):
        """模糊查询示例"""
        query = {
            "query": {
                "fuzzy": {
                    field: {
                        "value": value,
                        "fuzziness": fuzziness,
                        "max_expansions": 50
                    }
                }
            }
        }
        results = self.execute_query(query)
        self.print_results(results, f"模糊查询 '{field}' 近似匹配 '{value}'")

    def test_wildcard_search(self, field: str, pattern: str):
        """通配符查询示例"""
        query = {
            "query": {
                "wildcard": {
                    field: {
                        "value": pattern
                    }
                }
            }
        }
        results = self.execute_query(query)
        self.print_results(results, f"通配符查询 '{field}' 模式 '{pattern}'")

    def test_prefix_search(self, field: str, prefix: str):
        """前缀查询示例"""
        query = {
            "query": {
                "prefix": {
                    field: prefix
                }
            }
        }
        results = self.execute_query(query)
        self.print_results(results, f"前缀查询 '{field}' 前缀 '{prefix}'")

    def test_multi_match_fuzzy(self, value: str, fields: List[str]):
        """多字段模糊查询示例"""
        query = {
            "query": {
                "multi_match": {
                    "query": value,
                    "fields": fields,
                    "fuzziness": "AUTO"
                }
            }
        }
        results = self.execute_query(query)
        self.print_results(results, f"多字段模糊查询 '{value}' in {fields}")

    def test_combined_search(self, must_field: str, must_value: str, should_field: str, should_value: str):
        """组合查询示例"""
        query = {
            "query": {
                "bool": {
                    "must": [
                        {"match": {must_field: must_value}}
                    ],
                    "should": [
                        {"match": {should_field: should_value}}
                    ],
                    "minimum_should_match": 1
                }
            }
        }
        results = self.execute_query(query)
        self.print_results(results, f"组合查询 (must: {must_field}={must_value}, should: {should_field}={should_value})")

    def get_field_names(self):
        """获取索引中的所有字段名"""
        url = f"{self.es_endpoint}/{self.index_name}/_mapping"
        response = requests.get(url, auth=self.auth, verify=False)
        if response.status_code == 200:
            mappings = response.json()[self.index_name]['mappings']
            fields = list(mappings.get('properties', {}).keys())
            logger.info("\n可用字段:")
            logger.info(json.dumps(fields, indent=2, ensure_ascii=False))
            return fields
        return []

    def vector_search(self, query_text: str, k: int = 5):
        """使用文本进行向量搜索"""
        # 将查询文本转换为向量
        query_vector = self.model.encode(query_text).tolist()
        
        query = {
            "size": k,
            "_source": {
                "includes": ["content_zh", "content_en", "activity_name", "geography"]
            },
            "query": {
                "script_score": {
                    "query": {"match_all": {}},
                    "script": {
                        "source": "cosineSimilarity(params.query_vector, 'content_vector') + 1.0",
                        "params": {"query_vector": query_vector}
                    }
                }
            }
        }

        results = self.execute_query(query)
        self.print_results(results, f"向量搜索 '{query_text}'")
        return results

    def hybrid_search(self, query_text: str, k: int = 5):
        """混合查询：结合文本搜索和向量搜索"""
        query_vector = self.model.encode(query_text).tolist()
        
        query = {
            "size": k,
            "_source": {
                "includes": ["content_zh", "content_en", "activity_name", "geography"]
            },
            "query": {
                "bool": {
                    "should": [
                        {
                            "multi_match": {
                                "query": query_text,
                                "fields": ["content_zh^3", "content_en^2", "activity_name^2"],
                                "type": "best_fields",
                                "tie_breaker": 0.3,
                                "minimum_should_match": "30%"
                            }
                        },
                        {
                            "script_score": {
                                "query": {"match_all": {}},
                                "script": {
                                    "source": "cosineSimilarity(params.query_vector, 'content_vector') + 1.0",
                                    "params": {"query_vector": query_vector}
                                }
                            }
                        }
                    ],
                    "minimum_should_match": 1
                }
            }
        }

        results = self.execute_query(query)
        self.print_results(results, f"混合搜索 '{query_text}'")
        return results

def main():
    # 配置参数
    ES_ENDPOINT = "http://climateseal-4fv.public.cn-hangzhou.es-serverless.aliyuncs.com:9200"
    INDEX_NAME = "carbon_factor"  # 使用原有的索引名
    USERNAME = "climateseal-4fv"
    PASSWORD = "!Ss12369874"

    # 创建查询测试器
    tester = ESQueryTester(ES_ENDPOINT, INDEX_NAME, USERNAME, PASSWORD)

    # 展開所有可以匹配字段
    tester.get_field_names()

    # 测试中英文匹配
    logger.info("\n=== 测试中英文匹配 ===")


    embed()
    # 原有的测试代码
    tester.test_term_query("activity_name", "zucchini production")
    # 把中文範例用model做成項目, 並且用content_vector進行向量搜索匹配

    tester.vector_search("鐵")

    logger.info("\n=== 开始工业碳排放因子搜索测试 ===")
    
    
    # 1. 使用中文搜索铝生产相关英文内容
    logger.info("\n1. 搜索铝生产相关内容:")
    tester.vector_search("铝生产工艺碳排放 中國")

    tester.vector_search("铝生产工艺碳排放 美國")
    
    # 2. 混合搜索钢铁生产相关内容
    logger.info("\n2. 搜索钢铁生产相关内容:")
    tester.hybrid_search("铝生产 中國")
    
    # 3. 使用概念搜索
    logger.info("\n3. 使用相关概念搜索:")
    tester.vector_search("金属冶炼过程排放")
    
    # 4. 特定工艺搜索
    logger.info("\n4. 特定工艺搜索:")
    tester.hybrid_search("电解铝生产")

    # 5. 模糊匹配搜索
    logger.info("\n5. 模糊匹配:")
    tester.test_fuzzy_search("content_zh", "电炉炼铁")  # 可匹配"电炉炼钢"
    
    # 6. 组合查询（中英文）
    logger.info("\n6. 中英文组合查询:")
    tester.test_combined_search(
        "content_zh", "铝生产",
        "content_en", "aluminum production"
    )
    
    # 7. 多领域组合搜索
    logger.info("\n7. 多领域组合搜索:")
    tester.hybrid_search("有色金属冶炼")  # 可匹配铝、铜等相关内容
    
    logger.info("\n=== 搜索测试完成 ===")

if __name__ == "__main__":
    main() 