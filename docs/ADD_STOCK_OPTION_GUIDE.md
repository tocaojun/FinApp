# 添加股票期权产品分类指南

## 概述
此指南说明如何添加"股票期权"产品分类到系统中。

## 前端已完成的更改 ✅
- ✅ ProductCategoryManager.tsx 已更新，支持在 UI 中选择 STOCK_OPTION 分类
- ✅ ProductManagement.tsx 已支持 STOCK_OPTION 的详情字段（StockOptionDetailsFields）
- ✅ 颜色映射已添加（lime 颜色标签）

## 需要执行的数据库操作

### 步骤 1: 备份数据库

```bash
# 创建备份
BACKUP_DIR="/Users/caojun/code/FinApp/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/finapp_test_backup_stock_option_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

pg_dump -h localhost -U finapp_user -d finapp_test > "$BACKUP_FILE"
gzip "$BACKUP_FILE"

echo "✅ 数据库备份完成: ${BACKUP_FILE}.gz"
```

### 步骤 2: 执行以下 SQL 命令添加分类

```sql
-- 在 psql 中执行以下命令
psql -h localhost -U finapp_user -d finapp_test

-- 然后运行：
BEGIN;

INSERT INTO finapp.asset_types (code, name, category, description, is_active)
VALUES (
  'STOCK_OPTION',
  '股票期权',
  'STOCK_OPTION',
  '股票期权合约，包括认购期权和认沽期权',
  true
)
ON CONFLICT (code) DO NOTHING;

-- 验证插入
SELECT id, code, name, category, description 
FROM finapp.asset_types 
WHERE code = 'STOCK_OPTION';

COMMIT;
```

或者，直接使用脚本文件：

```bash
psql -h localhost -U finapp_user -d finapp_test -f scripts/add-stock-option-type.sql
```

## 验证

执行完成后，应该看到输出：

```
 id | code | name | category | description
----+------+------+----------+----------
 ... | STOCK_OPTION | 股票期权 | STOCK_OPTION | 股票期权合约，包括认购期权和认沽期权
```

## 系统可用性检查

1. **在分类管理界面**：
   - 打开"产品管理系统" → "分类管理"
   - 点击"新增分类"
   - 在"分类类别"下拉菜单中应该可以看到 `股票期权 (STOCK_OPTION)`

2. **在产品创建/编辑页面**：
   - 新增或编辑产品时
   - 选择"产品类型"为"股票期权"
   - 应该看到股票期权特定的详情字段

## 详情字段支持

当选择产品类型为"股票期权"时，以下详情字段将可用：

- 标的股票代码 (underlying_stock_symbol)
- 标的股票名称 (underlying_stock_name)
- 期权类型 (option_type) - 看涨期权/看跌期权
- 行权价 (strike_price)
- 到期日期 (expiration_date)
- 合约乘数 (multiplier)
- 行权方式 (exercise_style)
- 结算方式 (settlement_type)
- 保证金要求 (margin_requirement)
- 隐含波动率 (implied_volatility)
- 历史波动率 (historical_volatility)
- 期权价值分解 (intrinsic_value, time_value)
- 希腊字母系数 (delta, gamma, theta, vega, rho)

## 数据库架构

相关表：
- `finapp.asset_types` - 资产类型表
- `finapp.stock_option_details` - 股票期权详情表
- `finapp.assets` - 资产表

## 相关文件

前端文件：
- `/frontend/src/components/admin/ProductCategoryManager.tsx` - 分类管理器 ✅ 已更新
- `/frontend/src/pages/admin/ProductManagement.tsx` - 产品管理页面 ✅ 已支持
- `/frontend/src/components/asset/details/StockOptionDetailsFields.tsx` - 股票期权详情字段组件 ✅ 已存在

后端文件：
- `/backend/src/services/AssetService.ts` - 资产服务（支持创建、更新、删除资产类型）
- `/backend/prisma/schema.prisma` - Prisma 数据模型

## 注意事项

1. ⚠️ 在执行 SQL 之前，必须对数据库进行完整备份
2. ⚠️ 确保没有其他进程在修改数据库
3. ✅ INSERT 命令使用 ON CONFLICT (code) DO NOTHING 来避免重复记录
4. ✅ 此操作不会影响现有的资产数据

## 回滚计划

如果需要回滚，可以使用备份文件恢复：

```bash
# 恢复备份
gunzip -c backups/finapp_test_backup_stock_option_YYYYMMDD_HHMMSS.sql.gz | psql -h localhost -U finapp_user -d finapp_test

# 或者删除添加的分类
DELETE FROM finapp.asset_types WHERE code = 'STOCK_OPTION';
```

---

**更新时间**: 2025-11-07  
**前端状态**: ✅ 完成  
**数据库状态**: ⏳ 待执行 SQL
