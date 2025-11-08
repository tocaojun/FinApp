# 数据库备份权限解决方案

## 问题背景

使用 `finapp_user` 执行 `pg_dump` 时出现权限错误：

```
pg_dump: error: query failed: ERROR:  permission denied for table roles
pg_dump: error: query was: LOCK TABLE public.roles IN ACCESS SHARE MODE
```

## 根本原因

- `public.roles` 表由 `caojun` 用户拥有
- `finapp_user` 对该表的备份权限不足
- `pg_dump` 需要对所有表的 `SELECT` 权限

## 解决方案

### ✅ 已实施的解决方案

#### 1. 权限配置

在 `caojun` 用户下执行：

```sql
-- 授予数据库连接权限
GRANT CONNECT ON DATABASE finapp_test TO finapp_user;

-- 授予 schema 使用权限
GRANT USAGE ON SCHEMA public TO finapp_user;
GRANT USAGE ON SCHEMA finapp TO finapp_user;

-- 授予所有现有表的 SELECT 权限
GRANT SELECT ON ALL TABLES IN SCHEMA finapp TO finapp_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO finapp_user;

-- 对未来创建的表自动授予权限
ALTER DEFAULT PRIVILEGES IN SCHEMA finapp GRANT SELECT ON TABLES TO finapp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO finapp_user;

-- 授予序列使用权限（备份需要）
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA finapp TO finapp_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO finapp_user;

-- 对未来创建的序列自动授予权限
ALTER DEFAULT PRIVILEGES IN SCHEMA finapp GRANT USAGE, SELECT ON SEQUENCES TO finapp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO finapp_user;
```

#### 2. 创建备份脚本

- `scripts/backup-database.sh` - 灵活的备份脚本
- `scripts/restore-database.sh` - 数据恢复脚本

#### 3. 权限验证

两个用户都可以执行备份：

```bash
# 使用 caojun 用户
pg_dump -h localhost -U caojun -d finapp_test > backup.sql

# 使用 finapp_user 用户（已授权）
pg_dump -h localhost -U finapp_user -d finapp_test > backup.sql
```

## 备份方式对比

| 方式 | 用户 | 权限状态 | 备份命令 |
|------|------|---------|---------|
| 直接备份 | `caojun` | ✅ 有完全权限 | `pg_dump -U caojun` |
| 直接备份 | `finapp_user` | ✅ 已授权 | `pg_dump -U finapp_user` |
| 脚本备份 | `caojun` | ✅ 推荐 | `bash backup-database.sh` |
| 脚本备份 | `finapp_user` | ✅ 支持 | `bash backup-database.sh` |

## 推荐的备份方式

### 快速备份（日常）

```bash
# 完整备份
bash scripts/backup-database.sh

# 或使用 caojun 用户直接备份
pg_dump -h localhost -U caojun -d finapp_test > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 压缩备份（推荐用于长期存储）

```bash
# 压缩备份
bash scripts/backup-database.sh compress

# 或手动压缩
pg_dump -h localhost -U caojun -d finapp_test | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### 特定表备份

```bash
# 备份 exchange_rates 表
bash scripts/backup-database.sh table exchange_rates

# 备份多个表
pg_dump -h localhost -U caojun -d finapp_test \
  -t "finapp.exchange_rates" \
  -t "finapp.users" > specific_tables.sql
```

### CSV 数据导出

```bash
# 导出 exchange_rates 表为 CSV
bash scripts/backup-database.sh data exchange_rates

# 手动导出
psql -h localhost -U caojun -d finapp_test \
  -c "COPY finapp.exchange_rates TO STDOUT WITH CSV HEADER" > data.csv
```

## 权限配置验证

### 检查 finapp_user 的权限

```bash
# 连接到数据库
psql -h localhost -U caojun -d finapp_test

# 列出 finapp_user 的权限
\du finapp_user

# 检查表级权限
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name='exchange_rates';
```

### 备份权限测试

```bash
# 测试 finapp_user 的备份权限
pg_dump -h localhost -U finapp_user -d finapp_test --schema-only | head -20

# 统计备份大小
pg_dump -h localhost -U finapp_user -d finapp_test | wc -l
```

