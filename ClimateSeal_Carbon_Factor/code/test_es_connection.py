#!/usr/bin/env python3
import os
from dotenv import load_dotenv
import requests
from elasticsearch import Elasticsearch
import logging
import sys
import urllib3

# 禁用不安全的HTTPS警告
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 直接输出到标准输出
def log(msg):
    print(msg)
    sys.stdout.flush()

# 加载环境变量
load_dotenv()

# 获取ES配置
es_endpoint = os.getenv('ES_ENDPOINT')
es_username = os.getenv('ES_USERNAME')
es_password = os.getenv('ES_PASSWORD')
es_index = os.getenv('ES_INDEX')

log(f"ES配置: 端点={es_endpoint}, 用户名={es_username}, 索引={es_index}")

try:
    # 测试基本HTTP连接
    log(f"测试HTTP连接到 {es_endpoint}...")
    response = requests.get(es_endpoint, auth=(es_username, es_password), verify=False, timeout=10)
    log(f"HTTP连接响应: {response.status_code}, {response.text[:100]}...")
    
    # 尝试创建ES客户端
    log("尝试创建ES客户端...")
    es = Elasticsearch(
        es_endpoint,
        basic_auth=(es_username, es_password),
        verify_certs=False
    )
    
    # 测试ES连接
    log("测试ES连接...")
    health = es.cluster.health()
    log(f"ES集群健康状态: {health}")
    
    # 检查索引是否存在
    log(f"检查索引 {es_index} 是否存在...")
    index_exists = es.indices.exists(index=es_index)
    log(f"索引 {es_index} 存在: {index_exists}")
    
    if index_exists:
        # 获取索引文档计数
        log(f"获取索引 {es_index} 的文档计数...")
        count = es.count(index=es_index)
        log(f"索引 {es_index} 文档计数: {count}")
        
        # 测试简单查询
        log("执行简单查询...")
        response = es.search(
            index=es_index,
            body={
                "query": {"match_all": {}},
                "size": 1
            }
        )
        log(f"查询结果: 匹配文档计数={response['hits']['total']['value']}")
        if response['hits']['total']['value'] > 0:
            log(f"第一个文档示例: {response['hits']['hits'][0]['_source']}")
    
    log("测试完成，连接成功!")
except Exception as e:
    log(f"连接测试失败: {str(e)}")
    import traceback
    log(traceback.format_exc()) 