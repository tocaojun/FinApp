# 数据源管理功能

## 📋 功能概述

在"数据同步"功能的"数据源"页面中已添加**新增数据源**和**修改数据源**的完整功能。

## 🎯 功能描述

### 1️⃣ 新增数据源

#### 如何使用
1. 打开 Admin 后台 → **数据同步** → **数据源** 标签页
2. 点击页面上方的 **"新增数据源"** 按钮
3. 在弹出的对话框中填写以下信息：
   - **名称**（必填）：数据源的显示名称，例如 "Yahoo Finance"
   - **提供商**（必填）：选择或输入提供商代码，例如 "yahoo_finance"
   - **API 端点**（可选）：数据源的 API 基础 URL
   - **配置**（可选）：JSON 格式的配置对象，包含数据源特定的参数
   - **启用**：打开/关闭该数据源
4. 点击 **"确定"** 按钮提交

#### 支持的提供商
系统预置了以下提供商选项：
- ✅ Yahoo Finance（推荐）
- ✅ EastMoney（东方财富）
- ✅ Tushare
- ✅ Sina（新浪）
- ✅ Alpha Vantage
- ✅ Polygon.io
- ✅ IEX Cloud
- ✅ Tiingo
- ✅ FRED

### 2️⃣ 修改数据源

#### 如何使用
1. 打开 Admin 后台 → **数据同步** → **数据源** 标签页
2. 在数据源列表中找到要修改的数据源
3. 点击该行右侧的 **编辑** 按钮（✏️ 图标）
4. 在弹出的对话框中修改以下任何信息：
   - 名称
   - 提供商
   - API 端点
   - 配置
   - 启用状态
5. 点击 **"确定"** 按钮保存修改

#### 修改的应用范围
- 🔄 修改后立即生效
- 📊 现有的同步任务会使用更新后的配置
- ⚠️ 修改提供商后，请确保新提供商与现有任务兼容

### 3️⃣ 删除数据源

#### 如何使用
1. 打开 Admin 后台 → **数据同步** → **数据源** 标签页
2. 在数据源列表中找到要删除的数据源
3. 点击该行右侧的 **删除** 按钮（🗑️ 图标）
4. 在确认对话框中点击 **"确定"** 按钮

#### ⚠️ 注意
- 删除数据源后，使用该数据源的同步任务将无法运行
- 删除操作不可撤销，请谨慎操作

## 📊 数据源表格显示

### 表格列
| 列名 | 说明 |
|------|------|
| **名称** | 数据源的显示名称 |
| **提供商** | 数据源提供商代码（如 yahoo_finance、eastmoney 等） |
| **状态** | 启用/禁用状态（绿色 = 启用，红色 = 禁用） |
| **最后同步** | 最后一次同步的时间戳 |
| **最后结果** | 最后一次同步的结果（成功/失败/部分） |
| **操作** | 编辑和删除按钮 |

### 状态说明
- 🟢 **启用**（绿色标签）：数据源可用，同步任务可以使用
- 🔴 **禁用**（红色标签）：数据源不可用，同步任务无法使用
- ✅ **成功**（绿色）：最后一次同步成功
- ❌ **失败**（红色）：最后一次同步失败
- 🟠 **部分**（橙色）：部分数据同步成功，部分失败

## 🔧 配置 JSON 格式参考

### 基础配置
```json
{
  "supports_batch": false,
  "max_days_per_request": 365
}
```

### 完整配置示例（Yahoo Finance）
```json
{
  "supports_batch": false,
  "max_days_per_request": 365,
  "supports_products": ["STOCK", "ETF", "INDEX"],
  "supports_markets": ["NYSE", "NASDAQ", "SSE", "SZSE", "HKEX"],
  "features": {
    "real_time_quotes": false,
    "historical_data": true,
    "technical_indicators": false
  }
}
```

### 完整配置示例（EastMoney）
```json
{
  "supports_batch": false,
  "max_days_per_request": 1000,
  "supports_products": ["STOCK", "FUND", "INDEX"],
  "supports_markets": ["SSE", "SZSE", "HKEX"],
  "features": {
    "real_time_quotes": true,
    "historical_data": true,
    "technical_indicators": false
  }
}
```

### 完整配置示例（Tushare）
```json
{
  "supports_batch": true,
  "max_symbols_per_request": 100,
  "supports_products": ["STOCK", "FUND", "FUTURE", "INDEX"],
  "supports_markets": ["SSE", "SZSE"],
  "features": {
    "real_time_quotes": true,
    "historical_data": true,
    "technical_indicators": true,
    "factor_library": true
  },
  "requires_api_key": true
}
```

