# 🎯 优化实施检查清单

快速复制粘贴，按步骤操作即可完成优化。

---

## 📌 P1-1：权限缓存优化（15 分钟）

### 步骤 1：查找需要修改的行
```bash
grep -n "this.cacheService.set(cacheKey, hasPermission" \
  backend/src/services/PermissionService.ts
```

期望输出：第 264 行（或附近）

### 步骤 2：修改缓存时间
```bash
# 使用 sed 修改（自动备份原文件）
cd backend
cp src/services/PermissionService.ts src/services/PermissionService.ts.backup

# 将 60 改为 1800
sed -i.bak 's/cacheService.set(cacheKey, hasPermission, 60)/cacheService.set(cacheKey, hasPermission, 1800)/g' \
  src/services/PermissionService.ts

# 验证修改
grep "hasPermission, 1800" src/services/PermissionService.ts
```

期望输出：看到改为 1800 的行

### 步骤 3：重启后端并测试
```bash
# 杀死旧进程
pkill -f "npm run dev"
sleep 2

# 启动新后端
cd backend && npm run dev > /tmp/backend.log 2>&1 &
sleep 5

# 测试权限查询（需要有效的 JWT token）
TOKEN="your_actual_token_here"

# 第一次请求（应该是 50-100ms）
time curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/portfolios

# 第二次请求（应该是 1-5ms）
time curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/portfolios

# 查看日志确认缓存命中
grep "permission" /tmp/backend.log | tail -5
```

期望结果：第二次请求快 10-50 倍

### 验证清单
- [x] 文件已备份（PermissionService.ts.backup）
- [x] 第 264 行已从 60 改为 1800
- [x] 后端已重启
- [x] 第一次请求 > 30ms
- [x] 第二次请求 < 10ms

---

## 📌 P1-3：前端超时控制（10 分钟）

### 步骤 1：打开 api.ts 文件
```bash
vi frontend/src/services/api.ts
```

### 步骤 2：找到 apiRequest 函数（第 24 行附近）
查找：`export const apiRequest = async <T = any>`

### 步骤 3：替换整个函数实现

找到这部分：
```typescript
export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: {
      ...createAuthHeaders(),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    // ... 处理响应 ...
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
```

替换为：
```typescript
export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<T> => {
  const timeout = options.timeout || 30000; // 默认 30 秒
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      signal: controller.signal,
      headers: {
        ...createAuthHeaders(),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    clearTimeout(timeoutId);
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error('Backend service not available');
    }
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // 无法解析错误响应
      }
      
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
    }
    console.error('API request failed:', error);
    throw error;
  }
};
```

### 步骤 4：添加便利函数（可选）

在文件末尾添加：
```typescript
// 针对可能较慢的查询，使用更长超时
export const apiGetWithLongTimeout = <T = any>(
  endpoint: string
): Promise<T> => {
  return apiRequest<T>(endpoint, { 
    method: 'GET', 
    timeout: 60000  // 60 秒
  });
};
```

### 步骤 5：保存并测试
```bash
# 保存文件（如果使用 vi）
# :wq

# 重启前端
pkill -f "npm run dev"
sleep 2
cd frontend && npm run dev > /tmp/frontend.log 2>&1 &
sleep 10

# 在浏览器中打开应用
open http://localhost:3001

# 在 DevTools Console 中测试
console.log('Testing timeout...');
fetch('http://localhost:8000/api/portfolios', { 
  signal: AbortSignal.timeout(30000) 
});
```

### 验证清单
- [x] apiRequest 函数已更新，包含 timeout 参数
- [x] AbortController 已添加
- [x] 添加了 clearTimeout 处理
- [x] 前端已重启
- [x] 可以在 DevTools 中看到 timeout 错误

---

## 📌 P1-4：数据库索引创建（5 分钟）

### 步骤 1：连接到数据库
```bash
# 使用 psql 连接数据库
PGPASSWORD="finapp_password" psql -U finapp_user -h localhost -d finapp_test
```

### 步骤 2：创建权限查询索引
```sql
-- 为权限查询添加索引
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_active 
ON user_roles(user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id 
ON role_permissions(role_id);

-- 验证索引已创建
\d user_roles
\d role_permissions
```

### 步骤 3：创建投资组合持仓查询索引
```sql
-- 为 N+1 优化做准备（P1-2）
CREATE INDEX IF NOT EXISTS idx_positions_portfolio_active 
ON positions(portfolio_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_positions_asset_id 
ON positions(asset_id);

CREATE INDEX IF NOT EXISTS idx_asset_prices_asset_date 
ON asset_prices(asset_id, price_date DESC);

-- 验证
\d positions
\d asset_prices
```

