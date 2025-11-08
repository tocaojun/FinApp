# 数据库字段类型修复报告

## 🐛 新发现的问题

在执行同步任务时，发现了两个数据库字段相关的错误：

### 错误1: JSONB类型转换错误

```
ERROR: column "last_run_result" is of type jsonb but expression is of type text
HINT: You will need to rewrite or cast the expression.
```

**原因**: 
- `price_sync_tasks.last_run_result` 字段是 JSONB 类型
- 代码使用 `$queryRaw` 传入 `JSON.stringify(result)` 时没有显式转换为 JSONB

### 错误2: 字段不存在

```
ERROR: column "duration_seconds" of relation "price_sync_logs" does not exist
```

**原因**:
- 代码尝试更新 `price_sync_logs.duration_seconds` 字段
- 但该表中**没有**这个字段

## 🔍 数据库表结构分析

### price_sync_tasks 表

```sql
Column           | Type                        
-----------------+-----------------------------
id               | uuid                        
name             | character varying(255)      
description      | text                        
data_source_id   | uuid                        
asset_type_id    | uuid                        
market_id        | uuid                        
asset_ids        | uuid[]                      
schedule_type    | character varying(20)       
cron_expression  | character varying(100)      
interval_minutes | integer                     
sync_days_back   | integer                     
overwrite_existing | boolean                   
is_active        | boolean                     
last_run_at      | timestamp without time zone 
last_run_status  | character varying(20)       
last_run_result  | jsonb                       ✅ JSONB类型
created_at       | timestamp without time zone 
updated_at       | timestamp without time zone 
```

### price_sync_logs 表

```sql
Column         | Type                        
---------------+-----------------------------
id             | uuid                        
task_id        | uuid                        
data_source_id | uuid                        
started_at     | timestamp without time zone 
completed_at   | timestamp without time zone 
status         | character varying(20)       
total_assets   | integer                     
total_records  | integer                     
success_count  | integer                     
failed_count   | integer                     
skipped_count  | integer                     
result_summary | jsonb                       ✅ 字段名是 result_summary
error_message  | text                        
                                             ❌ 没有 duration_seconds 字段
                                             ❌ 没有 sync_result 字段
```

## ✅ 修复内容

### 修复1: 使用 $queryRawUnsafe 并显式转换 JSONB

**修改前**:
```typescript
await this.db.prisma.$queryRaw`
  UPDATE finapp.price_sync_tasks 
  SET last_run_status = ${status},
      last_run_result = ${JSON.stringify(result)}  // ❌ 类型不匹配
  WHERE id = ${taskId}::uuid
`;
```

**修改后**:
```typescript
await this.db.prisma.$queryRawUnsafe(`
  UPDATE finapp.price_sync_tasks 
  SET last_run_status = $1,
      last_run_result = $2::jsonb  // ✅ 显式转换为 JSONB
  WHERE id = $3::uuid
`, status, JSON.stringify(result), taskId);
```

### 修复2: 移除不存在的字段，使用正确的字段名

**修改前**:
```typescript
await this.db.prisma.$queryRaw`
  UPDATE finapp.price_sync_logs 
  SET completed_at = CURRENT_TIMESTAMP,
      status = ${status},
      total_assets = ${result.total_assets},
      total_records = ${result.total_records},
      success_count = ${result.success_count},
      failed_count = ${result.failed_count},
      skipped_count = ${result.skipped_count},
      duration_seconds = ${result.duration_seconds},  // ❌ 字段不存在
      sync_result = ${JSON.stringify(result)}         // ❌ 字段不存在
  WHERE id = ${logId}::uuid
`;
```

**修改后**:
```typescript
await this.db.prisma.$queryRawUnsafe(`
  UPDATE finapp.price_sync_logs 
  SET completed_at = CURRENT_TIMESTAMP,
      status = $1,
      total_assets = $2,
      total_records = $3,
      success_count = $4,
      failed_count = $5,
      skipped_count = $6,
      result_summary = $7::jsonb  // ✅ 使用正确的字段名
  WHERE id = $8::uuid
`, status, result.total_assets, result.total_records, 
   result.success_count, result.failed_count, result.skipped_count,
   JSON.stringify(result), logId);
```

### 修复3: 修复错误处理中的字段问题

**修改前**:
```typescript
await this.db.prisma.$queryRaw`
  UPDATE finapp.price_sync_logs 
  SET completed_at = CURRENT_TIMESTAMP,
      status = 'failed',
      error_message = ${error instanceof Error ? error.message : 'Unknown error'},
      duration_seconds = ${result.duration_seconds}  // ❌ 字段不存在
  WHERE id = ${logId}::uuid
`;
```

**修改后**:
```typescript
await this.db.prisma.$queryRawUnsafe(`
  UPDATE finapp.price_sync_logs 
  SET completed_at = CURRENT_TIMESTAMP,
      status = 'failed',
      error_message = $1  // ✅ 只更新存在的字段
  WHERE id = $2::uuid
`, error instanceof Error ? error.message : 'Unknown error', logId);
```

