# 交易标签系统重构文档

## 概述

重构交易标签系统，移除 `transaction_tags` 表，统一使用 `tags` 表管理所有标签。

## 变更内容

### 1. 数据库结构变更

#### 删除的表
- `transaction_tags` - 交易专用标签表（已删除）

#### 修改的表
- `transaction_tag_mappings` - 交易标签映射表
  - **变更前**: `tag_id` 字段类型为 `uuid`，引用 `transaction_tags.id`
  - **变更后**: `tag_id` 字段类型为 `integer`，引用 `tags.id`
  - **新增**: `created_at` 字段
  - **新增**: 唯一索引确保每个交易在每个分类中只能选一个标签

#### 新增的约束
- 每个交易可以在每个分类（`tag_categories`）中选择一个标签
- 通过函数 `finapp.get_tag_category_id()` 和唯一索引实现

### 2. 标签系统架构

```
tag_categories (标签分类)
    ↓
tags (标签)
    ↓
transaction_tag_mappings (交易标签映射)
    ↓
transactions (交易)
```

**规则**:
- 每个标签属于一个分类（`tags.category_id`）
- 每个交易可以有多个标签
- 但在同一个分类中，每个交易只能选择一个标签

### 3. 代码变更

#### 后端服务 (`TransactionService.ts`)

**查询标签** - 从 `transaction_tags` 改为 `tags`:
```typescript
// 变更前
SELECT tt.name
FROM finapp.transaction_tag_mappings ttm
JOIN finapp.transaction_tags tt ON ttm.tag_id = tt.id
WHERE ttm.transaction_id = $1::uuid

// 变更后
SELECT t.name
FROM finapp.transaction_tag_mappings ttm
JOIN finapp.tags t ON ttm.tag_id = t.id
WHERE ttm.transaction_id = $1::uuid
```

**添加标签** - 简化逻辑，不再创建 `transaction_tags`:
```typescript
// 变更前：需要在 transaction_tags 中创建或查找标签
1. 从 tags 表查找标签
2. 在 transaction_tags 表中创建或查找对应标签
3. 插入映射关系

// 变更后：直接使用 tags 表
1. 从 tags 表查找标签
2. 插入映射关系（tag_id 为 integer）
```

#### Prisma Schema

**删除**:
```prisma
model transaction_tags {
  // ... 已删除
}
```

**修改**:
```prisma
model transaction_tag_mappings {
  transaction_id String      @db.Uuid
  tag_id         Int         // 从 String (uuid) 改为 Int
  created_at     DateTime?   @default(now()) @db.Timestamp(6)
  tags           tags        @relation(...)  // 从 transaction_tags 改为 tags
  transactions   Transaction @relation(...)
  
  @@id([transaction_id, tag_id])
  @@index([transaction_id])
  @@index([tag_id])
}
```

**更新 tags 模型**:
```prisma
model tags {
  // ... 其他字段
  transaction_tag_mappings transaction_tag_mappings[]  // 新增反向关系
}
```

### 4. 迁移脚本

位置: `/Users/caojun/code/FinApp/backend/migrations/remove_transaction_tags_table.sql`

执行内容:
1. 删除旧的 `transaction_tag_mappings` 表
2. 删除 `transaction_tags` 表
3. 创建新的 `transaction_tag_mappings` 表（tag_id 为 integer）
4. 创建辅助函数 `finapp.get_tag_category_id()`
5. 创建唯一索引确保每个交易在每个分类中只能选一个标签
6. 创建性能索引

## 测试步骤

### 1. 验证数据库结构
```sql
-- 检查 transaction_tag_mappings 表结构
\d finapp.transaction_tag_mappings

-- 应该看到 tag_id 类型为 integer
```

### 2. 测试标签功能
1. 编辑一条交易记录
2. 选择多个标签（来自不同分类）
3. 保存
4. 重新打开编辑，验证所有标签都正确显示

### 3. 测试分类约束
1. 在同一个分类中选择标签 A
2. 保存
3. 再次编辑，在同一分类中改选标签 B
4. 保存
5. 验证只保存了标签 B（替换了标签 A）

### 4. 查看日志
```bash
# 查看后端日志中的标签操作
tail -f /tmp/backend.log | grep "🏷️"
```

## 优势

1. **简化架构**: 只使用一个标签表，减少数据冗余
2. **统一管理**: 所有标签（组合、交易等）都在 `tags` 表中
3. **灵活分类**: 通过 `tag_categories` 实现标签分类
4. **约束清晰**: 每个交易在每个分类中只能选一个标签
5. **性能优化**: 减少了表关联，查询更快

## 注意事项

1. **数据迁移**: 如果生产环境有数据，需要先迁移 `transaction_tags` 的数据到 `tags` 表
2. **前端兼容**: 前端代码无需修改，因为接口返回的仍然是标签名称数组
3. **Prisma Studio**: 重启 Prisma Studio 以查看新的表结构

## 相关文件

- 迁移脚本: `backend/migrations/remove_transaction_tags_table.sql`
- 后端服务: `backend/src/services/TransactionService.ts`
- Prisma Schema: `backend/prisma/schema.prisma`
- 备份文件: `backend/prisma/schema.prisma.backup`

## 完成时间

2025-10-29
