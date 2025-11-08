# 优化执行路线图

## 📅 4 周优化计划

```
┌─────────────────────────────────────────────────────────────────┐
│ 第 1 周：基础优化（收益 80%，时间 1 周）                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ Mon (P1-1) [15min]  权限缓存优化                                  │
│  └─ 修改：backend/src/services/PermissionService.ts              │
│  └─ 效果：权限查询 50ms → 5ms                                   │
│  └─ 风险：低                                                     │
│                                                                   │
│ Tue (P1-3) [10min]  前端超时控制                                  │
│  └─ 修改：frontend/src/services/api.ts                           │
│  └─ 效果：无限等待 → 30s 超时提示                               │
│  └─ 风险：低                                                     │
│                                                                   │
│ Wed (P1-4) [5min]   数据库索引                                    │
│  └─ 修改：PostgreSQL 数据库                                      │
│  └─ 效果：权限查询加速 20%                                      │
│  └─ 风险：无                                                     │
│                                                                   │
│ Thu-Fri (P1-2) [4h] N+1 查询优化（核心工作）                     │
│  └─ 修改：backend/src/services/PortfolioService.ts               │
│  └─        backend/src/services/HoldingService.ts                │
│  └─ 效果：500-2000ms → 50-100ms（10 倍加速）                    │
│  └─ 风险：中等（需要测试）                                       │
│  └─ 测试：./scripts/test-optimization.sh                        │
│                                                                   │
│ ✅ 第 1 周总结：系统性能提升 80%，用户体验大幅改善               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 第 2 周：稳定性增强（收益 15%，时间 1 周）                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ Mon-Tue (P1-4) [1h] 汇率批量查询优化                             │
│  └─ 修改：backend/src/services/ExchangeRateService.ts            │
│  └─        backend/src/services/HoldingService.ts                │
│  └─ 效果：汇率查询减少 90%                                      │
│  └─ 风险：低                                                     │
│                                                                   │
│ Wed (P2-4) [15min]  日志级别优化                                  │
│  └─ 修改：backend/.env                                           │
│  └─        backend/src/services/DatabaseService.ts              │
│  └─ 效果：减少 30% I/O 开销                                     │
│  └─ 风险：低                                                     │
│                                                                   │
│ Thu-Fri (P2-1) [2h] Redis 缓存集成                               │
│  └─ 前置：部署 Redis 服务                                        │
│  └─ 修改：backend/src/services/CacheService.ts                   │
│  └─        backend/src/services/PermissionService.ts             │
│  └─ 效果：多实例共享缓存，缓存命中率 95%+                       │
│  └─ 风险：中等（需要处理 Redis 失败）                            │
│                                                                   │
│ ✅ 第 2 周总结：系统更加稳定，支持多实例部署                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 第 3 周：可扩展性改进（收益 5%，时间 1 周）                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ Mon-Tue (P2-2) [1h] 数据库连接池优化                             │
│  └─ 修改：backend/.env (DATABASE_URL)                            │
│  └─ 效果：支持 100+ 并发用户                                    │
│  └─ 风险：低                                                     │
│                                                                   │
│ Wed-Thu (P2-3) [1h] API 分层加载实现                             │
│  └─ 修改：frontend/src/components/charts/ChartDashboard.tsx      │
│  └─ 效果：首屏加载 3-5s → 1-2s                                  │
│  └─ 风险：低                                                     │
│                                                                   │
│ Fri (性能测试) [1h]  性能回归测试                                │
│  └─ 测试：./scripts/performance-test.sh                          │
│  └─ 验证：API 延迟、数据库查询数、缓存命中率                    │
│  └─ 生成：性能报告 (performance-report.md)                      │
│                                                                   │
│ ✅ 第 3 周总结：系统支持生产级别的并发和负载                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 第 4 周：监控和文档                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ Mon-Fri (性能监控) [2h]                                          │
│  └─ 添加：Prometheus 指标收集                                    │
│  └─ 修改：backend/src/middleware/performanceMonitor.ts           │
│  └─        frontend/src/utils/performanceMonitoring.ts           │
│  └─ 效果：实时监控系统性能，快速发现问题                        │
│                                                                   │
│ 文档和总结 [1h]                                                  │
│  └─ 更新：README.md (性能数据)                                   │
│  └─ 总结：优化成果 (OPTIMIZATION_RESULTS.md)                    │
│  └─ 维护：优化清单 (MAINTENANCE_CHECKLIST.md)                   │
│                                                                   │
│ ✅ 第 4 周总结：系统完全优化，可进入生产环境                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 性能改进曲线

```
响应时间 (ms)
  2000 │                          ╭─────────── P3 优化
       │                    ╭─────╯           (长期)
       │              ╭─────╯
  1500 │         ╭────╯       └─ P2 优化完成
       │    ╭────╯
       │ ╭──╯
  1000 │╭╯      └─ P1 优化第 1 天
       ││         (权限缓存 + 超时)
   500 │└─────── P1 优化完成
       │          (N+1 查询修复)
     0 │─────────────────────────────
       ↓ 时间 ─────────────────────→
      第1周   第2周   第3周   第4周
