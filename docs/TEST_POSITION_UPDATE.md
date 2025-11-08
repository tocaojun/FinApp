# 持仓更新功能测试指南

## 快速测试步骤

### 1. 准备测试数据

创建文件 `test_position_import.json`：

```json
[
  {
    "date": "2024-10-01",
    "type": "buy",
    "quantity": 100,
    "price": 150.00,
    "currency": "USD",
    "fee": 9.95,
    "notes": "测试买入 - 第一笔"
  },
  {
    "date": "2024-10-15",
    "type": "buy",
    "quantity": 50,
    "price": 155.00,
    "currency": "USD",
    "fee": 5.00,
    "notes": "测试加仓 - 第二笔"
  }
]
```

### 2. 执行导入

1. **打开浏览器**：http://localhost:3001
2. **登录系统**
3. **进入交易管理页面**
4. **点击"批量导入"按钮**
5. **填写导入信息**：
   - 选择投资组合
   - 选择交易账户
   - 选择资产（例如：AAPL - Apple Inc.）
6. **上传文件**：选择 `test_position_import.json`
7. **点击"确认导入"**

### 3. 验证结果

#### 方法1：前端查看持仓

1. **进入"持仓管理"页面**
2. **查看持仓列表**，应该能看到：
   - 资产名称：Apple Inc. (AAPL)
   - 持仓数量：150股
   - 平均成本：约 $151.67
   - 总成本：约 $22,750
   - 市值：根据当前价格计算

#### 方法2：查看后端日志

```bash
tail -50 /tmp/backend.log | grep -A5 "持仓更新"
```

应该看到：
```
开始更新持仓数据，共2条交易记录
Position updated successfully for transaction: xxx
Position updated successfully for transaction: xxx
持仓更新完成 - 成功: 2, 失败: 0
```

#### 方法3：数据库查询

```bash
# 连接数据库
psql -U finapp_user -d finapp_db

# 查询持仓
SELECT 
  a.symbol,
  a.name,
  p.quantity,
  p.average_cost,
  p.total_cost,
  p.currency,
  p.last_transaction_date
FROM finapp.positions p
JOIN finapp.assets a ON p.asset_id = a.id
WHERE p.is_active = true
ORDER BY p.updated_at DESC
LIMIT 5;
```

### 4. 预期计算结果

对于上面的测试数据：

| 指标 | 计算公式 | 结果 |
|------|---------|------|
| 总数量 | 100 + 50 | **150股** |
| 总成本 | (100 × 150) + (50 × 155) | **$22,750** |
| 平均成本 | 22,750 / 150 | **$151.67** |
| 总手续费 | 9.95 + 5.00 | **$14.95** |

## 测试场景

### 场景1：首次买入（创建新持仓）

**测试数据**：
```json
[
  {
    "date": "2024-10-01",
    "type": "buy",
    "quantity": 100,
    "price": 150.00,
    "currency": "USD",
    "notes": "首次建仓"
  }
]
```

**预期结果**：
- 创建新的持仓记录
- 数量：100
- 平均成本：$150.00
- 总成本：$15,000

### 场景2：加仓（更新现有持仓）

**前提**：已有100股，平均成本$150

**测试数据**：
```json
[
  {
    "date": "2024-10-15",
    "type": "buy",
    "quantity": 50,
    "price": 160.00,
    "currency": "USD",
    "notes": "加仓"
  }
]
```

**预期结果**：
- 数量：150（100 + 50）
- 平均成本：$153.33（(15,000 + 8,000) / 150）
- 总成本：$23,000

### 场景3：减仓（卖出部分）

**前提**：已有150股，平均成本$153.33

**测试数据**：
```json
[
  {
    "date": "2024-10-20",
    "type": "sell",
    "quantity": 50,
    "price": 165.00,
    "currency": "USD",
    "notes": "减仓"
  }
]
```

**预期结果**：
- 数量：100（150 - 50）
- 平均成本：$153.33（保持不变）
- 总成本：$15,333（100 × 153.33）

### 场景4：全部卖出（清仓）

**前提**：已有100股

**测试数据**：
```json
[
  {
    "date": "2024-10-25",
    "type": "sell",
    "quantity": 100,
    "price": 170.00,
    "currency": "USD",
    "notes": "清仓"
  }
]
```

**预期结果**：
- 数量：0
- 持仓记录保留（`is_active = true`）
- 可以查看历史持仓

### 场景5：分红（增加数量）

**测试数据**：
```json
[
  {
    "date": "2024-10-30",
    "type": "dividend",
    "quantity": 100,
    "price": 2.50,
    "currency": "USD",
    "notes": "季度分红"
  }
]
```

**预期结果**：
- 数量增加100股（如果是股票分红）
- 或者现金分红记录

## 常见问题

### Q1: 导入成功但看不到持仓？

**检查步骤**：
1. 刷新持仓页面（F5）
2. 检查是否选择了正确的投资组合
3. 查看后端日志是否有错误
4. 确认资产ID是否正确

### Q2: 持仓数量不对？

**可能原因**：
1. 交易类型错误（buy/sell混淆）
2. 数量为负数
3. 多次导入相同数据

**解决方法**：
- 删除错误的交易记录
- 重新导入正确的数据

### Q3: 平均成本计算不对？

**检查**：
- 确认所有交易使用相同币种
- 确认价格和数量都是正数
- 手动计算验证公式

### Q4: 导入很慢？

**原因**：
- 每条交易都会更新持仓（串行处理）
- 大量数据导入需要时间

**建议**：
- 分批导入（每次< 100条）
- 等待导入完成，不要重复提交

## 性能参考

| 交易数量 | 预计耗时 |
|---------|---------|
| 10条 | < 1秒 |
| 50条 | 2-3秒 |
| 100条 | 5-8秒 |
| 500条 | 30-60秒 |

## 回滚操作

如果导入错误，需要回滚：

### 方法1：删除交易记录（推荐）

```sql
-- 删除指定时间段的交易
DELETE FROM finapp.transactions
WHERE portfolio_id = 'YOUR_PORTFOLIO_ID'
  AND transaction_date >= '2024-10-01'
  AND transaction_date <= '2024-10-31';
```

### 方法2：重新计算持仓

```sql
-- 手动触发持仓重算（如果有此功能）
-- 或者删除持仓记录，让系统重新计算
DELETE FROM finapp.positions
WHERE portfolio_id = 'YOUR_PORTFOLIO_ID'
  AND asset_id = 'YOUR_ASSET_ID';
```

## 相关文档

- 📄 `BATCH_IMPORT_POSITION_UPDATE_FIX.md` - 修复详细说明
- 📄 `TRANSACTION_IMPORT_QUICK_REFERENCE_V2.md` - 导入功能快速参考
- 📄 `IMPORT_CONSTRAINT_FIX_COMPLETE.md` - 约束修复说明

---

**测试准备完成，请开始验证！** 🚀