### 步骤 4：验证索引大小
```sql
-- 查看所有索引的大小
SELECT 
    schemaname, 
    tablename, 
    indexname, 
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes 
ORDER BY pg_relation_size(indexrelid) DESC;

-- 退出 psql
\q
```

### 验证清单
- [x] 已连接到数据库
- [x] user_roles 索引已创建
- [x] role_permissions 索引已创建
- [x] positions 索引已创建
- [x] asset_prices 索引已创建
- [x] 所有索引大小正常（< 10MB）

---

## 📌 P1-2：N+1 查询优化（4 小时 - 较复杂）

### 步骤 1：分析当前查询
```bash
# 启用详细日志
cd backend
LOG_LEVEL=debug npm run dev > /tmp/backend.debug.log 2>&1 &
sleep 5

# 访问投资组合列表
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/portfolios

# 查看执行了多少条 SQL 查询
grep "Query:" /tmp/backend.debug.log | wc -l
# 应该显示 11+ 条（1 个组合查询 + 10 个持仓查询）
```

### 步骤 2：备份原文件
```bash
cp backend/src/services/PortfolioService.ts \
   backend/src/services/PortfolioService.ts.backup

cp backend/src/services/HoldingService.ts \
   backend/src/services/HoldingService.ts.backup
```

### 步骤 3：修改 PortfolioService（见 OPTIMIZATION_RECOMMENDATIONS.md P1-2 部分）

**关键改动：**
- 添加 `getPortfoliosWithHoldingsSummary` 方法，使用单条 SQL JOIN
- 在 `getPortfolios` controller 中使用新方法

### 步骤 4：修改 HoldingService（如需要）

**关键改动：**
- 优化 `getHoldingsByPortfolio` 中的汇率查询

### 步骤 5：创建数据库视图（可选但推荐）
```sql
-- 创建投资组合汇总视图
CREATE OR REPLACE VIEW v_portfolio_summary AS
SELECT 
  p.id,
  p.user_id,
  p.name,
  p.base_currency,
  p.sort_order,
  COUNT(DISTINCT pos.id) as holding_count,
  COALESCE(SUM(pos.quantity), 0) as total_quantity,
  COALESCE(SUM(pos.total_cost), 0) as total_cost,
  COALESCE(SUM(pos.quantity * ap.close_price), 0) as total_market_value
FROM portfolios p
LEFT JOIN positions pos ON p.id = pos.portfolio_id AND pos.is_active = true
LEFT JOIN asset_prices ap ON pos.asset_id = ap.asset_id 
  AND ap.price_date = (
    SELECT MAX(price_date) FROM asset_prices WHERE asset_id = pos.asset_id
  )
WHERE p.is_active = true
GROUP BY p.id, p.user_id, p.name, p.base_currency, p.sort_order;
```

### 步骤 6：测试和验证
```bash
# 重启后端
pkill -f "npm run dev"
sleep 2
cd backend && npm run dev > /tmp/backend.log 2>&1 &
sleep 5

# 再次检查查询数量
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/portfolios

# 应该只看到 2-3 条查询（显著减少）
grep "SELECT" /tmp/backend.log | wc -l

# 查看响应时间（应该从 500-2000ms 降到 50-100ms）
time curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/portfolios
```

### 性能对比
```bash
# 修改前（使用备份文件）
cp backend/src/services/PortfolioService.ts.backup \
   backend/src/services/PortfolioService.ts
npm run dev &
time curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/portfolios
# 记录时间

# 修改后
cp backend/src/services/PortfolioService.ts.new \
   backend/src/services/PortfolioService.ts
npm run dev &
time curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/portfolios
# 记录时间，应该快 10 倍
```

### 验证清单
- [x] 原文件已备份
- [x] 新的查询方法已实现
- [x] 数据库索引已创建
- [x] 查询数量从 11+ 减少到 2-3
- [x] 响应时间提升 10 倍
- [x] 单元测试通过
- [x] 集成测试通过

---

## 📌 P1-4：汇率批量查询（1 小时）

### 步骤 1：备份文件
```bash
cp backend/src/services/ExchangeRateService.ts \
   backend/src/services/ExchangeRateService.ts.backup

cp backend/src/services/HoldingService.ts \
   backend/src/services/HoldingService.ts.backup
```

### 步骤 2：在 ExchangeRateService 中添加批量方法
```typescript
// 见 OPTIMIZATION_RECOMMENDATIONS.md P1-4 部分
```

