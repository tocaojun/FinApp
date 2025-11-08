# 价格同步功能快速测试指南

## 🎯 测试目标

验证价格同步系统的以下功能：
1. ✅ 资产类型下拉框正常加载
2. ✅ 市场下拉框正常加载
3. ✅ 具体资产下拉框正常加载
4. ✅ 同步任务创建成功
5. ✅ 同步任务执行成功
6. ✅ 价格数据正确保存

## 📝 测试步骤

### 步骤1: 访问系统

1. 打开浏览器访问: http://localhost:3001
2. 使用测试账户登录:
   - 用户名: `testapi@finapp.com`
   - 密码: `testapi123`

### 步骤2: 进入价格管理

1. 点击左侧菜单 **价格管理中心**
2. 点击 **API自动同步** 标签页

### 步骤3: 验证数据加载

**预期结果**: 页面应显示以下统计信息
- 总任务数: 1
- 启用任务数: 1
- 运行中任务数: 0
- 可用数据源数: 3

**如果看到错误**: 
- 打开浏览器开发者工具 (F12)
- 查看 Console 标签页的错误信息
- 查看 Network 标签页的API请求状态

### 步骤4: 创建测试任务

1. 点击 **创建同步任务** 按钮

2. **验证下拉框数据**:
   - ✅ 数据源下拉框应有3个选项:
     - Yahoo Finance
     - 东方财富
     - Tushare
   
   - ✅ 资产类型下拉框应有数据（如：股票、基金等）
   
   - ✅ 市场下拉框应有数据（如：香港交易所、纳斯达克等）
   
   - ✅ 具体资产下拉框应有数据（可搜索）

3. **填写任务信息**:
   ```
   任务名称: 测试同步-港股腾讯
   任务描述: 测试Yahoo Finance API同步港股数据
   数据源: Yahoo Finance
   
   同步资产范围:
   - 资产类型: 股票
   - 市场: 香港交易所 (HKEX)
   - 具体资产: 00700 腾讯控股
   
   调度配置:
   - 调度类型: 手动执行
   - 回溯天数: 1
   - 覆盖已有数据: 否
   - 启用任务: 是
   ```

4. 点击 **确定** 保存

### 步骤5: 执行同步任务

1. 在任务列表中找到刚创建的任务
2. 点击任务行右侧的 ▶️ **执行** 按钮
3. 等待任务执行（通常需要5-10秒）

### 步骤6: 查看同步结果

1. 切换到 **同步日志** 标签页
2. 查看最新的日志记录

**成功标志**:
- ✅ 状态: 成功 (绿色标签)
- ✅ 同步资产数: 1
- ✅ 同步记录数: > 0
- ✅ 成功数: > 0
- ✅ 失败数: 0

**失败标志**:
- ❌ 状态: 失败 (红色标签)
- ❌ 失败数: > 0
- 点击 **查看详情** 查看错误信息

### 步骤7: 验证价格数据

**方法1: 通过数据库查询**

```bash
psql -d finapp_test -c "
SELECT 
  a.symbol,
  a.name,
  ap.price_date,
  ap.close_price,
  ap.source
FROM finapp.assets a
JOIN finapp.asset_prices ap ON a.id = ap.asset_id
WHERE a.symbol = '00700'
  AND ap.source = 'api'
ORDER BY ap.price_date DESC
LIMIT 5;
"
```

**预期输出**:
```
 symbol |   name   | price_date | close_price | source
--------+----------+------------+-------------+--------
 00700  | 腾讯控股 | 2025-10-27 |   XXX.XX    | api
```

**方法2: 通过前端界面**

1. 返回 **价格管理中心** 首页
2. 在资产列表中找到 "00700 腾讯控股"
3. 点击 **查看价格** 按钮
4. 验证是否有新的价格记录（来源标记为 "API"）

## 🐛 常见问题排查

### 问题1: 下拉框为空

**症状**: 资产类型或市场下拉框没有数据

**排查步骤**:
1. 打开浏览器开发者工具 (F12)
2. 切换到 Network 标签页
3. 刷新页面
4. 查找以下请求:
   - `/api/assets/types`
   - `/api/assets/markets`
   - `/api/assets?limit=1000`

