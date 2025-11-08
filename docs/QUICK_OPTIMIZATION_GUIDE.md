# 快速优化指南 - 5 分钟了解要点

## 🎯 系统当前的 3 大卡死原因

### 1️⃣ 权限检查太慢（每个请求都执行）
```
问题：每个 API 请求都执行 5 表 JOIN 查询
     缓存 60 秒后过期，立即重新查询
     
解决：增加缓存到 30 分钟
     权限变更时主动清除缓存
     
效果：50-200ms → 1-5ms（40 倍加速）
```

### 2️⃣ 数据库 N+1 查询问题
```
问题：获取 10 个投资组合的持仓
     执行 1 条查询获取组合 + 10 条查询获取持仓 = 11 条查询
     
解决：使用单条 SQL JOIN，一次获取所有数据
     
效果：11 次查询 → 2-3 次查询（90% 减少）
      500-2000ms → 50-100ms（10 倍加速）
```

### 3️⃣ 前端无限等待后端
```
问题：前端 fetch 没有超时设置
     后端卡住时，前端无限等待
     用户看到"加载中..."死界面
     
解决：设置 30 秒超时
     超时时显示错误提示
     
效果：无限等待 → 最多 30 秒显示超时提示
```

---

## 🚀 快速修复（优先级最高）

### 修复 1：权限缓存（15 分钟）
**文件：** `backend/src/services/PermissionService.ts`

**修改内容：**
```typescript
// 行 264：将缓存时间从 60 秒改为 1800 秒（30 分钟）
this.cacheService.set(cacheKey, hasPermission, 1800);  // 改这行
```

**验证：**
```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/portfolios
# 第一次：50ms
# 第二次：1ms（从缓存读取）
```

---

### 修复 2：前端超时控制（10 分钟）
**文件：** `frontend/src/services/api.ts`

**修改内容：**
```typescript
// 在 apiRequest 函数中添加超时
const timeout = options.timeout || 30000; // 默认 30 秒
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeout);

try {
  const response = await fetch(url, { 
    ...config, 
    signal: controller.signal  // 添加这行
  });
  clearTimeout(timeoutId);
  // ... 处理响应 ...
} catch (error) {
  if (error instanceof Error && error.name === 'AbortError') {
    throw new Error(`Request timeout after ${timeout}ms`);
  }
  throw error;
}
```

---

### 修复 3：数据库索引（5 分钟）
**文件：** 数据库

在 PostgreSQL 中执行：
```sql
-- 权限查询优化
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_active 
ON user_roles(user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id 
ON role_permissions(role_id);

-- 投资组合持仓查询优化
CREATE INDEX IF NOT EXISTS idx_positions_portfolio_active 
ON positions(portfolio_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_asset_prices_latest 
ON asset_prices(asset_id, price_date DESC);
```

---

## 📊 效果对比

### 修复前
```
加载投资组合列表：
  - 权限检查：100ms
  - 获取组合：50ms
  - 获取 10 个组合的持仓：1500ms（10×150ms）
  - 总计：1650ms

加载图表页面：
  - 调用 5 个 API：3000ms+
  - 如果任何 API 卡住：无限等待
```

### 修复后
```
加载投资组合列表：
  - 权限检查：2ms（从缓存）
  - 获取组合：50ms
  - 获取所有持仓：80ms（单条 SQL）
  - 总计：132ms（减少 92%）

加载图表页面：
  - 调用 5 个 API：1500ms
  - 如果 API 卡住：30 秒后显示超时提示
```

---

## ✅ 优化清单（按优先级）

### 第 1 天：立即实施（收益最大）
```
□ P1-1：权限缓存 60s → 1800s
  难度：⭐ | 时间：15 分钟 | 效果：40 倍加速
  
□ P1-3：前端超时控制
  难度：⭐ | 时间：10 分钟 | 效果：用户不再卡死
  
□ P1-4：数据库索引
  难度：⭐ | 时间：5 分钟 | 效果：权限查询加速
```

### 第 2 天：核心优化（最高收益）
```
□ P1-2：N+1 查询优化
  难度：⭐⭐⭐ | 时间：4 小时 | 效果：10 倍加速
  
□ P1-4：汇率批量查询
  难度：⭐⭐ | 时间：1 小时 | 效果：减少 90% 汇率查询
```