```

---

## 🎯 每个优化的具体步骤

### P1-1：权限缓存优化（15 分钟）

**Step 1:** 找到权限查询的缓存设置
```bash
grep -n "hasPermission.*set" backend/src/services/PermissionService.ts
# 输出应该显示第 264 行附近
```

**Step 2:** 修改缓存时间
```diff
- this.cacheService.set(cacheKey, hasPermission, 60);
+ this.cacheService.set(cacheKey, hasPermission, 1800);
```

**Step 3:** 添加权限变更时的缓存清除
```typescript
async updateUserPermission(userId: string, ...) {
  // ... 更新逻辑 ...
  
  // 清除该用户的所有权限缓存
  const keys = this.cacheService.keys();
  const userKeys = keys.filter(k => k.startsWith(`${userId}:`));
  userKeys.forEach(k => this.cacheService.del(k));
}
```

**Step 4:** 测试
```bash
# 启动后端
cd backend && npm run dev

# 在另一个终端测试
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/portfolios

# 查看日志中的耗时（应该从 50ms 降到 1-5ms）
tail -f /tmp/backend.log | grep -i duration
```

---

### P1-2：N+1 查询优化（4 小时）

**Step 1:** 分析当前查询
```bash
# 启用 Prisma 查询日志
LOG_LEVEL=debug npm run dev

# 观察投资组合列表加载时执行了多少条查询
# 应该看到 1 条 SELECT * FROM portfolios
#       + N 条 SELECT * FROM positions WHERE portfolio_id = ...
```

**Step 2:** 创建新的联合查询
```typescript
// backend/src/services/PortfolioService.ts

async getPortfoliosWithHoldingsSummary(userId: string) {
  // 单条 SQL 查询，包含所有必要的数据
  const query = `
    SELECT 
      p.*,
      COUNT(DISTINCT pos.id) as holding_count,
      SUM(pos.quantity * ap.close_price) as total_market_value
    FROM portfolios p
    LEFT JOIN positions pos ON p.id = pos.portfolio_id
    LEFT JOIN asset_prices ap ON pos.asset_id = ap.asset_id
    WHERE p.user_id = $1
    GROUP BY p.id
  `;
  
  return await databaseService.executeRawQuery(query, [userId]);
}
```

**Step 3:** 更新 API 使用新方法
```typescript
// backend/src/controllers/PortfolioController.ts

async getPortfolios(req, res) {
  const portfolios = await this.portfolioService
    .getPortfoliosWithHoldingsSummary(userId);  // 使用新方法
  
  res.json({ success: true, data: portfolios });
}
```

**Step 4:** 添加数据库索引
```sql
CREATE INDEX idx_positions_portfolio_id 
ON positions(portfolio_id) WHERE is_active = true;

CREATE INDEX idx_asset_prices_asset_id_date 
ON asset_prices(asset_id, price_date DESC);
```

**Step 5:** 性能验证
```bash
# 对比修改前后的耗时
# 应该从 500-2000ms 降到 50-100ms

ab -n 100 -c 10 \
  -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/portfolios
```

---

### P1-3：前端超时控制（10 分钟）

**Step 1:** 修改 api.ts 中的 apiRequest 函数
```typescript
export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<T> => {
  const timeout = options.timeout || 30000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...config,
      signal: controller.signal,  // 关键：添加这行
    });
    clearTimeout(timeoutId);
    // ... 处理响应 ...
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
};
```

**Step 2:** 在 ChartDashboard 中处理超时
```typescript
try {
  setLoading(true);
  const portfolios = await apiRequest('/portfolios', { timeout: 10000 });
  // ...
} catch (error) {
  if (error.message.includes('timeout')) {
    message.error('数据加载超时，请检查网络连接');
  } else {
    message.error('数据加载失败');
  }
  setChartData(getEmptyData());
} finally {
  setLoading(false);
}
```

**Step 3:** 测试超时处理
```javascript
// 在浏览器控制台中测试
// Chrome DevTools → Network → Throttle 选择 Slow 4G
// 或使用 Puppeteer 模拟慢速网络
```

---

### P1-4：汇率批量查询（1 小时）

**Step 1:** 修改 ExchangeRateService
```typescript
async getExchangeRatesBatch(
  pairs: Array<{ from: string; to: string }>
): Promise<Map<string, number>> {
  // 去重
  const uniquePairs = [...new Set(
    pairs.map(p => `${p.from}-${p.to}`)
  )];

  // 批量查询不在缓存中的汇率
  const missingPairs = uniquePairs.filter(pair => 
    !this.cacheService.has(`rate:${pair}`)
  );

  if (missingPairs.length > 0) {
    // 一次性从 API 获取所有缺失的汇率
    const rates = await this.fetchRatesFromAPI(missingPairs);
    
    // 缓存结果
    rates.forEach((rate, pair) => {
      this.cacheService.set(`rate:${pair}`, rate, 3600);
    });
  }

  // 构建返回数据
  const result = new Map<string, number>();
  uniquePairs.forEach(pair => {
    result.set(pair, this.cacheService.get(`rate:${pair}`) || 1);
  });

  return result;
}
```

**Step 2:** 更新 HoldingService 使用批量方法
```typescript
async getHoldingsByPortfolio(userId: string, portfolioId: string) {
  const positions = await this.fetchPositions(portfolioId);

  // 收集所有汇率对
  const currencyPairs = [
    ...new Set(
      positions
        .filter(p => p.currency !== portfolioCurrency)
        .map(p => ({ from: p.currency, to: portfolioCurrency }))
    )
  ];

  // 批量获取汇率（单次调用）
  const ratesMap = await this.exchangeRateService.getExchangeRatesBatch(currencyPairs);

  // 应用汇率
  return positions.map(pos => ({
    ...pos,
    exchangeRate: ratesMap.get(`${pos.currency}-${portfolioCurrency}`) || 1,
  }));
}
```

**Step 3:** 验证效果
```bash
# 汇率查询应该从 N 次（每个持仓一次）减少到 1 次
LOG_LEVEL=debug npm run dev
# 查看日志中的汇率 API 调用次数
```

---

## 📈 性能指标收集

### 添加性能监控中间件
```typescript
// backend/src/middleware/performanceMonitor.ts

