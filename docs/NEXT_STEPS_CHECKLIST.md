# 下一步行动清单

## 当前进度
- ✅ 后端完成: 100%
- ⏳ 前端待处理: 0%
- ⏳ 测试待处理: 0%

---

## 1️⃣ 前端代码更新 (最高优先级)

### 1.1 assetService.ts
```
位置: frontend/src/services/assetService.ts
预计时间: 30分钟
任务:
  [ ] 更新搜索方法中的marketId → countryId
  [ ] 更新API调用参数
  [ ] 检查所有资产相关API调用
```

### 1.2 AdvancedAssetFilter.tsx
```
位置: frontend/src/components/asset/AdvancedAssetFilter.tsx
预计时间: 45分钟
任务:
  [ ] 更新过滤字段定义
  [ ] 更新UI标签 (Market → Country)
  [ ] 更新数据源 (getMarkets → getCountries)
  [ ] 更新事件处理器
  [ ] 测试过滤功能
```

### 1.3 ApiSync/index.tsx
```
位置: frontend/src/pages/admin/PriceManagement/ApiSync/index.tsx
预计时间: 45分钟
任务:
  [ ] 更新表单字段名称
  [ ] 更新标签文本
  [ ] 更新表单验证逻辑
  [ ] 更新API调用参数
  [ ] 测试同步配置
```

### 1.4 DataSync/index.tsx
```
位置: frontend/src/pages/admin/DataSync/index.tsx
预计时间: 45分钟
任务:
  [ ] 更新选项列表 (Market → Country)
  [ ] 更新列表显示列
  [ ] 更新编辑/创建表单
  [ ] 更新API参数
  [ ] 测试数据同步
```

---

## 2️⃣ 测试执行 (高优先级)

### 2.1 单元测试
```
预计时间: 1-2小时
任务:
  [ ] 更新assetService测试用例
  [ ] 更新过滤组件测试
  [ ] 添加全球资产(NULL countryId)测试
  [ ] 运行: npm run test
```

### 2.2 集成测试
```
预计时间: 1-2小时
任务:
  [ ] 创建资产流程测试
  [ ] 搜索和过滤测试
  [ ] 价格同步测试
  [ ] 数据导入导出测试
```

### 2.3 手动测试场景
```
预计时间: 1小时
场景1: 创建资产
  [ ] 打开资产创建页面
  [ ] 选择国家(非市场)
  [ ] 创建资产并验证
  
场景2: 搜索资产
  [ ] 按国家过滤资产
  [ ] 验证返回结果正确
  
场景3: 全球资产
  [ ] 创建全球资产(无国家选择)
  [ ] 验证能正确显示和查询
  
场景4: 价格同步
  [ ] 配置国家级别的同步任务
  [ ] 执行同步并验证结果
```

---

## 3️⃣ 数据库部署 (高优先级)

```
预计时间: 30分钟
步骤:
  [ ] 确认备份存在: 
      backups/backup_before_market_removal_20251108_133033.sql
  
  [ ] 执行迁移脚本:
      psql -h localhost -U finapp_user -d finapp_test < \
      backend/migrations/010_remove_market_dimension/migration.sql
  
  [ ] 验证变更:
      SELECT * FROM information_schema.columns 
      WHERE table_name = 'assets' AND column_name = 'market_id';
      -- 应该返回0行
  
  [ ] 验证约束:
      SELECT * FROM information_schema.table_constraints 
      WHERE table_name = 'assets' AND constraint_type = 'UNIQUE';
      -- 应该看到 assets_country_id_symbol_unique
```

---

## 4️⃣ 编译和验证 (中优先级)

```
后端编译:
  [ ] npm run build:backend
  [ ] 检查编译错误: 应该为0
  [ ] 检查lint警告: 应该为0

前端编译:
  [ ] npm run build:frontend
  [ ] 检查编译错误: 应该为0
  [ ] 检查lint警告: 应该为0

运行应用:
  [ ] 启动后端: npm run start:backend
  [ ] 启动前端: npm run start:frontend
  [ ] 打开浏览器检查: http://localhost:3000
```

