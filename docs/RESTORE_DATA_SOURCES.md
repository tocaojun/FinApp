# FinApp 数据源恢复指南

## 问题背景

数据同步模块的"数据源"页面显示为空，因为 `finapp.price_data_sources` 表被清空。

## 数据源定义

根据程序代码分析，系统支持以下数据源提供商：

| 提供商 | 代码 | API 端点 | 说明 |
|-------|------|---------|------|
| Tushare | tushare | http://api.tushare.pro | 中国股票数据API |

## 恢复方法

### 方法 1：使用 SQL 脚本恢复（推荐）

创建 SQL 脚本并执行：

```sql
-- 恢复数据源表
INSERT INTO finapp.price_data_sources (
    id,
    name,
    provider,
    api_endpoint,
    api_key_encrypted,
    config,
    rate_limit,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Tushare - 股票数据源',
    'tushare',
    'http://api.tushare.pro',
    NULL,  -- 需要配置实际的 API Key（加密存储）
    '{"data_types": ["daily_price", "basic_info"], "sync_frequency": "daily"}',
    '100',  -- 速率限制（每分钟请求数）
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
```

### 方法 2：使用后端 API 创建（不推荐，因为需要已配置的 API Key）

```bash
curl -X POST http://localhost:8000/api/admin/data-sources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "name": "Tushare - 股票数据源",
    "provider": "tushare",
    "api_endpoint": "http://api.tushare.pro",
    "config": {
      "data_types": ["daily_price", "basic_info"],
      "sync_frequency": "daily"
    },
    "rate_limit": 100
  }'
```

## 数据源字段说明

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| id | UUID | 唯一标识 | 自动生成 |
| name | VARCHAR(100) | 数据源名称 | Tushare - 股票数据源 |
| provider | VARCHAR(50) | 数据提供商 | tushare |
| api_endpoint | VARCHAR(500) | API 端点 | http://api.tushare.pro |
| api_key_encrypted | TEXT | 加密的 API Key | [加密内容] |
| config | JSONB | 配置信息 | {data_types, sync_frequency} |
| rate_limit | INTEGER | 速率限制 | 100 |
| is_active | BOOLEAN | 是否激活 | true |
| last_sync_at | TIMESTAMP | 最后同步时间 | NULL |
| last_sync_status | VARCHAR(50) | 最后同步状态 | pending |
| created_at | TIMESTAMP | 创建时间 | 自动 |
| updated_at | TIMESTAMP | 更新时间 | 自动 |

## 完整恢复脚本

保存以下内容为 `restore_data_sources.sql`：

```sql
-- FinApp 数据源恢复脚本
-- 恢复 price_data_sources 表中的默认数据源

BEGIN;

-- 清空现有数据（如需要）
-- DELETE FROM finapp.price_data_sources;

-- 插入 Tushare 数据源
INSERT INTO finapp.price_data_sources (
    id,
    name,
    provider,
    api_endpoint,
    api_key_encrypted,
    config,
    rate_limit,
    is_active,
    last_sync_status,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Tushare - 中国股票数据源',
    'tushare',
    'http://api.tushare.pro',
    NULL,
    '{"data_types": ["daily_price", "basic_info", "stock_list"], "sync_frequency": "daily", "min_share_price": 0.1}'::jsonb,
    '100',
    true,
    'pending',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (name) DO NOTHING;

-- 验证插入结果
SELECT '数据源恢复完成' as message, COUNT(*) as total_data_sources 
FROM finapp.price_data_sources;

COMMIT;
```

执行脚本：

```bash
# 方法 1：直接执行
psql -h localhost -U caojun -d finapp_test -f restore_data_sources.sql

# 方法 2：管道执行
cat restore_data_sources.sql | psql -h localhost -U caojun -d finapp_test

# 方法 3：交互执行
psql -h localhost -U caojun -d finapp_test
# 然后在 psql 中执行：
# \i restore_data_sources.sql
```

## 验证恢复

### 检查数据源是否恢复

```bash
psql -h localhost -U caojun -d finapp_test -c "
SELECT id, name, provider, api_endpoint, is_active, created_at 
FROM finapp.price_data_sources 
ORDER BY created_at DESC;
"
```

预期输出：

```
                   id                   |        name         | provider |     api_endpoint      | is_active |         created_at
----------------------------------------+---------------------+----------+----------------------+-----------+----------------------------
 [uuid]                                 | Tushare - ...       | tushare  | http://api.tushare.pro | t         | 2025-11-07 21:50:00
```

### 检查数据源配置

```bash
psql -h localhost -U caojun -d finapp_test -c "
SELECT name, provider, config, rate_limit, is_active 
FROM finapp.price_data_sources;
"
```

## 前端验证

1. 访问数据同步页面：`http://localhost:3001/admin/data-sync`
2. 点击"数据源"标签页
3. 应该看到列出的 Tushare 数据源

## 后续配置

### 配置 API Key

如果要实际使用 Tushare 数据源同步数据，需要：

1. 注册 Tushare 账户：https://tushare.pro
2. 获取 API Token
3. 通过 API 更新数据源的 API Key（加密存储）

```bash
curl -X PUT http://localhost:8000/api/admin/data-sources/<data_source_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "api_key_encrypted": "your_encrypted_api_key"
  }'
```

## 常见问题

### Q: 为什么数据源表是空的？

A: 种子数据脚本中没有包含数据源初始化。这可能是因为：
- 开发过程中数据被清空
- 迁移脚本不完整
- 手动清空了表

### Q: 可以添加多个数据源吗？

A: 可以。系统设计支持多个数据源，每个对应不同的 provider。

### Q: 不同的 provider 有什么区别？

A: 根据代码，系统目前只实现了 `tushare` provider。其他 provider（如果需要）需要在 PriceSyncService 中添加 `fetchFromXxx` 方法。

### Q: API Key 如何加密存储？

A: API Key 应该在应用启动时通过加密服务加密后存储。具体实现详见后端代码。

## 相关文件

- **后端服务**: `backend/src/services/PriceSyncService.ts`
- **前端页面**: `frontend/src/pages/admin/DataSync/index.tsx`
- **API 路由**: `backend/src/routes/priceSync.ts`
- **数据库表**: `finapp.price_data_sources`

## 备份建议

恢复前建议备份数据库：

```bash
bash /Users/caojun/code/FinApp/scripts/backup-database.sh
```

---

**最后更新**: 2025-11-07  
**版本**: v1.0  
**状态**: ✅ 已验证
