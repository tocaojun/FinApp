# 多资产类型实施快速指南

## 🚀 快速开始

### 第一步：评估当前数据

```sql
-- 查看当前资产类型分布
SELECT 
  at.name as asset_type,
  at.code,
  COUNT(a.id) as count
FROM assets a
JOIN asset_types at ON a.asset_type_id = at.id
GROUP BY at.name, at.code
ORDER BY count DESC;

-- 查看哪些资产使用了 sector/industry
SELECT 
  at.name as asset_type,
  COUNT(CASE WHEN a.sector IS NOT NULL THEN 1 END) as has_sector,
  COUNT(CASE WHEN a.industry IS NOT NULL THEN 1 END) as has_industry
FROM assets a
JOIN asset_types at ON a.asset_type_id = at.id
GROUP BY at.name;
```

---

## 📋 实施检查清单

### 准备阶段
- [ ] 备份数据库
- [ ] 创建测试环境
- [ ] 评估现有数据量
- [ ] 确定优先级（哪些资产类型先做）

### 开发阶段
- [ ] 创建新表结构
- [ ] 编写迁移脚本
- [ ] 更新 TypeScript 类型
- [ ] 重构服务层
- [ ] 更新前端组件

### 测试阶段
- [ ] 单元测试
- [ ] 集成测试
- [ ] 性能测试
- [ ] 数据完整性验证

### 部署阶段
- [ ] 执行数据迁移
- [ ] 验证迁移结果
- [ ] 切换到新架构
- [ ] 监控性能

---

## 🔧 实施方案选择

### 方案1：最小改动（快速）⭐ 推荐新手

**适用场景**：
- 数据量小（< 1000条资产）
- 只有股票和期权
- 快速上线

**实施步骤**：
1. 只创建 `stock_details` 表
2. 迁移 sector/industry 到新表
3. 保持其他资产类型使用 metadata

**时间估计**：1-2天

### 方案2：完整改造（推荐）⭐⭐⭐

**适用场景**：
- 需要支持多种资产类型
- 长期维护
- 追求性能和可维护性

**实施步骤**：
1. 创建所有详情表
2. 渐进式迁移数据
3. 完整重构应用层

**时间估计**：5-7天

### 方案3：混合模式

**适用场景**：
- 核心资产类型（股票、基金）用专用表
- 其他类型暂时用 metadata

**实施步骤**：
1. 先做股票和基金
2. 其他类型后续扩展

**时间估计**：3-4天

---

## 📝 详细实施步骤

### Step 1: 创建新表（30分钟）

```bash
# 创建迁移文件
cd /Users/caojun/code/FinApp/backend/migrations
mkdir 005_multi_asset_types
cd 005_multi_asset_types
```

创建 `up.sql`：

