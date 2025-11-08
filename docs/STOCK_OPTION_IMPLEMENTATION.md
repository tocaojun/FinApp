# 股票期权产品类型实施文档

## 概述

新增"股票期权"资产类型，这是一种挂钩股票价格的期权产品，具有特殊的成本和价值计算公式。

### 核心特性

1. **挂钩股票**：每个股票期权关联一个标的股票
2. **成本计算**：成本 = 行权价格 ÷ 3.5（可自定义除数）
3. **价值计算**：
   - 看涨期权（CALL）：价值 = MAX(0, 标的价格 - 行权价格)
   - 看跌期权（PUT）：价值 = MAX(0, 行权价格 - 标的价格)

## 数据库层

### 1. 迁移文件

**位置**：`backend/migrations/009_stock_option_type/`

#### up.sql - 创建表和函数

```sql
-- 股票期权详情表
CREATE TABLE finapp.stock_option_details (
    id UUID PRIMARY KEY,
    asset_id UUID UNIQUE REFERENCES assets(id),
    
    -- 标的股票信息
    underlying_stock_id UUID REFERENCES assets(id),
    underlying_stock_symbol VARCHAR(50),
    underlying_stock_name VARCHAR(200),
    
    -- 期权基本信息
    option_type VARCHAR(10) CHECK (option_type IN ('CALL', 'PUT')),
    strike_price DECIMAL(20, 8) NOT NULL,
    expiration_date DATE NOT NULL,
    
    -- 合约信息
    contract_size INTEGER DEFAULT 100,
    exercise_style VARCHAR(20) DEFAULT 'AMERICAN',
    settlement_type VARCHAR(20) DEFAULT 'PHYSICAL',
    
    -- 希腊字母
    delta, gamma, theta, vega, rho DECIMAL(10, 6),
    
    -- 成本计算
    cost_divisor DECIMAL(10, 2) DEFAULT 3.5,
    
    ...
);
```

#### 计算函数

```sql
-- 成本计算函数
CREATE FUNCTION calculate_stock_option_cost(
    p_strike_price DECIMAL,
    p_cost_divisor DECIMAL DEFAULT 3.5
) RETURNS DECIMAL;

-- 价值计算函数
CREATE FUNCTION calculate_stock_option_value(
    p_option_type VARCHAR,
    p_underlying_price DECIMAL,
    p_strike_price DECIMAL
) RETURNS DECIMAL;
```

#### 视图

```sql
CREATE VIEW v_stock_options_full AS
SELECT 
    a.*,
    sod.*,
    -- 计算成本
    calculate_stock_option_cost(sod.strike_price, sod.cost_divisor) as calculated_cost,
    -- 标的当前价格
    (SELECT close_price FROM asset_prices 
     WHERE asset_id = sod.underlying_stock_id 
     ORDER BY price_date DESC LIMIT 1) as underlying_current_price,
    -- 计算价值
    calculate_stock_option_value(...) as calculated_value,
    -- 到期天数
    (sod.expiration_date - CURRENT_DATE) as days_to_expiration,
    -- 是否价内
    CASE ... END as is_in_the_money
FROM assets a
JOIN stock_option_details sod ON a.id = sod.asset_id;
```

### 2. 表结构

| 字段 | 类型 | 说明 |
|------|------|------|
| **标的信息** | | |
| underlying_stock_id | UUID | 标的股票ID |
| underlying_stock_symbol | VARCHAR | 标的股票代码 |
| underlying_stock_name | VARCHAR | 标的股票名称 |
| **期权基本信息** | | |
| option_type | VARCHAR | CALL/PUT |
| strike_price | DECIMAL | 行权价格 |
| expiration_date | DATE | 到期日 |
| **合约信息** | | |
| contract_size | INTEGER | 合约规模（默认10000） |
| exercise_style | VARCHAR | AMERICAN/EUROPEAN/BERMUDA |
| settlement_type | VARCHAR | PHYSICAL/CASH |
| multiplier | DECIMAL | 合约乘数 |
| **希腊字母** | | |
| delta | DECIMAL | 价格敏感度 |
| gamma | DECIMAL | Delta敏感度 |
| theta | DECIMAL | 时间衰减 |
| vega | DECIMAL | 波动率敏感度 |
| rho | DECIMAL | 利率敏感度 |
| **成本计算** | | |
| cost_divisor | DECIMAL | 成本除数（默认3.5） |

