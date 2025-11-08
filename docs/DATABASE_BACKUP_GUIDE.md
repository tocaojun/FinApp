# FinApp 数据库备份和恢复指南

## 快速开始

### 备份数据库

```bash
# 完整备份
bash scripts/backup-database.sh

# 压缩备份（推荐）
bash scripts/backup-database.sh compress

# 备份特定表
bash scripts/backup-database.sh table exchange_rates

# 导出表数据为 CSV
bash scripts/backup-database.sh data users

# 查看所有备份
bash scripts/backup-database.sh list
```

### 恢复数据库

```bash
# 恢复备份
bash scripts/restore-database.sh /path/to/backup.sql

# 恢复压缩备份
bash scripts/restore-database.sh /path/to/backup.sql.gz
```

---

## 问题解决

### 问题：权限错误 - "permission denied for table roles"

**原因**：`finapp_user` 对 `public.roles` 表没有足够的备份权限。

**解决方案**：

#### 方案 1：使用 caojun 用户备份（推荐）

```bash
pg_dump -h localhost -U caojun -d finapp_test > backup.sql
```

#### 方案 2：授予 finapp_user 备份权限

```sql
-- 使用 caojun 用户执行以下命令
GRANT CONNECT ON DATABASE finapp_test TO finapp_user;
GRANT USAGE ON SCHEMA public TO finapp_user;
GRANT USAGE ON SCHEMA finapp TO finapp_user;

-- 授予所有表的 SELECT 权限
GRANT SELECT ON ALL TABLES IN SCHEMA finapp TO finapp_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO finapp_user;

-- 对未来创建的表自动授予权限
ALTER DEFAULT PRIVILEGES IN SCHEMA finapp GRANT SELECT ON TABLES TO finapp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO finapp_user;

-- 授予序列权限
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA finapp TO finapp_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO finapp_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA finapp GRANT USAGE, SELECT ON SEQUENCES TO finapp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO finapp_user;
```

### 问题：命令找不到

确保脚本有执行权限：

```bash
chmod +x scripts/backup-database.sh
chmod +x scripts/restore-database.sh
```

---

## 备份脚本详解

### backup-database.sh

完整的数据库备份脚本，支持多种备份模式。

#### 支持的备份类型

| 类型 | 命令 | 说明 | 用途 |
|------|------|------|------|
| full | `backup-database.sh` | 完整数据库备份 | 日常备份 |
| compress | `backup-database.sh compress` | 压缩备份 | 节省存储空间 |
| table | `backup-database.sh table [表名]` | 备份特定表 | 备份关键表 |
| data | `backup-database.sh data [表名]` | 导出表数据为 CSV | 数据验证、分析 |
| list | `backup-database.sh list` | 列出所有备份 | 管理备份 |

#### 环境变量

```bash
# 默认使用 caojun 用户
DB_USER=caojun bash scripts/backup-database.sh

# 使用 finapp_user 用户
DB_USER=finapp_user bash scripts/backup-database.sh

# 指定备份目录
BACKUP_BASE_DIR=/custom/path bash scripts/backup-database.sh
```

### restore-database.sh

用于从备份恢复数据库的脚本。

#### 恢复步骤

1. **选择备份文件**
   ```bash
   bash scripts/restore-database.sh /path/to/backup.sql
   ```

2. **脚本会验证备份文件并提示确认**
   ```
   ✅ 找到备份文件
   📁 文件: /path/to/backup.sql
   📊 大小: 187K
   📅 时间: 2025-11-07 21:45:00
   
   ⚠️  警告：这将覆盖 finapp_test 数据库中的所有数据！
   确定要继续恢复吗？请输入 'yes' 确认:
   ```

3. **输入 'yes' 开始恢复**
   ```
   ✅ 数据库恢复成功！
   ⏰ 恢复完成: 2025-11-07 21:47:00
   ```