### 第 3-4 天：增强可靠性（可选）
```
□ P2-1：Redis 缓存层
  难度：⭐⭐⭐ | 时间：2 小时 | 效果：支持多实例

□ P2-4：优化日志级别
  难度：⭐ | 时间：15 分钟 | 效果：减少 I/O 开销
```

---

## 🔍 诊断工具

### 1. 检查权限查询耗时
```bash
# 查看后端日志中的查询耗时
tail -f /tmp/backend.log | grep -i "duration"
```

### 2. 监控数据库连接
```sql
-- 查看当前连接数
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;

-- 查看慢查询
SELECT query, mean_time FROM pg_stat_statements WHERE mean_time > 100;
```

### 3. 监控前端请求延迟
```javascript
// 在浏览器控制台中粘贴
window.addEventListener('fetch', (event) => {
  const start = performance.now();
  event.respondWith(
    event.request.clone()
      .then(response => {
        console.log(`${event.request.url}: ${performance.now() - start}ms`);
        return response;
      })
  );
});
```

### 4. 缓存命中率检查
```bash
# 查看 Redis 缓存统计
redis-cli INFO stats
# 查看 hits 和 misses 的比率
```

---

## 🎓 深入理解

### 为什么权限查询这么慢？
```
SELECT DISTINCT p.name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id          -- 1 个表
JOIN roles r ON ur.role_id = r.id                 -- 2 个表
JOIN role_permissions rp ON r.id = rp.role_id     -- 3 个表
JOIN permissions p ON rp.permission_id = p.id     -- 4 个表
WHERE u.id = ?                                     -- 5 个表

问题：每个请求都执行这个复杂 JOIN
     没有针对 user_id 的索引
     JOIN 操作是 O(n*m) 复杂度
```

### 为什么 N+1 查询这么慢？
```
for (const portfolio of portfolios) {
  // 数据库往返 N 次
  const holdings = await db.query(`
    SELECT * FROM positions 
    WHERE portfolio_id = ${portfolio.id}
  `);
}

问题：1 + N = 10 次网络往返
     每次都要建立连接、执行、返回数据
     连接开销很高（TLS 握手、认证等）
     
优化：使用 JOIN 一次获取所有数据
     1 次网络往返
     10 倍加速
```

### 为什么前端需要超时？
```
fetch(url)
  // 如果后端响应慢或卡住
  // fetch 会无限等待
  // 浏览器不会自动超时
  // 用户看到转圈转圈...（30 分钟）

解决：设置 AbortController 的超时
     30 秒后自动取消请求
     显示错误提示
     用户可以重试
```

---

## 💡 技巧

### 临时禁用权限检查来测试（仅开发用）
```typescript
// backend/src/middleware/permissionMiddleware.ts
if (process.env.NODE_ENV === 'development' && process.env.DISABLE_PERMISSION_CHECK === 'true') {
  // 跳过权限检查
  return next();
}
```

```bash
# 启动时禁用权限检查
DISABLE_PERMISSION_CHECK=true npm run dev
```

### 在 Chrome DevTools 中测试超时
```javascript
// 在控制台中执行，模拟网络延迟
// Settings → Throttling → Custom 选择 Slow 4G

// 或者使用 fetch 延迟
fetch('/api/test')
  .then(r => new Promise(resolve => {
    setTimeout(() => resolve(r), 10000); // 延迟 10 秒
  }))
```

---

## 📞 问题排查流程

```
系统卡死？
  ↓
1. 检查后端日志
   - 有没有权限查询？耗时多长？
   - 有没有数据库连接池耗尽？
   
2. 查询数据库
   - 有没有慢查询（>1s）？
   - 当前连接数是多少？
   
3. 检查前端
   - Network 标签中，API 请求什么时候返回？
   - 有没有超时？
   
4. 优化顺序
   - 权限查询慢？→ 增加缓存
   - 数据库查询多？→ 用 JOIN 替代循环
   - API 超时？→ 添加超时控制
```

---

## 🎯 成功标志

优化完成后，应该达到：
- ✅ 权限检查 < 5ms（从缓存）
- ✅ 投资组合列表加载 < 200ms
- ✅ 图表页面加载 < 2s
- ✅ 没有请求超过 30 秒
- ✅ 数据库查询数减少 90%
- ✅ 并发用户数从 5 提升到 50+

---

## 📚 相关文件

详细优化方案：`/OPTIMIZATION_RECOMMENDATIONS.md`
当前问题分析：`/analysis_report.md`（本文档）

开始优化吧！🚀