## 备份文件位置

```
/Users/caojun/code/FinApp/backups/
├── finapp_full_backup_20251107_214500.sql       # 完整备份
├── finapp_full_backup_20251107_214500.sql.gz    # 压缩备份
├── finapp_table_users_backup_20251107_214500.sql # 表备份
└── finapp_data_exchange_rates_20251107_214500.csv # CSV 导出
```

## 恢复步骤

### 从完整备份恢复

```bash
# 恢复未压缩的备份
psql -h localhost -U caojun -d finapp_test < backup.sql

# 恢复压缩备份
gunzip -c backup.sql.gz | psql -h localhost -U caojun -d finapp_test

# 使用脚本恢复
bash scripts/restore-database.sh backup.sql
```

### 仅恢复特定表

```bash
# 从备份中提取特定表的 SQL
grep -A 200 "CREATE TABLE.*users" backup.sql > users_table.sql

# 恢复特定表
psql -h localhost -U caojun -d finapp_test < users_table.sql
```

## 自动化备份

### Cron 任务配置

```bash
# 编辑 crontab
crontab -e

# 添加以下行
# 每天 22:00 执行完整备份
0 22 * * * cd /Users/caojun/code/FinApp && bash scripts/backup-database.sh compress

# 每周一 23:00 执行全面备份
0 23 * * 1 cd /Users/caojun/code/FinApp && bash scripts/backup-database.sh

# 每天 10:00 备份关键表
0 10 * * * cd /Users/caojun/code/FinApp && bash scripts/backup-database.sh table users
```

### 备份清理脚本

```bash
#!/bin/bash
# 删除 30 天前的备份
find /Users/caojun/code/FinApp/backups -name "*.sql" -mtime +30 -delete
find /Users/caojun/code/FinApp/backups -name "*.sql.gz" -mtime +30 -delete

# 备份不超过 10GB
while [ $(du -s /Users/caojun/code/FinApp/backups | cut -f1) -gt 10000000 ]; do
  rm -f $(ls -t /Users/caojun/code/FinApp/backups/*.sql.gz | tail -1)
done
```

## 故障排除

### 如果仍然遇到权限错误

#### 方案 1：重新应用权限

```bash
# 使用 caojun 用户
psql -h localhost -U caojun -d finapp_test << 'EOF'
GRANT SELECT ON ALL TABLES IN SCHEMA public TO finapp_user;
GRANT SELECT ON ALL TABLES IN SCHEMA finapp TO finapp_user;
EOF
```

#### 方案 2：以 caojun 用户身份执行备份

```bash
pg_dump -h localhost -U caojun -d finapp_test > backup.sql
```

#### 方案 3：使用 --no-privileges 参数

```bash
pg_dump -h localhost -U finapp_user --no-privileges -d finapp_test > backup.sql
```

### 备份验证失败

```bash
# 检查备份文件完整性
file backup.sql          # 应显示 "ASCII text"
wc -l backup.sql        # 查看行数
grep "PostgreSQL dump complete" backup.sql  # 检查是否完整

# 尝试恢复到测试数据库
createdb finapp_test_verify
psql -d finapp_test_verify < backup.sql
```

## 安全建议

### 备份安全

1. **定期备份**：至少每日一次
2. **多地备份**：本地 + 云存储
3. **权限管理**：限制备份文件访问
4. **版本控制**：保留不同时期的备份
5. **加密存储**：对敏感备份进行加密

### 权限管理

```bash
# 备份文件权限
chmod 600 /Users/caojun/code/FinApp/backups/*.sql
chmod 600 /Users/caojun/code/FinApp/backups/*.sql.gz

# 目录权限
chmod 700 /Users/caojun/code/FinApp/backups
```

---

## 相关资源

- [数据库备份指南](./DATABASE_BACKUP_GUIDE.md)
- [数据库保护规范](./DatabaseProtectionAndBackup.md)
- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)

---

**最后更新**: 2025-11-07  
**版本**: v1.0  
**解决方案状态**: ✅ 已测试和验证