```sql
-- ============================================
-- 多资产类型架构升级
-- ============================================

-- 1. 股票详情表
CREATE TABLE IF NOT EXISTS finapp.stock_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL UNIQUE REFERENCES finapp.assets(id) ON DELETE CASCADE,
    
    sector VARCHAR(100),
    industry VARCHAR(100),
    market_cap DECIMAL(20, 2),
    shares_outstanding BIGINT,
    
    pe_ratio DECIMAL(10, 2),
    pb_ratio DECIMAL(10, 2),
    dividend_yield DECIMAL(5, 2),
    
    company_website VARCHAR(200),
    headquarters VARCHAR(200),
    founded_year INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_details_asset ON finapp.stock_details(asset_id);
CREATE INDEX idx_stock_details_sector ON finapp.stock_details(sector);
CREATE INDEX idx_stock_details_industry ON finapp.stock_details(industry);

-- 2. 基金详情表
CREATE TABLE IF NOT EXISTS finapp.fund_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL UNIQUE REFERENCES finapp.assets(id) ON DELETE CASCADE,
    
    fund_type VARCHAR(50) NOT NULL,
    fund_category VARCHAR(50),
    
    management_fee DECIMAL(5, 2),
    custodian_fee DECIMAL(5, 2),
    subscription_fee DECIMAL(5, 2),
    redemption_fee DECIMAL(5, 2),
    
    nav DECIMAL(20, 4),
    nav_date DATE,
    accumulated_nav DECIMAL(20, 4),
    
    fund_size DECIMAL(20, 2),
    inception_date DATE,
    
    fund_manager VARCHAR(200),
    fund_company VARCHAR(200),
    
    min_investment DECIMAL(20, 2),
    min_redemption DECIMAL(20, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fund_details_asset ON finapp.fund_details(asset_id);
CREATE INDEX idx_fund_details_type ON finapp.fund_details(fund_type);

-- 3. 债券详情表
CREATE TABLE IF NOT EXISTS finapp.bond_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL UNIQUE REFERENCES finapp.assets(id) ON DELETE CASCADE,
    
    bond_type VARCHAR(50) NOT NULL,
    credit_rating VARCHAR(10),
    
    face_value DECIMAL(20, 2) NOT NULL,
    coupon_rate DECIMAL(5, 2) NOT NULL,
    coupon_frequency VARCHAR(20),
    
    issue_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    years_to_maturity DECIMAL(5, 2),
    
    yield_to_maturity DECIMAL(5, 2),
    current_yield DECIMAL(5, 2),
    
    issuer VARCHAR(200),
    issue_price DECIMAL(20, 2),
    issue_size DECIMAL(20, 2),
    
    callable BOOLEAN DEFAULT false,
    call_date DATE,
    call_price DECIMAL(20, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bond_details_asset ON finapp.bond_details(asset_id);
CREATE INDEX idx_bond_details_type ON finapp.bond_details(bond_type);
CREATE INDEX idx_bond_details_maturity ON finapp.bond_details(maturity_date);

-- 4. 期货详情表
CREATE TABLE IF NOT EXISTS finapp.futures_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL UNIQUE REFERENCES finapp.assets(id) ON DELETE CASCADE,
    
    futures_type VARCHAR(50) NOT NULL,
    underlying_asset VARCHAR(200),
    
    contract_month VARCHAR(10) NOT NULL,
    contract_size DECIMAL(20, 4),
    tick_size DECIMAL(20, 8),
    tick_value DECIMAL(20, 2),
    
    trading_hours VARCHAR(100),
    last_trading_date DATE,
    delivery_date DATE,
    delivery_method VARCHAR(50),
    
    initial_margin DECIMAL(20, 2),
    maintenance_margin DECIMAL(20, 2),
    margin_rate DECIMAL(5, 2),
    
    position_limit INTEGER,
    daily_price_limit DECIMAL(5, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_futures_details_asset ON finapp.futures_details(asset_id);
CREATE INDEX idx_futures_details_type ON finapp.futures_details(futures_type);
CREATE INDEX idx_futures_details_month ON finapp.futures_details(contract_month);

-- 5. 理财产品详情表
CREATE TABLE IF NOT EXISTS finapp.wealth_product_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL UNIQUE REFERENCES finapp.assets(id) ON DELETE CASCADE,
    
    product_type VARCHAR(50) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    
    expected_return DECIMAL(5, 2),
    min_return DECIMAL(5, 2),
    max_return DECIMAL(5, 2),
    return_type VARCHAR(20),
    
    issue_date DATE NOT NULL,
    start_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    lock_period INTEGER,
    
    min_investment DECIMAL(20, 2),
    max_investment DECIMAL(20, 2),
    investment_increment DECIMAL(20, 2),
    
    issuer VARCHAR(200),
    product_code VARCHAR(50),
    
    early_redemption BOOLEAN DEFAULT false,
    redemption_fee DECIMAL(5, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wealth_details_asset ON finapp.wealth_product_details(asset_id);
CREATE INDEX idx_wealth_details_type ON finapp.wealth_product_details(product_type);
CREATE INDEX idx_wealth_details_risk ON finapp.wealth_product_details(risk_level);

-- 6. 国债详情表
CREATE TABLE IF NOT EXISTS finapp.treasury_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL UNIQUE REFERENCES finapp.assets(id) ON DELETE CASCADE,
    
    treasury_type VARCHAR(50) NOT NULL,
    term_type VARCHAR(20),
    
    face_value DECIMAL(20, 2) NOT NULL,
    coupon_rate DECIMAL(5, 2) NOT NULL,
    coupon_frequency VARCHAR(20),
    
    issue_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    term_years INTEGER,
    
    issue_price DECIMAL(20, 2),
    issue_number VARCHAR(50),
    
    yield_to_maturity DECIMAL(5, 2),
    
    tradable BOOLEAN DEFAULT true,
    min_holding_period INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_treasury_details_asset ON finapp.treasury_details(asset_id);
CREATE INDEX idx_treasury_details_type ON finapp.treasury_details(treasury_type);
CREATE INDEX idx_treasury_details_maturity ON finapp.treasury_details(maturity_date);

-- 7. 添加资产类型（如果不存在）
INSERT INTO finapp.asset_types (code, name, category, description)
VALUES 
  ('FUND', '基金', 'fund', '包括股票型、债券型、混合型等基金'),
  ('BOND', '债券', 'bond', '包括企业债、政府债等'),
  ('FUTURES', '期货', 'futures', '商品期货、金融期货等'),
  ('WEALTH', '理财产品', 'wealth', '银行理财、券商理财等'),
  ('TREASURY', '国债', 'treasury', '国家发行的债券')
ON CONFLICT (code) DO NOTHING;

-- 8. 创建视图：完整资产信息
CREATE OR REPLACE VIEW finapp.v_assets_full AS
SELECT 
  a.*,
  at.name as asset_type_name,
  at.code as asset_type_code,
  m.name as market_name,
  
  -- 股票详情
  sd.sector,
  sd.industry,
  sd.market_cap,
  sd.pe_ratio,
  sd.pb_ratio,
  sd.dividend_yield,
  
  -- 基金详情
  fd.fund_type,
  fd.management_fee,
  fd.nav,
  fd.nav_date,
  
  -- 债券详情
  bd.bond_type,
  bd.coupon_rate as bond_coupon_rate,
  bd.maturity_date as bond_maturity_date,
  
  -- 期货详情
  ftd.futures_type,
  ftd.contract_month,
  ftd.initial_margin,
  
  -- 理财产品详情
  wpd.product_type as wealth_product_type,
  wpd.expected_return,
  wpd.maturity_date as wealth_maturity_date,
  
  -- 国债详情
  td.treasury_type,
  td.coupon_rate as treasury_coupon_rate,
  td.maturity_date as treasury_maturity_date

FROM finapp.assets a
LEFT JOIN finapp.asset_types at ON a.asset_type_id = at.id
LEFT JOIN finapp.markets m ON a.market_id = m.id
LEFT JOIN finapp.stock_details sd ON a.id = sd.asset_id
LEFT JOIN finapp.fund_details fd ON a.id = fd.asset_id
LEFT JOIN finapp.bond_details bd ON a.id = bd.asset_id
LEFT JOIN finapp.futures_details ftd ON a.id = ftd.asset_id
LEFT JOIN finapp.wealth_product_details wpd ON a.id = wpd.asset_id
LEFT JOIN finapp.treasury_details td ON a.id = td.asset_id;

COMMENT ON VIEW finapp.v_assets_full IS '完整资产信息视图，包含所有类型的详情';
```

