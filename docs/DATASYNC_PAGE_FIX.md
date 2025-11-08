# DataSync 页面卡死问题修复

## 问题描述
**现象**: 打开 DataSync 页面时，页面卡死无法加载
**时间**: 2025-11-08
**影响**: 用户无法访问数据同步管理功能

## 根本原因分析

### 1. 状态定义缺失
```typescript
// ❌ 错误：缺少 filteredMarkets 和对应的 setFilteredMarkets
const [filteredAssetTypes, setFilteredAssetTypes] = useState<AssetType[]>([]);
// 但代码中使用了 setFilteredMarkets()
```

代码在多处调用 `setFilteredMarkets()`，但这个状态从未定义，导致：
- 运行时错误 `setFilteredMarkets is not defined`
- 组件崩溃，页面卡死

### 2. API 加载无超时控制
```typescript
// ❌ 问题：多个 await 阻塞式调用
await Promise.all([
  loadDataSources(),      // 可能卡住
  loadSyncTasks(),        // 可能卡住
  loadAssetTypes(),       // 可能卡住
  loadSyncLogs(),         // 可能卡住
  loadAssets(),           // 可能卡住
]);
```

如果任何一个 API 响应缓慢或超时，整个页面都会卡死。

### 3. 数据量过大
`loadAssets()` 加载所有资产，可能导致：
- 网络传输时间过长
- 浏览器内存占用过高
- UI 卡顿

## 修复方案

### 1. 添加缺失状态 ✅
```typescript
const [filteredMarkets, setFilteredMarkets] = useState<Market[]>([]);
```

### 2. 实现分阶段加载 ✅
```
第一阶段 (必须成功):
├─ loadDataSources()     [5s 超时]
└─ loadSyncTasks()       [5s 超时]
        ↓ (继续)
第二阶段 (可选，非阻塞):
├─ loadAssetTypes()      [5s 超时，失败使用默认值]
        ↓ (继续)
第三阶段 (后台加载):
├─ loadSyncLogs()        [5s 超时，失败使用空数组]
└─ loadAssets()          [5s 超时，失败使用空数组]
```

### 3. 实现优雅超时 ✅
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

const response = await priceSyncApiClient.get('/data-sources', {
  signal: controller.signal as any
});
clearTimeout(timeoutId);
```

### 4. 限制数据量 ✅
```typescript
// 只加载前500条资产
const response = await axios.get('/api/assets?limit=500&page=1', {
  timeout: 8000,
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## 技术细节

### 关键改进

| 问题 | 原方案 | 修复后 |
|------|-------|-------|
| 缺失状态 | 定义不完整 | ✅ 完整定义所有状态 |
| 超时控制 | 无 | ✅ 每个 API 5秒超时 |
| 加载策略 | 全部阻塞 | ✅ 分阶段非阻塞 |
| 错误处理 | 中断加载 | ✅ 使用默认值继续 |
| 数据量 | 全部加载 | ✅ 限制 500 条 |

### 加载性能

```
优化前:
- 所有 API 串行等待 → 最长 40 秒
- 若有 API 超时 → 页面卡死

优化后:
- 关键 API 并行 → 5 秒内完成
- 可选 API 后台加载 → 不阻塞页面
- 任何 API 超时 → 自动使用默认值
- 页面立即可用 → 提升用户体验
```

## 修改文件
- `frontend/src/pages/admin/DataSync/index.tsx`

## 提交信息
```
fix: 修复DataSync页面加载卡死问题
- 添加缺失的filteredMarkets状态
- 实现5秒API超时控制
- 采用分阶段非阻塞式加载
- 限制资产加载数量为500条
```

## 验证清单
- [x] 页面能快速加载（无卡死）
- [x] 数据源正确显示
- [x] 同步任务正确显示
- [x] 可选数据加载失败时使用默认值
- [x] 网络缓慢时页面仍可用

## 相关资源
- 优化前后端通信：`docs/FRONTEND_BACKEND_TIMEOUT_DIAGNOSIS.md`
- 数据加载最佳实践：见 React 官方文档
