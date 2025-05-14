产品规格
产品描述
产品图片
数据收集开始时间
数据收集结束时间
产品总产量数值
产品总产量单位
产品总产量转换系数
核算边界：半生命周期or全生命周期
活动水平数据状态，枚举：缺失、完整、AI补充；
运输方式
运输重量
单位装欢系数数据状态：缺失、AI补充、已手动配置
背景数据状态：枚举：缺失、AI补充、已手动配置、数据收集中、数据收集完成

## 数据库字段说明

| 字段名称 | 数据类型 | 约束/说明 |
|---------|---------|-----------|
| product_specification | VARCHAR(255) | 产品规格，必填 |
| product_description | TEXT | 产品描述，可为空 |
| product_image | VARCHAR(255) | 产品图片URL，可为空 |
| data_collection_start_time | DATETIME | 数据收集开始时间，必填 |
| data_collection_end_time | DATETIME | 数据收集结束时间，必填 |
| total_production_value | DECIMAL(20,6) | 产品总产量数值，必填 |
| total_production_unit | VARCHAR(50) | 产品总产量单位，必填 |
| conversion_factor | DECIMAL(20,6) | 产品总产量转换系数，必填 |
| accounting_boundary | ENUM('half_lifecycle', 'full_lifecycle') | 核算边界，必填 |
| activity_data_status | ENUM('missing', 'complete', 'ai_supplemented') | 活动水平数据状态，必填 |
| transport_method | VARCHAR(100) | 运输方式，必填 |
| transport_weight | DECIMAL(20,6) | 运输重量，必填 |
| unit_conversion_status | ENUM('missing', 'ai_supplemented', 'manually_configured') | 单位转换系数数据状态，必填 |
| background_data_status | ENUM('missing', 'ai_supplemented', 'manually_configured', 'collecting', 'collection_completed') | 背景数据状态，必填 |