# 数据库设计文档

## 1. 概述

本文档描述了AI驱动的产品碳足迹量化平台的数据库设计。该设计基于PostgreSQL数据库系统，通过Supabase服务进行管理。数据库设计遵循规范化原则，同时考虑到查询性能和扩展性。

## 2. 数据库技术选型

### 2.1 选型依据

平台选择PostgreSQL作为主要数据库系统的原因：

1. **开源可靠**: PostgreSQL是成熟的开源关系型数据库，有良好的社区支持
2. **功能强大**: 支持JSON/JSONB数据类型、全文搜索、地理数据等高级特性
3. **事务支持**: 完整支持ACID属性，确保数据一致性
4. **扩展性**: 支持表分区、复制等扩展机制
5. **云服务集成**: 通过Supabase提供现代化的数据库服务，简化运维

### 2.2 Supabase集成

平台通过Supabase服务管理PostgreSQL数据库，提供以下优势：

1. **API自动生成**: 自动生成RESTful和GraphQL API
2. **实时订阅**: 支持实时数据更新推送
3. **身份认证**: 内置的用户认证系统
4. **行级安全**: 精细的权限控制
5. **存储集成**: 无缝集成对象存储功能

## 3. 数据库模式设计

### 3.1 模式(Schema)组织

数据库使用多个Schema组织表结构：

- `public`: 核心业务数据表
- `auth`: 认证和权限相关表（由Supabase管理）
- `storage`: 文件存储相关表（由Supabase管理）
- `analytics`: 分析统计相关表
- `audit`: 审计日志相关表

### 3.2 表命名规范

- 使用蛇形命名法(snake_case)
- 表名使用英文复数形式
- 使用前缀区分不同业务模块，如`prd_`(产品)、`calc_`(计算)等

## 4. 核心数据模型

### 4.1 实体关系图(ERD)

```
+--------------------+       +--------------------+       +--------------------+
|    organizations   |       |       users        |       |       roles        |
+--------------------+       +--------------------+       +--------------------+
| id                 |<----->| id                 |<----->| id                 |
| name               |       | email              |       | name               |
| industry           |       | encrypted_password |       | permissions        |
| contact_info       |       | organization_id    |       +--------------------+
| created_at         |       | role_id            |               ^
| updated_at         |       | created_at         |               |
+--------------------+       | updated_at         |               |
         ^                   +--------------------+               |
         |                                                        |
         |                                                        |
+--------------------+       +--------------------+       +--------------------+
|      products      |       | emission_factors   |       |    permissions     |
+--------------------+       +--------------------+       +--------------------+
| id                 |       | id                 |       | id                 |
| name               |       | name               |       | name               |
| description        |       | category           |       | resource           |
| category           |       | value              |       | action             |
| organization_id    |       | unit               |       | description        |
| created_at         |       | source             |       +--------------------+
| updated_at         |       | uncertainty        |
+--------------------+       | created_at         |
         ^                   | updated_at         |
         |                   +--------------------+
         |                            ^
+--------------------+                |
|      bom_items     |                |
+--------------------+                |
| id                 |                |
| product_id         |                |
| material_id        |                |
| quantity           |<---------------+
| unit               |
| emission_factor_id |
| created_at         |
| updated_at         |
+--------------------+
         ^
         |
+--------------------+       +--------------------+       +--------------------+
|     materials      |       |  activity_data     |       |   pcf_calculations |
+--------------------+       +--------------------+       +--------------------+
| id                 |<----->| id                 |       | id                 |
| name               |       | material_id        |<----->| product_id         |
| description        |       | activity_type      |       | method             |
| category           |       | value              |       | boundary           |
| properties         |       | unit               |       | allocation_method  |
| created_at         |       | time_period        |       | status             |
| updated_at         |       | source             |       | result             |
+--------------------+       | uncertainty        |       | created_by         |
                             | created_at         |       | created_at         |
                             | updated_at         |       | updated_at         |
                             +--------------------+       +--------------------+
```

### 4.2 核心表结构

#### 4.2.1 组织与用户

**organizations (组织)**

