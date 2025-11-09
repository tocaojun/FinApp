# 准生产环境迁移总结

## 📌 核心要点

### 迁移源信息
- **源数据库**：`finapp_test`（开发环境）
- **目标数据库**：`finapp_staging`（准生产环境）
- **备份文件**：`finapp_test_backup_standard_data.sql.gz`（50KB）
- **备份时间**：2025-11-09 11:46
- **数据状态**：已清理 assets 和 asset_prices

### 数据库现状
| 表名 | 记录数 | 状态 |
|------|--------|------|
| users | 2 | ✅ 完整 |
| portfolios | ✓ | ✅ 完整 |
| transactions | ✓ | ✅ 完整 |
| exchange_rates | ✓ | ✅ 完整 |
| asset_types | 15 | ✅ 保留 |
| price_data_sources | 6 | ✅ 保留 |
| assets | 0 | 🧹 已清理 |
| asset_prices | 0 | 🧹 已清理 |
| **总表数** | **33** | ✅ 完整 |

---

## 🎯 迁移前准备

### 必要条件
1. ✅ 开发环境数据已备份
2. ✅ 备份文件已验证有效
3. ⏳ 准生产环境 PostgreSQL 已安装
4. ⏳ 准生产环境网络已配置
5. ⏳ SSH 访问已配置

### 关键配置信息

**后端环境变量需要更新：**
```env
DATABASE_URL="postgresql://finapp_staging:PASSWORD@<staging-host>:5432/finapp_staging?schema=finapp"
JWT_SECRET="change-me-to-secure-random-value"
NODE_ENV="staging"
CORS_ORIGIN="https://staging.yourdomain.com"
```

**前端环境变量需要更新：**
```env
VITE_API_BASE_URL=https://staging-api.yourdomain.com/api
VITE_APP_TITLE=FinApp (Staging)
```

---

## 📋 迁移步骤速览

### 快速参考（完整步骤见 `DATABASE_MIGRATION_TO_STAGING.md`）

```bash
# 1️⃣ 在准生产环境创建数据库用户和数据库
psql -h <staging-db-host> -U postgres << EOF
CREATE USER finapp_staging WITH PASSWORD 'secure-password';
CREATE DATABASE finapp_staging OWNER finapp_staging ENCODING 'UTF8';
CREATE SCHEMA finapp AUTHORIZATION finapp_staging;
EOF

# 2️⃣ 上传备份文件
scp /Users/caojun/code/FinApp/backups/finapp_test_backup_standard_data.sql.gz \
    staging-user@<staging-host>:/tmp/finapp_backup.sql.gz

# 3️⃣ 恢复数据库
ssh staging-user@<staging-host> << EOF
gunzip -c /tmp/finapp_backup.sql.gz | \
  psql -h localhost -U finapp_staging -d finapp_staging
EOF

# 4️⃣ 验证数据完整性
psql -h <staging-host> -U finapp_staging -d finapp_staging << EOF
SELECT 'users' as table, COUNT(*) FROM finapp.users
UNION ALL
SELECT 'portfolios', COUNT(*) FROM finapp.portfolios
UNION ALL
SELECT 'assets', COUNT(*) FROM finapp.assets;
EOF
```

---

## 🚀 后续部署步骤

### 1. 配置应用
- [ ] 复制 `.env.staging.template` 到后端 `.env.staging`
- [ ] 复制 `frontend/.env.staging.template` 到前端 `.env.staging`
- [ ] 填入准生产环境的具体值

### 2. 构建应用
```bash
cd backend && npm run build
cd ../frontend && npm run build
```

### 3. 启动服务
```bash
# 后端
NODE_ENV=staging PORT=8000 npm start

# 前端（使用预构建文件或开发服务器）
npm run preview
```

### 4. 健康检查
```bash
# 检查后端
curl -X GET http://localhost:8000/health

# 检查数据库连接
curl -X GET http://localhost:8000/api/health/db

# 检查前端
curl -X GET http://staging.yourdomain.com
```

---

## ✅ 验证清单

### 数据完整性验证
- [ ] 所有 33 个表都存在
- [ ] `assets` 和 `asset_prices` 表行数为 0
- [ ] 用户账户数据完整
- [ ] 投资组合数据完整
- [ ] 交易记录数据完整
- [ ] 汇率数据可用