## 💡 最佳实践

### 1️⃣ 创建新数据源前的检查
- 确认提供商的 API 是否可用
- 如果需要 API 密钥，提前准备好
- 了解数据源支持的产品类型和市场

### 2️⃣ 配置建议
- **始终填写配置**：包含 `supports_products` 和 `supports_markets` 信息
- **这样做的好处**：系统可以进行级联过滤，用户创建同步任务时只能看到支持的产品和市场
- **避免混淆**：用户不会尝试使用不支持的组合

### 3️⃣ 命名建议
- 使用清晰的英文名称：例如 "Yahoo Finance US"、"Tushare CN"
- 包含功能说明：例如 "Yahoo Finance (Global Historical Prices)"
- 避免过长或模糊的名称

### 4️⃣ 启用/禁用策略
- **测试新数据源**：先创建为禁用状态，测试后再启用
- **维护时禁用**：数据源出问题时，快速禁用以防止任务继续失败
- **定期检查**：定期检查禁用的数据源，及时清理或重新启用

## 🚀 常见操作场景

### 场景 1：添加第三方数据源
1. 新增数据源，名称填 "第三方数据源名称"
2. 选择对应的提供商
3. 填入 API 端点（如果需要）
4. 如果有 API 密钥，可以添加到配置中
5. 设置启用状态
6. 点击确定

### 场景 2：临时禁用有问题的数据源
1. 点击数据源行的 **编辑** 按钮
2. 关闭 **"启用此数据源"** 开关
3. 点击 **确定** 保存
4. 使用该数据源的同步任务会自动暂停

### 场景 3：更新数据源的 API 端点
1. 点击数据源行的 **编辑** 按钮
2. 修改 **API 端点** 字段
3. 更新 **配置** JSON（如需要）
4. 点击 **确定** 保存
5. 依赖该数据源的任务会使用新的端点

### 场景 4：调整支持的产品和市场
1. 点击数据源行的 **编辑** 按钮
2. 修改 **配置** 中的 `supports_products` 和 `supports_markets` 列表
3. 点击 **确定** 保存
4. 下次创建或编辑同步任务时，级联过滤会使用新配置

## 📱 API 调用示例

### 创建数据源
```bash
curl -X POST http://localhost:3001/api/price-sync/data-sources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Custom Data Source",
    "provider": "custom",
    "api_endpoint": "https://api.example.com",
    "config": {
      "supports_products": ["STOCK"],
      "supports_markets": ["NYSE"]
    },
    "is_active": true
  }'
```

### 修改数据源
```bash
curl -X PUT http://localhost:3001/api/price-sync/data-sources/{id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Updated Name",
    "is_active": false
  }'
```

### 删除数据源
```bash
curl -X DELETE http://localhost:3001/api/price-sync/data-sources/{id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔐 权限要求

所有数据源管理操作需要以下权限：
- **权限类型**: `price`
- **权限等级**: `admin`

如果当前用户没有这些权限，按钮会被禁用或操作会被拒绝。

## 🐛 故障排查

### 问题 1：新增/修改数据源时出现"操作失败"
- ✅ 检查网络连接
- ✅ 检查 Authorization token 是否有效
- ✅ 确认是否有 `price:admin` 权限
- ✅ 检查数据是否填写正确

### 问题 2：JSON 配置保存失败
- ✅ 确保 JSON 格式正确（可使用在线 JSON 验证工具）
- ✅ 检查是否有多余的逗号或缺少花括号
- ✅ 尝试从现有数据源复制配置并修改

### 问题 3：修改数据源后同步任务仍使用旧配置
- ✅ 刷新页面重新加载数据
- ✅ 数据源配置修改是实时的，但任务缓存可能需要刷新
- ✅ 重新启动后端服务以清除缓存

### 问题 4：删除数据源失败
- ✅ 检查是否还有同步任务使用该数据源
- ✅ 需要先删除相关的同步任务后才能删除数据源
- ✅ 检查权限是否足够

## 📚 相关文档

- [Yahoo Finance 集成验证](YAHOO_FINANCE_INTEGRATION.md)
- [数据源对比分析](DATA_SOURCE_COMPARISON.md)
- [数据源选择指南](DATA_SOURCE_SELECTION_GUIDE.txt)

---

**最后更新**: 2025-11-07  
**功能状态**: ✅ 已完成  
**相关组件**: `frontend/src/pages/admin/DataSync/index.tsx`  
**API 端点**: `/api/price-sync/data-sources`
