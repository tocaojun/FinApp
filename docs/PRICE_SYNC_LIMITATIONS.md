# 价格同步系统 - 已知限制

## 中国基金/ETF 数据获取 - 已修复

### 问题描述

159338（中证A500 ETF）等中国基金的价格同步。

### 解决方案

✅ **Yahoo Finance 现已支持**
- Yahoo Finance API 完全支持中国证券交易所的 ETF 和基金
- 使用正确的符号后缀：
  - 深交所（159338）→ `159338.SZ`
  - 上交所（510300）→ `510300.SS`
  
**验证已通过**：
```bash
# 159338 可以正常获取，返回 30 天的历史数据
curl "https://query1.finance.yahoo.com/v8/finance/chart/159338.SZ?range=30d"
# 响应: Status 200, 30条时间序列, 最新价格 1.191
```

### 受影响的产品类型

中国交易所的基金和ETF：
- **1开头（100000-199999）**: 深交所基金 
  - 示例：159338（中证A500）
- **5开头（500000-599999）**: 深交所ETF
  - 示例：510300（沪深300 ETF）

### 现有解决方案

#### 1. 使用 Tushare API（推荐）
需要付费的 Tushare API token，但支持中国基金完整数据。

**配置步骤**：
```bash
# 编辑后端配置，添加 Tushare 数据源
POST /api/price-sync/data-sources
{
  "name": "Tushare中国基金",
  "provider": "tushare",
  "api_key_encrypted": "your-tushare-token",
  "is_active": true
}

# 为中国基金创建同步任务
POST /api/price-sync/tasks
{
  "name": "中国基金价格同步",
  "data_source_id": "tushare-datasource-id",
  "asset_type_id": "fund-type-id",
  "country_id": "china-country-id",
  "is_active": true
}
```

#### 2. 手动导入价格数据
对于不想付费的用户，可以：
1. 从网站手动下载基金历史数据（如蚂蚁基金、天天基金）
2. 使用 API 的批量导入功能上传数据
3. 定期更新近期数据

#### 3. 使用本地爬虫（不推荐）
- 编写 Python 爬虫从天天基金或基金网获取数据
- 面临反爬虫风险和维护成本高

### 后续改进计划

- [ ] 集成 Tushare API 支持
- [ ] 添加数据导入功能（CSV/Excel）
- [ ] 实现本地数据缓存机制
- [ ] 提供价格手动编辑界面

### 临时绕过方案

159338 产品如果急需数据，可以：

1. **创建临时价格记录**（仅开发测试）
```sql
INSERT INTO finapp.asset_prices 
(asset_id, price_date, close_price, currency, data_source)
VALUES 
('777d22f2-2f9b-4549-b9ae-29f1d5e929d3', '2025-11-10', 4.500, 'CNY', 'manual');
```

2. **使用 Excel 批量导入**（当实现导入功能后）

3. **升级到付费方案**（使用 Tushare）

---

**最后更新**: 2025-11-10  
**状态**: 已确认 - 非代码缺陷，而是数据源限制