## 📊 修复对比表

| 问题 | 修改前 | 修改后 | 状态 |
|------|--------|--------|------|
| JSONB类型转换 | `${JSON.stringify(result)}` | `$2::jsonb` | ✅ 已修复 |
| duration_seconds字段 | 尝试更新 | 移除 | ✅ 已修复 |
| sync_result字段 | 使用错误字段名 | 改为 `result_summary` | ✅ 已修复 |
| 参数化查询 | 使用 `$queryRaw` | 改为 `$queryRawUnsafe` | ✅ 已修复 |

## 🧪 验证步骤

### 1. 检查后端服务

```bash
curl http://localhost:8000/health
# 应返回: {"status":"healthy",...}
```

### 2. 执行同步任务

1. 访问 http://localhost:3001
2. 登录系统（testapi@finapp.com / testapi123）
3. 进入 价格管理中心 → API自动同步
4. 点击 ▶️ 执行任务
5. 观察后端日志

### 3. 查看后端日志

```bash
tail -f /tmp/finapp-backend.log | grep PriceSync
```

**预期输出**（无错误）:
```
[PriceSync] Starting sync task: xxx
[PriceSync] Task found: 每日股票价格同步
[PriceSync] Data source: Yahoo Finance (yahoo_finance)
[PriceSync] Found 5 assets to sync
[PriceSync] Processing asset: 00700 (腾讯控股)
[PriceSync] Fetched 1 price records for 00700
[PriceSync] Sync completed with status: success
[PriceSync] Results: 5 assets, 5 records, 5 success, 0 failed
```

**不应该看到的错误**:
- ❌ `column "last_run_result" is of type jsonb but expression is of type text`
- ❌ `column "duration_seconds" of relation "price_sync_logs" does not exist`
- ❌ `column "sync_result" does not exist`

### 4. 验证数据保存

```sql
-- 检查任务状态更新
SELECT 
  id,
  name,
  last_run_status,
  last_run_result
FROM finapp.price_sync_tasks
WHERE id = '3ed34abc-8751-42fc-bafc-ec196a8324ee';

-- 检查同步日志
SELECT 
  id,
  status,
  total_assets,
  total_records,
  success_count,
  failed_count,
  result_summary
FROM finapp.price_sync_logs
ORDER BY started_at DESC
LIMIT 5;

-- 检查价格数据
SELECT 
  a.symbol,
  a.name,
  ap.price_date,
  ap.close_price,
  ap.source
FROM finapp.assets a
JOIN finapp.asset_prices ap ON a.id = ap.asset_id
WHERE ap.source = 'api'
  AND ap.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY ap.created_at DESC
LIMIT 10;
```

## 📝 技术说明

### 为什么使用 $queryRawUnsafe

1. **JSONB类型转换**: `$queryRaw` 模板字符串无法正确处理 JSONB 类型转换
2. **参数化查询**: `$queryRawUnsafe` 允许使用 `$1, $2, ...` 占位符
3. **类型安全**: 可以显式指定 `::jsonb` 进行类型转换

### duration_seconds 字段的处理

虽然数据库表中没有 `duration_seconds` 字段，但我们在内存中的 `result` 对象中保留了这个字段：

```typescript
interface SyncResult {
  success: boolean;
  total_assets: number;
  total_records: number;
  success_count: number;
  failed_count: number;
  skipped_count: number;
  errors: any[];
  duration_seconds: number;  // ✅ 保留在内存中
}
```

这个值会被包含在 `result_summary` JSONB 字段中：

```json
{
  "success": true,
  "total_assets": 5,
  "total_records": 5,
  "success_count": 5,
  "failed_count": 0,
  "skipped_count": 0,
  "duration_seconds": 3,  // ✅ 存储在 JSONB 中
  "errors": []
}
```

## 🎯 预期结果

修复后，同步任务应该能够：

1. ✅ 成功执行不报错
2. ✅ 正确更新 `price_sync_tasks.last_run_result` (JSONB)
3. ✅ 正确更新 `price_sync_logs.result_summary` (JSONB)
4. ✅ 不再尝试更新不存在的字段
5. ✅ 成功保存价格数据到数据库

## 🔄 相关修复

本次修复是价格同步系统的第三轮修复：

1. **第一轮**: 修复前端API路径错误（下拉框为空）
2. **第二轮**: 修复错误日志表字段不匹配
3. **第三轮**: 修复数据库字段类型和字段名错误 ✅ 当前

## 📚 相关文档

- `PRICE_SYNC_FIX_REPORT.md` - API路径修复
- `SYNC_ERROR_FIX_REPORT.md` - 错误日志修复
- `FINAL_SYNC_FIX_SUMMARY.md` - 完整修复总结
- `DATABASE_FIELD_FIX_REPORT.md` - 本文档

---

**修复时间**: 2025-10-27  
**修复人员**: AI Assistant  
**影响范围**: 后端价格同步服务  
**风险等级**: 低（仅修复字段映射）  
**测试状态**: ✅ 后端已重启，待用户验证
