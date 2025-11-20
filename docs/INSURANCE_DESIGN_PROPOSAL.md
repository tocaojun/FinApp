# 重疾险资产管理设计方案

## 1. 业务分析

### 重疾险特点
- **保费缴纳**：定期支出（月缴/年缴/趸缴）
- **保障期限**：定期（如30年）或终身
- **保额固定**：确诊即赔付固定金额
- **现金价值**：可退保，有现金价值变化曲线
- **分红收益**：部分产品有投资分红

### 与传统投资的区别
- 主要价值是保障，不是投资收益
- 不按份额计算，按保单管理
- 有明确的保险期限和缴费期限
- 现金价值通常前期很低，后期增长

## 2. 数据库设计方案

### 方案A：扩展现有资产体系（推荐）

#### 2.1 添加保险资产类型
```sql
-- 添加保险类别的资产类型
INSERT INTO finapp.asset_types (code, name, category, description, is_active)
VALUES ('CRITICAL_ILLNESS', '重疾险', 'INSURANCE', '重大疾病保险产品', true);

INSERT INTO finapp.asset_types (code, name, category, description, is_active)
VALUES ('LIFE_INSURANCE', '寿险', 'INSURANCE', '人寿保险产品', true);

INSERT INTO finapp.asset_types (code, name, category, description, is_active)
VALUES ('ACCIDENT_INSURANCE', '意外险', 'INSURANCE', '意外伤害保险产品', true);
```

#### 2.2 创建保险产品详情表
```sql
CREATE TABLE IF NOT EXISTS finapp.insurance_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES finapp.assets(id) ON DELETE CASCADE,
    
    -- 基本保险信息
    policy_number VARCHAR(100), -- 保单号
    insurance_company VARCHAR(200) NOT NULL, -- 保险公司
    insurance_type VARCHAR(50) NOT NULL, -- 保险类型：CRITICAL_ILLNESS, LIFE, ACCIDENT等
    
    -- 保障信息
    coverage_amount DECIMAL(15,2) NOT NULL, -- 保额
    coverage_period VARCHAR(50), -- 保障期限：终身/定期
    coverage_start_date DATE, -- 保障开始日期
    coverage_end_date DATE, -- 保障结束日期（如果是定期）
    
    -- 缴费信息
    premium_amount DECIMAL(15,2) NOT NULL, -- 保费金额
    premium_frequency VARCHAR(20) NOT NULL, -- 缴费频率：MONTHLY, QUARTERLY, ANNUALLY, LUMP_SUM
    premium_period INTEGER, -- 缴费期限（年）
    premium_start_date DATE, -- 缴费开始日期
    premium_end_date DATE, -- 缴费结束日期
    
    -- 现金价值信息
    current_cash_value DECIMAL(15,2) DEFAULT 0, -- 当前现金价值
    guaranteed_cash_value DECIMAL(15,2) DEFAULT 0, -- 保证现金价值
    dividend_cash_value DECIMAL(15,2) DEFAULT 0, -- 分红现金价值
    
    -- 受益人信息
    beneficiary_info JSONB, -- 受益人信息
    
    -- 其他信息
    policy_status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, LAPSED, SURRENDERED, CLAIMED
    is_participating BOOLEAN DEFAULT false, -- 是否分红险
    waiting_period INTEGER DEFAULT 90, -- 等待期（天）
    
    -- 元数据
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- 创建索引
CREATE INDEX idx_insurance_details_asset_id ON finapp.insurance_details(asset_id);
CREATE INDEX idx_insurance_details_policy_number ON finapp.insurance_details(policy_number);
CREATE INDEX idx_insurance_details_insurance_type ON finapp.insurance_details(insurance_type);
CREATE INDEX idx_insurance_details_policy_status ON finapp.insurance_details(policy_status);
```