创建 `down.sql`（回滚脚本）：

```sql
-- 回滚脚本
DROP VIEW IF EXISTS finapp.v_assets_full;
DROP TABLE IF EXISTS finapp.treasury_details;
DROP TABLE IF EXISTS finapp.wealth_product_details;
DROP TABLE IF EXISTS finapp.futures_details;
DROP TABLE IF EXISTS finapp.bond_details;
DROP TABLE IF EXISTS finapp.fund_details;
DROP TABLE IF EXISTS finapp.stock_details;
```

### Step 2: 执行迁移（5分钟）

```bash
# 连接数据库
psql -U finapp_user -d finapp_db

# 执行迁移
\i /Users/caojun/code/FinApp/backend/migrations/005_multi_asset_types/up.sql

# 验证表创建
\dt finapp.*_details

# 查看视图
\dv finapp.v_assets_full
```

### Step 3: 迁移现有数据（10分钟）

```sql
-- 迁移股票数据
INSERT INTO finapp.stock_details (asset_id, sector, industry)
SELECT 
  a.id,
  a.sector,
  a.industry
FROM finapp.assets a
JOIN finapp.asset_types at ON a.asset_type_id = at.id
WHERE at.code = 'STOCK'
  AND (a.sector IS NOT NULL OR a.industry IS NOT NULL)
ON CONFLICT (asset_id) DO NOTHING;

-- 验证迁移结果
SELECT 
  COUNT(*) as total_stocks,
  COUNT(sd.id) as migrated_to_details
FROM finapp.assets a
JOIN finapp.asset_types at ON a.asset_type_id = at.id
LEFT JOIN finapp.stock_details sd ON a.id = sd.asset_id
WHERE at.code = 'STOCK';
```

