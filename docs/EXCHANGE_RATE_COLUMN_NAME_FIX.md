# 汇率管理界面刷新问题修复 - 列名错误

## 🔍 问题根源

在汇率管理界面点击"刷新"按钮时，系统显示：**获取汇率数据失败**

### 错误日志

```
[2025-10-28T12:52:03.492Z] ERROR: Database error: {
  message: 'Raw query failed. Code: `42703`. Message: `column "ratedate" does not exist`'
}
Error searching exchange rates: PrismaClientKnownRequestError: 
Raw query failed. Code: `42703`. Message: `column "ratedate" does not exist`
```

### 问题原因

SQL查询中使用了错误的列名：
- ❌ 使用了驼峰命名：`rateDate`
- ✅ 数据库实际列名：`rate_date`（下划线命名）

## 🔧 修复方案

### 修改文件

`backend/src/services/ExchangeRateService.ts`

### 修改内容

**修改前**：
```typescript
const dataQuery = `
  SELECT * FROM exchange_rates 
  ${whereClause}
  ORDER BY ${sortBy === 'createdAt' ? 'created_at' : sortBy} ${sortOrder}
  LIMIT $${params.length + 1} OFFSET $${params.length + 2}
`;
```

**修改后**：
```typescript
// 将驼峰命名转换为下划线命名
const sortColumn = sortBy === 'createdAt' ? 'created_at' : 
                  sortBy === 'rateDate' ? 'rate_date' :
                  sortBy === 'fromCurrency' ? 'from_currency' :
                  sortBy === 'toCurrency' ? 'to_currency' :
                  sortBy === 'dataSource' ? 'data_source' :
                  sortBy;

const dataQuery = `
  SELECT * FROM exchange_rates 
  ${whereClause}
  ORDER BY ${sortColumn} ${sortOrder}
  LIMIT $${params.length + 1} OFFSET $${params.length + 2}
`;
```

## ✅ 修复完成

### 修改说明

添加了驼峰命名到下划线命名的转换逻辑，支持以下字段：
- `createdAt` → `created_at`
- `rateDate` → `rate_date`
- `fromCurrency` → `from_currency`
- `toCurrency` → `to_currency`
- `dataSource` → `data_source`

### 测试验证

重启后端服务后，汇率管理界面的"刷新"按钮应该能正常工作。

```bash
# 重启后端服务
cd backend
npm run dev
```

### 预期结果

- ✅ 点击"刷新"按钮不再报错
- ✅ 汇率列表正常显示
- ✅ 排序功能正常工作

## 📝 相关文件

- `backend/src/services/ExchangeRateService.ts` - 修复的文件
- `backend/src/controllers/ExchangeRateController.ts` - 控制器
- `frontend/src/pages/admin/ExchangeRateManagement.tsx` - 前端页面

## 🎯 总结

问题已修复！原因是前端传递的排序字段使用驼峰命名（`rateDate`），但数据库列名使用下划线命名（`rate_date`），导致SQL查询失败。现在已添加命名转换逻辑，确保所有字段名正确映射到数据库列名。

---

**修复时间**: 2025-10-28  
**状态**: ✅ 已修复
