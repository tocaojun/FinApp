# Release Notes - v1.0.1

**发布日期**: 2025-10-27  
**版本**: v1.0.1  
**提交哈希**: 90b7f84  
**类型**: Bug Fix Release

## 🎯 概述

本次发布主要修复了港股价格同步问题，特别是美团和京东的 API 同步失败问题，并提升了系统对长时间历史数据的支持能力。

## ✨ 主要更新

### 1. 港股 Symbol 格式转换修复 🔥

**问题描述**:
- 美团 (03690) 和京东 (09618) 的价格同步失败
- 数据无法插入到 `AssetPrice` 表

**根本原因**:
- 港股 symbol 格式转换逻辑错误
- 正则表达式 `/^0+/` 导致 `03690` → `0.HK` (应该是 `3690.HK`)

**修复方案**:
```typescript
// 修复前
const hkSymbol = asset.symbol.replace(/^0+/, '0');

// 修复后
let hkSymbol = asset.symbol;
if (hkSymbol.length === 5 && hkSymbol.startsWith('0')) {
  hkSymbol = hkSymbol.substring(1);
}
```

**影响范围**:
- ✅ 美团 (03690) - 现可正常同步
- ✅ 京东 (09618) - 现可正常同步
- ✅ 所有 5 位数字且以 0 开头的港股资产

**测试结果**:
- 美团: 19 条记录同步成功
- 京东: 19 条记录同步成功
- 成功率: 100%

### 2. 历史数据回溯限制移除 📈

**更新内容**:
- 前端回溯天数限制: 365 天 → 3650 天 (10 年)
- 支持长时间历史数据补全

**性能测试**:
- 30 天数据: 38 条记录，1.11 秒
- 1 年数据: 247 条记录，0.65 秒
- 3 年数据: 735 条记录，0.70 秒

**使用场景**:
- 新资产历史数据补全
- 数据迁移和回填
- 长期数据分析

### 3. 数据保存字段修复 🔧

**修复内容**:
- 字段名: `source` → `data_source`
- 新增: `currency` 字段支持
- 确保价格数据正确保存

**影响**:
- 所有价格数据现在都能正确保存到数据库
- 支持多币种价格数据

## 📚 新增文档

### 核心文档 (7 个)
- `MEITUAN_JD_SYNC_FIX_REPORT.md` - 港股 Symbol 修复详细报告
- `FINAL_MEITUAN_JD_FIX_SUMMARY.md` - 修复总结
- `PRICE_SYNC_FIX_COMPLETE.md` - 价格同步完整修复报告
- `LONG_HISTORY_SYNC_GUIDE.md` - 长时间历史数据同步指南
- `HISTORY_SYNC_QUICK_REFERENCE.md` - 快速参考
- `QUICK_START_HISTORY_SYNC.md` - 快速开始指南
- `PRICE_SYNC_DOCS_INDEX.md` - 文档索引

### 技术文档 (5 个)
- `HISTORY_SYNC_LIMIT_REMOVAL.md` - 限制移除报告
- `PRICE_SYNC_DATABASE_SCHEMA.md` - 数据库架构
- `YAHOO_FINANCE_RATE_LIMIT_GUIDE.md` - API 限流指南
- `SESSION_SUMMARY.md` - 会话总结
- `GIT_COMMIT_SUMMARY.md` - Git 提交总结

### 测试脚本 (3 个)
- `test-meituan-jd-quick.sh` - 美团京东快速测试
- `test-price-sync-api.sh` - 价格同步 API 测试
- `test-sync-fix.sh` - 同步修复测试

### 其他文档 (45+ 个)
- Phase 3 相关文档
- Prisma Studio 指南
- 各类修复报告和指南

## 🔧 修改的文件

### 后端 (7 个文件)
- `backend/src/services/PriceSyncService.ts` - Symbol 转换逻辑修复 ⭐
- `backend/src/controllers/AssetController.ts`
- `backend/src/routes/assets.ts`
- `backend/src/services/AssetService.ts`
- `backend/prisma/schema.prisma`
- `backend/src/app.ts`
- `backend/tsconfig.json`

