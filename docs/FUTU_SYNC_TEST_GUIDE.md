# 富途同步修复测试指南

## 🎯 测试目标

验证修复后，同步日志能正确显示同步的记录数。

---

## 📋 测试前准备

### 1. 确认后端服务已重启

```bash
cd /Users/caojun/code/FinApp
bash restart-backend.sh
```

**等待输出**：
```
✅ Backend service started successfully on port 8000
```

### 2. 检查修复前的状态

```bash
psql -h localhost -U finapp_user -d finapp_test -f scripts/check-sync-fix.sql
```

**记录当前状态**：
- 最近同步的 `total_records` 值
- 最新价格数据的日期

---

## 🧪 测试步骤

### 步骤 1：打开前端

```bash
# 确保前端正在运行
cd /Users/caojun/code/FinApp/frontend
npm run dev
```

访问：`http://localhost:3001`

### 步骤 2：登录系统

- 用户名：`admin@finapp.com`
- 密码：`admin123`

### 步骤 3：进入数据同步页面

导航路径：
```
主页 → 系统管理 → 数据同步 → 同步任务
```

### 步骤 4：执行香港股票同步

1. 找到"香港股票价格同步"任务
2. 点击"立即同步"按钮
3. 等待同步完成（约 3-5 秒）
4. 查看提示消息

**预期消息**：
```
✅ 同步任务已启动
```

### 步骤 5：查看同步日志

导航路径：
```
数据同步 → 同步日志
```

**查看最新的日志记录**：

#### 修复前（❌ 错误）：
```
时间: 2025-12-12 22:23:46
状态: success ✅
资产数量: 4
同步记录数: 0  ❌ 问题！
成功数量: 0
失败数量: 0
```

#### 修复后（✅ 正确）：
```
时间: 2025-12-12 22:30:00
状态: success ✅
资产数量: 4
同步记录数: 30  ✅ 修复成功！
成功数量: 30
失败数量: 0
```

### 步骤 6：验证数据库

```bash
psql -h localhost -U finapp_user -d finapp_test -f scripts/check-sync-fix.sql
```

**检查输出**：

```sql
-- 1. 最近同步日志
sync_time           | status  | total_assets | total_records | fix_status
--------------------+---------+--------------+---------------+------------
2025-12-12 22:30:00 | success |            4 |            30 | ✅ 正常

-- 2. 价格数据统计
symbol | name      | price_source | total_prices | latest_date
-------+-----------+--------------+--------------+-------------
00700  | 腾讯控股  | FUTU_API     |           30 | 2025-12-12
03690  | 美团-W    | FUTU_API     |           30 | 2025-12-12
...

-- 3. 今天的同步记录
symbol | name      | records_today | latest_date
-------+-----------+---------------+-------------
00700  | 腾讯控股  |             1 | 2025-12-12
03690  | 美团-W    |             1 | 2025-12-12
...
```

---

## ✅ 测试验证清单

### 功能验证

- [ ] 后端服务成功重启
- [ ] 前端能正常访问同步页面
- [ ] 同步任务能成功触发
- [ ] 同步完成后显示"成功"状态

### 数据验证

- [ ] 同步日志中 `total_records > 0`
- [ ] 同步日志中 `success_count > 0`
- [ ] `total_records` = `success_count`
- [ ] 数据库中有新的价格数据
- [ ] 价格数据的日期是最新的

### 显示验证

- [ ] 前端正确显示同步记录数
- [ ] 同步日志详情页显示完整信息
- [ ] 产品详情页显示最新价格
- [ ] 价格图表更新正确

---

## 🔍 问题排查

### 问题 1：同步后 total_records 仍为 0

**可能原因**：
1. 后端服务未重启
2. 代码修改未生效
3. 缓存问题

**解决方法**：
```bash
# 1. 强制停止后端
pkill -f "node.*backend"

# 2. 清除 node_modules 缓存
cd /Users/caojun/code/FinApp/backend
rm -rf node_modules/.cache

# 3. 重新编译
npm run build

# 4. 重启
npm run dev
```

### 问题 2：同步显示失败

**可能原因**：
1. 富途 OpenD 未启动
2. 网络连接问题
3. Python 环境问题

**解决方法**：
```bash
# 1. 检查富途 OpenD
curl http://127.0.0.1:11111

# 2. 检查 Python 环境
python3 -c "import futu; print('Futu SDK OK')"

# 3. 查看后端日志
tail -f /Users/caojun/code/FinApp/logs/backend.log
```

### 问题 3：数据库中没有新数据

**可能原因**：
1. 资产 ID 配置错误
2. 富途 API 返回空数据
3. 数据库插入失败

**解决方法**：
```sql
-- 检查资产配置
SELECT 
  t.name, 
  t.asset_ids,
  array_length(t.asset_ids, 1) as asset_count
FROM finapp.price_sync_tasks t
WHERE t.name LIKE '%香港%';

-- 检查同步错误
SELECT * FROM finapp.price_sync_errors
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📊 测试数据对比

### 场景 1：正常同步（30天数据）

| 指标 | 修复前 | 修复后 |
|------|--------|--------|
| 状态 | success ✅ | success ✅ |
| 资产数 | 4 | 4 |
| 记录数 | 0 ❌ | 30 ✅ |
| 成功数 | 0 ❌ | 30 ✅ |
| 失败数 | 0 | 0 |

### 场景 2：部分失败（1个资产失败）

| 指标 | 修复前 | 修复后 |
|------|--------|--------|
| 状态 | success ✅ | partial ⚠️ |
| 资产数 | 4 | 4 |
| 记录数 | 0 ❌ | 22 ✅ |
| 成功数 | 0 ❌ | 22 ✅ |
| 失败数 | 1 | 8 |

---

## 🎉 测试成功标准

所有以下条件都满足：

1. ✅ 同步任务能成功执行
2. ✅ 同步日志中 `total_records > 0`
3. ✅ `total_records` = `success_count`（无失败时）
4. ✅ 数据库中有新的价格数据
5. ✅ 前端显示正确的同步记录数
6. ✅ 产品详情显示最新价格

---

## 📞 支持

如果测试遇到问题：

1. 查看后端日志：`tail -f logs/backend.log`
2. 查看 Python 脚本输出
3. 检查数据库同步错误表：`finapp.price_sync_errors`
4. 参考完整文档：`docs/FUTU_SYNC_RECORD_COUNT_FIX.md`

---

**测试版本**：v1.0  
**创建日期**：2025-12-12  
**预计测试时间**：5-10 分钟