### 应用功能验证
- [ ] 用户可以正常登录
- [ ] 用户可以查看个人资产
- [ ] 可以查看投资组合列表
- [ ] 可以查看交易记录
- [ ] 可以查看汇率数据
- [ ] 汇率同步功能可用
- [ ] 管理员可以管理系统

### 性能验证
- [ ] 页面加载时间 < 3秒
- [ ] API 响应时间 < 1秒
- [ ] 数据库查询正常
- [ ] 无错误日志

---

## ⚠️ 常见问题和解决方案

### Q1: 如何验证备份文件完整性？
```bash
gunzip -t /Users/caojun/code/FinApp/backups/finapp_test_backup_standard_data.sql.gz
# 如果显示 OK，表示文件完整
```

### Q2: 迁移后如何验证数据是否正确？
```bash
# 连接到准生产数据库
psql -h <staging-host> -U finapp_staging -d finapp_staging

# 执行验证查询
SELECT schema_name FROM information_schema.schemata;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'finapp';
```

### Q3: 如何回滚数据库迁移？
```bash
# 删除准生产数据库
psql -h <staging-host> -U postgres -c "DROP DATABASE finapp_staging;"

# 重新创建并恢复（重复迁移步骤）
```

### Q4: JWT_SECRET 如何生成？
```bash
# 生成随机的安全密钥
openssl rand -base64 32
```

### Q5: 如何处理数据库连接超时？
```bash
# 1. 检查网络连接
ping <staging-db-host>

# 2. 检查 PostgreSQL 服务
ssh staging-user@<staging-host> "systemctl status postgresql"

# 3. 检查防火墙规则（5432 端口）
```

---

## 📚 相关文档

| 文档 | 用途 | 链接 |
|------|------|------|
| 完整迁移指南 | 详细的分步骤迁移说明 | `DATABASE_MIGRATION_TO_STAGING.md` |
| 快速参考 | 常用命令和快速查询表 | `STAGING_QUICK_REFERENCE.md` |
| 后端配置模板 | 准生产环境后端配置 | `.env.staging.template` |
| 前端配置模板 | 准生产环境前端配置 | `frontend/.env.staging.template` |

---

## 🔐 安全建议

### 必须做的事
1. ✅ 更改默认密码
2. ✅ 生成新的 JWT_SECRET
3. ✅ 配置 HTTPS/SSL
4. ✅ 设置防火墙规则
5. ✅ 配置备份和恢复计划
6. ✅ 启用监控和日志

### 绝对不要做的事
1. ❌ 使用开发环境的密码
2. ❌ 使用开发环境的 JWT_SECRET
3. ❌ 在 HTTP 上运行生产数据库
4. ❌ 允许外部直接访问数据库端口
5. ❌ 将 `.env` 文件提交到 Git

---

## 📞 技术支持

### 遇到问题时的排查步骤

1. **检查备份文件**
   ```bash
   ls -lh /Users/caojun/code/FinApp/backups/
   gunzip -t finapp_test_backup_standard_data.sql.gz
   ```

2. **检查网络连接**
   ```bash
   ping <staging-db-host>
   telnet <staging-db-host> 5432
   ```

3. **检查数据库状态**
   ```bash
   psql -h <staging-host> -U postgres -l | grep finapp_staging
   ```

4. **查看错误日志**
   ```bash
   tail -f /var/log/postgresql/postgresql.log
   ```

5. **验证用户权限**
   ```bash
   psql -h <staging-host> -U postgres -c \
     "SELECT usename FROM pg_user WHERE usename='finapp_staging';"
   ```

---

## 📊 迁移时间表

| 阶段 | 所需时间 | 关键里程碑 |
|------|---------|----------|
| 准备 | 1-2 小时 | 环境检查完成，文件准备好 |
| 迁移 | 5-10 分钟 | 数据库恢复完成 |
| 验证 | 30 分钟 | 所有检查通过 |
| 部署 | 1-2 小时 | 应用启动成功 |
| **总计** | **3-4 小时** | 系统上线可用 |

---

## 🎉 迁移完成后

### 持续监控
- [ ] 监控数据库性能
- [ ] 检查应用日志
- [ ] 跟踪用户反馈
- [ ] 定期备份准生产数据库

### 后续优化
- [ ] 性能调优
- [ ] 索引优化
- [ ] 缓存配置
- [ ] 监控告警设置

---

**文档创建时间**：2025-11-09  
**版本**：v1.0  
**作者**：FinApp 开发团队  
**状态**：已完成并上传到 GitHub