### Step 4: 更新应用代码（2-3小时）

#### 4.1 更新类型定义

创建 `backend/src/types/asset-details.types.ts`：

```typescript
// 股票详情
export interface StockDetails {
  id: string;
  assetId: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  sharesOutstanding?: number;
  peRatio?: number;
  pbRatio?: number;
  dividendYield?: number;
  companyWebsite?: string;
  headquarters?: string;
  foundedYear?: number;
}

// 基金详情
export interface FundDetails {
  id: string;
  assetId: string;
  fundType: string;
  fundCategory?: string;
  managementFee?: number;
  custodianFee?: number;
  subscriptionFee?: number;
  redemptionFee?: number;
  nav?: number;
  navDate?: Date;
  accumulatedNav?: number;
  fundSize?: number;
  inceptionDate?: Date;
  fundManager?: string;
  fundCompany?: string;
  minInvestment?: number;
  minRedemption?: number;
}

// ... 其他类型详情接口
```

#### 4.2 更新 AssetService

```typescript
// backend/src/services/AssetService.ts

export class AssetService {
  
  /**
   * 获取完整资产信息（使用视图）
   */
  async getAssetFull(assetId: string): Promise<any> {
    const query = `
      SELECT * FROM finapp.v_assets_full
      WHERE id = $1::uuid
    `;
    
    const result = await databaseService.executeRawQuery(query, [assetId]);
    
    if (!result || result.length === 0) {
      throw new Error('Asset not found');
    }
    
    return this.formatAssetWithDetails(result[0]);
  }
  
  /**
   * 格式化资产数据（根据类型组织详情）
   */
  private formatAssetWithDetails(row: any): any {
    const base = {
      id: row.id,
      symbol: row.symbol,
      name: row.name,
      assetTypeId: row.asset_type_id,
      assetTypeName: row.asset_type_name,
      assetTypeCode: row.asset_type_code,
      marketId: row.market_id,
      marketName: row.market_name,
      currency: row.currency,
      riskLevel: row.risk_level,
      liquidityTag: row.liquidity_tag,
      isActive: row.is_active
    };
    
    // 根据资产类型添加详情
    let details = null;
    
    switch (row.asset_type_code) {
      case 'STOCK':
        if (row.sector || row.industry) {
          details = {
            sector: row.sector,
            industry: row.industry,
            marketCap: row.market_cap,
            peRatio: row.pe_ratio,
            pbRatio: row.pb_ratio,
            dividendYield: row.dividend_yield
          };
        }
        break;
        
      case 'FUND':
        if (row.fund_type) {
          details = {
            fundType: row.fund_type,
            managementFee: row.management_fee,
            nav: row.nav,
            navDate: row.nav_date
          };
        }
        break;
        
      // ... 其他类型
    }
    
    return { ...base, details };
  }
  
  /**
   * 创建资产（带详情）
   */
  async createAssetWithDetails(data: any): Promise<any> {
    return await databaseService.prisma.$transaction(async (tx) => {
      // 1. 创建基础资产
      const asset = await tx.$queryRaw`
        INSERT INTO finapp.assets (
          symbol, name, asset_type_id, market_id, currency, 
          risk_level, liquidity_tag, description
        ) VALUES (
          ${data.symbol}, ${data.name}, ${data.assetTypeId}::uuid,
          ${data.marketId || null}::uuid, ${data.currency},
          ${data.riskLevel || null}, ${data.liquidityTag || null},
          ${data.description || null}
        )
        RETURNING *
      `;
      
      const assetId = asset[0].id;
      
      // 2. 根据类型创建详情
      if (data.assetTypeCode === 'STOCK' && data.details) {
        await tx.$queryRaw`
          INSERT INTO finapp.stock_details (
            asset_id, sector, industry, market_cap, pe_ratio, pb_ratio
          ) VALUES (
            ${assetId}::uuid, ${data.details.sector || null},
            ${data.details.industry || null}, ${data.details.marketCap || null},
            ${data.details.peRatio || null}, ${data.details.pbRatio || null}
          )
        `;
      } else if (data.assetTypeCode === 'FUND' && data.details) {
        await tx.$queryRaw`
          INSERT INTO finapp.fund_details (
            asset_id, fund_type, management_fee, nav, fund_manager
          ) VALUES (
            ${assetId}::uuid, ${data.details.fundType},
            ${data.details.managementFee || null}, ${data.details.nav || null},
            ${data.details.fundManager || null}
          )
        `;
      }
      // ... 其他类型
      
      return asset[0];
    });
  }
}
```

