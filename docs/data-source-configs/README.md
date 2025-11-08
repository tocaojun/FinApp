# 数据源 JSON 配置文件

本目录包含四个主要数据源的完整 JSON 配置文件，可直接在程序中使用。

## 文件清单

| 文件 | 数据源 | 支持产品 | 支持国家 |
|------|--------|---------|---------|
| `yahoo-finance.json` | Yahoo Finance | 股票、ETF、基金 | 美国、香港、中国 |
| `eastmoney.json` | 东方财富 | 股票、基金 | 中国 |
| `sina.json` | 新浪财经 | 股票、基金、期货、外汇 | 中国 |
| `fred.json` | FRED | 经济指标 | 美国 |

## 快速使用

### 方式一：在 UI 中手动复制配置

1. 打开对应的 JSON 文件（如 `yahoo-finance.json`）
2. 复制整个 JSON 内容
3. 进入系统 **数据同步** → **数据源** → **新增数据源**
4. 依次填写：
   - **名称**：`Yahoo Finance`
   - **提供商**：`yahoo_finance`
   - **API 端点**：`https://query1.finance.yahoo.com/v8/finance/chart/`
   - **配置（JSON 格式）**：粘贴复制的 JSON 内容
5. 点击 **确定** 保存

### 方式二：直接从 JSON 对象创建

如果你的系统支持 API 直接插入，可以使用类似这样的命令：

```bash
curl -X POST http://localhost:8000/api/price-sync/data-sources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @yahoo-finance.json
```

### 方式三：通过数据库 SQL 导入

```sql
-- 先转换为有效的 SQL INSERT 语句
INSERT INTO finapp.price_data_sources (
  name, provider, api_endpoint, config, is_active
) VALUES (
  'Yahoo Finance',
  'yahoo_finance',
  'https://query1.finance.yahoo.com/v8/finance/chart/',
  '{"supports_batch": false, "max_concurrent_requests": 5, ...}'::jsonb,
  true
);
```

## 配置字段说明

每个 JSON 文件包含以下主要部分：

### 顶层字段

```json
{
  "name": "数据源显示名称",
  "provider": "提供商标识符",
  "api_endpoint": "API 基础 URL",
  "is_active": true,
  "config": { ... }
}
```

### config 对象常用字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `supports_batch` | boolean | 是否支持批量请求 |
| `max_concurrent_requests` | number | 最大并发请求数 |
| `max_symbols_per_request` | number | 单次请求最多符号数 |
| `supports_products` | array | 支持的产品类型 |
| `supports_countries` | array | 支持的国家代码 |
| `rate_limit_per_minute` | number | 每分钟请求限制 |
| `timeout_seconds` | number | 请求超时时间 |
| `requires_api_key` | boolean | 是否需要 API Key |

## 数据源特点对比

### Yahoo Finance
- ✅ 无需 API Key
- ✅ 支持美股、港股、A股
- ✅ 提供历史数据
- ❌ 不支持批量请求

### 东方财富
- ✅ 无需 API Key
- ✅ A股数据最实时
- ✅ 支持基金数据
- ⚠️ 代码需要前缀（sh/sz）

### 新浪财经
- ✅ 无需 API Key
- ✅ 支持批量请求
- ✅ 支持期货、外汇
- ❌ 仅提供当天数据

### FRED
- ⚠️ 需要 API Key（免费）
- ✅ 提供经济指标
- ✅ 历史数据丰富
- ✅ 支持批量查询

## 修改配置

如果需要修改某个数据源的配置：

1. 编辑对应的 JSON 文件
2. 验证 JSON 格式有效：`cat file.json | jq .`
3. 在系统中编辑数据源，更新配置
4. 测试同步任务是否正常运行

## 常见问题

### Q: 可以同时使用多个数据源吗？
**A:** 可以。建议根据需求组合使用，例如用 Yahoo Finance 做股票，用 FRED 做经济数据。

### Q: 如何修改已有数据源？
**A:** 在 **数据源** 页签找到目标数据源，点击 **编辑** 按钮，修改配置后保存。

### Q: JSON 验证工具
**A:** 使用 `jq` 命令或在线工具 https://jsonlint.com/ 验证 JSON 格式。

### Q: API Key 如何配置？
**A:** 对于需要 API Key 的数据源（如 FRED），在 `backend/.env` 中添加相应的环境变量，然后重启后端。

## 相关文档

- 完整配置说明：`../DATA_SOURCE_CONFIGS.md`
- 快速参考：`../DATA_SOURCE_QUICK_REFERENCE.md`

---

**更新日期**：2025-11-08  
**版本**：1.0

