# Yahoo Finance API 限流规则和应对策略

## 📊 限流规则概述

### 基本信息
- **API 类型**: 非官方内部 API（无官方文档）
- **限流维度**: IP 地址
- **限流方式**: 滚动窗口
- **错误响应**: HTTP 429 "Too Many Requests"

### 估计的限流阈值

根据社区经验和测试：

| 时间窗口 | 请求限制 | 说明 |
|---------|---------|------|
| 每分钟 | ~100 请求 | 短期突发限制 |
| 每小时 | ~2,000 请求 | 中期限制 |
| 每天 | ~48,000 请求 | 日限制 |

⚠️ **注意**: 这些数值是估计值，Yahoo 可能随时调整。

## 🚨 触发限流的常见场景

### 1. 高频请求
```typescript
// ❌ 错误示例：快速连续请求
for (const symbol of symbols) {
  await fetchYahooData(symbol); // 无延迟
}
```

### 2. 批量历史数据
```typescript
// ❌ 错误示例：一次性请求大量历史数据
const period1 = Date.now() - 365 * 24 * 60 * 60 * 1000; // 1年前
const period2 = Date.now();
```

### 3. 缺少浏览器特征
```typescript
// ❌ 错误示例：没有 User-Agent
axios.get(url); // 容易被识别为爬虫
```

## ✅ 应对策略

### 策略 1: 请求速率控制

```typescript
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private requestsPerMinute = 50; // 保守值
  private minDelay = 60000 / this.requestsPerMinute; // 1200ms

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      if (!this.processing) {
        this.process();
      }
    });
  }

  private async process() {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const fn = this.queue.shift()!;
      await fn();
      
      // 添加延迟
      if (this.queue.length > 0) {
        await this.delay(this.minDelay);
      }
    }
    
    this.processing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 使用示例
const rateLimiter = new RateLimiter();

async function fetchWithRateLimit(symbol: string) {
  return rateLimiter.add(() => fetchYahooData(symbol));
}
```

### 策略 2: 指数退避重试

```typescript
async function fetchWithRetry(
  symbol: string,
  maxRetries = 3
): Promise<any> {
  const delays = [60000, 300000, 900000]; // 1分钟, 5分钟, 15分钟
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchYahooData(symbol);
    } catch (error: any) {
      if (error.response?.status === 429) {
        if (i < maxRetries - 1) {
          const delay = delays[i];
          console.log(`Rate limited. Retrying in ${delay/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw new Error('Rate limit exceeded after max retries');
        }
      } else {
        throw error;
      }
    }
  }
}
```

### 策略 3: 请求头优化

```typescript
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Referer': 'https://finance.yahoo.com/',
  'Origin': 'https://finance.yahoo.com',
  'Connection': 'keep-alive',
  'Cache-Control': 'no-cache',
};
```

### 策略 4: 智能缓存

```typescript
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class PriceCache {
  private cache = new Map<string, CacheEntry>();

  set(key: string, data: any, ttl: number) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
}

// 使用示例
const cache = new PriceCache();

async function fetchWithCache(symbol: string) {
  const cacheKey = `${symbol}_${new Date().toDateString()}`;
  
  // 检查缓存
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`Cache hit for ${symbol}`);
    return cached;
  }
  
  // 获取新数据
  const data = await fetchYahooData(symbol);
  
  // 缓存 15 分钟
  cache.set(cacheKey, data, 15 * 60 * 1000);
  
  return data;
}
```

### 策略 5: 批量请求优化

```typescript
async function batchFetch(symbols: string[]) {
  const BATCH_SIZE = 5;
  const BATCH_DELAY = 5000; // 5秒
  const results = [];
  
  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    const batch = symbols.slice(i, i + BATCH_SIZE);
    
    console.log(`Processing batch ${i/BATCH_SIZE + 1}/${Math.ceil(symbols.length/BATCH_SIZE)}`);
    
    // 并行处理批次内的请求
    const batchResults = await Promise.allSettled(
      batch.map(symbol => fetchWithRateLimit(symbol))
    );
    
    results.push(...batchResults);
    
    // 批次间延迟
    if (i + BATCH_SIZE < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }
  
  return results;
}
```

## 🔧 实施建议

### 短期改进（立即实施）

1. **添加请求延迟**
   ```typescript
   // 在 PriceSyncService.ts 中
   private async delay(ms: number) {
     return new Promise(resolve => setTimeout(resolve, ms));
   }
   
   // 每个请求后延迟
   await this.delay(1500); // 1.5秒
   ```

2. **优化请求头**（已实施 ✅）
   ```typescript
   headers: {
     'User-Agent': 'Mozilla/5.0...',
     'Accept': 'application/json',
   }
   ```

3. **改进错误处理**（已实施 ✅）
   ```typescript
   if (statusCode === 429) {
     throw new Error('Rate limit exceeded...');
   }
   ```

### 中期改进（1-2周内）

1. **实现速率限制器**
   - 创建 `RateLimiter` 类
   - 配置每分钟最大请求数
   - 自动排队和延迟请求

2. **添加缓存层**
   - 缓存日内数据 15 分钟
   - 缓存历史数据 1 小时
   - 使用 Redis 或内存缓存

3. **实现重试机制**
   - 指数退避策略
   - 最大重试次数限制
   - 记录重试日志

### 长期改进（1个月内）

1. **多数据源支持**
   - 东方财富（港股/A股）
   - Alpha Vantage（美股）
   - 自动切换数据源

2. **智能调度**
   - 非高峰时段同步
   - 优先级队列
   - 动态调整请求频率

3. **监控和告警**
   - 限流次数统计
   - 成功率监控
   - 自动告警机制

## 📊 监控指标

### 关键指标

```sql
-- 限流错误统计
SELECT 
  DATE(created_at) as date,
  COUNT(*) as rate_limit_errors
FROM finapp.price_sync_errors
WHERE error_type = 'api_limit'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 成功率统计
SELECT 
  DATE(started_at) as date,
  COUNT(*) as total_syncs,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM finapp.price_sync_logs
GROUP BY DATE(started_at)
ORDER BY date DESC;
```

## 🚀 快速恢复指南

### 遇到限流时的操作步骤

1. **立即停止所有同步任务**
   ```sql
   UPDATE finapp.price_sync_tasks 
   SET is_active = false 
   WHERE data_source_id IN (
     SELECT id FROM finapp.price_data_sources WHERE provider = 'yahoo_finance'
   );
   ```

2. **等待恢复（15-60分钟）**
   ```bash
   # 测试是否恢复
   curl -s "https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d" | head -20
   ```

3. **逐步恢复**
   ```sql
   -- 先启用一个低频任务测试
   UPDATE finapp.price_sync_tasks 
   SET is_active = true 
   WHERE id = 'test-task-id';
   ```

4. **监控恢复情况**
   ```sql
   -- 查看最近的同步日志
   SELECT * FROM finapp.price_sync_logs 
   ORDER BY started_at DESC 
   LIMIT 10;
   ```

## 📚 参考资料

- [Yahoo Finance API 社区讨论](https://github.com/ranaroussi/yfinance)
- [速率限制最佳实践](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
- [指数退避算法](https://en.wikipedia.org/wiki/Exponential_backoff)

---

**创建时间**: 2025-10-27  
**最后更新**: 2025-10-27  
**维护人员**: 开发团队  
**版本**: v1.0