4. **验证恢复结果**
   ```
   📊 数据库表数: 33
   👥 用户数: 5
   ```

---

## 最佳实践

### 备份计划

| 频率 | 方式 | 时机 |
|------|------|------|
| 每日 | 完整备份 | 工作日下班前 |
| 每周 | 压缩备份 | 每周五 16:00 |
| 修改前 | 完整 + 表备份 | 任何 DDL 操作前 |
| 删除前 | 完整 + CSV 导出 | 任何 DML 删除操作前 |

### 备份命名规范

```
finapp_[type]_backup_[YYYYMMDD_HHMMSS].[ext]

示例：
finapp_full_backup_20251107_214500.sql
finapp_compressed_backup_20251107_214500.sql.gz
finapp_table_users_backup_20251107_214500.sql
finapp_data_exchange_rates_20251107_214500.csv
```

### 备份验证

备份完成后进行验证：

```bash
# 1. 检查备份文件大小
du -h /Users/caojun/code/FinApp/backups/backup*.sql*

# 2. 查看备份内容摘要
head -50 backup.sql
tail -10 backup.sql

# 3. 计算备份中的表数量
grep "CREATE TABLE" backup.sql | wc -l

# 4. 在测试环境中恢复验证
createdb finapp_test_verify
psql -d finapp_test_verify < backup.sql
```

### 备份存储

```bash
# 本地备份目录
/Users/caojun/code/FinApp/backups/

# 推荐：定期压缩并上传到云存储
gzip -9 backup.sql                    # 最大压缩
# 上传到 S3、阿里云 OSS 等
```

---

## 故障恢复流程

### 步骤 1：评估问题

```bash
# 检查数据库状态
psql -h localhost -U caojun -d finapp_test -c "SELECT COUNT(*) FROM finapp.users;"

# 查看最近的备份
bash scripts/backup-database.sh list
```

### 步骤 2：选择合适的备份

- 找到问题发生之前的最近备份
- 检查备份文件的时间和大小

### 步骤 3：执行恢复

```bash
# 恢复最新备份
bash scripts/restore-database.sh /Users/caojun/code/FinApp/backups/finapp_full_backup_20251107_214500.sql
```

### 步骤 4：验证数据

```bash
# 检查用户数量
psql -h localhost -U caojun -d finapp_test -c "SELECT COUNT(*) FROM finapp.users;"

# 检查投资组合
psql -h localhost -U caojun -d finapp_test -c "SELECT COUNT(*) FROM finapp.portfolios;"

# 检查交易记录
psql -h localhost -U caojun -d finapp_test -c "SELECT COUNT(*) FROM finapp.transactions;"
```

### 步骤 5：重启应用服务

```bash
# 重启后端
bash restart-backend.sh

# 重启前端
bash restart-frontend-only.sh
```

---

## 常见问题

### Q: 备份需要多长时间？
A: 通常 5-10 秒，取决于数据库大小。

### Q: 备份文件需要多少存储空间？
A: 约 200KB（未压缩），25KB（压缩后）。压缩率约 87%。

### Q: 可以恢复特定的表吗？
A: 可以，使用以下命令：
```bash
psql -h localhost -U caojun -d finapp_test -c "DROP TABLE IF EXISTS finapp.table_name; COMMIT;"
gunzip -c backup.sql.gz | psql -h localhost -U caojun -d finapp_test | grep "CREATE TABLE.*table_name"
```

### Q: 备份是否包括所有数据？
A: 包括，包括表结构、数据、索引、约束、触发器等。

### Q: 如何自动化备份？
A: 使用 cron 定时任务：
```bash
# 每天 22:00 执行备份
0 22 * * * /Users/caojun/code/FinApp/scripts/backup-database.sh compress
```

---

## 相关文档

- [数据库保护规范](./DatabaseProtectionAndBackup.md)
- [系统配置](../config/system-config.md)

---

**最后更新**: 2025-11-07  
**版本**: v1.0