### 3. 索引

```sql
CREATE INDEX idx_stock_option_details_asset ON stock_option_details(asset_id);
CREATE INDEX idx_stock_option_details_underlying ON stock_option_details(underlying_stock_id);
CREATE INDEX idx_stock_option_details_expiration ON stock_option_details(expiration_date);
CREATE INDEX idx_stock_option_details_strike ON stock_option_details(strike_price);
CREATE INDEX idx_stock_option_details_type ON stock_option_details(option_type);
```

## 后端层

### 1. 类型定义

**文件**：`backend/src/types/asset-details.types.ts`

```typescript
export interface StockOptionDetails {
  id: string;
  assetId: string;
  
  // 标的股票信息
  underlyingStockId?: string;
  underlyingStockSymbol?: string;
  underlyingStockName?: string;
  
  // 期权基本信息
  optionType: 'CALL' | 'PUT';
  strikePrice: number;
  expirationDate: Date;
  
  // 合约信息
  contractSize?: number;
  exerciseStyle?: 'AMERICAN' | 'EUROPEAN' | 'BERMUDA';
  settlementType?: 'PHYSICAL' | 'CASH';
  
  // 希腊字母
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  rho?: number;
  
  // 成本计算
  costDivisor?: number; // 默认 3.5
  
  ...
}

export interface CreateStockOptionDetailsInput {
  // 同上，用于创建
}

export enum AssetTypeCode {
  STOCK = 'STOCK',
  STOCK_OPTION = 'STOCK_OPTION', // 新增
  FUND = 'FUND',
  ...
}
```

### 2. 服务层

**文件**：`backend/src/services/AssetDetailsService.ts`

新增方法：

```typescript
class AssetDetailsService {
  // 获取股票期权详情
  async getStockOptionDetails(assetId: string): Promise<StockOptionDetails | null>
  
  // 创建股票期权详情
  async createStockOptionDetails(
    assetId: string,
    details: CreateStockOptionDetailsInput
  ): Promise<StockOptionDetails>
  
  // 更新股票期权详情
  async updateStockOptionDetails(
    assetId: string,
    details: Partial<CreateStockOptionDetailsInput>
  ): Promise<StockOptionDetails>
  
  // 映射数据
  private mapStockOptionDetails(row: any): StockOptionDetails
}
```

### 3. 路由处理

在 `AssetDetailsService` 的主方法中添加：

```typescript
async getAssetDetails(assetId: string, assetTypeCode: string) {
  switch (assetTypeCode) {
    case AssetTypeCode.STOCK_OPTION:
      return this.getStockOptionDetails(assetId);
    ...
  }
}

async createAssetDetails(...) {
  switch (assetTypeCode) {
    case AssetTypeCode.STOCK_OPTION:
      return this.createStockOptionDetails(assetId, details);
    ...
  }
}

async updateAssetDetails(...) {
  switch (assetTypeCode) {
    case AssetTypeCode.STOCK_OPTION:
      return this.updateStockOptionDetails(assetId, details);
    ...
  }
}
```

## 前端层

### 1. 详情字段组件

**文件**：`frontend/src/components/asset/details/StockOptionDetailsFields.tsx`

#### 组件特性

1. **标的股票选择器**
   - 从股票列表中选择
   - 自动填充股票代码和名称
   - 显示当前价格

2. **成本与价值计算**
   - 实时计算成本：行权价格 ÷ 除数
   - 实时计算价值：根据期权类型和标的价格
   - 可视化显示计算结果