### Step 5: 更新前端（1-2小时）

#### 5.1 创建类型特定的表单组件

```typescript
// frontend/src/components/asset/StockDetailsFields.tsx

export const StockDetailsFields: React.FC = () => {
  return (
    <>
      <Form.Item label="行业板块" name={['details', 'sector']}>
        <Input placeholder="例如：科技" />
      </Form.Item>
      
      <Form.Item label="细分行业" name={['details', 'industry']}>
        <Input placeholder="例如：半导体" />
      </Form.Item>
      
      <Form.Item label="市盈率" name={['details', 'peRatio']}>
        <InputNumber min={0} precision={2} />
      </Form.Item>
      
      <Form.Item label="市净率" name={['details', 'pbRatio']}>
        <InputNumber min={0} precision={2} />
      </Form.Item>
      
      <Form.Item label="股息率 (%)" name={['details', 'dividendYield']}>
        <InputNumber min={0} max={100} precision={2} />
      </Form.Item>
    </>
  );
};

// frontend/src/components/asset/FundDetailsFields.tsx

export const FundDetailsFields: React.FC = () => {
  return (
    <>
      <Form.Item 
        label="基金类型" 
        name={['details', 'fundType']}
        rules={[{ required: true, message: '请选择基金类型' }]}
      >
        <Select>
          <Option value="equity">股票型</Option>
          <Option value="bond">债券型</Option>
          <Option value="hybrid">混合型</Option>
          <Option value="money_market">货币市场型</Option>
          <Option value="index">指数型</Option>
        </Select>
      </Form.Item>
      
      <Form.Item label="管理费率 (%)" name={['details', 'managementFee']}>
        <InputNumber min={0} max={10} precision={2} />
      </Form.Item>
      
      <Form.Item label="最新净值" name={['details', 'nav']}>
        <InputNumber min={0} precision={4} />
      </Form.Item>
      
      <Form.Item label="净值日期" name={['details', 'navDate']}>
        <DatePicker />
      </Form.Item>
      
      <Form.Item label="基金经理" name={['details', 'fundManager']}>
        <Input />
      </Form.Item>
    </>
  );
};
```

#### 5.2 更新资产表单

```typescript
// frontend/src/components/asset/AssetForm.tsx

export const AssetForm: React.FC<AssetFormProps> = ({ onSubmit }) => {
  const [form] = Form.useForm();
  const [assetType, setAssetType] = useState<string>('');
  
  const handleAssetTypeChange = (value: string) => {
    setAssetType(value);
    // 清空详情字段
    form.setFieldsValue({ details: {} });
  };
  
  const renderDetailsFields = () => {
    switch (assetType) {
      case 'STOCK':
        return <StockDetailsFields />;
      case 'FUND':
        return <FundDetailsFields />;
      case 'BOND':
        return <BondDetailsFields />;
      case 'FUTURES':
        return <FuturesDetailsFields />;
      case 'WEALTH':
        return <WealthProductDetailsFields />;
      case 'TREASURY':
        return <TreasuryDetailsFields />;
      default:
        return null;
    }
  };
  
  return (
    <Form form={form} onFinish={onSubmit} layout="vertical">
      {/* 基础字段 */}
      <Form.Item label="资产代码" name="symbol" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      
      <Form.Item label="资产名称" name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      
      <Form.Item label="资产类型" name="assetTypeCode" rules={[{ required: true }]}>
        <Select onChange={handleAssetTypeChange}>
          <Option value="STOCK">股票</Option>
          <Option value="FUND">基金</Option>
          <Option value="BOND">债券</Option>
          <Option value="FUTURES">期货</Option>
          <Option value="WEALTH">理财产品</Option>
          <Option value="TREASURY">国债</Option>
        </Select>
      </Form.Item>
      
      <Form.Item label="币种" name="currency" rules={[{ required: true }]}>
        <Select>
          <Option value="CNY">人民币</Option>
          <Option value="USD">美元</Option>
          <Option value="HKD">港币</Option>
        </Select>
      </Form.Item>
      
      {/* 类型特定字段 */}
      <Divider>详细信息</Divider>
      {renderDetailsFields()}
      
      <Form.Item>
        <Button type="primary" htmlType="submit">
          提交
        </Button>
      </Form.Item>
    </Form>
  );
};
```