#### 2.3 创建保险缴费记录表
```sql
CREATE TABLE IF NOT EXISTS finapp.insurance_premium_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insurance_detail_id UUID NOT NULL REFERENCES finapp.insurance_details(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES finapp.transactions(id), -- 关联交易记录
    
    -- 缴费信息
    payment_date DATE NOT NULL,
    premium_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CNY',
    payment_method VARCHAR(50), -- 支付方式
    
    -- 缴费期数
    payment_period INTEGER, -- 第几期缴费
    is_overdue BOOLEAN DEFAULT false,
    overdue_days INTEGER DEFAULT 0,
    
    -- 状态
    payment_status VARCHAR(20) DEFAULT 'PAID', -- PAID, PENDING, OVERDUE, WAIVED
    
    -- 元数据
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_insurance_premium_payments_insurance_id ON finapp.insurance_premium_payments(insurance_detail_id);
CREATE INDEX idx_insurance_premium_payments_date ON finapp.insurance_premium_payments(payment_date);
CREATE INDEX idx_insurance_premium_payments_status ON finapp.insurance_premium_payments(payment_status);
```

#### 2.4 创建现金价值历史表
```sql
CREATE TABLE IF NOT EXISTS finapp.insurance_cash_value_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insurance_detail_id UUID NOT NULL REFERENCES finapp.insurance_details(id) ON DELETE CASCADE,
    
    -- 现金价值信息
    valuation_date DATE NOT NULL,
    guaranteed_cash_value DECIMAL(15,2) NOT NULL,
    dividend_cash_value DECIMAL(15,2) DEFAULT 0,
    total_cash_value DECIMAL(15,2) GENERATED ALWAYS AS (guaranteed_cash_value + dividend_cash_value) STORED,
    
    -- 累计缴费
    total_premium_paid DECIMAL(15,2) DEFAULT 0,
    
    -- 收益率计算
    yield_rate DECIMAL(8,4), -- 年化收益率
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_insurance_cash_value_history_insurance_id ON finapp.insurance_cash_value_history(insurance_detail_id);
CREATE INDEX idx_insurance_cash_value_history_date ON finapp.insurance_cash_value_history(valuation_date);
```

## 3. 交易类型扩展

### 3.1 新增保险相关交易类型
```sql
-- 在现有交易类型基础上添加保险相关类型
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'INSURANCE_PREMIUM'; -- 保费缴纳
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'INSURANCE_CLAIM'; -- 保险理赔
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'INSURANCE_SURRENDER'; -- 退保
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'INSURANCE_DIVIDEND'; -- 保险分红
```

## 4. 业务逻辑设计

### 4.1 保险产品创建流程
1. 创建保险资产（assets表）
2. 创建保险详情（insurance_details表）
3. 创建初始现金价值记录
4. 设置定期缴费提醒

### 4.2 保费缴纳流程
1. 创建缴费交易记录（transactions表）
2. 记录保费支付（insurance_premium_payments表）
3. 更新现金价值（如果有变动）
4. 更新投资组合现金流

### 4.3 现金价值管理
1. 定期更新现金价值（手动或API）
2. 记录历史现金价值变化
3. 计算投资收益率
4. 支持退保价值查询

## 5. 前端界面设计

### 5.1 保险产品列表
- 显示保单号、保险公司、保额、保费
- 显示当前现金价值和累计缴费
- 显示保障期限和缴费状态

### 5.2 保险详情页
- 基本信息：保单号、保险公司、保额等
- 缴费记录：历史缴费和未来缴费计划
- 现金价值曲线图
- 收益率分析

### 5.3 缴费管理
- 缴费提醒和计划
- 批量缴费录入
- 逾期缴费管理

## 6. 报表和分析

### 6.1 保险资产统计
- 总保额统计
- 年缴费总额
- 当前总现金价值
- 保险资产占比

### 6.2 收益分析
- 现金价值增长曲线
- 实际收益率vs预期收益率
- 保费投入vs现金价值对比

## 7. 实施建议

### 阶段1：基础功能
1. 创建数据库表结构
2. 实现保险产品CRUD
3. 基础的缴费记录功能

### 阶段2：高级功能
1. 现金价值管理
2. 缴费提醒功能
3. 收益率分析

### 阶段3：完善功能
1. 保险理赔管理
2. 退保功能
3. 深度报表分析

## 8. 技术考虑

### 8.1 数据同步
- 考虑与保险公司API对接（如果有）
- 支持手动更新现金价值
- 定期提醒用户更新数据

### 8.2 计算逻辑
- 现金价值的复合增长计算
- 考虑分红险的不确定性
- 退保损失计算

### 8.3 风险管理
- 缴费逾期提醒
- 保单失效风险提示
- 现金价值波动监控

这个设计方案将重疾险完整地纳入到现有的资产管理体系中，既保持了系统的一致性，又充分考虑了保险产品的特殊性。