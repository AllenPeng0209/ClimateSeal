import pandas as pd
from elasticsearch import Elasticsearch
import time
from typing import List, Dict
import os
from datetime import datetime
from IPython import embed
import json
import requests
import torch
from sentence_transformers import SentenceTransformer

class ExcelToElasticsearch:
    def __init__(self, es_endpoint: str, index_name: str, username: str, password: str):
        """初始化ES客户端"""
        self.index_name = index_name
        self.es_endpoint = es_endpoint.rstrip('/')
        self.auth = (username, password)
        
        # 初始化文本向量模型，强制使用CPU
        print("正在加载文本向量模型...")
        try:
            # 设置为仅使用CPU

            os.environ['CUDA_VISIBLE_DEVICES'] = ''
            self.model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2', device='cpu')
            print("模型加载完成")
        except Exception as e:
            print(f"加载模型时发生错误: {str(e)}")
            print("尝试使用备用方法加载模型...")
            try:
                self.model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
                self.model = self.model.to('cpu')
                print("模型加载完成（使用备用方法）")
            except Exception as e:
                print(f"加载模型失败: {str(e)}")
                raise
        
        # 测试连接
        try:
            response = requests.get(
                f"{self.es_endpoint}",
                auth=self.auth,
                verify=False
            )
            response.raise_for_status()
            info = response.json()
            print("Elasticsearch连接成功!")
            print(f"版本: {info['version']['number']}")
        except Exception as e:
            print(f"连接测试失败: {str(e)}")
            raise

    def read_file(self, file_path: str, sheet_name: int = 2) -> pd.DataFrame:
        """读取文件，支持 Excel 和 CSV"""
        if file_path.lower().endswith('.xlsx'):
            print(f"开始读取 Excel 文件的第 {sheet_name + 1} 个sheet...")
            try:
                # 首先读取所有sheet名称
                xl = pd.ExcelFile(file_path)
                sheet_names = xl.sheet_names
                print(f"Excel文件包含以下sheet: {sheet_names}")
                
                if sheet_name >= len(sheet_names):
                    raise ValueError(f"Excel文件只有 {len(sheet_names)} 个sheet，无法读取第 {sheet_name + 1} 个sheet")
                
                # 读取指定的sheet，跳过前三行，使用第四行作为header
                df = pd.read_excel(
                    file_path, 
                    sheet_name=3,
                    header=2,  # 使用第四行（索引为3）作为header
                    skiprows=[0]  # 跳过前三行
                )
                print(f"正在读取sheet: {sheet_names[sheet_name]}")
                
                # 打印列名，帮助调试
                print("Excel文件的列名:", df.columns.tolist())
                

                
                return df
            except Exception as e:
                print(f"读取Excel文件时发生错误: {str(e)}")
                raise
        elif file_path.lower().endswith('.csv'):
            print("开始读取 CSV 文件...")
            return pd.read_csv(file_path)
        else:
            raise ValueError(f"不支持的文件格式: {os.path.splitext(file_path)[1]}")

    def read_excel(self, excel_path: str) -> pd.DataFrame:
        """保留此方法以兼容旧代码，实际调用 read_file"""
        return self.read_file(excel_path, sheet_name=3)  # 默认读取第三个sheet

    def create_index_if_not_exists(self):
        """创建索引（如果不存在）"""
        try:
            # 检查索引是否存在
            response = requests.head(
                f"{self.es_endpoint}/{self.index_name}",
                auth=self.auth,
                verify=False
            )
            
            if response.status_code == 404:
                # 定义索引映射
                mapping = {
                    "settings": {
                        "number_of_shards": 1,
                        "number_of_replicas": 0
                    },
                    "mappings": {
                        "properties": {
                            "@timestamp": {"type": "date"},
                            "import_date": {"type": "date"},
                            "data_source": {"type": "keyword"},
                            "version": {"type": "keyword"},
                            # 添加向量字段
                            "content_vector": {
                                "type": "dense_vector",
                                "dims": 384,  # paraphrase-multilingual-MiniLM-L12-v2 模型输出维度
                                "index": True,
                                "similarity": "cosine"
                            },
                            # 添加文本字段
                            "content_zh": {
                                "type": "text",
                                "analyzer": "standard"
                            },
                            "content_en": {
                                "type": "text",
                                "analyzer": "standard"
                            },
                            # 其他字段使用动态映射
                            "ipcc_2021": {"type": "text"},
                            "ipcc_2021_keyword": {"type": "keyword"}
                        },
                        "dynamic_templates": [
                            {
                                "strings_as_keywords": {
                                    "match_mapping_type": "string",
                                    "mapping": {
                                        "type": "keyword"
                                    }
                                }
                            }
                        ]
                    }
                }
                
                # 创建索引
                response = requests.put(
                    f"{self.es_endpoint}/{self.index_name}",
                    headers={'Content-Type': 'application/json'},
                    auth=self.auth,
                    json=mapping,
                    verify=False
                )
                
                if response.status_code == 200:
                    print(f"创建索引 {self.index_name} 成功")
                else:
                    print(f"创建索引失败: {response.text}")
                    raise Exception(response.text)
                    
        except Exception as e:
            print(f"创建索引时发生错误: {str(e)}")
            raise

    def generate_text_content(self, row: pd.Series) -> Dict[str, str]:
        """从行数据生成中英文描述文本"""
        # 这里需要根据实际的Excel列名来调整
        en_parts = []
        # 添加工艺名称
        if 'activity_name' in row:
            en_parts.append(str(row['activity_name']))
            
        # 添加排放因子
        if 'geography' in row:
            en_parts.append(str(row['geography']))
            
        return {
            "content_en": " ".join(en_parts)
        }

    def prepare_bulk_data(self, df: pd.DataFrame) -> List[Dict]:
        """准备批量导入的数据"""
        bulk_data = []
        
        # 清理列名：替换空格为下划线，移除特殊字符
        df.columns = [self.clean_field_name(str(col)) for col in df.columns]
        
        for idx, row in df.iterrows():
            # 1. 基础数据清理
            doc = {}
            for col, val in row.items():
                # 移除空值
                if pd.isna(val):
                    continue
                    
                # 处理数字类型
                if isinstance(val, (int, float)):
                    doc[col] = val
                else:
                    # 处理字符串，移除前后空格
                    cleaned_val = str(val).strip()
                    if cleaned_val:  # 只保留非空值
                        doc[col] = cleaned_val

            # 跳过空文档
            if not doc:
                continue

            # 2. 生成文本内容
            content = self.generate_text_content(row)
            doc.update(content)

            # 3. 生成向量
            # 使用中文内容生成向量（因为主要用中文搜索）
            doc['content_vector'] = self.model.encode(content['content_en']).tolist()

            # 4. 添加元数据
            doc.update({
                "@timestamp": datetime.now().isoformat(),
                "import_date": datetime.now().strftime("%Y-%m-%d"),
                "data_source": "ecoinvent",
                "version": "1.0"
            })
            
            # 5. 构建bulk操作
            action = {
                "index": {
                    "_index": self.index_name,
                    "_id": f"{self.index_name}_{idx}"  # 使用自定义ID避免重复
                }
            }
            
            # 6. 添加到批量操作列表
            bulk_data.append(action)
            bulk_data.append(doc)
            
        print(f"准备完成 {len(bulk_data)//2} 条数据")
        # 打印第一条数据作为示例
        if bulk_data:
            print("\n数据示例:")
            print(json.dumps(bulk_data[0], indent=2, ensure_ascii=False))
            print(json.dumps(bulk_data[1], indent=2, ensure_ascii=False))
        
        return bulk_data

    def upload_to_es(self, bulk_data: List[Dict]) -> Dict:
        """上传数据到Elasticsearch"""
        if not bulk_data:
            print("没有数据需要上传")
            return {"errors": False}
            
        try:
            # 构建bulk请求体
            bulk_body = ""
            for item in bulk_data:
                bulk_body += json.dumps(item, ensure_ascii=False) + "\n"
            
            # 直接使用requests发送bulk请求
            headers = {
                'Content-Type': 'application/json'
            }
            
            response = requests.post(
                f"{self.es_endpoint}/_bulk",
                headers=headers,
                auth=self.auth,
                data=bulk_body.encode('utf-8'),
                verify=False
            )
            
            if response.status_code != 200:
                print(f"上传失败，状态码: {response.status_code}")
                print(f"错误信息: {response.text}")
                return {"errors": True, "error_message": response.text}
            
            result = response.json()
            if result.get("errors"):
                error_items = [item for item in result.get("items", []) if item.get("index", {}).get("error")]
                if error_items:
                    print("\n上传错误详情:")
                    for error_item in error_items[:3]:  # 只显示前3个错误
                        print(json.dumps(error_item, indent=2, ensure_ascii=False))
            return result
        except Exception as e:
            print(f"上传数据时发生错误: {str(e)}")
            return {"errors": True, "error_message": str(e)}

    def clean_field_name(self, field_name: str) -> str:
        """清理字段名，使其符合ES的要求"""
        # 转换为小写
        field_name = field_name.lower()
        # 替换空格为下划线
        field_name = field_name.replace(' ', '_')
        # 移除特殊字符
        field_name = ''.join(c for c in field_name if c.isalnum() or c == '_')
        # 确保字段名不以数字开头
        if field_name[0].isdigit():
            field_name = 'f_' + field_name
        return field_name

    def process_file(self, file_path: str, batch_size: int = 1000) -> List[Dict]:
        """处理文件并上传到 ES，添加调试信息"""
        try:
            print(f"开始处理文件: {file_path}")
            df = self.read_file(file_path)
            print(f"成功读取 {len(df)} 条记录")

            # 确保索引存在
            self.create_index_if_not_exists()

            results = []
            # 批量处理
            total_batches = (len(df) + batch_size - 1) // batch_size
            for i in range(0, len(df), batch_size):
                current_batch = (i // batch_size) + 1
                print(f"处理批次 {current_batch}/{total_batches}")

                batch_df = df[i:i+batch_size]
                bulk_data = self.prepare_bulk_data(batch_df)
                result = self.upload_to_es(bulk_data)
                results.append(result)

                if result.get("errors", False):
                    print(f"批次 {current_batch} 处理出现错误: {result.get('error_message', '未知错误')}")
                else:
                    print(f"批次 {current_batch} 处理成功")

            return results
        except Exception as e:
            print(f"处理文件 {file_path} 时发生错误: {str(e)}")
            raise

def main():
    # 配置参数
    ES_ENDPOINT = "http://climateseal-4fv.public.cn-hangzhou.es-serverless.aliyuncs.com:9200"
    INDEX_NAME = "carbon_factor"  # 修改为更有意义的索引名称
    EXCEL_PATH = "./carbon_import/data/ecoinvent.xlsx"  # 修改为 CSV 文件路径
    USERNAME = "climateseal-4fv"  # 使用实例ID作为用户名
    PASSWORD = "!Ss12369874"

    # 创建处理器实例
    processor = ExcelToElasticsearch(ES_ENDPOINT, INDEX_NAME, USERNAME, PASSWORD)
    
    try:
        # 处理并上传数据
        results = processor.process_file(EXCEL_PATH)  # 调用新的处理方法
        
        # 输出结果
        success_count = sum(1 for r in results if not r.get('errors', True))
        print(f"\n处理完成! 成功批次: {success_count}/{len(results)}")
        
        # 如果有错误，显示详细信息
        if success_count < len(results):
            print("\n错误详情:")
            for i, result in enumerate(results):
                if result.get('errors', True):
                    print(f"批次 {i+1} 错误: {result.get('error_message', '未知错误')}")
        
        # 刷新索引
        refresh_response = requests.post(
            f"{ES_ENDPOINT}/{INDEX_NAME}/_refresh",
            auth=(USERNAME, PASSWORD),
            verify=False
        )
        
        if refresh_response.status_code != 200:
            print(f"刷新索引失败: {refresh_response.text}")
        
        # 获取文档数量
        count_response = requests.get(
            f"{ES_ENDPOINT}/{INDEX_NAME}/_count",
            auth=(USERNAME, PASSWORD),
            verify=False
        )
        
        if count_response.status_code == 200:
            count_data = count_response.json()
            print(f"\n索引中的文档总数: {count_data['count']}")
        else:
            print(f"获取文档数量失败: {count_response.text}")
        
    except Exception as e:
        print(f"处理过程中发生错误: {str(e)}")

if __name__ == "__main__":
    main()
    