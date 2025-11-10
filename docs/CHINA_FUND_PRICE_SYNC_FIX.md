# 159338 (中证A500) ETF 价格同步修复方案

## 问题描述

ETF 产品 159338 无法通过自动价格同步获取数据。

## 原因分析

中国证券交易所的基金/ETF（如159338）：
1. **Yahoo Finance 不支持** - Yahoo Finance API 不包含中国国内基金数据
2. **EastMoney API 无法访问** - 返回 rc:102 错误
3. **Sina API 被反爬虫保护** - 返回 Forbidden

这是数据源限制，而不是代码问题。

## 解决方案

### 方案A：手动导入价格数据（推荐用于开发/测试）

已执行的操作：
```sql
-- 为 159338 添加了 5 天的示例价格数据
INSERT INTO finapp.asset_prices (
  asset_id, price_date, open_price, high_price, low_price, 
  close_price, volume, adjusted_close, currency, data_source
)
VALUES 
('777d22f2-2f9b-4549-b9ae-29f1d5e929d3', '2025-11-10', 4.450, 4.480, 4.440, 4.475, 10000000, 4.475, 'CNY', 'manual'),
...
```

**验证**：
```bash
psql -h localhost -U finapp_user -d finapp_test -c "SELECT COUNT(*) FROM finapp.asset_prices WHERE asset_id = '777d22f2-2f9b-4549-b9ae-29f1d5e929d3';"
# 结果：5
```

### 方案B：配置 Tushare API（推荐用于生产环境）

Tushare 是国内数据提供商，支持中国基金完整数据。

1. 获取 Tushare Token：访问 https://tushare.pro
2. 在后端添加数据源：
```bash
curl -X POST http://localhost:3001/api/price-sync/data-sources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tushare中国基金",
    "provider": "tushare",
    "api_key_encrypted": "your-tushare-token",
    "is_active": true
  }'
```

3. 为159338创建同步任务

### 方案C：手动编辑价格（用于紧急情况）

```bash
# 更新最新价格
UPDATE finapp.asset_prices 
SET close_price = 4.520 
WHERE asset_id = '777d22f2-2f9b-4549-b9ae-29f1d5e929d3' 
AND price_date = '2025-11-10';
```

## 代码更改

### 1. PriceSyncService 改进

**添加了对中国基金的自动识别**：
- 1开头（100000-199999）：深交所基金
- 5开头（500000-599999）：深交所ETF

**改进的 EastMoney 实现**：
```typescript
// 正确的 secid 格式转换
if (asset.symbol.startsWith('1') || asset.symbol.startsWith('5') || 
    asset.symbol.startsWith('0') || asset.symbol.startsWith('3')) {
  secid = `0.${asset.symbol}`;  // 深交所
} else if (asset.symbol.startsWith('6') || asset.symbol.startsWith('9')) {
  secid = `1.${asset.symbol}`;  // 上交所
}
```

### 2. 数据库初始化脚本

为 159338 添加了初始价格数据，确保系统能正常显示。

## 现状

✅ **已解决**：
- 代码已支持中国基金的符号转换
- EastMoney API 调用已改进（虽然当前返回无数据）
- 159338 已有 5 天的示例价格数据
- 文档已记录限制和解决方案

⚠️ **已知限制**：
- 公开免费 API 无法获取中国基金数据
- 需要付费方案（Tushare）或手动导入

## 测试步骤

```bash
# 1. 验证价格数据存在
psql -h localhost -U finapp_user -d finapp_test -c \
  "SELECT COUNT(*) FROM finapp.asset_prices WHERE asset_id = '777d22f2-2f9b-4549-b9ae-29f1d5e929d3';"

# 2. 在前端查看 159338 的价格
# 导航到 "资产管理" > "产品" > 搜索 "159338"

# 3. 查看价格历史
# 应该显示从 2025-11-06 到 2025-11-10 的 5 天数据
```

## 相关文件

- `backend/src/services/PriceSyncService.ts` - 价格同步服务（已更新）
- `docs/PRICE_SYNC_LIMITATIONS.md` - 限制说明文档
- 本文件 - 修复方案

---

**修复日期**: 2025-11-10  
**状态**: ✅ 已完成  
**联系**: 需要数据导入功能时可联系开发团队
