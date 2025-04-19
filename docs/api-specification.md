# API接口规范文档

## 1. 概述

本文档定义了AI驱动的产品碳足迹量化平台的API接口规范，用于指导开发团队实现一致、可维护的API服务。本规范适用于平台中的所有微服务和API端点。

## 2. API设计原则

1. **RESTful设计** - 遵循REST架构风格
2. **一致性** - 保持命名、参数和响应格式的一致性
3. **版本控制** - 所有API支持版本控制
4. **安全性** - 实施适当的认证和授权机制
5. **可测试性** - API设计便于自动化测试

## 3. API基础URL结构

```
https://{环境域名}/api/v{版本号}/{服务名}/{资源}/{资源ID}
```

示例:

- 生产环境: `https://api.carbonplatform.com/api/v1/products/1234`
- 开发环境: `https://dev-api.carbonplatform.com/api/v1/products/1234`

## 4. HTTP方法使用

| 方法   | 用途         | 示例                         |
| ------ | ------------ | ---------------------------- |
| GET    | 获取资源     | GET /api/v1/products         |
| POST   | 创建资源     | POST /api/v1/products        |
| PUT    | 全量更新资源 | PUT /api/v1/products/1234    |
| PATCH  | 部分更新资源 | PATCH /api/v1/products/1234  |
| DELETE | 删除资源     | DELETE /api/v1/products/1234 |

## 5. 请求格式

### 5.1 Headers

所有API请求必须包含以下头信息:

```
Content-Type: application/json
Authorization: Bearer {access_token}
Accept-Language: zh-CN
```

### 5.2 请求体格式

POST/PUT/PATCH请求的请求体必须使用JSON格式:

```json
{
  "property1": "value1",
  "property2": "value2",
  "nestedObject": {
    "nestedProperty": "nestedValue"
  }
}
```

### 5.3 查询参数

GET请求的过滤、排序和分页通过查询参数实现:

```
/api/v1/products?page=1&limit=20&sort=name:asc&filter=category:electronics
```

支持的查询参数:

- `page`: 页码，从1开始
- `limit`: 每页记录数，默认20，最大100
- `sort`: 排序字段和方向，格式为{field}:{direction}
- `filter`: 过滤条件，格式为{field}:{value}

## 6. 响应格式

### 6.1 成功响应

所有成功响应使用统一的JSON格式:

```json
{
  "success": true,
  "data": {
    // 响应数据
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

### 6.2 错误响应

错误响应格式如下:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "用户友好的错误消息",
    "details": {
      // 错误详情，可选
    }
  }
}
```

### 6.3 HTTP状态码

| 状态码 | 说明                 |
| ------ | -------------------- |
| 200    | 请求成功             |
| 201    | 资源创建成功         |
| 204    | 成功处理但无返回内容 |
| 400    | 请求参数错误         |
| 401    | 未认证               |
| 403    | 权限不足             |
| 404    | 资源不存在           |
| 422    | 数据验证失败         |
| 429    | 请求频率超限         |
| 500    | 服务器内部错误       |

## 7. 错误码设计

错误码格式: `{服务简写}_{错误类型}_{错误描述}`

示例:

- `AUTH_INVALID_CREDENTIALS`: 认证服务-无效的凭证
- `PROD_NOT_FOUND`: 产品服务-资源不存在
- `CALC_INVALID_INPUT`: 计算服务-无效输入

## 8. 认证与授权

### 8.1 认证方式

平台使用JWT进行API认证:

1. 客户端通过登录API获取access_token和refresh_token
2. 后续请求通过Authorization头发送access_token
3. access_token过期后使用refresh_token获取新token

### 8.2 授权机制

基于RBAC(角色)和ABAC(属性)结合的授权模型:

1. 用户被分配一个或多个角色
2. 资源访问控制基于角色权限和资源属性
3. API响应会根据用户权限自动过滤数据

## 9. API限流策略

