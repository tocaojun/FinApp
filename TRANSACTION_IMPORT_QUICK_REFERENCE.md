# 交易批量导入快速参考

## 一、必填字段（8个）

| # | 字段 | 类型 | 示例 | 说明 |
|---|------|------|------|------|
| 1 | **portfolio** | String | `我的投资组合` | 必须是已存在的投资组合 |
| 2 | **account** | String | `港股账户` | 必须属于指定的投资组合 |
| 3 | **date** | Date | `2024-01-15` | YYYY-MM-DD格式，不能是未来 |
| 4 | **asset.symbol** | String | `00700.HK` | 必须是已存在的资产 |
| 5 | **type** | Enum | `STOCK_BUY` | 见下方交易类型列表 |
| 6 | **quantity** | Decimal | `100` | 必须 > 0 |
| 7 | **price** | Decimal | `320.5` | 必须 ≥ 0 |
| 8 | **currency** | String | `HKD` | ISO 4217货币代码（3位） |

## 二、可选字段（3个）

| # | 字段 | 类型 | 示例 | 默认值 |
|---|------|------|------|--------|
| 9 | **fee** | Decimal | `10.5` | `0` |
| 10 | **notes** | String | `建仓` | `null` |
| 11 | **tags** | Array | `["长期持有"]` | `[]` |

## 三、系统支持的交易类型

### 股票交易
- `STOCK_BUY` - 股票买入
- `STOCK_SELL` - 股票卖出

### 基金交易
- `FUND_SUBSCRIBE` - 基金申购
- `FUND_REDEEM` - 基金赎回

### 债券交易
- `BOND_BUY` - 债券买入
- `BOND_SELL` - 债券卖出

### 期权交易
- `OPTION_BUY` - 期权买入
- `OPTION_SELL` - 期权卖出
- `OPTION_EXERCISE` - 期权行权

### 现金流
- `DEPOSIT` - 存入
- `WITHDRAWAL` - 取出
- `DIVIDEND` - 分红
- `INTEREST` - 利息
- `FEE` - 费用
- `TRANSFER_IN` - 转入
- `TRANSFER_OUT` - 转出

### 便捷别名（自动映射）

| 输入 | 映射到 |
|------|--------|
| 买入, 买, buy | STOCK_BUY |
| 卖出, 卖, sell | STOCK_SELL |
| 申购, subscribe | FUND_SUBSCRIBE |
| 赎回, redeem | FUND_REDEEM |
| 分红, dividend | DIVIDEND |
| 存入, deposit | DEPOSIT |
| 取出, withdraw | WITHDRAWAL |

## 四、Excel模板

```
| 投资组合 | 交易账户 | 日期 | 资产代码 | 资产名称 | 交易类型 | 数量 | 价格 | 币种 | 手续费 | 备注 |
|---------|---------|------|---------|---------|---------|------|------|------|--------|------|
| 我的投资组合 | 港股账户 | 2024-01-15 | 00700.HK | 腾讯控股 | STOCK_BUY | 100 | 320.5 | HKD | 10 | 建仓 |
```

## 五、JSON模板

```json
{
  "transactions": [
    {
      "portfolio": "我的投资组合",
      "account": "港股账户",
      "date": "2024-01-15",
      "asset": {
        "symbol": "00700.HK",
        "name": "腾讯控股"
      },
      "type": "STOCK_BUY",
      "quantity": 100,
      "price": 320.5,
      "currency": "HKD",
      "fee": 10,
      "notes": "建仓",
      "tags": ["长期持有"]
    }
  ]
}
```

## 六、层级关系

```
用户 (User)
  └── 投资组合 (Portfolio) ← 必须存在
        └── 交易账户 (Trading Account) ← 必须存在且属于该组合
              └── 交易记录 (Transaction) ← 导入的数据
```

## 七、验证流程

```
1. 解析文件 (Excel/JSON)
   ↓
2. 验证投资组合存在
   ↓
3. 验证交易账户存在且属于该组合
   ↓
4. 验证资产存在
   ↓
5. 验证业务规则（数量、价格、日期等）
   ↓
6. 原子性导入（全部成功或全部失败）
```

## 八、常用币种代码

| 代码 | 币种 | 代码 | 币种 |
|------|------|------|------|
| CNY | 人民币 | USD | 美元 |
| HKD | 港币 | EUR | 欧元 |
| GBP | 英镑 | JPY | 日元 |
| AUD | 澳元 | CAD | 加元 |
| SGD | 新加坡元 | CHF | 瑞士法郎 |

## 九、导入前检查清单

- [ ] 投资组合已创建
- [ ] 交易账户已在对应组合下创建
- [ ] 所有资产已在系统中创建
- [ ] 日期格式正确（YYYY-MM-DD）
- [ ] 交易类型使用系统定义的类型
- [ ] 币种使用3位ISO代码
- [ ] 数量和价格为正数
- [ ] 已下载并使用官方模板

## 十、常见错误及解决

### 错误1: 投资组合不存在
```
❌ 投资组合 "测试组合" 不存在或已停用
✅ 前往【投资组合管理】创建该组合
```

### 错误2: 交易账户不属于组合
```
❌ 交易账户 "美股账户" 在投资组合 "我的组合" 中不存在
✅ 在该组合下创建交易账户，或修改为正确的组合名称
```

### 错误3: 资产不存在
```
❌ 资产不存在: TSLA
✅ 前往【资产管理】创建资产 TSLA
```

### 错误4: 交易类型错误
```
❌ 不支持的交易类型: purchase
✅ 使用 STOCK_BUY 或别名"买入"
```

### 错误5: 币种格式错误
```
❌ 币种必须是3位字母代码（当前值：RMB）
✅ 使用 CNY（不是RMB）
```

## 十一、最佳实践

1. **先创建层级结构**
   ```
   创建投资组合 → 创建交易账户 → 创建资产 → 导入交易
   ```

2. **使用标准类型**
   - 直接使用 `STOCK_BUY` 而不是 `买入`
   - 避免歧义，提高导入成功率

3. **小批量测试**
   - 先导入5-10条测试数据
   - 确认无误后再批量导入

4. **数据备份**
   - 导入前导出现有数据
   - 便于出错时恢复

5. **检查数据质量**
   - 确保日期连续性
   - 检查价格合理性
   - 验证数量准确性

## 十二、快速命令

### 下载模板
```bash
GET /api/transactions/import/template?format=excel
GET /api/transactions/import/template?format=json
```

### 预览导入
```bash
POST /api/transactions/import/preview
Content-Type: multipart/form-data
- file: [Excel/JSON文件]
- format: excel|json
```

### 执行导入
```bash
POST /api/transactions/import
Content-Type: multipart/form-data
- file: [Excel/JSON文件]
- format: excel|json
```

---

**文档版本**: 1.0  
**创建时间**: 2024-01-15  
**适用版本**: FinApp v1.0.1+

**相关文档**:
- 详细字段规范: `TRANSACTION_IMPORT_FIELDS_SPEC.md`
- 实现方案: `TRANSACTION_IMPORT_IMPLEMENTATION.md`