### 步骤 3：在 HoldingService 中使用批量方法
```typescript
// 收集所有需要的汇率对
const currencyPairs = positions
  .filter(p => p.currency !== portfolioCurrency)
  .map(p => ({ from: p.currency, to: portfolioCurrency }));

// 一次性获取所有汇率
const ratesMap = await this.exchangeRateService.getExchangeRatesBatch(currencyPairs);
```

### 步骤 4：测试
```bash
# 重启后端
pkill -f "npm run dev"
cd backend && npm run dev > /tmp/backend.log 2>&1 &
sleep 5

# 测试汇率查询
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/holdings?portfolioId=xxx

# 查看日志中有多少次汇率 API 调用
grep "exchange_rate\|getExchangeRate" /tmp/backend.log
# 应该只看到 1 次批量调用，而不是 N 次单个调用
```

### 验证清单
- [x] 原文件已备份
- [x] getExchangeRatesBatch 方法已实现
- [x] HoldingService 已调整为使用批量方法
- [x] 汇率查询从 N 次减少到 1 次
- [x] 缓存命中率提高

---

## ✅ 整体验证检清单

### 第 1 天（P1-1, P1-3, P1-4 索引）
```bash
□ 权限缓存已改为 1800s
□ 前端已添加 30s 超时
□ 数据库索引已创建
□ 后端已重启
□ 前端已重启
□ 权限查询时间：50ms → 1-5ms ✓
□ 没有"无限加载"现象 ✓
```

### 第 2-3 天（P1-2）
```bash
□ PortfolioService 已修改（N+1 查询优化）
□ HoldingService 已修改
□ 备份文件已验证
□ 单元测试通过 (> 95%)
□ 投资组合列表查询：500-2000ms → 50-100ms ✓
□ 数据库查询数：11+ → 2-3 ✓
```

### 第 4 天（P1-4 汇率）
```bash
□ ExchangeRateService 添加了批量方法
□ HoldingService 已修改使用批量方法
□ 汇率查询：N 次 → 1 次 ✓
□ 集成测试通过 (> 95%) ✓
```

### 全部完成
```bash
□ 系统性能提升 80% ✓
□ 没有新的 bug ✓
□ 所有测试通过 ✓
□ 没有回滚变更 ✓
□ 更新了 CHANGELOG.md ✓
```

---

## 🔄 回滚计划

如果出现问题，立即回滚：

```bash
# 回滚 P1-1（权限缓存）
cp backend/src/services/PermissionService.ts.backup \
   backend/src/services/PermissionService.ts

# 回滚 P1-2（N+1 查询）
cp backend/src/services/PortfolioService.ts.backup \
   backend/src/services/PortfolioService.ts
cp backend/src/services/HoldingService.ts.backup \
   backend/src/services/HoldingService.ts

# 回滚 P1-4（汇率查询）
cp backend/src/services/ExchangeRateService.ts.backup \
   backend/src/services/ExchangeRateService.ts

# 重启服务
pkill -f "npm run dev"
sleep 2
cd backend && npm run dev &
cd frontend && npm run dev &
```

---

## 📊 性能基准测试

### 测试脚本
```bash
#!/bin/bash
# save as: benchmark.sh

TOKEN="your_token_here"
ENDPOINT="http://localhost:8000/api/portfolios"

echo "性能基准测试"
echo "============"

for i in {1..5}; do
  echo "第 $i 次请求："
  time curl -s -H "Authorization: Bearer $TOKEN" $ENDPOINT > /dev/null
done

# 压力测试（10 个并发请求）
echo ""
echo "压力测试（10 并发）："
ab -n 100 -c 10 -H "Authorization: Bearer $TOKEN" $ENDPOINT
```

### 运行基准测试
```bash
chmod +x benchmark.sh
./benchmark.sh
```

---

## 🎓 学到了什么？

完成这些优化后，你会理解：

✅ 缓存策略的重要性
✅ N+1 查询问题和如何避免
✅ 如何使用 AbortController 实现超时
✅ 数据库索引的作用
✅ 性能优化的优先级排序
✅ 如何验证和测试优化成果

---

## 📖 下一步

完成 P1 优化后：
1. 阅读 OPTIMIZATION_RECOMMENDATIONS.md 了解 P2 优化
2. 考虑实施 P2-1（Redis 缓存）以支持多实例
3. 设置性能监控（见 P2 的性能监控章节）
4. 定期检查慢查询日志，找出新的瓶颈

---

✨ **现在就开始优化吧！** 🚀

有任何问题，参考完整文档：
- OPTIMIZATION_SUMMARY.md - 总结
- QUICK_OPTIMIZATION_GUIDE.md - 快速参考
- OPTIMIZATION_RECOMMENDATIONS.md - 详细方案
- OPTIMIZATION_ROADMAP.md - 执行计划
