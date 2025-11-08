# 数据源动态过滤功能验证清单

## 功能概述
用户在创建或编辑同步任务时，选择数据源后，系统会自动过滤显示该数据源支持的资产类型和市场，提高用户体验。

## 代码变更总结

### 后端修改 (Backend)
- **文件**: `/backend/src/services/PriceSyncService.ts`
  - 新增方法: `getDataSourceCoverage(dataSourceId: string)`
  - 功能: 根据数据源ID获取其支持的产品类型和市场列表

- **文件**: `/backend/src/controllers/PriceSyncController.ts`
  - 新增方法: `getDataSourceCoverage = async (req, res)`
  - 功能: HTTP请求处理

- **文件**: `/backend/src/routes/priceSync.ts`
  - 新增路由: `GET /data-sources/:id/coverage`

### 前端修改 (Frontend)
- **文件**: `/frontend/src/pages/admin/DataSync/index.tsx`
  - 新增状态: `filteredAssetTypes`, `filteredMarkets`
  - 新增方法: `loadDataSourceCoverage(dataSourceId)`
  - 修改: 数据源选择添加 onChange 监听
  - 修改: 资产类型和市场下拉框使用过滤数据
  - 修改: 新建和编辑任务时初始化过滤数据

## 验证步骤

### ✅ 编译和启动验证

- [ ] **后端编译无误**
  ```bash
  cd /Users/caojun/code/FinApp/backend
  npm run build
  ```
  预期结果: 编译成功，无 TypeScript 错误

- [ ] **前端编译无误**
  ```bash
  cd /Users/caojun/code/FinApp/frontend
  npm run build
  ```
  预期结果: 编译成功，无 TypeScript 警告

- [ ] **后端启动正常**
  ```bash
  cd /Users/caojun/code/FinApp/backend
  npm start
  ```
  预期结果: 服务器启动，监听 5000 端口

- [ ] **前端启动正常**
  ```bash
  cd /Users/caojun/code/FinApp/frontend
  npm start
  ```
  预期结果: 开发服务器启动，可访问 http://localhost:3000

### ✅ API 端点验证

- [ ] **获取数据源列表**
  ```bash
  curl -X GET http://localhost:5000/api/price-sync/data-sources \
    -H "Authorization: Bearer {token}"
  ```
  预期结果:
  - HTTP 200 OK
  - 返回数据源数组
  - 每个数据源包含 id, name, provider, config 等字段

- [ ] **获取单个数据源信息**
  ```bash
  curl -X GET http://localhost:5000/api/price-sync/data-sources/{id} \
    -H "Authorization: Bearer {token}"
  ```
  预期结果:
  - HTTP 200 OK
  - 返回单个数据源的详细信息

- [ ] **获取数据源覆盖范围（新增端点）**
  ```bash
  curl -X GET http://localhost:5000/api/price-sync/data-sources/{id}/coverage \
    -H "Authorization: Bearer {token}"
  ```
  预期结果:
  ```json
  {
    "success": true,
    "data": {
      "id": "source-id",
      "name": "Data Source Name",
      "provider": "provider_name",
      "productTypes": ["STOCK", "BOND", "ETF"],
      "markets": [
        { "code": "NYSE", "name": "纽约证券交易所" },
        { "code": "NASDAQ", "name": "纳斯达克" }
      ]
    }
  }
  ```

- [ ] **覆盖范围为空的情况**
  - 选择一个不支持任何产品/市场的数据源
  - 预期: `productTypes: []` 和 `markets: []`

- [ ] **覆盖范围处理错误**
  - 查询不存在的数据源 ID
  - 预期: HTTP 500，返回错误消息

### ✅ UI 功能验证

#### 新建任务流程

- [ ] **打开「新建任务」对话框**
  - 操作: 数据同步 → 新建任务
  - 预期: 表单弹出，所有字段为空

- [ ] **初始状态验证**
  - 观察「资产类型」和「市场」下拉框
  - 预期: 暂时显示所有可选项（因为未选择数据源）

