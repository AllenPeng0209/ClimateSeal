import os
import logging
import argparse
import requests
from requests.auth import HTTPBasicAuth
from datetime import datetime
import sys

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'es_index_deletion_{datetime.now().strftime("%Y%m%d")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def get_es_config():
    """从环境变量获取ES配置"""
    config = {
        'endpoint': os.getenv('ES_ENDPOINT', 'http://climateseal-4fv.public.cn-hangzhou.es-serverless.aliyuncs.com:9200'),
        'username': os.getenv('ES_USERNAME', 'climateseal-4fv'),
        'password': os.getenv('ES_PASSWORD', '!Ss12369874')  # 在生产环境中必须使用环境变量
    }
    return config

def delete_index(index_name, force=False):
    """
    删除指定的Elasticsearch索引
    
    Args:
        index_name (str): 要删除的索引名称
        force (bool): 是否强制删除，不需要确认
    
    Returns:
        bool: 删除是否成功
    """
    config = get_es_config()
    url = f"{config['endpoint']}/{index_name}"

    # 如果不是强制删除，需要用户确认
    if not force:
        confirm = input(f"确定要删除索引 '{index_name}' 吗？此操作不可恢复！(y/N): ")
        if confirm.lower() != 'y':
            logger.info("操作已取消")
            return False

    try:
        logger.info(f"开始删除索引: {index_name}")
        response = requests.delete(
            url,
            auth=HTTPBasicAuth(config['username'], config['password']),
            timeout=30
        )

        if response.status_code in [200, 404]:
            logger.info(f"索引 {index_name} 删除成功！")
            logger.debug(f"服务器响应: {response.text}")
            return True
        else:
            logger.error(f"删除索引失败。HTTP状态码: {response.status_code}")
            logger.error(f"错误信息: {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        logger.error(f"请求错误: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"未预期的错误: {str(e)}")
        return False

def main():
    parser = argparse.ArgumentParser(description='删除Elasticsearch索引工具')
    parser.add_argument('index_name', help='要删除的索引名称')
    parser.add_argument('-f', '--force', action='store_true', help='强制删除，不需要确认')
    args = parser.parse_args()

    success = delete_index(args.index_name, args.force)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main() 