export const performanceMonitor = (req, res, next) => {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
    
    // 记录慢查询
    if (duration > 1000) {
      logger.warn(`Slow: ${req.method} ${req.path} - ${duration.toFixed(2)}ms`);
    }

    // 发送到监控系统
    metrics.recordRequestDuration(req.path, duration);
  });

  next();
};
```

### 前端性能跟踪
```typescript
// frontend/src/utils/performanceMonitoring.ts

export const recordApiMetric = async (
  endpoint: string,
  fn: () => Promise<any>
) => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    console.log(`API: ${endpoint} - ${duration.toFixed(2)}ms`);
    
    if (duration > 2000) {
      console.warn(`⚠️ Slow API: ${endpoint}`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`❌ Error: ${endpoint} after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
};
```

---

## ✅ 优化验证清单

### 第 1 周验收标准
- [ ] 权限查询延迟 < 5ms（从缓存）
- [ ] 投资组合列表查询 < 100ms
- [ ] 前端请求有 30 秒超时
- [ ] 数据库索引已创建
- [ ] N+1 查询已修复（总查询数 < 5）
- [ ] 单元测试通过率 > 95%

### 第 2 周验收标准
- [ ] Redis 缓存运行正常
- [ ] 缓存命中率 > 80%
- [ ] 汇率查询只执行 1 次
- [ ] 日志 I/O 减少 30%
- [ ] 集成测试通过率 > 95%

### 第 3 周验收标准
- [ ] 单实例支持 100+ 并发用户
- [ ] API 首屏加载 < 2s
- [ ] 数据库连接池未耗尽
- [ ] 性能测试通过所有指标

### 第 4 周验收标准
- [ ] 性能监控系统运行
- [ ] 文档完整更新
- [ ] 优化成果总结完成
- [ ] 维护流程文档化

---

## 🚨 风险管理

### 可能的问题及应对

**问题 1：修改后出现数据不一致**
```
原因：缓存过期时间不同步
解决：
  - 实现缓存预热机制
  - 数据更新时主动清除缓存
  - 定期校验缓存和数据库一致性
```

**问题 2：Redis 服务故障**
```
原因：Redis 连接失败
解决：
  - 配置自动重连
  - 降级到本地缓存
  - 监控 Redis 健康状态
```

**问题 3：数据库连接数增加**
```
原因：优化增加了数据库访问
解决：
  - 调整连接池大小
  - 启用连接复用
  - 监控连接数
```

**问题 4：某些用户报告变慢**
```
原因：用户的数据量特别大
解决：
  - 实现分页加载
  - 添加数据量限制
  - 针对大数据集优化查询
```

---

## 📞 支持资源

- **详细优化方案：** `/OPTIMIZATION_RECOMMENDATIONS.md`
- **快速参考指南：** `/QUICK_OPTIMIZATION_GUIDE.md`
- **性能测试脚本：** `/scripts/performance-test.sh`
- **监控仪表板：** (将在 P4 实施)

---

## 🎓 学习资源

- PostgreSQL 索引优化：https://www.postgresql.org/docs/current/indexes.html
- Prisma 性能优化：https://www.prisma.io/docs/concepts/components/prisma-client/performance-optimization
- Redis 缓存策略：https://redis.io/docs/manual/client-side-caching/
- Node.js 性能优化：https://nodejs.org/en/docs/guides/simple-profiling/

---

## 📝 提交规范

每个优化完成后，提交 Git commit：

```bash
git commit -m "opt: P1-1 权限缓存优化 (60s → 1800s)

- 增加权限缓存时间到 30 分钟
- 添加权限变更时的缓存清除
- 性能提升：50ms → 5ms（40 倍）
- 测试通过率：100%
- 数据库查询减少：90%

Closes #ISSUE_NUMBER"
```

---

**准备好开始优化了吗？从 P1-1 开始！** 🚀