| 字段名        | 数据类型     | 约束                      | 说明         |
| ------------- | ------------ | ------------------------- | ------------ |
| id            | uuid         | PRIMARY KEY               | 组织唯一标识 |
| name          | varchar(100) | NOT NULL                  | 组织名称     |
| industry      | varchar(50)  |                           | 行业类型     |
| address       | text         |                           | 组织地址     |
| contact_name  | varchar(100) |                           | 联系人姓名   |
| contact_email | varchar(100) |                           | 联系人邮箱   |
| contact_phone | varchar(20)  |                           | 联系人电话   |
| status        | varchar(20)  | DEFAULT 'active'          | 组织状态     |
| created_at    | timestamptz  | DEFAULT CURRENT_TIMESTAMP | 创建时间     |
| updated_at    | timestamptz  | DEFAULT CURRENT_TIMESTAMP | 更新时间     |

**users (用户)**

| 字段名             | 数据类型     | 约束                      | 说明         |
| ------------------ | ------------ | ------------------------- | ------------ |
| id                 | uuid         | PRIMARY KEY               | 用户唯一标识 |
| email              | varchar(255) | NOT NULL UNIQUE           | 用户邮箱     |
| encrypted_password | varchar(255) | NOT NULL                  | 加密密码     |
| name               | varchar(100) |                           | 用户姓名     |
| organization_id    | uuid         | REFERENCES organizations  | 所属组织     |
| role_id            | uuid         | REFERENCES roles          | 用户角色     |
| last_login         | timestamptz  |                           | 最后登录时间 |
| status             | varchar(20)  | DEFAULT 'active'          | 用户状态     |
| created_at         | timestamptz  | DEFAULT CURRENT_TIMESTAMP | 创建时间     |
| updated_at         | timestamptz  | DEFAULT CURRENT_TIMESTAMP | 更新时间     |

**roles (角色)**

| 字段名      | 数据类型    | 约束                      | 说明         |
| ----------- | ----------- | ------------------------- | ------------ |
| id          | uuid        | PRIMARY KEY               | 角色唯一标识 |
| name        | varchar(50) | NOT NULL UNIQUE           | 角色名称     |
| description | text        |                           | 角色描述     |
| permissions | jsonb       |                           | 权限JSON数组 |
| created_at  | timestamptz | DEFAULT CURRENT_TIMESTAMP | 创建时间     |
| updated_at  | timestamptz | DEFAULT CURRENT_TIMESTAMP | 更新时间     |

#### 4.2.2 产品与物料

**products (产品)**

| 字段名          | 数据类型     | 约束                      | 说明         |
| --------------- | ------------ | ------------------------- | ------------ |
| id              | uuid         | PRIMARY KEY               | 产品唯一标识 |
| name            | varchar(200) | NOT NULL                  | 产品名称     |
| description     | text         |                           | 产品描述     |
| category        | varchar(100) |                           | 产品类别     |
| sku             | varchar(50)  |                           | 产品编码     |
| organization_id | uuid         | REFERENCES organizations  | 所属组织     |
| properties      | jsonb        |                           | 产品属性JSON |
| status          | varchar(20)  | DEFAULT 'active'          | 产品状态     |
| created_by      | uuid         | REFERENCES users          | 创建用户     |
| created_at      | timestamptz  | DEFAULT CURRENT_TIMESTAMP | 创建时间     |
| updated_at      | timestamptz  | DEFAULT CURRENT_TIMESTAMP | 更新时间     |

**materials (物料)**

| 字段名          | 数据类型     | 约束                      | 说明         |
| --------------- | ------------ | ------------------------- | ------------ |
| id              | uuid         | PRIMARY KEY               | 物料唯一标识 |
| name            | varchar(200) | NOT NULL                  | 物料名称     |
| description     | text         |                           | 物料描述     |
| category        | varchar(100) |                           | 物料类别     |
| properties      | jsonb        |                           | 物料属性JSON |
| organization_id | uuid         | REFERENCES organizations  | 所属组织     |
| status          | varchar(20)  | DEFAULT 'active'          | 物料状态     |
| created_by      | uuid         | REFERENCES users          | 创建用户     |
| created_at      | timestamptz  | DEFAULT CURRENT_TIMESTAMP | 创建时间     |
| updated_at      | timestamptz  | DEFAULT CURRENT_TIMESTAMP | 更新时间     |

**bom_items (物料清单项)**

| 字段名             | 数据类型      | 约束                        | 说明          |
| ------------------ | ------------- | --------------------------- | ------------- |
| id                 | uuid          | PRIMARY KEY                 | BOM项唯一标识 |
| product_id         | uuid          | REFERENCES products         | 所属产品      |
| material_id        | uuid          | REFERENCES materials        | 物料ID        |
| quantity           | decimal(15,5) | NOT NULL                    | 数量          |
| unit               | varchar(20)   | NOT NULL                    | 单位          |
| emission_factor_id | uuid          | REFERENCES emission_factors | 排放因子ID    |
| properties         | jsonb         |                             | 附加属性      |
| version            | varchar(20)   | DEFAULT '1.0'               | BOM版本       |
| created_by         | uuid          | REFERENCES users            | 创建用户      |
| created_at         | timestamptz   | DEFAULT CURRENT_TIMESTAMP   | 创建时间      |
| updated_at         | timestamptz   | DEFAULT CURRENT_TIMESTAMP   | 更新时间      |