3. **希腊字母输入**
   - Delta、Gamma、Theta、Vega、Rho
   - 带说明提示

4. **合约信息**
   - 合约规模、行权方式、结算方式
   - 交易单位、最小变动价位

#### 关键代码

```tsx
export const StockOptionDetailsFields: React.FC = ({ form }) => {
  const [calculatedCost, setCalculatedCost] = useState<number | null>(null);
  const [calculatedValue, setCalculatedValue] = useState<number | null>(null);
  const [underlyingPrice, setUnderlyingPrice] = useState<number | null>(null);

  // 计算成本
  const calculateCost = (strikePrice?: number, costDivisor?: number) => {
    if (strikePrice && costDivisor) {
      return strikePrice / costDivisor;
    }
    return null;
  };

  // 计算价值
  const calculateValue = (optionType?: string, underlyingPrice?: number, strikePrice?: number) => {
    if (underlyingPrice && strikePrice) {
      if (optionType === 'CALL') {
        return Math.max(0, underlyingPrice - strikePrice);
      } else if (optionType === 'PUT') {
        return Math.max(0, strikePrice - underlyingPrice);
      }
    }
    return null;
  };

  // 选择标的股票时获取价格
  const handleStockSelect = async (stockId: string) => {
    const prices = await AssetService.getAssetPrices(stockId, { limit: 1 });
    if (prices.data && prices.data.length > 0) {
      setUnderlyingPrice(prices.data[0].closePrice);
    }
  };

  return (
    <>
      <Alert message="成本 = 行权价格 ÷ 3.5" type="info" />
      
      {/* 标的股票选择 */}
      <Form.Item name={['details', 'underlyingStockId']}>
        <Select onChange={handleStockSelect}>
          {stocks.map(stock => (
            <Option value={stock.id}>{stock.symbol} - {stock.name}</Option>
          ))}
        </Select>
      </Form.Item>
      
      {/* 行权价格 */}
      <Form.Item name={['details', 'strikePrice']}>
        <InputNumber onChange={handleFieldsChange} />
      </Form.Item>
      
      {/* 显示计算结果 */}
      {calculatedCost && (
        <Statistic title="计算成本" value={calculatedCost} prefix="¥" />
      )}
      {calculatedValue && (
        <Statistic title="当前价值" value={calculatedValue} prefix="¥" />
      )}
      
      {/* 希腊字母 */}
      <Form.Item name={['details', 'delta']}>
        <InputNumber min={-1} max={1} step={0.01} />
      </Form.Item>
      ...
    </>
  );
};
```

### 2. 组件导出

**文件**：`frontend/src/components/asset/details/index.tsx`

```typescript
export { StockOptionDetailsFields } from './StockOptionDetailsFields';
```

### 3. 产品管理页面集成

**文件**：`frontend/src/pages/admin/ProductManagement.tsx`

```tsx
import { StockOptionDetailsFields } from '../../components/asset/details';

// 在表单中添加
{formAssetTypeCode === 'STOCK_OPTION' && (
  <StockOptionDetailsFields form={form} />
)}
```

## 使用流程

### 1. 创建股票期权

1. 进入产品管理页面
2. 点击"新增产品"
3. 选择产品类型："股票期权"
4. 填写基础信息：
   - 产品代码：如 `000001-C-15.50-20251231`
   - 产品名称：如 `平安银行看涨期权-行权价15.50-2025年12月`
5. 填写详情信息：
   - **标的股票**：选择 `000001.SZ - 平安银行`
   - **期权类型**：选择 `看涨期权（CALL）`
   - **行权价格**：输入 `15.50`
   - **到期日**：选择 `2025-12-31`
   - **成本除数**：默认 `3.5`（可修改）
   - **合约规模**：输入 `10000`
   - **希腊字母**：输入 Delta、Gamma 等（可选）
