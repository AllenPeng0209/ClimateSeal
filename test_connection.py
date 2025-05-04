#!/usr/bin/env python3
import requests
from requests.auth import HTTPBasicAuth
import sys
import urllib3
import socket
import ssl

# 禁用SSL警告
urllib3.disable_warnings()

print("开始测试连接...")
print("系统信息:", sys.version)
print("-" * 50)

# 尝试直接使用socket
try:
    print("尝试使用socket连接...")
    s = socket.create_connection(
        ("climateseal0425-0h8.public.cn-shanghai.es-serverless.aliyuncs.com", 9200),
        timeout=5
    )
    print("Socket连接成功!")
    s.close()
except Exception as e:
    print(f"Socket连接失败: {str(e)}")

print("-" * 50)

# 尝试HTTPS连接
try:
    print("发送HTTPS请求...")
    response = requests.get(
        "https://climateseal0425-0h8.public.cn-shanghai.es-serverless.aliyuncs.com:9200",
        auth=HTTPBasicAuth("climateseal0425-0h8", "!Ss12369874"),
        verify=False,
        timeout=10
    )
    print(f"状态码: {response.status_code}")
    print(f"响应头: {response.headers}")
    print(f"响应内容: {response.text[:500]}...")
except Exception as e:
    print(f"HTTPS请求失败: {str(e)}")
    import traceback
    print(traceback.format_exc())

print("-" * 50)

# 尝试HTTP连接
try:
    print("发送HTTP请求...")
    response = requests.get(
        "http://climateseal0425-0h8.public.cn-shanghai.es-serverless.aliyuncs.com:9200",
        auth=HTTPBasicAuth("climateseal0425-0h8", "!Ss12369874"),
        verify=False,
        timeout=10
    )
    print(f"状态码: {response.status_code}")
    print(f"响应头: {response.headers}")
    print(f"响应内容: {response.text[:500]}...")
except Exception as e:
    print(f"HTTP请求失败: {str(e)}")
    import traceback
    print(traceback.format_exc())

print("测试结束") 