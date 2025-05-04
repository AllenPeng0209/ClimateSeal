import time
from fastapi import Request
from fastapi.responses import JSONResponse
from log import logger

@app.post("/match")
async def match_carbon_factor(request: Request):
    try:
        # 记录请求开始时间，用于性能监控
        start_time = time.time()
        logger.info("开始处理匹配请求")
        
        # 获取请求体
        req_body = await request.json()
        logger.info(f"接收到匹配请求: {req_body}")
        
        # 必要参数验证
        if "labels" not in req_body or not req_body["labels"]:
            logger.error("请求缺少必要的labels参数")
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "Missing required parameter: labels"}
            )
            
        labels = req_body["labels"]
        top_k = req_body.get("top_k", 3)
        min_score = req_body.get("min_score", 0.3)
        embedding_model = req_body.get("embedding_model", "dashscope_v3")
        search_method = req_body.get("search_method", "script_score")
        
        # 记录请求参数
        logger.info(f"处理匹配请求: 标签={labels}, top_k={top_k}, min_score={min_score}")
        
        # 执行匹配操作
        try:
            results = carbon_matcher.match_labels(
                labels=labels,
                top_k=top_k,
                min_score=min_score,
                embedding_model=embedding_model,
                search_method=search_method
            )
            elapsed_time = time.time() - start_time
            logger.info(f"匹配成功完成，耗时: {elapsed_time:.2f}秒")
            
            # 添加请求参数到响应中，便于调试
            response_data = {
                "success": True,
                "results": results,
                "request": {
                    "labels": labels,
                    "top_k": top_k,
                    "min_score": min_score
                },
                "performance": {
                    "elapsed_time": f"{elapsed_time:.2f}秒"
                }
            }
            
            # 如果没有找到匹配结果，添加提示信息
            if not any(result.get("matches") for result in results):
                logger.warning(f"未找到匹配结果: 标签={labels}")
                response_data["message"] = "未找到匹配结果，请尝试使用其他关键词"
                
            return JSONResponse(content=response_data)
            
        except Exception as e:
            logger.error(f"匹配过程中发生错误: {str(e)}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={"success": False, "error": f"匹配失败: {str(e)}"}
            )
            
    except Exception as e:
        logger.error(f"处理请求时发生错误: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": f"服务器错误: {str(e)}"}
        ) 