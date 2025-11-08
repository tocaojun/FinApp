# 前端更新指南 - 市场维度移除

## 概述
本指南提供前端代码更新的具体步骤,用于适应后端的市场维度移除变更。

## 更新文件清单

### 1. `frontend/src/services/assetService.ts`
**用途**: 与后端API通信的服务层

**需要更新的方法**:

#### searchAssets() 
```diff
- const params = { keyword, assetTypeId, marketId, ... }
+ const params = { keyword, assetTypeId, countryId, ... }

- marketId: marketId || undefined
+ countryId: countryId || undefined
```

#### getAssets()
```diff
- /assets?marketId=...
+ /assets?countryId=...
```

#### getAssetById()
- 无需更改 (读取逻辑不变)

#### createAsset()
```diff
- { ..., marketId, ... }
+ { ..., countryId, ... }
```

#### updateAsset()
```diff
- { ..., marketId, ... }
+ { ..., countryId, ... }
```

**检查清单**:
- [ ] 搜索参数中的marketId改为countryId
- [ ] API端点调用的查询参数正确
- [ ] 请求体中的marketId改为countryId

---

### 2. `frontend/src/components/asset/AdvancedAssetFilter.tsx`
**用途**: 高级资产过滤组件

**需要更新的部分**:

#### 过滤器定义
```diff
- marketId?: string
+ countryId?: string
```

#### UI 标签
```diff
- label: "Market"
+ label: "Country"
```

#### 过滤条件构建
```diff
- filters.marketId = selectedMarket
+ filters.countryId = selectedCountry
```

#### 数据源
```diff
- markets: Market[]  // 从API获取
+ countries: Country[]  // 从API获取

- await getMarkets()
+ await getCountries()
```

**检查清单**:
- [ ] 过滤器字段定义更新
- [ ] UI标签文本更新 (Market → Country)
- [ ] 数据源更新 (市场 → 国家)
- [ ] 事件处理器更新
- [ ] 样式/图标更新 (如果有)

---

### 3. `frontend/src/pages/admin/PriceManagement/ApiSync/index.tsx`
**用途**: 价格同步配置页面

**需要更新的部分**:

#### 同步任务配置
```diff
- market_id: string
+ country_id: string
```

#### 表单字段
```diff
- <select name="marketId" ... />
+ <select name="countryId" ... />
```

#### 表单验证
```diff
- if (!formData.marketId) ...
+ if (!formData.countryId) ...
```

#### API调用
```diff
- await createSyncTask({ ..., market_id, ... })
+ await createSyncTask({ ..., country_id, ... })
```

**检查清单**:
- [ ] 表单字段名称更新
- [ ] 标签文本更新
- [ ] 表单验证逻辑更新
- [ ] API参数更新
- [ ] 错误提示信息更新

---

### 4. `frontend/src/pages/admin/DataSync/index.tsx`
**用途**: 数据同步管理页面

**需要更新的部分**:

#### 同步配置选项
```diff
- marketOptions: Market[]
+ countryOptions: Country[]
```

#### 列表展示
```diff
- <td>{sync.market_id}</td>
+ <td>{sync.country_id}</td>
```

#### 编辑表单
```diff
- market_id: task.market_id
+ country_id: task.country_id
```

**检查清单**:
- [ ] 选项列表更新 (Market → Country)
- [ ] 显示列更新
- [ ] 编辑/创建表单更新
- [ ] API参数更新

---

## 通用更新模式

### 导入语句更新
```typescript
// 如果有相关的类型导入,确保更新
import { Market } from '@/types';  // 移除 (如果仅用于marketId)
import { Country } from '@/types';  // 确保存在
```

### 类型定义更新
确保这些类型已在`@/types/asset.ts`或相关文件中更新:

```typescript
interface Asset {
  countryId?: string | null;  // 支持null用于全球资产
  // marketId 移除
}

interface AssetSearchCriteria {
  countryId?: string;
  // marketId 移除
}

interface Country {
  id: string;
  code: string;
  name: string;
  // ... 其他字段
}
```

### 状态管理更新 (如适用)
如果使用Redux/Context Store:

```typescript
// 状态定义
interface AssetFilterState {
  countryId?: string;  // 新增
  // marketId 移除
}

// Action类型
type AssetFilterAction =
  | { type: 'SET_COUNTRY'; payload: string }
  | // ... 其他action
```

---

## 测试检查清单

### 单元测试
- [ ] assetService tests - 更新API调用模拟
- [ ] 过滤组件tests - 验证国家过滤逻辑
- [ ] 表单tests - 验证country_id字段

### 集成测试
- [ ] 搜索资产 - 使用countryId过滤
- [ ] 创建资产 - 选择country而非market
- [ ] 编辑资产 - 更新country字段
- [ ] 导出资产 - CSV中包含country列

### 手动测试场景
1. 打开资产管理页面
   - [ ] 国家过滤器正确显示
   - [ ] 可以按国家搜索

2. 创建新资产
   - [ ] 需要选择国家 (非市场)
   - [ ] 可以选择"全球"(NULL country)

3. 全球资产处理
   - [ ] BTC/ETH等全球资产可创建
   - [ ] 无需选择国家

4. 价格同步配置
   - [ ] 可以按国家配置同步任务
   - [ ] 任务列表显示country_id

---

## 常见问题处理

### Q1: 如何处理显示市场名称的地方?
A: 改为显示国家名称。如果需要显示交易所信息,可以:
- 在symbol中编码交易所 (如SSE/SZSE通过数字前缀识别)
- 在备注/详情中存储交易所信息
- 使用国家+symbol组合推断交易所

### Q2: 全球资产如何选择国家?
A: 不选择国家 (保留NULL)
- UI应该提供"无国家"或"全球"的选项
- API自动处理NULL值

### Q3: 已有数据中的marketId如何处理?
A: 数据库迁移已自动清理:
- market_id列已删除
- 现有country_id值正确映射
- 不需要前端特殊处理

### Q4: 跨国上市公司如何处理?
A: 创建多个Asset记录:
- 苹果 (AAPL) - country_id: US
- 苹果 (AAPL) - country_id: CN (如果在中国上市)
每个记录有独立的ID,可独立管理价格和持仓

---

## 性能考虑

### 优化建议
1. **缓存国家列表** - 国家列表很少变化
   ```typescript
   const countries = useMemo(() => getCountries(), []);
   ```

2. **虚拟化大型列表** - 如果国家/资产列表很大
   ```typescript
   <VirtualList items={countries} />
   ```

3. **使用Select组件的搜索** - 方便用户快速查找国家
   ```typescript
   <Select 
     searchable
     filterOption="filter-by-name"
     options={countries}
   />
   ```

---

## 验证部署

部署前检查清单:

- [ ] 编译无错误
- [ ] 所有单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试场景验证
- [ ] 浏览器控制台无错误
- [ ] API请求正确 (DevTools Network检查)
- [ ] 国家数据正确加载
- [ ] 搜索/过滤功能正常

---

## 回滚方案

如遇到问题:
1. 恢复之前的assetService版本
2. 临时使用countryId → marketId的映射
3. 通知后端维护人员

---

## 参考资源
- 后端实施总结: `MARKET_REMOVAL_IMPLEMENTATION_SUMMARY.md`
- API变更日志: 后端API文档
- 类型定义: `backend/src/types/asset.ts`

---

**最后更新**: 2025-11-08
**优先级**: HIGH
**预计工作量**: 2-4小时 (取决于测试覆盖率)
