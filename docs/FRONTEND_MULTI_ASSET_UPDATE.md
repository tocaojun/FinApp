# 前端多资产类型支持 - 更新说明

## ✅ 已完成的前端更新

### 1. 创建的组件（7个）

#### 详情字段组件
位置：`frontend/src/components/asset/details/`

| 组件 | 文件 | 行数 | 用途 |
|------|------|------|------|
| `StockDetailsFields` | StockDetailsFields.tsx | 139 | 股票详情字段 |
| `FundDetailsFields` | FundDetailsFields.tsx | 219 | 基金详情字段 |
| `BondDetailsFields` | BondDetailsFields.tsx | 233 | 债券详情字段 |
| `FuturesDetailsFields` | index.tsx | - | 期货详情字段 |
| `WealthProductDetailsFields` | index.tsx | - | 理财产品详情字段 |
| `TreasuryDetailsFields` | index.tsx | - | 国债详情字段 |
| 索引文件 | index.tsx | 281 | 统一导出 |

### 2. 更新的页面

#### AssetManagement.tsx
- ✅ 导入详情字段组件
- ✅ 添加 `formAssetTypeCode` 状态
- ✅ 资产类型选择时动态设置类型代码
- ✅ 根据资产类型动态显示对应的详情字段
- ✅ 创建/编辑时正确初始化资产类型

### 3. 功能特性

#### 动态表单
```typescript
// 根据选择的资产类型显示不同的详情字段
{formAssetTypeCode === 'STOCK' && <StockDetailsFields />}
{formAssetTypeCode === 'FUND' && <FundDetailsFields />}
{formAssetTypeCode === 'BOND' && <BondDetailsFields />}
{formAssetTypeCode === 'FUTURES' && <FuturesDetailsFields />}
{formAssetTypeCode === 'WEALTH' && <WealthProductDetailsFields />}
{formAssetTypeCode === 'TREASURY' && <TreasuryDetailsFields />}
```

#### 字段嵌套
所有详情字段使用嵌套路径：
```typescript
<Form.Item name={['details', 'sector']} label="行业板块">
  <Input />
</Form.Item>
```

这样提交时数据结构为：
```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "assetTypeId": "xxx",
  "details": {
    "sector": "科技",
    "industry": "消费电子",
    "peRatio": 28.5
  }
}
```

---

## 📋 各资产类型的字段

### 股票 (STOCK)
- ✅ 行业板块 (sector)
- ✅ 细分行业 (industry)
- ✅ 市值 (marketCap)
- ✅ 市盈率 (peRatio)
- ✅ 市净率 (pbRatio)
- ✅ 股息率 (dividendYield)
- ✅ 流通股数 (sharesOutstanding)
- ✅ 成立年份 (foundedYear)
- ✅ 公司网站 (companyWebsite)
- ✅ 总部地址 (headquarters)

### 基金 (FUND)
- ✅ 基金类型 (fundType) - 必填
  - 股票型 (equity)
  - 债券型 (bond)
  - 混合型 (hybrid)
  - 货币市场型 (money_market)
  - 指数型 (index)
- ✅ 基金分类 (fundCategory)
- ✅ 最新净值 (nav)
- ✅ 累计净值 (accumulatedNav)
- ✅ 净值日期 (navDate)
- ✅ 管理费率 (managementFee)
- ✅ 托管费率 (custodianFee)
- ✅ 申购费率 (subscriptionFee)
- ✅ 赎回费率 (redemptionFee)
- ✅ 基金规模 (fundSize)
- ✅ 成立日期 (inceptionDate)
- ✅ 基金经理 (fundManager)
- ✅ 基金公司 (fundCompany)
- ✅ 最低投资额 (minInvestment)
- ✅ 最低赎回额 (minRedemption)

### 债券 (BOND)
- ✅ 债券类型 (bondType) - 必填
  - 政府债 (government)
  - 企业债 (corporate)
  - 地方债 (municipal)
  - 可转债 (convertible)
- ✅ 信用评级 (creditRating)
- ✅ 面值 (faceValue) - 必填
- ✅ 票面利率 (couponRate) - 必填
- ✅ 付息频率 (couponFrequency)
- ✅ 发行日期 (issueDate) - 必填
- ✅ 到期日期 (maturityDate) - 必填
- ✅ 剩余年限 (yearsToMaturity)
- ✅ 到期收益率 (yieldToMaturity)
- ✅ 当前收益率 (currentYield)
- ✅ 发行价格 (issuePrice)
- ✅ 发行人 (issuer)
- ✅ 发行规模 (issueSize)
- ✅ 是否可赎回 (callable)
- ✅ 赎回日期 (callDate)
- ✅ 赎回价格 (callPrice)

### 期货 (FUTURES)
- ✅ 期货类型 (futuresType) - 必填
  - 商品期货 (commodity)
  - 金融期货 (financial)
  - 指数期货 (index)
  - 外汇期货 (currency)
- ✅ 合约月份 (contractMonth) - 必填
- ✅ 标的资产 (underlyingAsset)
- ✅ 合约规模 (contractSize)
- ✅ 初始保证金 (initialMargin)
- ✅ 维持保证金 (maintenanceMargin)
- ✅ 保证金比例 (marginRate)