为保障系统稳定性，实施以下限流策略:

1. 基础API: 60次/分钟/用户
2. 计算密集型API: 10次/分钟/用户
3. 批量操作API: 5次/分钟/用户

超过限制返回429响应，包含Retry-After头指示等待时间。

## 10. 微服务API规范

### 10.1 用户管理服务 API

**基础路径**: `/api/v1/users`

| 端点            | 方法   | 描述         | 请求示例                                                          |
| --------------- | ------ | ------------ | ----------------------------------------------------------------- |
| `/auth/login`   | POST   | 用户登录     | `{"email":"user@example.com","password":"****"}`                  |
| `/auth/refresh` | POST   | 刷新令牌     | `{"refreshToken":"token_here"}`                                   |
| `/`             | GET    | 获取用户列表 | N/A                                                               |
| `/`             | POST   | 创建用户     | `{"name":"张三","email":"zhangsan@example.com","role":"analyst"}` |
| `/{id}`         | GET    | 获取用户详情 | N/A                                                               |
| `/{id}`         | PUT    | 更新用户     | `{"name":"张三(更新)","email":"zhangsan@example.com"}`            |
| `/{id}`         | DELETE | 删除用户     | N/A                                                               |
| `/roles`        | GET    | 获取角色列表 | N/A                                                               |
| `/permissions`  | GET    | 获取权限列表 | N/A                                                               |

### 10.2 产品管理服务 API

**基础路径**: `/api/v1/products`

| 端点              | 方法   | 描述             | 请求示例                                                       |
| ----------------- | ------ | ---------------- | -------------------------------------------------------------- |
| `/`               | GET    | 获取产品列表     | N/A                                                            |
| `/`               | POST   | 创建产品         | `{"name":"产品A","description":"描述","category":"电子产品"}`  |
| `/{id}`           | GET    | 获取产品详情     | N/A                                                            |
| `/{id}`           | PUT    | 更新产品         | `{"name":"产品A修改版","description":"新描述"}`                |
| `/{id}`           | DELETE | 删除产品         | N/A                                                            |
| `/{id}/bom`       | GET    | 获取产品BOM      | N/A                                                            |
| `/{id}/bom`       | POST   | 创建/更新产品BOM | `{"version":"1.0","items":[{"materialId":123,"quantity":10}]}` |
| `/materials`      | GET    | 获取物料列表     | N/A                                                            |
| `/materials/{id}` | GET    | 获取物料详情     | N/A                                                            |

### 10.3 数据管理服务 API

**基础路径**: `/api/v1/data`

| 端点                     | 方法 | 描述             | 请求示例                                          |
| ------------------------ | ---- | ---------------- | ------------------------------------------------- |
| `/emission-factors`      | GET  | 获取排放因子列表 | N/A                                               |
| `/emission-factors/{id}` | GET  | 获取排放因子详情 | N/A                                               |
| `/activity-data`         | GET  | 获取活动数据列表 | N/A                                               |
| `/activity-data`         | POST | 创建活动数据     | `{"type":"electricity","value":100,"unit":"kWh"}` |
| `/suppliers`             | GET  | 获取供应商列表   | N/A                                               |
| `/imports`               | POST | 导入数据         | Multipart form data with file                     |
| `/exports/{type}`        | GET  | 导出数据         | N/A                                               |

### 10.4 计算引擎服务 API

**基础路径**: `/api/v1/calculations`

| 端点            | 方法 | 描述                   | 请求示例                                                                       |
| --------------- | ---- | ---------------------- | ------------------------------------------------------------------------------ |
| `/`             | POST | 创建计算任务           | `{"productId":123,"method":"cradle-to-gate","version":"1.0"}`                  |
| `/{id}`         | GET  | 获取计算任务状态和结果 | N/A                                                                            |
| `/{id}/results` | GET  | 获取计算结果详情       | N/A                                                                            |
| `/simulate`     | POST | 模拟计算(不保存结果)   | `{"productId":123,"parameters":{"material_change":{"id":456,"new_value":10}}}` |
| `/batch`        | POST | 批量计算               | `{"productIds":[123,456,789],"method":"cradle-to-gate"}`                       |

