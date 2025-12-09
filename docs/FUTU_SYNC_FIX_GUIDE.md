# 富途同步问题修复指南

## 问题描述

生产环境中富途同步失败，导致港股资产价格无法更新。

### 错误信息

```
ModuleNotFoundError: No module named 'psycopg2'
ModuleNotFoundError: No module named 'futu'
```

### 影响范围

- ❌ 所有港股资产同步失败（腾讯控股、美团、中国移动等）
- ❌ 数据库表结构缺失字段（priority、schedule）
- 📊 整体同步失败率：33.33%

---

## 根本原因

1. **Python 依赖缺失**
   - `psycopg2`：PostgreSQL 数据库连接库
   - `futu`：富途 OpenAPI SDK

2. **数据库表结构不完整**
   - `price_data_sources` 表缺少 `priority` 字段
   - `price_sync_tasks` 表缺少 `schedule` 字段

---

## 解决方案

### 方案 1：一键快速修复（推荐）⚡

在本地 Mac 执行：

```bash
cd /Users/caojun/code/FinApp
bash scripts/quick-fix-production.sh
```

这个脚本会自动：
- ✅ 传输修复脚本到服务器
- ✅ 安装 Python 依赖（psycopg2、futu）
- ✅ 修复数据库表结构
- ✅ 重启后端服务
- ✅ 运行诊断验证

**预计耗时：2-3 分钟**

---

### 方案 2：手动逐步修复

#### 步骤 1：传输修复脚本

```bash
cd /Users/caojun/code/FinApp

# 传输修复脚本
scp scripts/fix-futu-sync-issues.sh \
    scripts/fix-production-db-schema.sql \
    scripts/diagnose-sync-failures.sh \
    root@apollo123.cloud:/root/FinApp/scripts/
```

#### 步骤 2：登录服务器执行修复

```bash
# 登录服务器
ssh root@apollo123.cloud

# 切换目录
cd /root/FinApp

# 执行修复
bash scripts/fix-futu-sync-issues.sh
```

修复脚本会：
1. 检查并安装 `psycopg2-binary`
2. 检查并安装 `futu-api`
3. 执行数据库表结构修复
4. 验证所有依赖
5. 询问是否重启后端服务

#### 步骤 3：验证修复结果

```bash
# 运行诊断脚本
bash scripts/diagnose-sync-failures.sh

# 检查 Python 依赖
python3 -c "import psycopg2, futu; print('✅ 所有依赖已安装')"

# 查看数据源状态
sudo -u postgres psql -d finapp_production -c \
  "SELECT name, provider, is_active, priority FROM finapp.price_data_sources ORDER BY priority"
```

---

## 验证检查清单

修复完成后，请确认以下项目：

- [ ] **Python 依赖已安装**
  ```bash
  python3 -c "import psycopg2; print('psycopg2:', psycopg2.__version__)"
  python3 -c "import futu; print('futu:', futu.__version__)"
  ```

- [ ] **数据库字段已添加**
  ```bash
  sudo -u postgres psql -d finapp_production -c \
    "SELECT column_name FROM information_schema.columns 
     WHERE table_schema='finapp' AND table_name='price_data_sources' 
     AND column_name='priority'"
  ```

- [ ] **后端服务运行正常**
  ```bash
  curl -s http://localhost:8000/health
  ```

- [ ] **富途同步不再报错**
  ```bash
  tail -f /opt/finapp/releases/20251209_065522/logs/backend.log | grep -i futu
  ```

- [ ] **同步失败率下降**
  ```bash
  sudo -u postgres psql -d finapp_production -c \
    "SELECT status, COUNT(*) as count 
     FROM finapp.price_sync_logs 
     WHERE created_at > NOW() - INTERVAL '1 hour' 
     GROUP BY status"
  ```

---

## 故障排查

### 问题 1：pip3 命令不存在

```bash
# 安装 pip3
sudo apt-get update
sudo apt-get install -y python3-pip

# 验证安装
pip3 --version
```

### 问题 2：psycopg2 安装失败

```bash
# 尝试使用系统包管理器
sudo apt-get update
sudo apt-get install -y python3-psycopg2

# 验证
python3 -c "import psycopg2"
```

### 问题 3：futu 安装失败

```bash
# 升级 pip
sudo pip3 install --upgrade pip

# 重新安装 futu
sudo pip3 install futu-api

# 验证
python3 -c "import futu"
```

### 问题 4：数据库连接失败

```bash
# 检查 PostgreSQL 服务
sudo systemctl status postgresql

# 重启 PostgreSQL
sudo systemctl restart postgresql

# 检查数据库
sudo -u postgres psql -d finapp_production -c '\dt finapp.*'
```

### 问题 5：后端服务启动失败

```bash
# 查看后端日志
tail -100 /opt/finapp/releases/20251209_065522/logs/backend.log

# 重启后端
bash /root/FinApp/scripts/restart-backend-ubuntu.sh

# 检查进程
ps aux | grep "node.*dist/server"
```

---

## 相关文件

### 修复脚本
- `scripts/fix-futu-sync-issues.sh` - 主修复脚本
- `scripts/fix-production-db-schema.sql` - 数据库表结构修复
- `scripts/quick-fix-production.sh` - 一键快速修复

### 诊断脚本
- `scripts/diagnose-sync-failures.sh` - 同步问题诊断

### 富途同步相关
- `scripts/futu-sync-single.py` - 富途单个标的同步脚本
- `backend/src/services/PriceSyncService.ts` - 价格同步服务

---

## 预防措施

为避免将来出现类似问题：

1. **在部署脚本中添加依赖检查**
   ```bash
   # 在 start-all-services-ubuntu.sh 中添加
   python3 -c "import psycopg2, futu" || {
     echo "Python 依赖缺失，正在安装..."
     sudo pip3 install psycopg2-binary futu-api
   }
   ```

2. **创建 requirements.txt**
   ```bash
   # /root/FinApp/scripts/requirements.txt
   psycopg2-binary==2.9.9
   futu-api==6.4.5
   ```

3. **定期检查依赖**
   ```bash
   # 添加到 crontab
   0 0 * * * python3 -c "import psycopg2, futu" || pip3 install psycopg2-binary futu-api
   ```

4. **监控同步失败率**
   - 设置告警：失败率 > 20% 时发送通知
   - 定期查看 `price_sync_logs` 表

---

## 联系支持

如果问题持续存在：

1. 收集以下信息：
   - 后端日志：`tail -200 /opt/finapp/releases/20251209_065522/logs/backend.log`
   - Python 版本：`python3 --version`
   - 已安装包：`pip3 list | grep -E "(psycopg2|futu)"`
   - 数据库状态：诊断脚本输出

2. 检查项目文档：
   - `README.md` - 项目总览
   - `requirements.md` - 系统需求
   - `config/system-config.md` - 系统配置

---

**最后更新**: 2025-12-09  
**版本**: v1.0  
**状态**: ✅ 已验证有效
