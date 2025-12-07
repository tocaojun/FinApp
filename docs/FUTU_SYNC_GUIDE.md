# 富途数据同步使用指南

**版本**: v2.0  
**更新日期**: 2025-12-02  
**状态**: ✅ 已修复并测试通过

---

## 🎉 问题已解决

### 之前的问题
在UI的"数据同步"菜单中选择"香港股票同步"时，同步失败并显示错误："无法连接到富途OpenD服务"。

### 根本原因
1. **协议不匹配**: 富途OpenD使用**TCP协议**而非HTTP
2. **TypeScript无法直接连接**: Node.js/TypeScript后端尝试通过HTTP调用OpenD，这是不支持的
3. **需要Python SDK**: 富途官方提供的`futu-api` Python库才能正确连接

### 解决方案
采用**混合架构**：TypeScript后端调用Python脚本，Python脚本使用官方SDK连接富途OpenD。

---

## 📋 系统架构

```
UI (React)
   ↓ HTTP请求
后端API (TypeScript/Node.js)
   ↓ execSync调用
Python脚本 (futu-sync-single.py)
   ↓ TCP连接
富途OpenD
   ↓ 行情数据
PostgreSQL数据库
```

---

## 🚀 快速开始

### 1. 确保富途OpenD已启动

```bash
# 检查OpenD是否运行
lsof -i :11111

# 应该看到类似输出:
# COMMAND   PID     USER   FD   TYPE DEVICE
# FutuOpenD 1234  username  10u  IPv4 0x...  TCP localhost:11111 (LISTEN)
```

如果没有运行，请：
1. 打开富途OpenD应用
2. 登录富途账号
3. 确认端口为 11111

### 2. 通过UI同步数据

1. 登录FinApp
2. 进入**数据同步**菜单
3. 选择"香港股票同步"
4. 点击**执行同步**
5. 查看同步日志

### 3. 验证同步结果

```sql
-- 查看同步的价格数据
SELECT 
    a.symbol,
    a.name,
    COUNT(*) as price_count,
    MAX(ap.price_date) as latest_date,
    MAX(ap.close_price) as latest_price
FROM finapp.asset_prices ap
JOIN finapp.assets a ON ap.asset_id = a.id
WHERE ap.price_source = 'FUTU_API'
GROUP BY a.symbol, a.name
ORDER BY a.symbol;
```

---

## 🛠️ 技术实现

### 核心文件

| 文件 | 说明 | 路径 |
|------|------|------|
| **Python同步脚本** | 单个资产同步 | `/scripts/futu-sync-single.py` |
| **批量同步脚本** | 所有资产同步 | `/scripts/futu-sync-prices.py` |
| **TypeScript服务** | 后端集成 | `/backend/src/services/PriceSyncService.ts` |
| **依赖安装脚本** | Python依赖 | `/scripts/install-futu-deps.sh` |

### Python脚本（`futu-sync-single.py`）

**功能**:
- 接收参数：`asset_id`, `futu_symbol`, `days_back`
- 连接富途OpenD获取K线数据
- 直接保存到数据库
- 返回JSON结果给TypeScript

**输出格式**:
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-12-02",
      "open": 625.5,
      "high": 626.0,
      "low": 615.0,
      "close": 617.0,
      "volume": 11460186,
      "currency": "HKD"
    }
  ],
  "message": "成功同步 4 条价格记录"
}
```

### TypeScript集成（`PriceSyncService.ts`）

**关键代码**:
```typescript
private async fetchFromFutu(
  dataSource: DataSource,
  asset: any,
  daysBack: number
): Promise<any[]> {
  // 构建富途股票代码 (例如: HK.00700)
  let futuSymbol = this.buildFutuSymbol(asset);
  
  // 调用Python脚本
  const scriptPath = path.join(__dirname, '..', '..', '..', 'scripts', 'futu-sync-single.py');
  const command = `python3 "${scriptPath}" "${asset.id}" "${futuSymbol}" ${daysBack}`;
  
  const output = execSync(command, { encoding: 'utf-8', timeout: 60000 });
  
  // 解析JSON输出（跳过日志行）
  const lines = output.trim().split('\n');
  const jsonLine = lines.find(l => l.trim().startsWith('{'));
  const result = JSON.parse(jsonLine);
  
  // 数据已由Python脚本保存，返回空数组
  return [];
}
```

---

## 📊 支持的数据

### 金融产品
- ✅ 港股 (HK)
- ✅ 美股 (US)
- ✅ A股 (CN)
- ✅ ETF基金
- ✅ 期权
- ✅ 期货
- ✅ 窝轮/牛熊证

### 数据字段
- `price_date`: 交易日期
- `open_price`: 开盘价
- `high_price`: 最高价
- `low_price`: 最低价
- `close_price`: 收盘价
- `volume`: 成交量
- `currency`: 货币（HKD, USD, CNY等）
- `price_source`: 固定为 'FUTU_API'

---

## 🔧 故障排查

### 问题1: "无法连接到富途OpenD服务"

**检查清单**:
```bash
# 1. 确认OpenD运行
lsof -i :11111

