# Prisma Studio 查看价格同步表完整指南

## ✅ 确认：模型已存在于 Schema 中

我已经确认，价格同步相关的模型**确实存在**于 `backend/prisma/schema.prisma` 中：

```prisma
✅ price_data_sources  (第 732 行)
✅ price_sync_errors   (第 758 行)
✅ price_sync_logs     (第 776 行)
✅ price_sync_tasks    (第 801 行)
```

## 🎯 为什么在 Prisma Studio 中可能看不到？

### 原因 1: 模型名称是小写下划线格式

Prisma Studio 中显示的模型名称是：
- `price_data_sources` （不是 PriceDataSources）
- `price_sync_tasks` （不是 PriceSyncTasks）
- `price_sync_logs` （不是 PriceSyncLogs）
- `price_sync_errors` （不是 PriceSyncErrors）

**请在 Prisma Studio 的左侧列表中向下滚动，查找这些小写下划线格式的名称！**

### 原因 2: 模型列表太长，需要滚动

Prisma Schema 中有 **37 个模型**，价格同步相关的模型在列表的**中后部**：

```
按字母顺序排列：
- asset_prices
- asset_types
- assets
- audit_logs
- ...
- portfolios
- position_snapshots
- positions
- price_data_sources    ← 在这里！
- price_sync_errors     ← 在这里！
- price_sync_logs       ← 在这里！
- price_sync_tasks      ← 在这里！
- report_executions
- ...
```

## 🚀 解决步骤

### 步骤 1: 确认 Prisma Studio 已重启

我已经为你重启了 Prisma Studio，现在应该在运行：

```bash
# 检查 Prisma Studio 是否运行
lsof -i :5555 | grep LISTEN
```

访问地址：**http://localhost:5555**

### 步骤 2: 在 Prisma Studio 中查找

1. 打开浏览器访问 `http://localhost:5555`
2. 在左侧模型列表中**向下滚动**
3. 查找以 `price_` 开头的模型：
   - `price_data_sources`
   - `price_sync_errors`
   - `price_sync_logs`
   - `price_sync_tasks`

### 步骤 3: 使用搜索功能（如果有）

某些版本的 Prisma Studio 支持搜索，尝试：
- 在模型列表中按 `Ctrl+F` 或 `Cmd+F`
- 搜索 "price"

## 📸 预期看到的内容

### price_data_sources 表

点击后应该看到 2 条记录：
- Yahoo Finance
- 东方财富（或其他数据源）

字段包括：
- id
- name
- provider
- api_endpoint
- rate_limit
- is_active
- last_sync_status
- ...

### price_sync_tasks 表

点击后应该看到 1 条记录：
- 任务名称
- schedule_type
- is_active
- last_run_status
- ...

### price_sync_logs 表

点击后应该看到 10 条记录：
- started_at
- completed_at
- status
- total_assets
- total_records
- success_count
- failed_count
- error_message
- ...

### price_sync_errors 表

可能是空的（0 条记录）

## 🔍 验证模型是否正确加载

### 方法 1: 检查 Prisma Client

```bash
cd /Users/caojun/code/FinApp/backend

# 查看生成的 Prisma Client 类型
cat node_modules/.prisma/client/index.d.ts | grep -A 5 "price_sync"
```

### 方法 2: 使用代码测试

创建测试文件 `test-prisma.ts`：

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 测试查询
  const dataSources = await prisma.price_data_sources.findMany();
  console.log('Data Sources:', dataSources);

  const tasks = await prisma.price_sync_tasks.findMany();
  console.log('Tasks:', tasks);

  const logs = await prisma.price_sync_logs.findMany({
    take: 5,
    orderBy: { started_at: 'desc' }
  });
  console.log('Recent Logs:', logs);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

运行测试：
```bash
cd backend
npx ts-node test-prisma.ts
```

## 🎨 Prisma Studio 截图指南

你应该看到类似这样的界面：