#### 4.2.3 排放因子与活动数据

**emission_factors (排放因子)**

| 字段名         | 数据类型      | 约束                      | 说明             |
| -------------- | ------------- | ------------------------- | ---------------- |
| id             | uuid          | PRIMARY KEY               | 排放因子唯一标识 |
| name           | varchar(200)  | NOT NULL                  | 排放因子名称     |
| category       | varchar(100)  |                           | 类别             |
| subcategory    | varchar(100)  |                           | 子类别           |
| value          | decimal(15,5) | NOT NULL                  | 排放因子值       |
| unit           | varchar(50)   | NOT NULL                  | 单位             |
| source         | varchar(200)  |                           | 数据来源         |
| reference_year | int           |                           | 参考年份         |
| region         | varchar(100)  |                           | 适用区域         |
| uncertainty    | decimal(5,2)  |                           | 不确定性百分比   |
| metadata       | jsonb         |                           | 元数据           |
| verified       | boolean       | DEFAULT false             | 是否已验证       |
| created_by     | uuid          | REFERENCES users          | 创建用户         |
| created_at     | timestamptz   | DEFAULT CURRENT_TIMESTAMP | 创建时间         |
| updated_at     | timestamptz   | DEFAULT CURRENT_TIMESTAMP | 更新时间         |

**activity_data (活动数据)**

| 字段名          | 数据类型      | 约束                      | 说明             |
| --------------- | ------------- | ------------------------- | ---------------- |
| id              | uuid          | PRIMARY KEY               | 活动数据唯一标识 |
| material_id     | uuid          | REFERENCES materials      | 关联物料         |
| activity_type   | varchar(100)  | NOT NULL                  | 活动类型         |
| value           | decimal(15,5) | NOT NULL                  | 数值             |
| unit            | varchar(50)   | NOT NULL                  | 单位             |
| time_period     | tstzrange     |                           | 时间段           |
| source          | varchar(200)  |                           | 数据来源         |
| uncertainty     | decimal(5,2)  |                           | 不确定性百分比   |
| is_primary      | boolean       | DEFAULT true              | 是否为一次数据   |
| verification    | varchar(100)  |                           | 验证方式         |
| organization_id | uuid          | REFERENCES organizations  | 所属组织         |
| properties      | jsonb         |                           | 附加属性         |
| created_by      | uuid          | REFERENCES users          | 创建用户         |
| created_at      | timestamptz   | DEFAULT CURRENT_TIMESTAMP | 创建时间         |
| updated_at      | timestamptz   | DEFAULT CURRENT_TIMESTAMP | 更新时间         |

#### 4.2.4 计算与报告

**pcf_calculations (碳足迹计算)**

| 字段名            | 数据类型      | 约束                      | 说明              |
| ----------------- | ------------- | ------------------------- | ----------------- |
| id                | uuid          | PRIMARY KEY               | 计算唯一标识      |
| product_id        | uuid          | REFERENCES products       | 关联产品          |
| name              | varchar(200)  | NOT NULL                  | 计算名称          |
| method            | varchar(50)   | NOT NULL                  | 计算方法          |
| boundary          | varchar(50)   |                           | 系统边界          |
| allocation_method | varchar(50)   |                           | 分配方法          |
| functional_unit   | varchar(100)  |                           | 功能单位          |
| status            | varchar(20)   | DEFAULT 'draft'           | 计算状态          |
| result            | decimal(15,5) |                           | 计算结果(kg CO2e) |
| result_details    | jsonb         |                           | 详细结果          |
| version           | varchar(20)   | DEFAULT '1.0'             | 版本              |
| organization_id   | uuid          | REFERENCES organizations  | 所属组织          |
| created_by        | uuid          | REFERENCES users          | 创建用户          |
| created_at        | timestamptz   | DEFAULT CURRENT_TIMESTAMP | 创建时间          |
| updated_at        | timestamptz   | DEFAULT CURRENT_TIMESTAMP | 更新时间          |

**reports (报告)**

