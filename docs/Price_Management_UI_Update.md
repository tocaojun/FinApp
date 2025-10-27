# 价格管理界面更新说明

## 更新时间
2025-10-26

## 更新内容

### 1. 修复 API 端点问题

**问题描述：**
- 单产品多日录入功能中，产品下拉框为空
- 前端使用了错误的 API 端点 `/api/assets/search`

**解决方案：**
- 将 API 端点从 `/api/assets/search` 改为 `/api/assets`
- `/api/assets/search` 对应 `searchSuggestions` 方法，只处理 `keyword` 参数
- `/api/assets` 对应 `searchAssets` 方法，支持完整的搜索条件（包括 `assetTypeId`）

**修改文件：**
- `frontend/src/pages/admin/PriceManagement/QuickEntry/SingleAssetMultiDate.tsx`

### 2. 统一产品选择方式

**问题描述：**
- 多产品单日录入使用搜索框选择产品
- 单产品多日录入使用两级下拉选择（产品类型→产品）
- 两种方式不一致，用户体验不统一

**解决方案：**
- 将多产品单日录入改为与单产品多日录入相同的两级下拉选择方式
- 第一步：选择产品类型
- 第二步：从该类型下的产品列表中选择具体产品

**修改文件：**
- `frontend/src/pages/admin/PriceManagement/QuickEntry/MultiAssetSingleDate.tsx`

### 3. 界面优化

**单产品多日录入：**
- 产品类型下拉框
- 产品下拉框（根据选择的类型加载）
- 显示历史价格列表
- 支持编辑现有价格
- 分页显示（每页15条）

**多产品单日录入：**
- 日期选择器
- 产品类型下拉框
- 产品池显示（显示当前类型下的产品数量）
- 产品下拉框（根据选择的类型加载）
- 动态添加/删除产品行
- 实时统计有效记录数

## 技术细节

### API 端点说明

| 端点 | 方法 | 用途 | 支持参数 |
|------|------|------|----------|
| `/api/assets` | GET | 搜索资产（完整功能） | assetTypeId, marketId, currency, keyword, page, limit 等 |
| `/api/assets/search` | GET | 搜索建议（简化功能） | keyword, limit |
| `/api/assets/types` | GET | 获取资产类型列表 | - |
| `/api/assets/prices/bulk` | POST | 批量更新价格 | updates[] |

### 数据流程

```
1. 加载资产类型列表
   GET /api/assets/types
   
2. 选择资产类型后，加载该类型的资产列表
   GET /api/assets?assetTypeId={id}&isActive=true&limit=1000
   
3. 选择资产后，加载历史价格（仅单产品多日录入）
   GET /api/assets/{assetId}/prices?limit=15&page={page}
   
4. 保存价格数据
   POST /api/assets/prices/bulk
   Body: { updates: [...] }
```

### 状态管理

**单产品多日录入：**
- `assetTypes`: 资产类型列表
- `assets`: 当前类型下的资产列表
- `selectedAssetType`: 选中的资产类型ID
- `selectedAsset`: 选中的资产对象
- `historicalPrices`: 历史价格列表
- `data`: 价格记录列表（包含新增和编辑的记录）
- `currentPage`: 当前页码

**多产品单日录入：**
- `assetTypes`: 资产类型列表
- `assets`: 当前类型下的资产列表
- `selectedAssetType`: 选中的资产类型ID
- `selectedDate`: 选中的日期
- `data`: 价格记录列表（多个产品）

## 测试要点

### 功能测试

1. **资产类型加载**
   - [ ] 页面加载时自动获取资产类型列表
   - [ ] 资产类型下拉框显示正确
   - [ ] 支持搜索过滤

2. **资产列表加载**
   - [ ] 选择资产类型后自动加载该类型的资产
   - [ ] 显示资产数量统计
   - [ ] 如果该类型下无资产，显示提示信息

3. **产品选择**
   - [ ] 产品下拉框支持搜索过滤
   - [ ] 显示产品代码和名称
   - [ ] 多产品单日录入中，不能重复选择同一产品

4. **价格录入**
   - [ ] 收盘价为必填项
   - [ ] 开盘价、最高价、最低价为可选项
   - [ ] 价格验证：最低价 ≤ 开盘价/收盘价 ≤ 最高价

5. **数据保存**
   - [ ] 验证必填项
   - [ ] 批量保存成功
   - [ ] 显示成功/失败消息
   - [ ] 保存后清空表单

### 性能测试

- [ ] 资产类型列表加载速度
- [ ] 资产列表加载速度（1000个产品）
- [ ] 历史价格分页加载
- [ ] 批量保存响应时间

### 用户体验测试

- [ ] 加载状态显示（Spin）
- [ ] 错误提示清晰
- [ ] 操作流程顺畅
- [ ] 界面布局合理

## 已知问题

无

## 后续优化建议

1. **缓存优化**
   - 缓存资产类型列表（很少变化）
   - 缓存已加载的资产列表

2. **性能优化**
   - 资产列表虚拟滚动（如果数量很大）
   - 历史价格懒加载

3. **功能增强**
   - 支持批量导入（Excel/CSV）
   - 支持价格模板
   - 支持快捷键操作

4. **数据验证**
   - 价格异常检测（与历史价格对比）
   - 重复日期检测
   - 数据完整性检查

## 相关文档

- [价格更新功能重新设计](./Price_Update_Redesign.md)
- [价格管理测试清单](./Price_Management_Test_Checklist.md)
- [系统配置信息](../config/system-config.md)
