# 美国股票同步失败修复指南

## 📋 问题描述

**错误信息**：
```
无权限获取US.BILI的行情，请检查美国市场股票行情权限
```

**资产**：BILI（哔哩哔哩美股）  
**市场**：美国股票市场  
**数据源**：富途 OpenD API

---

## 🔍 问题原因

富途账户**没有美股行情权限**。富途 OpenD 需要以下条件：

| 要求 | 状态 |
|------|------|
| 富途账户 | ✅ 已有 |
| OpenD 服务运行 | ✅ 正常（端口 11111） |
| 香港市场权限 | ✅ 正常（00700等可同步） |
| **美国市场权限** | ❌ **缺失** |

---

## 💡 解决方案

### 方案 1：开通富途美股行情权限（推荐）

#### 步骤 1：登录富途账户

访问：[https://www.futunn.com](https://www.futunn.com)

#### 步骤 2：开通美股行情

导航路径：
```
我的 → 数据服务 → 美股行情 → 开通权限
```

**费用**：
- 免费：延时15分钟行情
- 付费：实时行情（约 $9-19/月）

#### 步骤 3：验证权限

```bash
# 测试美股同步
cd /Users/caojun/code/FinApp
python3 scripts/futu-sync-single.py "5aec5284-20e0-4962-8e1d-a702724b6452" "US.BILI" 14
```

**预期输出**：
```json
{
  "success": true,
  "data": [...],
  "message": "成功同步 XX 条价格记录"
}
```

---

### 方案 2：切换到 Yahoo Finance（免费替代）

如果不想开通富途美股权限，可以使用 Yahoo Finance API。

#### 步骤 1：修改美股同步任务

```sql
-- 查询 Yahoo Finance 数据源 ID
SELECT id, name, provider FROM finapp.price_data_sources 
WHERE provider = 'yahoo_finance';

-- 假设返回 ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

-- 更新美股同步任务
UPDATE finapp.price_sync_tasks 
SET data_source_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
WHERE name = '美国股票价格同步';
```

#### 步骤 2：验证 Yahoo Finance

```bash
# 测试 Yahoo Finance API
curl "https://query1.finance.yahoo.com/v8/finance/chart/BILI?interval=1d&range=1mo"
```

**注意**：Yahoo Finance 有以下限制：
- ⚠️ 可能返回 403 错误（IP 限制）
- ⚠️ 每分钟请求次数限制
- ⚠️ 需要使用代理或 User-Agent

---

### 方案 3：暂时禁用美股同步

如果暂时不需要美股数据：

```sql
-- 禁用美股同步任务
UPDATE finapp.price_sync_tasks 
SET is_active = false
WHERE name = '美国股票价格同步';
```

---

### 方案 4：使用其他数据源

#### Alpha Vantage（免费 + 付费）

**优点**：
- ✅ 免费版每天 500 次请求
- ✅ 数据全面
- ✅ API 稳定

**缺点**：
- ❌ 需要注册 API Key
- ❌ 免费版有速率限制

**申请地址**：[https://www.alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key)

#### Polygon.io（免费 + 付费）

**优点**：
- ✅ 数据质量高
- ✅ 实时行情
- ✅ 历史数据全面

**缺点**：
- ❌ 免费版限制较多
- ❌ 需要信用卡验证

---

## 🔧 快速修复（推荐方案）

### 方案 A：开通富途美股权限（最简单）

```bash
# 1. 开通富途美股行情权限（在富途官网）
# 2. 重启富途 OpenD（确保权限生效）

# 3. 验证权限
python3 /Users/caojun/code/FinApp/scripts/futu-sync-single.py \
  "5aec5284-20e0-4962-8e1d-a702724b6452" "US.BILI" 14

# 4. 如果成功，在前端重新执行同步
```

### 方案 B：切换到 Yahoo Finance（免费但不稳定）

```sql
-- 1. 查询数据源
SELECT id, name, provider FROM finapp.price_data_sources;

-- 2. 假设 Yahoo Finance 的 ID 是 abc-def-123
-- 更新美股同步任务
UPDATE finapp.price_sync_tasks 
SET data_source_id = 'abc-def-123'::uuid
WHERE name = '美国股票价格同步';

-- 3. 在前端重新执行同步
```

### 方案 C：暂时禁用（最快）

```sql
-- 禁用美股同步
UPDATE finapp.price_sync_tasks 
SET is_active = false
WHERE name = '美国股票价格同步';
```

---

## 📊 各方案对比

| 方案 | 成本 | 数据质量 | 稳定性 | 实施难度 |
|------|------|---------|--------|---------|
| **富途美股权限** | $0-19/月 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 🟢 简单 |
| **Yahoo Finance** | 免费 | ⭐⭐⭐ | ⭐⭐ | 🟢 简单 |
| **Alpha Vantage** | 免费/付费 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 🟡 中等 |
| **Polygon.io** | 付费 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 🟡 中等 |
| **暂时禁用** | 免费 | N/A | N/A | 🟢 最简单 |

---

## 🎯 推荐方案

根据你的需求选择：

### 1. 如果你有富途账户且需要高质量数据
→ **开通富途美股权限**（方案 1）
- 延时行情免费
- 实时行情约 $9-19/月
- 数据最准确

### 2. 如果预算有限且不需要实时数据
→ **使用 Yahoo Finance**（方案 2）
- 完全免费
- 但可能不稳定（403 错误）
- 需要配置 User-Agent

### 3. 如果暂时不需要美股数据
→ **暂时禁用**（方案 3）
- 最简单
- 不影响其他市场（香港、中国等）

---

## ✅ 验证步骤

### 1. 验证富途美股权限

```bash
# 测试 BILI
python3 /Users/caojun/code/FinApp/scripts/futu-sync-single.py \
  "5aec5284-20e0-4962-8e1d-a702724b6452" "US.BILI" 14

# 测试其他美股（如果有）
python3 /Users/caojun/code/FinApp/scripts/futu-sync-single.py \
  "<asset_id>" "US.AAPL" 14
```

**成功标志**：
```json
{
  "success": true,
  "data": [...]
}
```

**失败标志**：
```json
{
  "success": false,
  "error": "无权限获取US.BILI的行情"
}
```

### 2. 前端测试

1. 访问 `http://localhost:3001`
2. 进入"数据同步" → "同步任务"
3. 选择"美国股票价格同步"
4. 点击"立即同步"
5. 查看"同步日志"

**预期结果**：
- ✅ 状态：success
- ✅ 同步记录数 > 0
- ✅ 成功数量 > 0

---

## 🔍 问题排查

### 问题 1：富途显示"无权限"

**原因**：
- 账户未开通美股行情
- 权限未生效
- OpenD 未重启

**解决**：
```bash
# 1. 确认已在富途官网开通权限
# 2. 重启富途 OpenD
# 3. 等待 5-10 分钟让权限生效
# 4. 重新测试
```

### 问题 2：Yahoo Finance 返回 403

**原因**：
- IP 被限制
- 缺少 User-Agent
- 请求频率过高

**解决**：
```typescript
// 在 PriceSyncService.ts 中添加 headers
const response = await axios.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...',
    'Accept': 'application/json',
  },
  timeout: 10000,
});
```

### 问题 3：仍然失败

**检查清单**：
- [ ] 数据源配置正确
- [ ] 资产 ID 存在
- [ ] 网络连接正常
- [ ] 后端服务已重启
- [ ] 查看详细错误日志

---

## 📞 支持

如果以上方案都无法解决：

1. **查看详细错误日志**：
   ```sql
   SELECT * FROM finapp.price_sync_errors 
   WHERE asset_symbol = 'BILI' 
   ORDER BY id DESC LIMIT 10;
   ```

2. **测试网络连接**：
   ```bash
   curl -I https://query1.finance.yahoo.com
   curl -I http://127.0.0.1:11111
   ```

3. **查看后端日志**：
   ```bash
   tail -f /Users/caojun/code/FinApp/logs/backend.log
   ```

---

**文档版本**：v1.0  
**创建日期**：2025-12-12  
**适用范围**：美国股票价格同步失败