### 10.5 报告服务 API

**基础路径**: `/api/v1/reports`

| 端点                    | 方法 | 描述             | 请求示例                                                                |
| ----------------------- | ---- | ---------------- | ----------------------------------------------------------------------- |
| `/templates`            | GET  | 获取报告模板列表 | N/A                                                                     |
| `/`                     | POST | 创建报告         | `{"name":"2025年Q1报告","templateId":123,"data":{"calculationId":456}}` |
| `/{id}`                 | GET  | 获取报告详情     | N/A                                                                     |
| `/{id}/export/{format}` | GET  | 导出报告         | N/A                                                                     |
| `/dashboard/{type}`     | GET  | 获取仪表板数据   | N/A                                                                     |

### 10.6 知识库服务 API

**基础路径**: `/api/v1/knowledge`

| 端点             | 方法 | 描述               | 请求示例                   |
| ---------------- | ---- | ------------------ | -------------------------- |
| `/articles`      | GET  | 获取知识库文章列表 | N/A                        |
| `/articles/{id}` | GET  | 获取文章详情       | N/A                        |
| `/search`        | GET  | 搜索知识库         | `/search?q=碳足迹计算方法` |
| `/categories`    | GET  | 获取知识分类       | N/A                        |
| `/regulations`   | GET  | 获取法规库         | N/A                        |

### 10.7 AI服务 API

**基础路径**: `/api/v1/ai`

| 端点         | 方法 | 描述         | 请求示例                                                    |
| ------------ | ---- | ------------ | ----------------------------------------------------------- |
| `/validate`  | POST | 数据验证     | `{"dataType":"activity_data","records":[...]}`              |
| `/complete`  | POST | 数据补全     | `{"dataType":"emission_factor","context":{...}}`            |
| `/recommend` | POST | 获取推荐     | `{"type":"emission_factor","productAttributes":{...}}`      |
| `/chat`      | POST | 与AI顾问对话 | `{"message":"如何计算产品碳足迹?","conversation_id":"123"}` |

## 11. API文档与测试

### 11.1 API文档

平台使用Swagger/OpenAPI规范记录API:

1. 开发文档: `https://dev-api.carbonplatform.com/docs`
2. 生产文档: `https://api.carbonplatform.com/docs`

### 11.2 API测试工具

1. 开发人员: Postman集合
2. 自动化测试: Jest + Supertest
3. 集成测试: GitHub Actions CI/CD流程

## 12. MVP阶段API优化

为MVP阶段(Q3 2025)简化API设计:

1. 合并部分微服务，减少API碎片化
2. 优先实现核心功能API
3. 简化认证机制，采用基本JWT流程
4. 进一步标准化错误处理机制

## 13. 版本更新策略

1. 兼容性更新(bug修复、新增字段): 小版本升级，如v1.1
2. 不兼容更新: 主版本升级，保留旧版本支持6个月，如v2.0

## 14. 附录

### 14.1 请求示例

完整登录流程:

```
POST /api/v1/users/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

响应:

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "user": {
      "id": 123,
      "name": "测试用户",
      "email": "user@example.com",
      "role": "analyst"
    }
  }
}
```

### 14.2 常见错误处理示例

未授权错误:

```json
{
  "success": false,
  "error": {
    "code": "AUTH_UNAUTHORIZED",
    "message": "您无权访问此资源",
    "details": {
      "required_permission": "product:write"
    }
  }
}
```

数据验证错误:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "提交的数据无效",
    "details": {
      "fields": {
        "email": "必须是有效的电子邮件地址",
        "password": "密码长度不能少于8个字符"
      }
    }
  }
}
```
