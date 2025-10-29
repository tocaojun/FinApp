# 股票期权更新功能修复

## 问题描述
更新股票期权产品时显示"更新产品失败"。

## 问题原因
在 `AssetDetailsService.ts` 的 `updateStockOptionDetails` 方法中，更新 `expiration_date` 字段时缺少类型转换。

PostgreSQL 错误：
```
ERROR: column "expiration_date" is of type date but expression is of type text
HINT: You will need to rewrite or cast the expression.
```

## 修复内容

### 文件：`backend/src/services/AssetDetailsService.ts`

**修改位置**：第871行

**修改前**：
```typescript
if (details.expirationDate !== undefined) {
  updates.push(`expiration_date = $${paramIndex}`);
  values.push(details.expirationDate);
  paramIndex++;
}
```

**修改后**：
```typescript
if (details.expirationDate !== undefined) {
  updates.push(`expiration_date = $${paramIndex}::date`);
  values.push(details.expirationDate);
  paramIndex++;
}
```

## 测试步骤

1. **重启后端服务**（已完成）
   ```bash
   cd /Users/caojun/code/FinApp/backend
   npm run build
   npm start
   ```

2. **在浏览器中测试**
   - 访问 http://localhost:3001
   - 登录系统
   - 进入"产品管理"页面
   - 找到一个股票期权产品，点击"编辑"
   - 修改任意字段（如名称、行权价等）
   - 点击"保存"
   - 应该显示"更新成功"

3. **验证要点**
   - ✅ 能够成功保存修改
   - ✅ 到期日期字段正常更新
   - ✅ 其他股票期权特有字段（行权价、合约规模等）正常更新
   - ✅ 后端日志无错误

## 服务状态

### 后端服务 ✅
- 端口：8000
- 进程ID：78884
- 状态：healthy
- 已应用修复代码

### 前端服务 ✅
- 端口：3001
- 进程ID：79480
- 状态：正常运行

## 相关文件
- `/Users/caojun/code/FinApp/backend/src/services/AssetDetailsService.ts` - 修复的文件
- `/Users/caojun/code/FinApp/backend/dist/services/AssetDetailsService.js` - 编译后的文件

## 注意事项
- 创建股票期权时已经有正确的类型转换（`::date`），此次只修复了更新操作
- 该修复确保了 PostgreSQL 能够正确识别日期类型参数
- 如果遇到其他日期字段的类似问题，也需要添加 `::date` 类型转换

## 完成时间
2025-10-29 15:44