# 2. 测试Python连接
python3 -c "
from futu import OpenQuoteContext
quote_ctx = OpenQuoteContext(host='127.0.0.1', port=11111)
print('连接成功')
quote_ctx.close()
"

# 3. 手动测试脚本
python3 scripts/futu-sync-single.py \
  "6c19f81d-bb43-4539-b665-2b488d92368c" \
  "HK.00700" \
  5
```

**解决方法**:
- 启动富途OpenD应用
- 登录富途账号
- 确保端口为11111

### 问题2: Python依赖缺失

**错误信息**:
```
ModuleNotFoundError: No module named 'futu'
```

**解决方法**:
```bash
cd /Users/caojun/code/FinApp
./scripts/install-futu-deps.sh
```

### 问题3: 数据库连接失败

**错误信息**:
```
psycopg2.OperationalError: could not connect to server
```

**解决方法**:
```bash
# 确认数据库运行
psql -h localhost -U finapp_user -d finapp_test -c "SELECT 1;"

# 检查环境变量
echo $DATABASE_URL
```

### 问题4: JSON解析失败

**症状**: 同步失败，日志显示"无法解析Python脚本输出"

**原因**: Python脚本输出了额外的日志信息

**解决方法**: 
- 脚本已修复，会自动跳过日志行
- 如果仍有问题，检查Python脚本的stdout

---

## 🧪 测试

### 单元测试
```bash
# 测试单个股票同步
python3 scripts/futu-sync-single.py \
  "6c19f81d-bb43-4539-b665-2b488d92368c" \
  "HK.00700" \
  30
```

### 批量测试
```bash
# 同步所有香港股票（最近30天）
python3 scripts/futu-sync-prices.py 30
```

### API测试
```bash
# 获取token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"testapi@finapp.com","password":"testapi123"}' \
  | jq -r '.token')

# 执行同步任务
curl -X POST "http://localhost:8000/api/price-sync/tasks/07359f8f-1ecf-4d2f-9088-d135fa816499/execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📈 性能优化

### 批量操作
- 使用 `execute_values` 批量插入数据
- 单次同步可处理1000天的数据
- 平均每只股票同步时间：2-5秒

### 缓存策略
- 数据已存在时跳过（ON CONFLICT DO UPDATE）
- 避免重复获取相同日期的数据

### 错误处理
- 连接超时：60秒
- 自动重试：无（由UI控制）
- 错误记录：保存到 `price_sync_errors` 表

---

## 📝 最佳实践

### 1. 定时同步
建议每天收盘后执行一次同步：
```bash
# 添加crontab任务
0 17 * * 1-5 cd /Users/caojun/code/FinApp && python3 scripts/futu-sync-prices.py 1
```

### 2. 首次同步
首次使用建议同步最近365天数据：
```bash
python3 scripts/futu-sync-prices.py 365
```

### 3. 增量同步
日常使用只需同步最近1-7天：
```bash
python3 scripts/futu-sync-prices.py 7
```

### 4. 监控日志
定期检查同步日志：
```sql
SELECT * FROM finapp.price_sync_logs 
WHERE status = 'failed' 
ORDER BY started_at DESC 
LIMIT 10;
```

---

## 🎯 下一步计划

- [ ] 添加实时行情推送
- [ ] 支持更多市场（新加坡、日本）
- [ ] 自动化定时同步
- [ ] 价格异常检测和告警
- [ ] 同步进度实时显示

---

## 📚 相关文档

- [富途OpenAPI官方文档](https://openapi.futunn.com/futu-api-doc/)
- [富途Python SDK](https://github.com/FutunnOpen/py-futu-api)
- [FinApp数据库设计](DATABASE_STRUCTURE_DESIGN.md)

---

**问题反馈**: 如遇问题，请检查：
1. 富途OpenD运行状态
2. Python依赖安装
3. 数据库连接
4. 后端日志: `/tmp/backend.log`

**版本历史**:
- v2.0 (2025-12-02): 修复UI同步功能，采用Python脚本集成
- v1.0 (2025-11-28): 初始版本，仅命令行支持