---

## 5️⃣ 部署前检查 (中优先级)

```
功能检查:
  [ ] 资产管理功能正常
  [ ] 搜索过滤功能正常
  [ ] 价格同步功能正常
  [ ] 数据导入导出功能正常

性能检查:
  [ ] API响应时间 < 1秒
  [ ] 列表加载 < 2秒
  [ ] 无console错误

兼容性检查:
  [ ] Chrome 最新版本
  [ ] Firefox 最新版本
  [ ] Safari 最新版本
```

---

## 6️⃣ 文档和沟通 (低优先级)

```
预计时间: 1小时
任务:
  [ ] 清理docs/目录下的临时文档
  [ ] 更新主README.md(如需)
  [ ] 为团队准备发布说明
  [ ] 记录可能的问题和解决方案
```

---

## ⏱️ 时间估计

| 阶段 | 任务 | 时间 |
|------|------|------|
| 1️⃣ 前端更新 | 4个文件 | 2.5-3小时 |
| 2️⃣ 测试执行 | 单元+集成+手动 | 3-4小时 |
| 3️⃣ 数据库部署 | 执行迁移+验证 | 0.5小时 |
| 4️⃣ 编译验证 | 构建和检查 | 0.5小时 |
| 5️⃣ 部署前检查 | 功能和性能 | 1小时 |
| 6️⃣ 文档 | 清理和说明 | 1小时 |
| **总计** | | **8-10小时** |

---

## 🚀 部署清单

```
部署前必须完成:
  [ ] 所有代码变更已完成
  [ ] 所有测试通过
  [ ] 没有编译错误
  [ ] 没有lint警告
  [ ] 代码已审查
  [ ] 备份已确认
  [ ] 回滚方案已测试

部署步骤:
  [ ] 第1步: 备份当前数据库
  [ ] 第2步: 执行数据库迁移
  [ ] 第3步: 验证迁移成功
  [ ] 第4步: 部署后端代码
  [ ] 第5步: 部署前端代码
  [ ] 第6步: 验证应用功能
  [ ] 第7步: 监控错误日志

部署后:
  [ ] 所有API端点正常
  [ ] 用户能正常操作
  [ ] 没有数据丢失
  [ ] 性能符合预期
```

---

## 🆘 问题排查

### 如果前端编译失败
```
解决步骤:
1. 清理node_modules: rm -rf node_modules && npm install
2. 检查类型错误: npm run type-check
3. 查看完整错误: npm run build 2>&1 | head -50
```

### 如果API返回404或错误
```
解决步骤:
1. 检查后端是否启动
2. 检查API参数是否正确 (marketId → countryId)
3. 查看后端日志是否有错误信息
```

### 如果数据库迁移失败
```
回滚步骤:
1. 停止应用
2. 执行恢复:
   psql -h localhost -U finapp_user -d finapp_test < \
   backups/backup_before_market_removal_20251108_133033.sql
3. 重启应用
```

---

## 📞 支持资源

| 资源 | 位置 |
|------|------|
| 后端实施总结 | docs/MARKET_REMOVAL_IMPLEMENTATION_SUMMARY.md |
| 前端更新指南 | docs/FRONTEND_UPDATE_GUIDE.md |
| 完成报告 | docs/IMPLEMENTATION_COMPLETION_REPORT.md |
| 架构分析 | docs/COUNTRY_FIRST_MODEL_ANALYSIS.md |

---

## ✅ 完成标志

所有工作完成时:
- ✅ 前端代码已更新
- ✅ 所有测试通过
- ✅ 数据库已迁移
- ✅ 应用已部署
- ✅ 功能已验证
- ✅ 文档已更新

**目标完成日期**: 2025-11-09

---

**创建日期**: 2025-11-08  
**优先级**: HIGH  
**所有者**: 开发团队
