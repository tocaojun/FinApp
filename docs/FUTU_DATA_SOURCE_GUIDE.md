# 富途证券数据源集成指南

## 📋 目录

1. [概述](#概述)
2. [支持的金融产品](#支持的金融产品)
3. [市场覆盖](#市场覆盖)
4. [环境配置](#环境配置)
5. [使用方法](#使用方法)
6. [API接口说明](#api接口说明)
7. [常见问题](#常见问题)

---

## 概述

富途证券数据源基于 **富途OpenAPI** 提供港股、美股、A股等多个市场的实时行情和历史数据。

### 核心特性

- ✅ **多市场支持**: 香港、美国、中国A股、新加坡、日本
- ✅ **多产品类型**: 股票、ETF、期权、期货、窝轮、牛熊证
- ✅ **历史数据**: 支持日K、周K、月K等多种K线数据
- ✅ **实时行情**: 支持实时报价推送
- ✅ **复权处理**: 支持前复权、后复权、不复权
- ✅ **高性能**: 低延迟数据获取

---

## 支持的金融产品

### 1. 股票 (STOCK)

| 市场 | 说明 | 示例代码 |
|------|------|---------|
| **香港** | 港股主板、创业板 | `HK.00700` (腾讯控股) |
| **美国** | NYSE、NASDAQ | `US.AAPL` (苹果) |
| **中国A股** | 沪深A股通股票 | `CN.600000` (浦发银行) |

### 2. ETF基金

| 市场 | 说明 | 示例代码 |
|------|------|---------|
| **香港** | 港股ETF | `HK.02800` (盈富基金) |
| **美国** | 美股ETF | `US.SPY` (标普500 ETF) |
| **中国A股** | A股ETF | `CN.510050` (50ETF) |

### 3. 期权 (OPTION)

| 市场 | 说明 |
|------|------|
| **香港** | 港股期权 |
| **美国** | 美股期权 |

### 4. 期货 (FUTURE)

| 市场 | 说明 |
|------|------|
| **香港** | 恒生指数期货等 |
| **美国** | 标普500期货等 |
| **新加坡** | 新加坡期货 (模拟) |
| **日本** | 日经225期货 (模拟) |

### 5. 香港衍生品

| 产品类型 | 说明 |
|---------|------|
| **窝轮 (WARRANT)** | 香港市场权证 |
| **牛熊证 (CBBC)** | 香港市场牛熊证 |

---

## 市场覆盖

### 香港市场 (HK)

```json
{
  "code": "HK",
  "name": "香港市场",
  "timezone": "Asia/Hong_Kong",
  "currency": "HKD",
  "tradingHours": {
    "open": "09:30",
    "close": "16:00"
  },
  "products": ["STOCK", "ETF", "OPTION", "FUTURE", "WARRANT", "CBBC"]
}
```

### 美国市场 (US)

```json
{
  "code": "US",
  "name": "美国市场",
  "timezone": "America/New_York",
  "currency": "USD",
  "tradingHours": {
    "open": "09:30",
    "close": "16:00"
  },
  "products": ["STOCK", "ETF", "OPTION", "FUTURE"]
}
```

### 中国A股市场 (CN)

```json
{
  "code": "CN",
  "name": "中国A股",
  "timezone": "Asia/Shanghai",
  "currency": "CNY",
  "tradingHours": {
    "open": "09:30",
    "close": "15:00"
  },
  "products": ["STOCK", "ETF"]
}
```

---

## 环境配置

### 1. 安装富途OpenD

**下载地址**:
- macOS: https://www.futunn.com/download/openAPI
- Windows: https://www.futunn.com/download/openAPI  
- Linux: https://www.futunn.com/download/openAPI

### 2. 配置OpenD

1. **启动OpenD程序**
2. **配置端口**: 默认 `11111`
3. **登录富途账号**
4. **开通市场权限**:
   - 基础行情: 免费
   - Level 2行情: 需订阅

### 3. 环境变量配置

在 `/Users/caojun/code/FinApp/backend/.env` 文件中添加:

```bash
# 富途OpenD服务地址
FUTU_API_HOST=localhost

# 富途OpenD服务端口
FUTU_API_PORT=11111

# 是否启用加密
FUTU_ENABLE_ENCRYPTION=false

# API超时时间(毫秒)
FUTU_API_TIMEOUT=30000
```

### 4. 运行数据库迁移

```bash
cd /Users/caojun/code/FinApp/backend
psql -h localhost -U finapp_user -d finapp_test -f migrations/017_futu_data_source.sql
```

---

## 使用方法

### 方法1: 通过前端UI创建同步任务

1. **访问价格同步管理页面**
   - 登录 FinApp 系统
   - 导航到 "数据管理" -> "价格同步"

2. **选择富途数据源**
   - 数据源: 富途证券
   - 产品类型: STOCK / ETF / OPTION 等
   - 市场: HK / US / CN 等

3. **配置同步任务**
   - 任务名称: 如 "港股历史价格同步"
   - 同步天数: 如 365 (一年)
   - 是否覆盖: 根据需要选择
   - 调度类型: 手动 / 定时

4. **执行同步**
   - 点击 "立即执行" 或等待定时任务触发

### 方法2: 通过API调用

#### 创建同步任务

```bash
curl -X POST http://localhost:8000/api/price-sync/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "港股历史价格同步",
    "data_source_id": "富途数据源ID",
    "asset_type_id": "STOCK资产类型ID",
    "country_id": "HK国家ID",
    "schedule_type": "manual",
    "sync_days_back": 365,
    "overwrite_existing": false,
    "is_active": true
  }'
```

#### 执行同步任务

```bash
curl -X POST http://localhost:8000/api/price-sync/tasks/{taskId}/execute \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 方法3: 使用 FutuDataSourceService

```typescript
import { futuDataSourceService } from './services/FutuDataSourceService';

// 同步特定资产的历史价格
const result = await futuDataSourceService.syncHistoricalPrices(
  ['资产ID1', '资产ID2'],  // 资产ID列表
  365,                      // 回溯365天
  false                     // 不覆盖已存在数据
);

console.log(`成功: ${result.success}, 失败: ${result.failed}`);
```

---

## API接口说明

### 1. 获取富途数据源信息

```sql
-- 查看富途数据源配置
SELECT * FROM finapp.v_futu_data_source_info;
```

返回字段:
- `id`: 数据源ID
- `name`: 数据源名称
- `supported_products`: 支持的产品类型
- `supported_markets`: 支持的市场
- `market_info`: 市场详细信息
- `api_version`: API版本

### 2. 查看同步任务

```sql
-- 查看所有富途相关的同步任务
SELECT t.*, ds.name as data_source_name
FROM finapp.price_sync_tasks t
JOIN finapp.price_data_sources ds ON t.data_source_id = ds.id
WHERE ds.provider = 'futu'
ORDER BY t.created_at DESC;
```

### 3. 查看同步日志

```sql
-- 查看最近的同步日志
SELECT l.*, t.name as task_name
FROM finapp.price_sync_logs l
JOIN finapp.price_sync_tasks t ON l.task_id = t.id
JOIN finapp.price_data_sources ds ON l.data_source_id = ds.id
WHERE ds.provider = 'futu'
ORDER BY l.started_at DESC
LIMIT 10;
```

### 4. 查看价格数据

```sql
-- 查看富途数据源同步的价格数据
SELECT 
    a.symbol,
    a.name,
    ap.price_date,
    ap.close_price,
    ap.volume,
    ap.price_source
FROM finapp.asset_prices ap
JOIN finapp.assets a ON ap.asset_id = a.id
WHERE ap.price_source = 'FUTU_API'
ORDER BY ap.price_date DESC
LIMIT 100;
```

---

## 常见问题

### Q1: 无法连接到富途OpenD

**错误信息**: `无法连接到富途OpenD服务`

**解决方案**:
1. 确认OpenD程序已启动
2. 检查端口配置 (默认11111)
3. 检查防火墙设置
4. 验证连接: 访问 `http://localhost:11111`

### Q2: 股票代码格式错误

**问题**: 获取不到数据或返回错误

**解决方案**:
- 确保使用富途格式: `MARKET.SYMBOL`
- 港股示例: `HK.00700` (腾讯)
- 美股示例: `US.AAPL` (苹果)
- A股示例: `CN.600000` (浦发银行)

### Q3: 没有行情权限

**错误信息**: `No permission for this market`

**解决方案**:
1. 登录富途牛牛/moomoo账号
2. 在账户设置中开通对应市场权限
3. 部分高级数据需要订阅Level 2行情

### Q4: 同步速度慢

**优化建议**:
1. 减少单次同步的天数 (建议≤365天)
2. 分批同步,避免一次同步过多资产
3. 使用定时任务分散同步压力
4. 检查网络连接质量

### Q5: 数据不完整

**可能原因**:
1. 股票停牌期间无交易数据
2. 新股上市时间短于请求天数
3. 某些特殊日期市场休市

**解决方案**:
- 查看 `price_sync_errors` 表获取详细错误
- 检查资产的上市日期
- 参考交易日历验证数据

---

## 技术支持

### 富途OpenAPI文档

- 官方文档: https://openapi.futunn.com/futu-api-doc/
- 行情接口: https://openapi.futunn.com/futu-api-doc/quote/overview.html
- SDK下载: https://openapi.futunn.com/futu-api-doc/intro/intro.html

### 联系方式

- 项目Issues: [GitHub Issues]
- 邮箱支持: [项目邮箱]

---

**文档版本**: v1.0  
**最后更新**: 2025-11-28  
**适用版本**: FinApp 1.0+