### 前端 (8 个文件)
- `frontend/src/pages/admin/PriceManagement/ApiSync/index.tsx` - 回溯天数限制提升 ⭐
- `frontend/src/App.tsx`
- `frontend/src/components/charts/InteractiveChartWrapper.tsx`
- `frontend/src/components/layout/AppLayout.tsx`
- `frontend/src/components/portfolio/AccountsTab.tsx`
- `frontend/src/components/portfolio/HoldingsTable.tsx`
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/services/authService.ts`

### 配置和脚本 (3 个文件)
- `README.md` - 添加价格同步文档链接
- `restart-backend.sh` - 后端重启脚本
- `scripts/migrate-phase3.sh` - Phase 3 迁移脚本

## 📊 统计数据

- **文件变更**: 85 个文件
- **新增行数**: 17,619 行
- **删除行数**: 355 行
- **新增文件**: 60+ 个
- **修改核心文件**: 18 个

## 🧪 测试覆盖

### 单元测试
- ✅ Symbol 转换逻辑测试
- ✅ Yahoo Finance API 测试
- ✅ 数据保存测试

### 集成测试
- ✅ 美团京东完整同步测试
- ✅ 3 年历史数据同步测试
- ✅ 数据库数据验证

### 性能测试
- ✅ 30 天数据同步
- ✅ 1 年数据同步
- ✅ 3 年数据同步

## 🚀 升级指南

### 1. 拉取最新代码
```bash
git pull origin master
```

### 2. 安装依赖
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. 重启服务
```bash
./restart-all-services.sh
```

### 4. 验证修复
```bash
./test-meituan-jd-quick.sh
```

## 📖 使用指南

### 快速开始
1. 阅读 [快速开始指南](./QUICK_START_HISTORY_SYNC.md)
2. 查看 [文档索引](./PRICE_SYNC_DOCS_INDEX.md)
3. 运行测试脚本验证

### 同步美团和京东价格
1. 登录系统
2. 进入"价格管理" → "API 同步"
3. 创建新任务，选择美团和京东
4. 设置回溯天数（如 30 天）
5. 执行任务并查看结果

### 补全历史数据
1. 参考 [长时间历史数据同步指南](./LONG_HISTORY_SYNC_GUIDE.md)
2. 设置回溯天数（最多 3650 天）
3. 执行同步任务
4. 在 Prisma Studio 中验证数据

## ⚠️ 注意事项

### 1. 系统时间
- 当前系统时间显示为 2025 年
- 可能影响日期范围计算
- 建议使用相对日期

### 2. API 限流
- Yahoo Finance 有请求频率限制
- 建议合理设置同步间隔
- 参考 [Yahoo Finance 限流规则指南](./YAHOO_FINANCE_RATE_LIMIT_GUIDE.md)

### 3. 数据覆盖
- 默认不覆盖已有数据
- 如需覆盖，设置 `overwrite_existing: true`

### 4. 性能考虑
- 大量数据同步可能需要较长时间
- 建议分批同步
- 监控系统资源使用

## 🐛 已知问题

无

## 🔮 下一步计划

- [ ] 支持更多数据源 (EastMoney, Tushare)
- [ ] 优化同步性能
- [ ] 添加数据质量检查
- [ ] 实现增量同步
- [ ] 添加同步进度显示

## 📝 变更日志

### Added
- 港股 Symbol 格式转换修复
- 历史数据回溯限制移除 (10 年支持)
- 60+ 个详细文档和指南
- 3 个测试脚本

### Fixed
- 美团 (03690) 价格同步失败
- 京东 (09618) 价格同步失败
- 数据保存字段名错误
- 缺少 currency 字段

### Changed
- 回溯天数限制: 365 天 → 3650 天
- Symbol 转换逻辑优化

### Improved
- 文档完善度
- 测试覆盖率
- 代码可维护性

## 🙏 致谢

感谢所有参与测试和反馈的用户！

## 📞 支持

如有问题，请：
1. 查看 [文档索引](./PRICE_SYNC_DOCS_INDEX.md)
2. 查看 [故障排查指南](./HISTORY_SYNC_QUICK_REFERENCE.md)
3. 提交 GitHub Issue

## 🔗 相关链接

- **GitHub 仓库**: https://github.com/tocaojun/FinApp
- **提交详情**: https://github.com/tocaojun/FinApp/commit/90b7f84
- **文档索引**: [PRICE_SYNC_DOCS_INDEX.md](./PRICE_SYNC_DOCS_INDEX.md)
- **快速开始**: [QUICK_START_HISTORY_SYNC.md](./QUICK_START_HISTORY_SYNC.md)

---

**发布者**: FinApp Team  
**发布日期**: 2025-10-27  
**版本**: v1.0.1  
**状态**: ✅ 已发布
