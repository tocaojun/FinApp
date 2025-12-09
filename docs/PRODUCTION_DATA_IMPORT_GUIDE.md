# 生产环境数据导入指南

## 问题描述

生产服务器上的"同步任务"、"数据源"、"同步日志"菜单显示为空,但本地开发环境有数据。

## 原因分析

生产环境使用的是 `finapp_production` 数据库,而本地使用的是 `finapp_test` 数据库。生产数据库只有表结构,没有测试数据。

## 解决方案

将本地测试数据导出并导入到生产数据库。

---

## 📋 完整操作步骤

### 第一步: 在本地导出测试数据

在**本地Mac电脑**上执行:

```bash
cd /Users/caojun/code/FinApp
bash scripts/export-test-data.sh
```

**输出示例**:
```
📦 导出本地测试数据...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 导出数据源和同步配置
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
导出数据源 (price_data_sources)... ✅ 3 条
导出同步任务 (price_sync_tasks)... ✅ 5 条
导出汇率数据 (exchange_rates, 最近30天)... ✅ 120 条
导出产品数据 (products)... ✅ 50 条

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 数据已打包: backups/test-data-20251209_120000.tar.gz
```

### 第二步: 上传数据包到服务器

在**本地Mac电脑**上执行:

```bash
# 找到生成的文件名(注意时间戳)
ls -lt backups/test-data-*.tar.gz | head -1

# 上传到服务器
scp backups/test-data-20251209_120000.tar.gz root@apollo123.cloud:/opt/finapp/backups/
```

### 第三步: 在服务器上检查当前数据

SSH登录到服务器:

```bash
ssh root@apollo123.cloud
cd /opt/finapp/releases/$(ls -t /opt/finapp/releases | grep -E '^[0-9]{8}_[0-9]{6}$' | head -1)

# 拉取最新脚本
git pull origin master
chmod +x scripts/*.sh

# 检查当前数据情况
bash scripts/check-production-data.sh
```

**输出示例**:
```
🔍 检查生产数据库数据...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 核心数据表统计
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
数据源 (price_data_sources): 0 条 ❌
同步任务 (price_sync_tasks): 0 条 ❌
同步日志 (price_sync_logs): 0 条 ⚠️

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 建议
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  生产数据库缺少测试数据
```

### 第四步: 解压并导入数据

在服务器上继续执行:

```bash
# 1. 创建并进入测试数据目录
mkdir -p /opt/finapp/backups/test-data
cd /opt/finapp/backups

# 2. 解压数据包(注意替换实际的文件名)
tar -xzf test-data-20251209_120000.tar.gz -C test-data

# 3. 查看解压的文件
ls -lh test-data/

# 4. 返回项目目录并执行导入
cd /opt/finapp/releases/$(ls -t /opt/finapp/releases | grep -E '^[0-9]{8}_[0-9]{6}$' | head -1)
bash scripts/import-production-data.sh
```

**交互提示**:
```
📥 导入测试数据到生产数据库...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 检查数据文件
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  price_data_sources.csv: 3 条 ✅
  price_sync_tasks.csv: 5 条 ✅
  exchange_rates.csv: 120 条 ✅
  products.csv: 50 条 ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  警告
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
此操作将导入数据到生产数据库: finapp_production

确认继续? (y/n): 
```

输入 `y` 确认。

**成功输出**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 开始导入数据
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
导入数据源...
price_data_sources: 3 条
导入同步任务...
price_sync_tasks: 5 条
导入汇率数据...
exchange_rates: 120 条
导入产品数据...
products: 50 条

✅ 数据导入成功!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 验证导入结果
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
数据源: 3 条
同步任务: 5 条
汇率: 120 条
产品: 50 条

🎉 导入完成!
```

### 第五步: 验证前端显示

1. 打开浏览器访问: `http://apollo123.cloud:3001`
2. 登录系统
3. 进入以下菜单验证:
   - **价格管理 → API同步** 
     - ✅ 数据源列表有数据
     - ✅ 同步任务列表有数据
     - ✅ 同步日志列表可能为空(正常,需要执行同步任务后才有)