**可能原因**:
- ❌ API返回404: 后端路由配置错误
- ❌ API返回401: Token过期，需要重新登录
- ❌ API返回500: 后端服务错误，查看后端日志

**解决方案**:
```bash
# 重启后端服务
cd /Users/caojun/code/FinApp
./restart-backend.sh

# 重启前端服务
./restart-frontend-only.sh
```

### 问题2: 同步任务失败

**症状**: 任务执行后状态显示"失败"

**排查步骤**:
1. 点击失败任务的 **查看详情** 按钮
2. 查看错误信息

**常见错误**:

#### 错误A: "No data found for symbol"
```
原因: Yahoo Finance找不到该symbol
解决: 
- 港股需要检查symbol格式（如00700）
- 确认市场选择正确（HKEX）
- 系统会自动添加.HK后缀
```

#### 错误B: "Task configuration missing asset selection"
```
原因: 未选择要同步的资产
解决: 
- 至少选择一项：资产类型、市场或具体资产
- 推荐选择具体资产以便精确控制
```

#### 错误C: "Data source not found or inactive"
```
原因: 数据源未配置或已禁用
解决:
- 检查数据源列表
- 确认选择的数据源状态为"启用"
```

### 问题3: 任务卡在"运行中"

**症状**: 任务状态一直显示"运行中"，超过5分钟未完成

**解决方案**:
```sql
-- 查看卡住的任务
SELECT id, task_id, status, started_at 
FROM finapp.price_sync_logs 
WHERE status = 'running' 
  AND started_at < NOW() - INTERVAL '10 minutes';

-- 手动标记为失败
UPDATE finapp.price_sync_logs 
SET status = 'failed', 
    completed_at = CURRENT_TIMESTAMP,
    error_message = '任务执行超时'
WHERE status = 'running' 
  AND started_at < NOW() - INTERVAL '10 minutes';
```

## ✅ 测试检查清单

- [ ] 能够正常登录系统
- [ ] 价格管理页面正常加载
- [ ] 数据源列表显示3个数据源
- [ ] 资产类型下拉框有数据
- [ ] 市场下拉框有数据
- [ ] 具体资产下拉框有数据（可搜索）
- [ ] 能够成功创建同步任务
- [ ] 能够手动执行同步任务
- [ ] 同步日志正确记录执行结果
- [ ] 价格数据成功保存到数据库
- [ ] 前端界面能够查看新同步的价格

## 📊 测试数据建议

### 推荐测试资产

**港股** (使用Yahoo Finance):
- 00700 腾讯控股 ✅ 推荐
- 03690 美团-W ✅ 推荐
- 09618 京东集团

**美股** (使用Yahoo Finance):
- BILI 哔哩哔哩 ✅ 推荐
- AAPL 苹果
- MSFT 微软

**A股** (使用东方财富):
- 暂不推荐测试（需要特殊的symbol格式）

## 🔍 调试技巧

### 查看后端日志
```bash
# 实时查看后端日志
tail -f /tmp/finapp-backend.log

# 过滤同步相关日志
tail -f /tmp/finapp-backend.log | grep -i "sync\|yahoo\|price"
```

### 查看前端日志
```bash
# 实时查看前端日志
tail -f /tmp/finapp-frontend.log
```

### 数据库查询

```sql
-- 查看所有同步任务
SELECT id, name, last_run_status, is_active 
FROM finapp.price_sync_tasks;

-- 查看最近的同步日志
SELECT 
  psl.id,
  pst.name as task_name,
  psl.status,
  psl.started_at,
  psl.total_assets,
  psl.success_count,
  psl.failed_count
FROM finapp.price_sync_logs psl
JOIN finapp.price_sync_tasks pst ON psl.task_id = pst.id
ORDER BY psl.started_at DESC
LIMIT 10;

-- 查看同步错误
SELECT * FROM finapp.price_sync_errors
ORDER BY occurred_at DESC
LIMIT 10;
```

---

**测试环境**: 开发环境  
**数据库**: finapp_test  
**前端地址**: http://localhost:3001  
**后端地址**: http://localhost:8000  
**测试账户**: testapi@finapp.com / testapi123
