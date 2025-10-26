# FinApp v1.2.0 发布说明

**发布日期**: 2025-10-26  
**版本**: v1.2.0  
**提交**: afa1ed5

---

## 🎉 版本亮点

本次版本主要完善了投资组合和交易账户管理功能，修复了多个关键问题，提升了系统的稳定性和用户体验。

---

## ✨ 新功能

### 1. 交易账户完整CRUD操作

#### 创建交易账户
- ✅ 前后端完整联调
- ✅ 数据类型验证和转换
- ✅ 详细的错误处理
- ✅ 实时数据同步

**使用方法**:
1. 进入投资组合详情页
2. 点击"交易账户"标签
3. 点击"添加账户"按钮
4. 填写账户信息并保存

#### 删除交易账户
- ✅ 安全检查（检查关联持仓）
- ✅ 确认对话框
- ✅ 真实数据库删除
- ✅ 自动刷新列表

**安全特性**:
- 有活跃持仓的账户无法删除
- 需要用户二次确认
- 只能删除自己的账户

**使用方法**:
1. 在交易账户列表中找到要删除的账户
2. 点击右侧"更多"按钮（三个点）
3. 选择"删除"
4. 确认删除操作

### 2. 投资组合排序功能

- ✅ 拖拽排序界面
- ✅ 排序持久化存储
- ✅ 实时更新显示
- ✅ 数据库字段支持

**使用方法**:
1. 进入投资组合列表页
2. 拖动投资组合卡片调整顺序
3. 系统自动保存排序

### 3. 默认投资组合设置

- ✅ 支持设置默认投资组合
- ✅ 自动取消其他默认设置
- ✅ 视觉标识（星标）

**使用方法**:
1. 在投资组合列表中
2. 点击投资组合的星标图标
3. 系统自动设置为默认

---

## 🔧 改进

### 错误处理优化

**前端**:
- 详细的错误消息展示
- 友好的用户提示
- 完整的错误日志

**后端**:
- 详细的调试日志
- 错误堆栈追踪
- 分类错误消息

### 安全性增强

1. **交易账户删除安全检查**
   ```
   - 检查账户是否存在
   - 检查是否有关联持仓
   - 验证投资组合所有权
   ```

2. **权限控制**
   ```
   - accounts:create - 创建账户
   - accounts:read - 查看账户
   - accounts:update - 更新账户
   - accounts:delete - 删除账户
   ```

### 数据验证

- 前端数据类型转换（字符串 → 数字）
- 后端参数验证
- 数据库约束检查

---

## 🐛 修复的问题

### 1. 交易账户创建失败
**问题**: 创建账户时显示 "Failed to create trading account"

**原因**:
- 数据类型不匹配（balance 字段）
- 字段映射错误（broker vs broker_name）
- 缺少 portfolioId 字段

**解决方案**:
- 添加数据类型转换 `parseFloat()`
- 修正数据库字段映射
- 完善类型定义

### 2. 删除账户未生效
**问题**: 点击删除后界面显示成功，但数据库中仍存在

**原因**:
- 前端只更新本地状态
- 未调用后端API
- 后端缺少删除方法

**解决方案**:
- 实现完整的删除API
- 前端调用真实API
- 删除后刷新列表

### 3. 错误消息不详细
**问题**: 只显示 "HTTP error! status: 500"

**原因**:
- 前端未解析错误响应
- 后端错误消息未传递

**解决方案**:
- 改进前端错误处理
- 后端返回详细错误信息
- 添加调试日志

---

## 📊 技术细节

### 数据库变更

#### 新增字段
```sql
-- portfolios 表
ALTER TABLE finapp.portfolios 
  ADD COLUMN sort_order INTEGER DEFAULT 0,
  ADD COLUMN is_default BOOLEAN DEFAULT false;

-- 创建索引
CREATE INDEX idx_portfolios_sort_order ON finapp.portfolios(sort_order);
CREATE INDEX idx_portfolios_is_default ON finapp.portfolios(is_default);
```

### API 变更

#### 新增端点
```
DELETE /api/portfolios/:portfolioId/accounts/:accountId
- 删除交易账户
- 需要 accounts:delete 权限
```

#### 修改端点
```
POST /api/portfolios/accounts
- 优化数据验证
- 改进错误处理

PUT /api/portfolios/sort-order
- 批量更新排序
```

### 代码统计

```
修改文件: 11个
新增代码: 692行
删除代码: 64行
净增加: 628行
```

**主要修改文件**:
- `backend/src/controllers/PortfolioController.ts` (+112行)
- `backend/src/services/PortfolioService.ts` (+225行)
- `backend/src/routes/portfolios.ts` (+92行)
- `frontend/src/components/portfolio/AccountsTab.tsx` (+85行)
- `frontend/src/pages/portfolio/PortfolioList.tsx` (+156行)

---

## 🚀 升级指南

### 数据库迁移

```bash
# 运行迁移脚本
cd backend/migrations/003_portfolio_sorting
psql -U finapp_user -d finapp_test -f 001_add_sort_order.sql
```

### 后端更新

```bash
cd backend
npm install  # 如有新依赖
npm run dev  # 重启服务
```

### 前端更新

```bash
cd frontend
npm install  # 如有新依赖
npm run dev  # 重启服务
```

---

## 📝 使用示例

### 创建交易账户

```typescript
const accountData = {
  portfolioId: 'xxx-xxx-xxx',
  name: '招商证券账户',
  accountType: 'BROKERAGE',
  broker: '招商证券',
  accountNumber: '1234567890',
  currency: 'CNY',
  balance: 100000,
  availableBalance: 100000
};

await PortfolioService.createTradingAccount(accountData);
```

### 删除交易账户

```typescript
await PortfolioService.deleteTradingAccount(portfolioId, accountId);
```

### 更新投资组合排序

```typescript
const portfolioOrders = [
  { id: 'portfolio-1', sortOrder: 0 },
  { id: 'portfolio-2', sortOrder: 1 },
  { id: 'portfolio-3', sortOrder: 2 }
];

await PortfolioService.updatePortfolioSortOrder(portfolioOrders);
```

---

## ⚠️ 注意事项

1. **删除账户前的检查**
   - 确保账户没有活跃持仓
   - 删除操作不可恢复

2. **数据类型**
   - 余额字段必须是数字类型
   - 前端会自动转换字符串为数字

3. **权限要求**
   - 需要相应的权限才能执行操作
   - 只能操作自己的数据

---

## 🔗 相关链接

- [GitHub 仓库](https://github.com/tocaojun/FinApp)
- [完整更新日志](../CHANGELOG.md)
- [问题追踪](https://github.com/tocaojun/FinApp/issues)

---

## 👥 贡献者

感谢所有为本次版本做出贡献的开发者！

---

## 📞 反馈

如有问题或建议，请通过以下方式联系：
- 提交 [GitHub Issue](https://github.com/tocaojun/FinApp/issues)
- 发送邮件至项目维护者

---

**祝使用愉快！** 🎊