---

## 🔍 导出的数据内容

### 1. 数据源 (price_data_sources)
- Yahoo Finance
- Alpha Vantage
- 自定义数据源

### 2. 同步任务 (price_sync_tasks)
- 每日股票价格同步
- 每周汇率更新
- 基金净值同步
等

### 3. 汇率数据 (exchange_rates)
- 最近30天的汇率数据
- 包含主要货币对: USD/CNY, EUR/CNY, HKD/CNY 等

### 4. 产品数据 (products)
- 股票、基金、债券等产品信息
- 包含代码、名称、市场等基本信息

---

## ⚠️ 注意事项

### 1. 数据覆盖策略

- **数据源和同步任务**: 使用CSV直接插入,如果已存在则会报错(可以先清空表)
- **汇率和产品**: 使用 `ON CONFLICT DO UPDATE`,已存在的记录会被更新

### 2. 清空现有数据(可选)

如果需要完全替换现有数据,在导入前执行:

```sql
sudo -u postgres psql -d finapp_production << 'EOF'
TRUNCATE finapp.price_sync_logs CASCADE;
TRUNCATE finapp.price_sync_tasks CASCADE;
TRUNCATE finapp.price_data_sources CASCADE;
EOF
```

### 3. 备份生产数据

**强烈建议**在导入前备份生产数据库:

```bash
sudo -u postgres pg_dump finapp_production > /opt/finapp/backups/finapp_production_before_import_$(date +%Y%m%d_%H%M%S).sql
```

---

## 🛠️ 故障排除

### 问题1: 导入后前端仍然显示为空

**原因**: 浏览器缓存或前端请求失败

**解决方案**:
```bash
# 1. 清除浏览器缓存 (Ctrl+Shift+Delete)
# 2. 检查浏览器控制台Network标签,查看API请求是否成功
# 3. 在服务器上验证数据:
sudo -u postgres psql -d finapp_production -c "SELECT COUNT(*) FROM finapp.price_data_sources"
```

### 问题2: 导入时提示"数据目录不存在"

**原因**: 数据包未正确解压

**解决方案**:
```bash
cd /opt/finapp/backups
mkdir -p test-data
tar -xzf test-data-*.tar.gz -C test-data
ls -la test-data/
```

### 问题3: 权限错误

**原因**: 需要postgres用户权限

**解决方案**:
```bash
# 所有数据库操作都使用 sudo -u postgres
sudo -u postgres psql -d finapp_production -f import-data.sql
```

---

## 📊 验证命令

在服务器上执行以下命令验证数据:

```bash
# 检查数据源
sudo -u postgres psql -d finapp_production -c "SELECT id, name, provider, enabled FROM finapp.price_data_sources"

# 检查同步任务
sudo -u postgres psql -d finapp_production -c "SELECT id, name, schedule, enabled FROM finapp.price_sync_tasks"

# 检查最新汇率
sudo -u postgres psql -d finapp_production -c "SELECT code, rate, date FROM finapp.exchange_rates ORDER BY date DESC LIMIT 10"

# 检查产品
sudo -u postgres psql -d finapp_production -c "SELECT COUNT(*), product_type FROM finapp.products GROUP BY product_type"
```

---

## 🚀 后续操作

数据导入完成后,可以:

1. **测试同步任务**: 在前端点击"立即执行"按钮测试同步功能
2. **查看同步日志**: 执行同步任务后,同步日志列表会有新记录
3. **配置定时任务**: 可以在服务器上配置cron定时执行同步

---

## 📝 相关文件

- 导出脚本: `scripts/export-test-data.sh`
- 导入脚本: `scripts/import-production-data.sh`
- 检查脚本: `scripts/check-production-data.sh`
- 前端页面: `frontend/src/pages/admin/PriceManagement/ApiSync/index.tsx`
- 后端服务: `backend/src/services/PriceSyncService.ts`

---

**文档创建日期**: 2025-12-09  
**版本**: v1.0  
**适用环境**: Ubuntu 生产服务器
