# 数据源快速配置参考

快速查阅数据源配置的关键信息。完整配置见 `DATA_SOURCE_CONFIGS.md`

## 对比表

| 功能 | Yahoo Finance | 东方财富 | 新浪财经 | FRED |
|------|--------------|---------|---------|------|
| **支持产品** | 股票、ETF、基金 | 股票、基金 | 股票、基金、期货、外汇 | 经济指标 |
| **支持国家** | 美国、香港、中国 | 中国 | 中国 | 美国 |
| **数据类型** | K线、财务数据 | K线、实时行情 | 实时行情 | 经济数据 |
| **需要 API Key** | ❌ 否 | ❌ 否 | ❌ 否 | ✅ 是 |
| **批量请求** | ❌ 否 | ❌ 否 | ✅ 是 | ✅ 是 |
| **历史数据** | ✅ 是 | ✅ 是 | ❌ 否 | ✅ 是 |
| **实时数据** | ✅ 是 | ✅ 是 | ✅ 是 | ❌ 否 |
| **QPS 限制** | 60/分钟 | 100/分钟 | 150/分钟 | 120/分钟 |

## 快速配置字符串

### Yahoo Finance
**仅复制 config 部分即可粘贴到 UI 中**
```json
{
  "supports_batch": false,
  "max_concurrent_requests": 5,
  "max_symbols_per_request": 1,
  "supports_products": ["STOCK", "ETF", "FUND"],
  "supports_countries": ["US", "HK", "CN"],
  "rate_limit_per_minute": 60,
  "timeout_seconds": 30,
  "requires_api_key": false
}
```

### 东方财富
```json
{
  "supports_batch": false,
  "max_concurrent_requests": 10,
  "max_symbols_per_request": 1,
  "supports_products": ["STOCK", "FUND"],
  "supports_countries": ["CN"],
  "rate_limit_per_minute": 100,
  "timeout_seconds": 15,
  "requires_api_key": false
}
```

### 新浪财经
```json
{
  "supports_batch": true,
  "max_concurrent_requests": 5,
  "max_symbols_per_request": 10,
  "supports_products": ["STOCK", "FUND", "FUTURES", "FOREX"],
  "supports_countries": ["CN"],
  "rate_limit_per_minute": 150,
  "timeout_seconds": 10,
  "requires_api_key": false
}
```

### FRED
```json
{
  "supports_batch": true,
  "max_concurrent_requests": 3,
  "max_symbols_per_request": 10,
  "supports_products": ["ECONOMIC_INDICATOR"],
  "supports_countries": ["US"],
  "rate_limit_per_minute": 120,
  "timeout_seconds": 20,
  "requires_api_key": true,
  "api_key_env_var": "FRED_API_KEY"
}
```

## 配置步骤

### 第一步：进入数据源管理
1. 访问 `http://localhost:3001/admin/data-sync`
2. 切换到 **数据源** 页签

### 第二步：添加新数据源
1. 点击 **新增数据源** 按钮
2. 填写以下信息：

| 字段 | 示例 | 备注 |
|------|------|------|
| **名称** | Yahoo Finance | 显示在任务中 |
| **提供商** | yahoo_finance | 从下拉选择 |
| **API 端点** | https://query1.finance.yahoo.com/v8/finance/chart/ | 完整的 API 基础 URL |
| **配置（JSON）** | 见上方快速配置 | 必须是有效的 JSON |
| **启用此数据源** | 打钩 | 可选择是否启用 |

### 第三步：保存
点击 **确定** 按钮保存配置。

## 常用 SQL 命令

### 查看已配置的数据源
```sql
SELECT id, name, provider, is_active, last_sync_at
FROM finapp.price_data_sources
ORDER BY created_at DESC;
```

### 查看数据源配置详情
```sql
SELECT id, name, provider, config, rate_limit, timeout_seconds
FROM finapp.price_data_sources
WHERE provider = 'yahoo_finance';
```

### 更新数据源状态
```sql
UPDATE finapp.price_data_sources
SET is_active = true
WHERE provider = 'yahoo_finance';
```

### 删除数据源（谨慎操作）
```sql
DELETE FROM finapp.price_data_sources
WHERE id = '数据源ID';
```

## API Key 配置

### FRED（必需）

1. **获取 API Key**
   - 访问 https://fredaccount.stlouisfed.org/login/secure/
   - 注册或登录
   - 创建新的 API Key

2. **配置环境变量**
   - 编辑 `backend/.env` 文件
   - 添加：`FRED_API_KEY=your_api_key_here`
   - 重启后端服务

3. **验证**
   ```bash
   # 后端项目中测试
   curl "https://api.stlouisfed.org/fred/series/UNRATE?api_key=$FRED_API_KEY&file_type=json"
   ```

## 常见错误排查

### 错误：Config JSON 格式不正确
- ❌ 检查 JSON 中的引号（必须是英文双引号 `"` 而非中文引号 `""`）
- ❌ 检查是否遗漏逗号
- ❌ 使用在线 JSON 验证工具：https://jsonlint.com/

### 错误：连接超时
- ❌ 检查 API 端点是否正确
- ❌ 检查网络连接
- ❌ 尝试增加 `timeout_seconds` 值

### 错误：请求限制
- ❌ 检查速率限制 `rate_limit_per_minute`
- ❌ 检查并发数 `max_concurrent_requests`
- ❌ 等待几分钟后重试

## 性能优化建议

1. **并发控制**：根据数据源的速率限制设置 `max_concurrent_requests`
2. **超时配置**：国内API建议15-30秒，国外API建议30-60秒
3. **批量查询**：新浪财经支持批量，可一次查询多个产品
4. **缓存策略**：频繁查询同一产品时，使用更长的间隔

## 关于国家维度

从 v1.0 开始，系统使用 **国家维度** 而非 **市场维度**。

- **国家代码**：CN、US、HK、JP 等
- **配置字段**：`supports_countries` 而非 `supports_markets`

示例：
```json
{
  "supports_countries": ["CN", "US", "HK"]
}
```

---

**最后更新**：2025-11-08