- [ ] **选择数据源 - Alpha Vantage**
  - 操作: 点击「数据源」下拉框，选择 "Alpha Vantage"
  - 预期:
    - 「资产类型」下拉框仅显示 STOCK 和 ETF
    - 「市场」下拉框仅显示 NYSE 和 NASDAQ
    - 任何之前选择的资产类型/市场被清空

- [ ] **选择数据源 - 新浪财经**
  - 操作: 改变数据源选择为 "新浪财经"
  - 预期:
    - 「资产类型」下拉框更新为 STOCK, BOND, FUND
    - 「市场」下拉框更新为 SSE, SZSE, HKEX, NYSE, NASDAQ
    - 下拉框内容动态刷新，无页面延迟

- [ ] **选择数据源 - Tushare**
  - 操作: 改变数据源选择为 "Tushare"
  - 预期:
    - 显示 Tushare 支持的资产类型和市场
    - 如果 Tushare 仅支持特定市场，应只显示那些市场

- [ ] **选择资产类型和市场**
  - 操作: 
    1. 选择数据源 "Alpha Vantage"
    2. 从资产类型下拉框选择 "股票"
    3. 从市场下拉框选择 "NYSE"
  - 预期:
    - 选择成功，表单字段更新
    - 未来保存时应包含这些选择

- [ ] **不选择数据源的情况**
  - 操作: 打开新建任务，保持数据源为空，点击资产类型下拉框
  - 预期: 显示提示 "请先选择数据源"

#### 编辑任务流程

- [ ] **打开编辑现有任务**
  - 操作: 找一个现有任务，点击「编辑」按钮
  - 预期: 表单弹出，显示该任务的所有信息

- [ ] **自动加载覆盖范围**
  - 观察表单中的「资产类型」和「市场」下拉框
  - 预期: 
    - 自动加载该数据源的覆盖范围
    - 已保存的资产类型和市场在下拉框中可见且被选中
    - 如果保存的选择不在覆盖范围内（数据源配置已更改），应显示警告

- [ ] **修改数据源后**
  - 操作: 在编辑表单中改变数据源选择
  - 预期:
    - 资产类型和市场下拉框更新为新数据源的覆盖范围
    - 已选择的资产类型和市场被清空

#### 边界情况

- [ ] **无网络连接或 API 超时**
  - 操作: 断开网络后选择数据源，观察行为
  - 预期:
    - 前端应显示所有可选项（降级处理）
    - 浏览器控制台应记录错误日志

- [ ] **空的覆盖范围**
  - 操作: 选择一个不支持任何产品的数据源（如果存在）
  - 预期:
    - 「资产类型」下拉框被禁用
    - 显示提示 "该数据源不支持资产类型选择"

- [ ] **数据库中市场代码不存在**
  - 前提: 数据源配置中包含 `finapp.markets` 表中不存在的市场代码
  - 预期: API 应正确处理，返回可用的市场信息

- [ ] **超大覆盖范围**
  - 前提: 一个数据源支持 50+ 种产品或市场
  - 预期: 下拉框应正确显示所有选项，无性能问题

### ✅ 浏览器开发工具验证

在浏览器 DevTools 中验证：

- [ ] **Network 标签**
  - 选择数据源时，应在 Network 标签中看到请求
  - URL: `/api/price-sync/data-sources/{id}/coverage`
  - 预期响应时间: < 1 秒（正常网络条件下）
  - 返回状态: 200 OK

- [ ] **Console 标签**
  - 预期: 无红色错误信息
  - 可能的警告信息: 来自第三方库，与此功能无关

- [ ] **Application / Storage 标签**
  - 查看 localStorage 中的 auth_token 是否存在
  - 验证请求头中是否包含正确的 Authorization token

### ✅ 数据库验证

- [ ] **检查数据源配置**
  ```sql
  SELECT id, name, provider, config
  FROM finapp.price_data_sources
  WHERE is_active = true
  ORDER BY name;
  ```
  预期: 所有活跃数据源的 config 包含 `supports_products` 和 `supports_markets` 字段