6. 系统自动计算：
   - **成本**：15.50 ÷ 3.5 = 4.43 元
   - **当前价值**：如果标的价格为 16.00，则价值 = 16.00 - 15.50 = 0.50 元
7. 保存

### 2. 编辑股票期权

1. 在产品列表中找到股票期权
2. 点击"编辑"按钮
3. 所有详情字段自动预填充
4. 修改需要更新的字段
5. 系统实时重新计算成本和价值
6. 保存更新

### 3. 查看股票期权

产品列表显示：
- 产品代码
- 产品名称
- 标的股票
- 行权价格
- 到期日
- 当前价值（如果有标的价格）

## 计算示例

### 示例1：看涨期权

- **标的股票**：平安银行（000001.SZ）
- **当前价格**：16.00 元
- **期权类型**：CALL（看涨）
- **行权价格**：15.50 元
- **成本除数**：3.5

**计算**：
- 成本 = 15.50 ÷ 3.5 = **4.43 元**
- 价值 = MAX(0, 16.00 - 15.50) = **0.50 元**
- 盈亏 = 0.50 - 4.43 = **-3.93 元**（亏损）

### 示例2：看跌期权

- **标的股票**：平安银行（000001.SZ）
- **当前价格**：14.00 元
- **期权类型**：PUT（看跌）
- **行权价格**：15.50 元
- **成本除数**：3.5

**计算**：
- 成本 = 15.50 ÷ 3.5 = **4.43 元**
- 价值 = MAX(0, 15.50 - 14.00) = **1.50 元**
- 盈亏 = 1.50 - 4.43 = **-2.93 元**（亏损）

### 示例3：价内期权

- **标的股票**：平安银行（000001.SZ）
- **当前价格**：20.00 元
- **期权类型**：CALL（看涨）
- **行权价格**：15.50 元
- **成本除数**：3.5

**计算**：
- 成本 = 15.50 ÷ 3.5 = **4.43 元**
- 价值 = MAX(0, 20.00 - 15.50) = **4.50 元**
- 盈亏 = 4.50 - 4.43 = **+0.07 元**（盈利）

## 数据库查询示例

### 查询所有股票期权

```sql
SELECT * FROM finapp.v_stock_options_full
WHERE is_active = true
ORDER BY expiration_date;
```

### 查询即将到期的期权

```sql
SELECT 
    symbol,
    name,
    underlying_stock_symbol,
    strike_price,
    expiration_date,
    days_to_expiration,
    calculated_cost,
    calculated_value
FROM finapp.v_stock_options_full
WHERE days_to_expiration <= 30
ORDER BY days_to_expiration;
```

### 查询价内期权

```sql
SELECT *
FROM finapp.v_stock_options_full
WHERE is_in_the_money = true
ORDER BY calculated_value DESC;
```

### 计算期权盈亏

```sql
SELECT 
    symbol,
    name,
    calculated_cost,
    calculated_value,
    (calculated_value - calculated_cost) as profit_loss,
    CASE 
        WHEN calculated_value > calculated_cost THEN '盈利'
        WHEN calculated_value < calculated_cost THEN '亏损'
        ELSE '持平'
    END as status
FROM finapp.v_stock_options_full;
```

## API 接口

### 创建股票期权

```http
POST /api/assets
Content-Type: application/json

{
  "symbol": "000001-C-15.50-20251231",
  "name": "平安银行看涨期权-行权价15.50-2025年12月",
  "assetTypeId": "{STOCK_OPTION_TYPE_ID}",
  "marketId": "{MARKET_ID}",
  "currency": "CNY",
  "riskLevel": "HIGH",
  "liquidityTag": "{TAG_ID}",
  "details": {
    "underlyingStockId": "{STOCK_ID}",
    "underlyingStockSymbol": "000001.SZ",
    "underlyingStockName": "平安银行",
    "optionType": "CALL",
    "strikePrice": 15.50,
    "expirationDate": "2025-12-31",
    "contractSize": 10000,
    "exerciseStyle": "AMERICAN",
    "settlementType": "PHYSICAL",
    "costDivisor": 3.5,
    "delta": 0.65,
    "gamma": 0.05,
    "theta": -0.02,
    "vega": 0.15,
    "rho": 0.08
  }
}
```

