# 存款产品管理指南

## 功能概述

存款产品管理功能允许您添加、查看和管理各类银行存款产品，包括活期存款、定期存款、通知存款和结构性存款。

## 如何添加存款产品

### 方法一：通过前端界面添加（推荐）

1. **打开存款产品页面**
   - 访问: `http://localhost:3001/deposits`
   - 或在应用导航栏中选择"存款管理"

2. **点击"添加产品"按钮**
   - 在页面右上角的筛选区域找到"添加产品"按钮
   - 点击后会弹出添加表单

3. **填写产品信息**

   **基本信息：**
   - 产品代码：唯一标识，如 `DEPOSIT_BOC_12M`（大写字母、数字、下划线）
   - 产品名称：如"中国银行12个月定期存款"
   - 银行名称：如"中国银行"
   - 支行名称（可选）：如"北京分行"
   - 存款类型：活期/定期/通知/结构性
   - 币种：CNY/USD/EUR/HKD

   **利率信息：**
   - 年利率(%)：如 2.75
   - 利率类型：固定/浮动
   - 计息频率：按日/按月/按季/按年/到期一次性付息

   **期限设置（定期存款）：**
   - 存款期限（月）：如 12
   - 自动续存：开/关

   **通知期（通知存款）：**
   - 通知期（天）：如 7

   **金额限制：**
   - 起存金额：如 50
   - 最大金额：不限制可留空
   - 递增单位：如 100

   **提前支取：**
   - 允许提前支取：是/否
   - 提前支取罚息率(%)：如 0.3

   **存款保险：**
   - 存款保险保障：是/否
   - 保险金额：如 500000

   **产品描述（可选）：**
   - 输入详细的产品说明

4. **提交创建**
   - 点击"确定"按钮
   - 等待创建成功提示
   - 产品列表会自动刷新

### 方法二：通过SQL直接添加

```sql
-- 1. 创建资产记录
INSERT INTO finapp.assets (symbol, name, asset_type_id, currency, description, is_active)
SELECT 
    'DEPOSIT_CCB_6M',
    '建设银行6个月定期存款',
    at.id,
    'CNY',
    '建设银行6个月整存整取定期存款',
    true
FROM finapp.asset_types at WHERE at.code = 'DEPOSIT';

-- 2. 创建存款详情
INSERT INTO finapp.deposit_details (
    asset_id, 
    deposit_type, 
    bank_name, 
    interest_rate, 
    rate_type,
    compound_frequency, 
    term_months, 
    min_deposit_amount, 
    auto_renewal,
    early_withdrawal_allowed, 
    early_withdrawal_penalty_rate,
    deposit_insurance_covered, 
    insurance_amount
)
SELECT 
    a.id,
    'TIME',
    '建设银行',
    0.0255,  -- 2.55%
    'FIXED',
    'MATURITY',
    6,
    50.00,
    false,
    true,
    0.0030,  -- 0.30% 按活期计息
    true,
    500000.00
FROM finapp.assets a 
WHERE a.symbol = 'DEPOSIT_CCB_6M';
```

### 方法三：通过API添加

```bash
# 1. 登录获取token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testapi@finapp.com","password":"testapi123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 2. 创建资产
ASSET_RESPONSE=$(curl -s -X POST http://localhost:8000/api/assets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "symbol": "DEPOSIT_ABC_12M",
    "name": "农业银行12个月定期存款",
    "assetTypeCode": "DEPOSIT",
    "currency": "CNY",
    "description": "农业银行12个月整存整取",
    "isActive": true
  }')

ASSET_ID=$(echo $ASSET_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

# 3. 创建存款详情
curl -X POST "http://localhost:8000/api/deposits/products/${ASSET_ID}/details" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "assetId": "'$ASSET_ID'",
    "depositType": "TIME",
    "bankName": "农业银行",
    "interestRate": 0.0265,
    "rateType": "FIXED",
    "compoundFrequency": "MATURITY",
    "termMonths": 12,
    "minDepositAmount": 50,
    "autoRenewal": false,
    "earlyWithdrawalAllowed": true,
    "earlyWithdrawalPenaltyRate": 0.003,
    "depositInsuranceCovered": true,
    "insuranceAmount": 500000
  }'
```

## 存款产品示例

### 活期存款示例

```
产品代码: DEPOSIT_ICBC_DEMAND
产品名称: 工商银行活期存款
银行: 工商银行
存款类型: 活期
年利率: 0.30%
计息频率: 按日计息
起存金额: ¥1
存款保险: ✓
```