| 字段名          | 数据类型     | 约束                        | 说明         |
| --------------- | ------------ | --------------------------- | ------------ |
| id              | uuid         | PRIMARY KEY                 | 报告唯一标识 |
| name            | varchar(200) | NOT NULL                    | 报告名称     |
| description     | text         |                             | 报告描述     |
| report_type     | varchar(50)  | NOT NULL                    | 报告类型     |
| template_id     | uuid         | REFERENCES report_templates | 报告模板     |
| data_source     | jsonb        |                             | 数据源配置   |
| content         | jsonb        |                             | 报告内容     |
| status          | varchar(20)  | DEFAULT 'draft'             | 报告状态     |
| version         | varchar(20)  | DEFAULT '1.0'               | 版本         |
| organization_id | uuid         | REFERENCES organizations    | 所属组织     |
| created_by      | uuid         | REFERENCES users            | 创建用户     |
| created_at      | timestamptz  | DEFAULT CURRENT_TIMESTAMP   | 创建时间     |
| updated_at      | timestamptz  | DEFAULT CURRENT_TIMESTAMP   | 更新时间     |

## 5. 索引设计

### 5.1 主要索引列表

| 表名             | 索引名                         | 索引字段                 | 索引类型 | 说明                         |
| ---------------- | ------------------------------ | ------------------------ | -------- | ---------------------------- |
| users            | users_email_idx                | email                    | BTREE    | 加速用户邮箱查询             |
| users            | users_organization_id_idx      | organization_id          | BTREE    | 加速按组织查询用户           |
| products         | products_organization_id_idx   | organization_id          | BTREE    | 加速按组织查询产品           |
| products         | products_name_idx              | name                     | BTREE    | 加速产品名称查询             |
| products         | products_category_idx          | category                 | BTREE    | 加速产品类别查询             |
| materials        | materials_organization_id_idx  | organization_id          | BTREE    | 加速按组织查询物料           |
| materials        | materials_name_idx             | name                     | BTREE    | 加速物料名称查询             |
| materials        | materials_category_idx         | category                 | BTREE    | 加速物料类别查询             |
| bom_items        | bom_items_product_id_idx       | product_id               | BTREE    | 加速BOM查询                  |
| bom_items        | bom_items_material_id_idx      | material_id              | BTREE    | 加速物料在BOM中的查询        |
| emission_factors | ef_category_region_idx         | category, region         | BTREE    | 加速排放因子分类和区域查询   |
| activity_data    | ad_material_id_time_period_idx | material_id, time_period | BTREE    | 加速按物料和时间查询活动数据 |
| pcf_calculations | pcf_product_id_idx             | product_id               | BTREE    | 加速按产品查询计算记录       |
| reports          | reports_organization_id_idx    | organization_id          | BTREE    | 加速按组织查询报告           |

### 5.2 全文搜索索引

对需要支持文本搜索的字段，创建GIN索引：

```sql
CREATE INDEX products_name_description_idx ON products USING GIN (to_tsvector('chinese', name || ' ' || description));
CREATE INDEX materials_name_description_idx ON materials USING GIN (to_tsvector('chinese', name || ' ' || description));
CREATE INDEX emission_factors_name_idx ON emission_factors USING GIN (to_tsvector('chinese', name));
```

### 5.3 JSON索引

对JSONB类型字段创建适当的索引：

```sql
CREATE INDEX products_properties_idx ON products USING GIN (properties);
CREATE INDEX materials_properties_idx ON materials USING GIN (properties);
CREATE INDEX activity_data_properties_idx ON activity_data USING GIN (properties);
CREATE INDEX pcf_calculations_result_details_idx ON pcf_calculations USING GIN (result_details);
```

## 6. 数据安全与访问控制

### 6.1 行级安全策略(RLS)

利用PostgreSQL的行级安全特性，实现细粒度的数据访问控制：

**组织数据隔离**

```sql
CREATE POLICY organization_isolation ON products
    USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY organization_isolation ON materials
    USING (organization_id = current_setting('app.current_org_id')::uuid);
```

**基于角色的访问控制**

```sql
CREATE POLICY read_only_policy ON products
    FOR SELECT
    USING (
        (SELECT permissions->>'products.read' FROM roles WHERE id = auth.role()) = 'true'
    );

CREATE POLICY write_policy ON products
    FOR INSERT
    WITH CHECK (
        (SELECT permissions->>'products.write' FROM roles WHERE id = auth.role()) = 'true'
    );
```

### 6.2 数据加密

敏感数据字段采用加密存储：