### 理财产品 (WEALTH)
- ✅ 产品类型 (productType) - 必填
  - 固定收益型 (fixed_income)
  - 浮动收益型 (floating)
  - 结构化产品 (structured)
- ✅ 风险等级 (riskLevel) - 必填
  - R1（低风险）
  - R2（中低风险）
  - R3（中风险）
  - R4（中高风险）
  - R5（高风险）
- ✅ 预期收益率 (expectedReturn)
- ✅ 最低收益率 (minReturn)
- ✅ 最高收益率 (maxReturn)
- ✅ 发行日期 (issueDate) - 必填
- ✅ 起息日期 (startDate) - 必填
- ✅ 到期日期 (maturityDate) - 必填
- ✅ 起购金额 (minInvestment)
- ✅ 发行机构 (issuer)

### 国债 (TREASURY)
- ✅ 国债类型 (treasuryType) - 必填
  - 储蓄国债 (savings)
  - 记账式国债 (book_entry)
  - 凭证式国债 (certificate)
- ✅ 期限类型 (termType)
  - 短期（1年以内）
  - 中期（1-10年）
  - 长期（10年以上）
- ✅ 面值 (faceValue) - 必填
- ✅ 票面利率 (couponRate) - 必填
- ✅ 期限（年）(termYears)
- ✅ 发行日期 (issueDate) - 必填
- ✅ 到期日期 (maturityDate) - 必填
- ✅ 发行批次号 (issueNumber)
- ✅ 到期收益率 (yieldToMaturity)

---

## 🎨 UI/UX 特性

### 1. 动态表单
- 根据选择的资产类型自动显示/隐藏对应的详情字段
- 切换资产类型时自动清空详情字段

### 2. 字段验证
- 必填字段标记 `*`
- 数值范围验证（例如：利率 0-100%）
- 日期格式验证

### 3. 用户提示
- Tooltip 提示字段含义
- Placeholder 提供输入示例
- Alert 提示信息（期货、理财、国债）

### 4. 布局优化
- 使用 Row/Col 响应式布局
- 相关字段分组显示
- Divider 分隔基础信息和详情

---

## 🔧 使用示例

### 创建股票
1. 点击"新增资产"
2. 选择资产类型：股票
3. 填写基础信息（代码、名称、市场等）
4. 自动显示股票详情字段
5. 填写行业、市盈率等信息
6. 提交

### 创建基金
1. 点击"新增资产"
2. 选择资产类型：基金
3. 填写基础信息
4. 自动显示基金详情字段
5. 选择基金类型（必填）
6. 填写净值、管理费等信息
7. 提交

---

## 📊 表单数据结构

### 提交数据格式
```json
{
  "symbol": "000001",
  "name": "华夏成长混合",
  "assetTypeId": "fund-type-id",
  "marketId": "cn-market-id",
  "currency": "CNY",
  "riskLevel": "MEDIUM",
  "liquidityTag": "high-liquidity-id",
  "details": {
    "fundType": "hybrid",
    "nav": 2.3456,
    "navDate": "2025-10-27",
    "managementFee": 1.5,
    "fundManager": "张三",
    "fundCompany": "华夏基金"
  }
}
```

### 编辑时数据回填
```typescript
// 后端返回的数据
{
  id: "xxx",
  symbol: "000001",
  name: "华夏成长混合",
  assetTypeId: "fund-type-id",
  assetTypeCode: "FUND",
  details: {
    fundType: "hybrid",
    nav: 2.3456,
    // ...
  }
}

// 前端自动回填到表单
form.setFieldsValue({
  symbol: "000001",
  name: "华夏成长混合",
  assetTypeId: "fund-type-id",
  details: {
    fundType: "hybrid",
    nav: 2.3456,
  }
});
```

---

## ⚠️ 注意事项

### 1. 后端API适配
前端已准备好，但需要确保后端API支持：
- ✅ 接收嵌套的 `details` 字段
- ✅ 返回完整的资产详情
- ✅ 使用 `createAssetWithDetails` 方法

### 2. 数据迁移
- 旧的 `sector` 和 `industry` 字段已迁移到 `stock_details` 表
- 前端表单使用 `details.sector` 和 `details.industry`
- 后端需要处理数据格式转换

### 3. 类型安全
- 所有详情字段都有TypeScript类型定义
- 使用 `Form.Item name={['details', 'fieldName']}` 确保类型安全

---

## 🚀 下一步

### 短期（1-2天）
- [ ] 测试所有资产类型的创建和编辑
- [ ] 验证数据提交和回填
- [ ] 调整字段布局和样式

### 中期（3-5天）
- [ ] 添加详情字段的条件显示逻辑
- [ ] 实现字段间的联动（例如：计算剩余年限）
- [ ] 添加更多验证规则

### 长期（1-2周）
- [ ] 资产详情展示页面优化
- [ ] 批量导入时支持详情字段
- [ ] 资产对比功能增强

---

## 📚 相关文档

- `MULTI_ASSET_IMPLEMENTATION_COMPLETE.md` - 后端实施报告
- `backend/src/types/asset-details.types.ts` - 类型定义
- `backend/src/services/AssetDetailsService.ts` - 详情服务

---

**更新日期**: 2025-10-27  
**更新人员**: AI Assistant  
**状态**: ✅ 前端组件已创建，待测试
