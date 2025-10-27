# Phase 3: API集成 - 部署指南

## 📋 概述

Phase 3 实现了完整的 API 自动同步功能，支持从外部数据源自动获取和更新资产价格数据。

## 🎯 新增功能

- ✅ 数据源管理（Yahoo Finance、东方财富、Tushare）
- ✅ 同步任务配置（手动、Cron、定时间隔）
- ✅ 自动调度执行
- ✅ 同步日志和监控
- ✅ 错误追踪和诊断

## 🚀 快速部署

### 步骤 1: 运行数据库迁移

```bash
# 方法 1: 使用迁移脚本（推荐）
./scripts/migrate-phase3.sh

# 方法 2: 手动执行 SQL
psql -U postgres -d finapp -f backend/migrations/008_price_sync_config/up.sql
```

迁移将创建以下表：
- `price_data_sources` - 数据源配置
- `price_sync_tasks` - 同步任务
- `price_sync_logs` - 同步日志
- `price_sync_errors` - 错误详情

### 步骤 2: 安装后端依赖

```bash
cd backend
npm install node-cron axios
```

### 步骤 3: 重启后端服务

```bash
cd backend
npm run dev
```

后端服务启动时会自动：
- 加载已配置的定时任务
- 启动任务调度器
- 初始化数据源连接

### 步骤 4: 访问前端界面

1. 确保前端服务正在运行：
   ```bash
   cd frontend
   npm run dev
   ```

2. 打开浏览器访问：`http://localhost:3001`

3. 登录系统（使用管理员账户）

4. 进入 **价格管理中心** → **API自动同步**

## 📚 使用指南

### 创建第一个同步任务

1. 点击 **创建同步任务** 按钮

2. 填写任务信息：
   ```
   任务名称: 每日A股价格同步
   任务描述: 每天收盘后同步A股价格数据
   数据源: 东方财富
   调度类型: Cron表达式
   Cron表达式: 0 0 16 * * ?  (每天16:00)
   回溯天数: 1
   覆盖已有数据: 否
   启用任务: 是
   ```

3. 点击 **确定** 保存

4. 任务将自动在每天16:00执行

### 手动执行任务

1. 在任务列表中找到要执行的任务

2. 点击 ▶️ 按钮立即执行

3. 切换到 **同步日志** 标签页查看执行结果

### 查看同步日志

1. 切换到 **同步日志** 标签页

2. 查看执行记录：
   - 开始/完成时间
   - 执行状态
   - 同步统计（资产数、记录数、成功/失败数）
   - 执行耗时

## 🔧 配置说明

### 数据源配置

系统预置了三个数据源：

#### 1. Yahoo Finance
- **提供商**: `yahoo_finance`
- **支持市场**: 全球市场
- **需要API密钥**: 否
- **适用场景**: 美股、港股等国际市场

#### 2. 东方财富
- **提供商**: `eastmoney`
- **支持市场**: 中国A股
- **需要API密钥**: 否
- **适用场景**: 沪深股票、基金

#### 3. Tushare
- **提供商**: `tushare`
- **支持市场**: 中国市场
- **需要API密钥**: 是
- **适用场景**: 需要高质量数据的场景

### Cron 表达式示例

```
# 格式: 秒 分 时 日 月 星期

0 0 16 * * ?     # 每天16:00
0 30 9 * * ?     # 每天9:30
0 0 0 * * 1      # 每周一0:00
0 0 12 1 * ?     # 每月1日12:00
0 0 */4 * * ?    # 每4小时
```

### 调度类型说明

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| 手动执行 | 需要手动触发 | 临时性数据同步 |
| Cron表达式 | 按Cron表达式定时执行 | 固定时间点同步（如每天收盘后） |
| 定时间隔 | 按固定间隔执行 | 需要频繁更新的数据 |

## 🧪 测试验证

### 1. 测试手动执行

```bash
# 创建一个手动执行的测试任务
# 选择少量资产进行测试
# 执行后查看日志确认成功
```

### 2. 测试定时任务

```bash
# 创建一个1分钟后执行的Cron任务
# 等待任务自动执行
# 查看日志确认调度成功
```

### 3. 验证数据