- [ ] **检查特定数据源的配置**
  ```sql
  SELECT name, config -> 'supports_products' as products,
         config -> 'supports_markets' as markets
  FROM finapp.price_data_sources
  WHERE name = 'Alpha Vantage';
  ```
  预期: 返回该数据源的覆盖范围配置

- [ ] **检查市场表**
  ```sql
  SELECT code, name FROM finapp.markets
  ORDER BY code;
  ```
  预期: 所有市场代码都正确定义，至少包含:
  - NYSE, NASDAQ (美国)
  - SSE, SZSE (中国)
  - HKEX (香港)
  - LSE (英国)
  - TSE (日本)
  - FWB (德国)

### ✅ 性能验证

- [ ] **响应时间**
  - 多次快速切换数据源
  - 预期: 下拉框响应流畅，无明显延迟 (< 500ms)

- [ ] **内存使用**
  - 打开多个任务表单
  - 预期: 内存占用合理，无泄漏迹象

- [ ] **并发请求**
  - 快速连续选择多个数据源
  - 预期: 最后一个选择的数据源覆盖范围生效

### ✅ 文档验证

- [ ] **指南文档完整性**
  - 文件: `/docs/DATA_SOURCE_DYNAMIC_FILTER_GUIDE.md`
  - 检查清单:
    - [ ] 功能概述清晰
    - [ ] 工作流程详细
    - [ ] 数据库配置要求明确
    - [ ] 测试步骤完整
    - [ ] 故障排查有帮助

- [ ] **本清单完整性**
  - 所有关键功能都有对应的测试项
  - 测试步骤可执行且清晰

## 潜在问题及解决方案

### 问题 1: 下拉框显示所有选项，未过滤
**原因**:
1. API 请求失败
2. 数据源配置不完整
3. 前端没有正确调用 `loadDataSourceCoverage`

**检查**:
```bash
# 1. 检查浏览器控制台是否有错误
# 2. 检查 Network 标签是否有请求失败
# 3. 验证数据库配置:
SELECT config FROM finapp.price_data_sources 
WHERE name = '你的数据源' LIMIT 1;
```

### 问题 2: 下拉框被禁用，无法选择
**原因**:
1. 该数据源不支持任何产品/市场
2. 市场代码在 finapp.markets 表中不存在

**检查**:
```bash
# 1. 验证数据源覆盖范围是否为空
curl -X GET http://localhost:5000/api/price-sync/data-sources/{id}/coverage

# 2. 检查市场代码是否存在
SELECT * FROM finapp.markets WHERE code = 'YOUR_MARKET_CODE';
```

### 问题 3: 编辑任务时选项不可用
**原因**: 保存的选项不在当前数据源的覆盖范围内

**解决**: 验证数据源配置是否被修改过

## 提交检查清单 (Ready for Production)

提交前必须确认以下所有项都已通过：

- [ ] 后端代码编译无误
- [ ] 前端代码编译无误
- [ ] 所有 API 端点都能正常响应
- [ ] 前端 UI 功能正常工作
- [ ] 浏览器控制台无错误
- [ ] 数据库配置正确
- [ ] 文档完整准确
- [ ] 性能满足要求
- [ ] 没有已知的 bug

## 测试环境要求

- Node.js: v16+
- PostgreSQL: v12+
- 浏览器: Chrome/Firefox/Safari (最新版本)
- API 接口: 后端 http://localhost:5000
- 前端服务: http://localhost:3000

## 后续改进方向

1. **缓存优化**: 缓存覆盖范围数据，减少 API 请求
2. **预加载**: 页面初始化时预加载常用数据源的覆盖范围
3. **搜索功能**: 在下拉框中添加搜索和过滤
4. **实时更新**: 管理员更新数据源时自动刷新前端数据
5. **国际化**: 支持多语言显示市场和产品类型名称

---

**清单版本**: v1.0  
**创建日期**: 2025-11-07  
**最后更新**: 2025-11-07  
**维护者**: [项目团队]