### 更新股票期权

```http
PUT /api/assets/{assetId}
Content-Type: application/json

{
  "details": {
    "strikePrice": 16.00,
    "delta": 0.70,
    "impliedVolatility": 0.28
  }
}
```

### 获取股票期权详情

```http
GET /api/assets/{assetId}

Response:
{
  "success": true,
  "data": {
    "id": "...",
    "symbol": "000001-C-15.50-20251231",
    "name": "平安银行看涨期权...",
    "assetTypeCode": "STOCK_OPTION",
    "details": {
      "underlyingStockId": "...",
      "optionType": "CALL",
      "strikePrice": 15.50,
      "costDivisor": 3.5,
      ...
    }
  }
}
```

## 测试清单

### 数据库测试
- [ ] 表创建成功
- [ ] 索引创建成功
- [ ] 计算函数正确
- [ ] 视图查询正常
- [ ] 触发器工作正常

### 后端测试
- [ ] 创建股票期权
- [ ] 更新股票期权
- [ ] 查询股票期权详情
- [ ] 删除股票期权
- [ ] 类型验证正确

### 前端测试
- [ ] 组件正常渲染
- [ ] 标的股票选择器工作
- [ ] 成本自动计算
- [ ] 价值自动计算
- [ ] 表单验证正确
- [ ] 数据保存成功
- [ ] 编辑预填充正确

### 集成测试
- [ ] 创建流程完整
- [ ] 编辑流程完整
- [ ] 查看流程完整
- [ ] 计算结果准确

## 文件清单

### 数据库
- ✅ `backend/migrations/009_stock_option_type/up.sql` - 创建表和函数
- ✅ `backend/migrations/009_stock_option_type/down.sql` - 回滚脚本

### 后端
- ✅ `backend/src/types/asset-details.types.ts` - 类型定义（已更新）
- ✅ `backend/src/services/AssetDetailsService.ts` - 服务层（已更新）

### 前端
- ✅ `frontend/src/components/asset/details/StockOptionDetailsFields.tsx` - 详情组件（新建）
- ✅ `frontend/src/components/asset/details/index.tsx` - 导出（已更新）
- ✅ `frontend/src/pages/admin/ProductManagement.tsx` - 产品管理（已更新）

### 文档
- ✅ `STOCK_OPTION_IMPLEMENTATION.md` - 本文档

## 部署步骤

1. **执行数据库迁移**
   ```bash
   cd backend
   psql -U finapp_user -d finapp_test -f migrations/009_stock_option_type/up.sql
   ```

2. **重启后端服务**
   ```bash
   ./restart-backend.sh
   ```

3. **刷新前端页面**
   - 前端会自动热重载
   - 或手动刷新浏览器

4. **验证功能**
   - 检查产品类型列表中是否有"股票期权"
   - 尝试创建一个股票期权
   - 验证计算功能是否正常

## 注意事项

1. **成本除数可自定义**：默认为3.5，但可以根据实际情况修改
2. **标的价格实时性**：价值计算依赖标的股票的最新价格
3. **希腊字母可选**：不是必填项，可以后续补充
4. **到期日管理**：需要定期检查到期的期权
5. **权限控制**：高风险产品，建议限制创建权限

## 后续优化建议

1. **自动计算希腊字母**：集成期权定价模型（如Black-Scholes）
2. **到期提醒**：添加到期日提醒功能
3. **盈亏分析**：添加期权盈亏分析报表
4. **批量导入**：支持批量导入股票期权
5. **实时价格更新**：集成实时行情数据
6. **风险指标**：添加更多风险指标和分析工具

---

**实施完成时间**：2025-10-27  
**实施人员**：AI Assistant  
**状态**：✅ 已完成，待测试
