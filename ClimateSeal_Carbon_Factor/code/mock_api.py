#!/usr/bin/env python3
"""
模拟碳因子匹配API，用于前端开发和测试
"""
import json
import time
import random
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Carbon Factor API Mock")

# 允许跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 模拟数据库
MOCK_DATA = {
    # 材料类
    "木材": {
        "activity_name": "木材生产",
        "kg_co2eq": 1.2,
        "reference_product_unit": "kg"
    },
    "塑料": {
        "activity_name": "塑料生产",
        "kg_co2eq": 3.5,
        "reference_product_unit": "kg"
    },
    "钢铁": {
        "activity_name": "钢铁生产",
        "kg_co2eq": 2.8,
        "reference_product_unit": "kg"
    },
    "铝": {
        "activity_name": "铝生产",
        "kg_co2eq": 8.2,
        "reference_product_unit": "kg"
    },
    "玻璃": {
        "activity_name": "玻璃生产",
        "kg_co2eq": 0.9,
        "reference_product_unit": "kg"
    },
    "纸张": {
        "activity_name": "纸张生产",
        "kg_co2eq": 1.1,
        "reference_product_unit": "kg"
    },
    "纸": {
        "activity_name": "纸生产",
        "kg_co2eq": 1.1,
        "reference_product_unit": "kg"
    },
    "塑料袋": {
        "activity_name": "塑料袋生产",
        "kg_co2eq": 2.7,
        "reference_product_unit": "kg"
    },
    
    # 能源类
    "电力": {
        "activity_name": "电力生产",
        "kg_co2eq": 0.5,
        "reference_product_unit": "kWh"
    },
    "天然气": {
        "activity_name": "天然气燃烧",
        "kg_co2eq": 2.2,
        "reference_product_unit": "m3"
    },
    "汽油": {
        "activity_name": "汽油燃烧",
        "kg_co2eq": 2.3,
        "reference_product_unit": "L"
    },
    "柴油": {
        "activity_name": "柴油燃烧",
        "kg_co2eq": 2.7,
        "reference_product_unit": "L"
    },
    
    # 运输类
    "卡车": {
        "activity_name": "卡车运输",
        "kg_co2eq": 0.1,
        "reference_product_unit": "tkm"
    },
    "船舶": {
        "activity_name": "船舶运输",
        "kg_co2eq": 0.02,
        "reference_product_unit": "tkm"
    },
    "飞机": {
        "activity_name": "航空运输",
        "kg_co2eq": 1.1,
        "reference_product_unit": "tkm"
    },
    "铁路": {
        "activity_name": "铁路运输",
        "kg_co2eq": 0.03,
        "reference_product_unit": "tkm"
    },
    
    # 废弃物处理
    "垃圾填埋": {
        "activity_name": "垃圾填埋",
        "kg_co2eq": 0.5,
        "reference_product_unit": "kg"
    },
    "废物焚烧": {
        "activity_name": "废物焚烧",
        "kg_co2eq": 0.2,
        "reference_product_unit": "kg"
    },
    "回收": {
        "activity_name": "材料回收",
        "kg_co2eq": 0.1,
        "reference_product_unit": "kg"
    },
    
    # 食品类
    "白砂糖": {
        "activity_name": "白砂糖生产",
        "kg_co2eq": 1.8,
        "reference_product_unit": "kg"
    },
    "有机米糠": {
        "activity_name": "有机米糠生产",
        "kg_co2eq": 0.7,
        "reference_product_unit": "kg"
    }
}

def find_best_match(label):
    """查找标签最佳匹配"""
    # 如果直接匹配成功
    if label in MOCK_DATA:
        return MOCK_DATA[label]
    
    # 尝试部分匹配
    for key in MOCK_DATA:
        if key in label or label in key:
            return MOCK_DATA[key]
    
    # 如果没有匹配，返回随机数据
    random_key = random.choice(list(MOCK_DATA.keys()))
    result = dict(MOCK_DATA[random_key])
    result["activity_name"] = f"{label}生产(模拟数据)"
    result["kg_co2eq"] = round(random.uniform(0.1, 10.0), 2)
    return result

@app.post("/match")
async def match_carbon_factor(request: Request):
    """模拟碳因子匹配API"""
    # 添加随机延迟，模拟网络延迟
    delay = random.uniform(0.5, 2.0)
    time.sleep(delay)
    
    try:
        # 解析请求
        req_body = await request.json()
        
        if "labels" not in req_body or not req_body["labels"]:
            return {
                "success": False,
                "error": "缺少必要参数: labels"
            }
        
        labels = req_body["labels"]
        top_k = req_body.get("top_k", 3)
        
        # 生成响应
        results = []
        for label in labels:
            matches = []
            # 主匹配
            best_match = find_best_match(label)
            matches.append(best_match)
            
            # 如果需要更多结果，添加更多匹配
            if top_k > 1:
                for _ in range(top_k - 1):
                    random_key = random.choice(list(MOCK_DATA.keys()))
                    match_data = dict(MOCK_DATA[random_key])
                    match_data["kg_co2eq"] = round(match_data["kg_co2eq"] * random.uniform(0.8, 1.2), 2)
                    matches.append(match_data)
            
            results.append({
                "query_label": label,
                "matches": matches,
                "error": None
            })
        
        return {
            "success": True,
            "results": results,
            "request": req_body,
            "performance": {
                "elapsed_time": f"{delay:.2f}秒"
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"服务器错误: {str(e)}"
        }

@app.get("/")
async def root():
    """API根路径"""
    return {
        "message": "碳因子匹配API模拟器",
        "version": "1.0.0",
        "status": "正常运行",
        "endpoints": {
            "/match": "匹配碳因子 (POST)",
            "/health": "健康检查 (GET)"
        }
    }

@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "正常",
        "timestamp": time.time()
    }

if __name__ == "__main__":
    print("启动碳因子匹配API模拟服务器...")
    print("请访问 http://localhost:9000/ 查看API信息")
    uvicorn.run(app, host="0.0.0.0", port=9000) 