### 定期存款示例

```
产品代码: DEPOSIT_CCB_24M
产品名称: 建设银行24个月定期存款
银行: 建设银行
存款类型: 定期
年利率: 3.10%
计息频率: 到期一次性付息
期限: 24个月
起存金额: ¥50
自动续存: ✗
提前支取: ✓ (罚息率0.30%)
存款保险: ✓ (保额¥500,000)
```

### 通知存款示例

```
产品代码: DEPOSIT_BOC_NOTICE7
产品名称: 中国银行7天通知存款
银行: 中国银行
存款类型: 通知
年利率: 1.10%
通知期: 7天
起存金额: ¥50,000
```

## 字段说明

### 存款类型 (depositType)
- **DEMAND**: 活期存款 - 随存随取，按日计息
- **TIME**: 定期存款 - 固定期限，到期支付本息
- **NOTICE**: 通知存款 - 需提前通知取款
- **STRUCTURED**: 结构性存款 - 收益与金融衍生品挂钩

### 利率类型 (rateType)
- **FIXED**: 固定利率 - 存期内利率不变
- **FLOATING**: 浮动利率 - 利率可能随市场调整

### 计息频率 (compoundFrequency)
- **DAILY**: 按日计息 - 日复利
- **MONTHLY**: 按月计息 - 月复利
- **QUARTERLY**: 按季计息 - 季复利
- **ANNUALLY**: 按年计息 - 年复利
- **MATURITY**: 到期一次性付息 - 不复利

### 年利率输入格式
- 前端输入: 百分比形式，如 `2.75` 表示 2.75%
- 数据库存储: 小数形式，如 `0.0275` 表示 2.75%
- 系统会自动转换

## 查看存款产品

### 产品列表功能

1. **筛选条件**
   - 银行名称搜索
   - 存款类型筛选
   - 利率范围筛选（最低-最高）

2. **产品信息展示**
   - 产品名称、银行、类型
   - 年利率和实际年化收益率
   - 存款期限
   - 起存金额
   - 产品特性标签

3. **操作按钮**
   - **存入**: 创建存款持仓
   - **详情**: 查看完整产品信息

## 验证产品创建

### 方法1: 前端查看
访问 `http://localhost:3001/deposits` 查看产品列表

### 方法2: API查询
```bash
curl http://localhost:8000/api/deposits/products | python3 -m json.tool
```

### 方法3: 数据库查询
```sql
-- 查看所有存款产品
SELECT * FROM finapp.deposit_products_summary 
ORDER BY bank_name, deposit_type, term_months;

-- 查询特定银行的产品
SELECT 
    product_name,
    bank_name,
    deposit_type,
    interest_rate * 100 as rate_percent,
    term_months
FROM finapp.deposit_products_summary
WHERE bank_name LIKE '%工商%'
ORDER BY term_months;
```

## 常见问题

### Q1: 创建产品时提示"产品代码已存在"
**A**: 产品代码(symbol)必须唯一，请使用不同的代码，如添加日期后缀 `_20251117`

### Q2: 年利率应该填多少？
**A**: 填写百分比数值，如年利率2.75%就填 `2.75`，系统会自动转换为0.0275存储

### Q3: 定期存款必须填哪些字段？
**A**: 
- 必填：产品代码、产品名称、银行名称、年利率、存款期限（月）
- 推荐：起存金额、提前支取罚息率

### Q4: 如何修改已创建的产品？
**A**: 目前需要通过SQL或API直接更新，前端编辑功能待开发

### Q5: 实际年化收益率如何计算？
**A**: 根据计息频率自动计算：
- 日复利: (1 + 年利率/365)^365 - 1
- 月复利: (1 + 年利率/12)^12 - 1
- 季复利: (1 + 年利率/4)^4 - 1
- 年复利/到期一次性: 年利率

## 数据库结构

### 相关表
- `finapp.assets` - 资产基础表
- `finapp.deposit_details` - 存款详情表
- `finapp.deposit_products_summary` - 存款产品汇总视图

### 关键约束
- `asset_id` 外键关联 `assets.id`
- `deposit_type` 必须是 DEMAND/TIME/NOTICE/STRUCTURED 之一
- `interest_rate` 范围 0.000001 - 1.0 (0.0001% - 100%)

## 下一步功能

- [ ] 产品编辑功能
- [ ] 产品删除/停用
- [ ] 批量导入产品
- [ ] 产品比较工具
- [ ] 收益计算器

---

**创建时间**: 2025-11-17
**版本**: v1.0