```sql
-- 创建加密扩展
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 加密/解密函数示例
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data text) RETURNS text AS $$
BEGIN
  RETURN pgp_sym_encrypt(data, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_sensitive_data(data text) RETURNS text AS $$
BEGIN
  RETURN pgp_sym_decrypt(data::bytea, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 7. 数据迁移策略

### 7.1 迁移工具

使用Supabase迁移工具管理数据库版本：

1. 使用`supabase migration new`创建迁移文件
2. 使用`supabase migration up`应用迁移
3. 迁移历史记录在`supabase_migrations`表中

### 7.2 迁移原则

1. **向后兼容**: 尽量保持数据模型变更的向后兼容性
2. **分步执行**: 大型改动分多个小步骤执行
3. **事务处理**: 确保每个迁移在事务中执行
4. **回滚计划**: 为每个迁移提供回滚脚本

## 8. 性能优化策略

### 8.1 表分区

对大型表采用表分区策略，提高查询性能：

```sql
-- 按组织分区
CREATE TABLE activity_data (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL,
    -- 其他字段
) PARTITION BY LIST (organization_id);

-- 按时间范围分区
CREATE TABLE pcf_calculations (
    id uuid PRIMARY KEY,
    created_at timestamptz NOT NULL,
    -- 其他字段
) PARTITION BY RANGE (created_at);
```

### 8.2 物化视图

为复杂报表查询创建物化视图：

```sql
CREATE MATERIALIZED VIEW product_carbon_footprint_summary AS
SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.category,
    o.name AS organization_name,
    AVG(c.result) AS avg_carbon_footprint,
    MIN(c.result) AS min_carbon_footprint,
    MAX(c.result) AS max_carbon_footprint,
    COUNT(c.id) AS calculation_count
FROM
    products p
JOIN
    organizations o ON p.organization_id = o.id
JOIN
    pcf_calculations c ON p.id = c.product_id
WHERE
    c.status = 'completed'
GROUP BY
    p.id, p.name, p.category, o.name;

-- 创建刷新函数
CREATE OR REPLACE FUNCTION refresh_materialized_views() RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW product_carbon_footprint_summary;
END;
$$ LANGUAGE plpgsql;
```

### 8.3 查询优化

优化频繁执行的查询：

1. 使用EXPLAIN ANALYZE分析查询执行计划
2. 优化JOIN顺序和条件
3. 为常用查询创建适当的复合索引
4. 使用LIMIT限制结果集大小

## 9. 数据备份与恢复

### 9.1 备份策略

1. **定时完整备份**: 每日凌晨进行全库备份
2. **增量备份**: 每小时执行增量备份
3. **事务日志备份**: 持续备份事务日志，支持时间点恢复

### 9.2 恢复流程

1. 恢复最近的全量备份
2. 应用增量备份
3. 回放事务日志到指定时间点

### 9.3 备份自动化

使用阿里云RDS自动备份功能，配合自定义脚本进行备份验证和离线存储。

## 10. MVP阶段数据库简化

为MVP阶段(Q3 2025)，数据库设计做以下简化：

### 10.1 模式简化

1. 降低表的规范化水平，减少表关联复杂度
2. 暂时合并部分相关表，简化数据模型
3. 推迟部分高级特性实现，如表分区、物化视图等

### 10.2 MVP核心表

优先实现以下核心表：

1. users: 用户基本信息
2. organizations: 组织基本信息
3. products: 产品信息
4. materials: 物料信息
5. bom_items: 物料清单
6. emission_factors: 基础排放因子
7. activity_data: 基础活动数据
8. pcf_calculations: 基础碳足迹计算

### 10.3 数据加载策略

1. 预置基本排放因子数据
2. 提供示例产品和物料数据
3. 实现基础数据导入功能

## 11. 后续扩展计划

随着系统功能迭代，计划在以下方面扩展数据库设计：

1. **多租户优化**: 进一步优化多租户数据隔离方案
2. **历史数据追踪**: 实现关键数据变更历史记录
3. **大数据集成**: 与数据湖集成，支持海量历史数据分析
4. **地理空间数据**: 增加地理位置分析支持
5. **实时数据处理**: 支持实时数据流处理和分析

## 12. 结论

本数据库设计文档提供了AI驱动的产品碳足迹量化平台的数据库结构和设计原则。设计满足系统的业务需求，同时考虑了性能、安全性和可扩展性。对于MVP阶段，我们采用了简化的设计，专注于核心功能实现，并为未来的功能扩展保留了灵活性。
