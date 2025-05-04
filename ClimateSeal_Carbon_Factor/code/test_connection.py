#!/usr/bin/env python3
import requests
from requests.auth import HTTPBasicAuth
import sys

print("开始测试连接...")

try:
    print("发送HTTP请求...")
    response = requests.get(
        'http://climateseal0425-0h8.public.cn-shanghai.es-serverless.aliyuncs.com:9200',
        auth=HTTPBasicAuth('climateseal0425-0h8', '!Ss12369874'),
        verify=False,
        timeout=10
    )
    print(f"状态码: {response.status_code}")
    print(f"响应头: {response.headers}")
    print(f"响应内容: {response.text[:500]}...")
except Exception as e:
    print(f"发生错误: {str(e)}")
    import traceback
    print(traceback.format_exc())

print("测试结束") 