```sql
-- 查看同步的价格数据
SELECT a.symbol, a.name, ap.price_date, ap.close_price, ap.source
FROM assets a
JOIN asset_prices ap ON a.id = ap.asset_id
WHERE ap.source = 'api'
ORDER BY ap.price_date DESC
LIMIT 20;

-- 查看同步日志
SELECT * FROM price_sync_logs
ORDER BY started_at DESC
LIMIT 10;
```

## 📊 监控和维护

### 查看任务状态

在 **同步任务** 标签页可以看到：
- 总任务数
- 启用任务数
- 运行中任务数
- 可用数据源数

### 查看执行历史

在 **同步日志** 标签页可以看到：
- 所有任务的执行历史
- 成功/失败统计
- 错误详情

### 定期维护

建议定期执行以下维护操作：

1. **检查失败记录**
   - 查看同步日志中的失败记录
   - 分析失败原因
   - 手动补充失败的数据

2. **优化任务配置**
   - 根据实际情况调整同步频率
   - 合理设置回溯天数
   - 避免不必要的数据覆盖

3. **清理历史日志**
   ```sql
   -- 删除30天前的日志
   DELETE FROM price_sync_logs
   WHERE started_at < NOW() - INTERVAL '30 days';
   ```

## 🔐 安全注意事项

1. **API密钥管理**
   - API密钥会加密存储
   - 只有管理员可以配置数据源
   - 定期更新API密钥

2. **权限控制**
   - 只有具有 `price:admin` 权限的用户可以管理数据源和任务
   - 具有 `price:update` 权限的用户可以执行任务
   - 所有操作都有审计日志

3. **速率限制**
   - 遵守数据源的API调用限制
   - 避免频繁调用导致被封禁
   - 合理设置同步间隔

## 🐛 故障排除

### 问题 1: 迁移失败

**错误信息**: `relation "price_data_sources" already exists`

**解决方法**:
```sql
-- 检查表是否已存在
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'price_%';

-- 如果需要重新创建，先删除旧表
DROP TABLE IF EXISTS price_sync_errors CASCADE;
DROP TABLE IF EXISTS price_sync_logs CASCADE;
DROP TABLE IF EXISTS price_sync_tasks CASCADE;
DROP TABLE IF EXISTS price_data_sources CASCADE;

-- 重新运行迁移
\i backend/migrations/008_price_sync_config/up.sql
```

### 问题 2: 定时任务未执行

**可能原因**:
- 任务未启用
- Cron表达式错误
- 后端服务未运行

**解决方法**:
1. 检查任务状态是否为"启用"
2. 验证Cron表达式格式
3. 查看后端服务日志
4. 重启后端服务

### 问题 3: 数据同步失败

**可能原因**:
- 网络连接问题
- 数据源API不可用
- 资产代码不存在

**解决方法**:
1. 查看同步日志中的错误信息
2. 检查网络连接
3. 验证资产代码是否正确
4. 尝试手动执行测试

## 📖 相关文档

- [API自动同步使用指南](docs/API_Sync_Guide.md)
- [Phase 3 实现总结](docs/Phase3_Implementation_Summary.md)
- [价格更新功能设计](docs/Price_Update_Redesign.md)

## 🎉 完成检查清单

部署完成后，请确认以下项目：

- [ ] 数据库迁移成功执行
- [ ] 后端服务正常启动
- [ ] 前端界面可以访问
- [ ] 可以查看数据源列表
- [ ] 可以创建同步任务
- [ ] 可以手动执行任务
- [ ] 可以查看同步日志
- [ ] 定时任务可以自动执行
- [ ] 价格数据正确保存到数据库

## 💡 下一步

Phase 3 完成后，可以考虑：

1. **配置生产环境的定时任务**
   - 设置每日收盘后自动同步
   - 配置周末和节假日的处理

2. **监控和告警**
   - 设置同步失败告警
   - 监控数据质量

3. **性能优化**
   - 根据实际使用情况调整并发数
   - 优化大批量数据同步

4. **扩展数据源**
   - 添加更多数据源支持
   - 实现自定义数据源适配器

---

**部署时间**: 2025-10-26  
**版本**: v1.0  
**状态**: ✅ 已完成