---

## 🧪 测试验证

### 测试脚本

```bash
# 创建测试脚本
cat > /Users/caojun/code/FinApp/test-multi-asset.sh << 'EOF'
#!/bin/bash

echo "=== 多资产类型测试 ==="

# 1. 测试表创建
echo "1. 检查表是否创建..."
psql -U finapp_user -d finapp_db -c "\dt finapp.*_details"

# 2. 测试数据迁移
echo "2. 检查数据迁移..."
psql -U finapp_user -d finapp_db -c "
SELECT 
  at.name,
  COUNT(a.id) as total_assets,
  COUNT(sd.id) as has_stock_details,
  COUNT(fd.id) as has_fund_details
FROM finapp.assets a
JOIN finapp.asset_types at ON a.asset_type_id = at.id
LEFT JOIN finapp.stock_details sd ON a.id = sd.asset_id
LEFT JOIN finapp.fund_details fd ON a.id = fd.asset_id
GROUP BY at.name;
"

# 3. 测试视图
echo "3. 测试完整资产视图..."
psql -U finapp_user -d finapp_db -c "
SELECT * FROM finapp.v_assets_full LIMIT 3;
"

echo "=== 测试完成 ==="
EOF

chmod +x /Users/caojun/code/FinApp/test-multi-asset.sh
```

---

## 📊 性能对比

### 查询性能测试

```sql
-- 测试1：查询股票（旧方式 vs 新方式）

-- 旧方式：从 metadata 查询
EXPLAIN ANALYZE
SELECT * FROM finapp.assets
WHERE metadata->>'sector' = '科技';
-- 预计：Seq Scan，慢

-- 新方式：从索引查询
EXPLAIN ANALYZE
SELECT a.*, sd.*
FROM finapp.assets a
JOIN finapp.stock_details sd ON a.id = sd.asset_id
WHERE sd.sector = '科技';
-- 预计：Index Scan，快

-- 测试2：聚合查询

-- 旧方式
EXPLAIN ANALYZE
SELECT 
  metadata->>'sector' as sector,
  COUNT(*) as count
FROM finapp.assets
WHERE asset_type_id = (SELECT id FROM finapp.asset_types WHERE code = 'STOCK')
GROUP BY metadata->>'sector';

-- 新方式
EXPLAIN ANALYZE
SELECT 
  sd.sector,
  COUNT(*) as count
FROM finapp.stock_details sd
GROUP BY sd.sector;
```

---

## 🔄 回滚方案

如果需要回滚：

```sql
-- 1. 备份新表数据（可选）
CREATE TABLE finapp.stock_details_backup AS
SELECT * FROM finapp.stock_details;

-- 2. 执行回滚
\i /Users/caojun/code/FinApp/backend/migrations/005_multi_asset_types/down.sql

-- 3. 验证
\dt finapp.*_details
-- 应该显示：Did not find any relations
```

---

## 📚 相关文档

- 📄 `MULTI_ASSET_TYPE_ARCHITECTURE.md` - 完整架构设计
- 📄 `DATABASE_ARCHITECTURE.md` - 数据库架构说明
- 📄 `system_design.md` - 系统设计文档

---

## ❓ 常见问题

### Q1: 是否需要删除 assets 表的旧字段？

**A**: 不建议立即删除。建议：
1. 先保留旧字段（兼容性）
2. 运行一段时间（1-2周）
3. 确认无问题后再删除

### Q2: 如何处理现有的 metadata 数据？

**A**: 
1. 分析 metadata 中存储的内容
2. 将重要字段迁移到专用表
3. 保留 metadata 用于扩展字段

### Q3: 性能会有多大提升？

**A**: 预期：
- 查询性能：30-50% 提升
- 聚合查询：50-70% 提升
- 索引查询：70-90% 提升

---

**准备好了吗？开始实施吧！** 🚀