```
┌─────────────────────────────────────────────────┐
│ Prisma Studio                                   │
├──────────────┬──────────────────────────────────┤
│ Models       │ price_data_sources               │
│              │                                  │
│ Asset        │ ┌────────────────────────────┐  │
│ AssetPrice   │ │ id  │ name  │ provider    │  │
│ AssetType    │ ├────────────────────────────┤  │
│ ...          │ │ ... │ Yahoo │ yahoo_fin...│  │
│ Portfolio    │ │ ... │ 东方财富│ eastmoney  │  │
│ Position     │ └────────────────────────────┘  │
│ ▼ price_data_sources  ← 点击这里！             │
│ ▼ price_sync_errors                            │
│ ▼ price_sync_logs                              │
│ ▼ price_sync_tasks                             │
│ Report       │                                  │
│ ...          │                                  │
└──────────────┴──────────────────────────────────┘
```

## ❌ 如果仍然看不到

### 检查清单

1. **确认浏览器已刷新**
   ```
   按 Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac) 强制刷新
   ```

2. **确认 Prisma Studio 版本**
   ```bash
   npx prisma --version
   ```

3. **查看 Prisma Studio 日志**
   ```bash
   cat /tmp/prisma-studio.log
   ```

4. **检查数据库连接**
   ```bash
   cd backend
   npx prisma db execute --stdin <<< "SELECT tablename FROM pg_tables WHERE schemaname = 'finapp' AND tablename LIKE 'price%';"
   ```

5. **重新生成所有内容**
   ```bash
   cd backend
   rm -rf node_modules/.prisma
   npx prisma generate
   pkill -f "prisma studio"
   npx prisma studio
   ```

## 🔧 终极解决方案

如果以上都不行，使用命令行直接查询：

```bash
# 方法 1: 使用 psql
psql -d finapp_test -c "SELECT * FROM finapp.price_sync_logs ORDER BY started_at DESC LIMIT 10;"

# 方法 2: 使用检查脚本
./check-sync-tables.sh

# 方法 3: 使用 Prisma Client 在代码中查询
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.price_sync_logs.findMany({ take: 5, orderBy: { started_at: 'desc' } })
  .then(console.log)
  .finally(() => prisma.\$disconnect());
"
```

## 📊 当前状态确认

我已经确认：

```
✅ 数据库: finapp_test
✅ Schema: finapp
✅ 表存在: price_data_sources, price_sync_tasks, price_sync_logs, price_sync_errors
✅ Prisma Schema 包含这些模型
✅ Prisma Client 已生成
✅ Prisma Studio 正在运行 (端口 5555)
```

**下一步：**
1. 访问 http://localhost:5555
2. 在左侧列表中向下滚动
3. 查找 `price_data_sources`, `price_sync_logs`, `price_sync_tasks`, `price_sync_errors`

## 💡 提示

如果你在 Prisma Studio 的左侧看到很多模型，但找不到 price 相关的：

1. **使用浏览器搜索功能**
   - 按 `Ctrl+F` (Windows) 或 `Cmd+F` (Mac)
   - 搜索 "price"
   - 应该会高亮显示这些模型

2. **按字母顺序查找**
   - 模型是按字母顺序排列的
   - `price_` 开头的模型应该在 `p` 部分
   - 在 `portfolios` 和 `report` 之间

3. **检查是否有折叠的分组**
   - 某些版本的 Prisma Studio 可能会分组显示模型
   - 查找是否有 "Price" 或 "Sync" 分组

---

**如果你仍然看不到这些表，请告诉我：**
1. 你在 Prisma Studio 左侧看到了哪些模型？（列出前 10 个）
2. 是否有搜索框或过滤功能？
3. Prisma Studio 的版本号是多少？

我会根据你的反馈提供更具体的帮助！

---

**创建时间**: 2025-10-27  
**问题**: 按照方案 3 执行后仍看不到价格同步相关的表  
**关键点**: 模型名称是小写下划线格式，需要在列表中向下滚动查找  
**访问地址**: http://localhost:5555
