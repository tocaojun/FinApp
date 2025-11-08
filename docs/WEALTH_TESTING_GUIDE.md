# 财富产品系统测试指南

**目的**: 验证财富产品管理系统的各项功能正常运作  
**测试环境**: 开发环境 (localhost)  
**预计时间**: 30-45分钟

---

## 📋 前置准备

### 1. 启动服务

```bash
# 终端1: 启动后端服务
cd backend
npm run dev
# 等待: "listening on port 3000"

# 终端2: 启动前端服务
cd frontend
npm run dev
# 等待: "VITE v5.0.8 ready in xxx ms"
```

### 2. 获取测试令牌

```bash
# 创建测试用户或获取现有用户的登录令牌
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# 保存响应中的 token，供后续请求使用
export TOKEN="eyJhbGciOiJIUzI1NiIs..."
```

### 3. 准备测试数据

```sql
-- 在数据库中插入测试产品
INSERT INTO finapp.assets (id, user_id, name, asset_type, created_at)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  '<your-user-id>'::uuid,
  '测试分红产品',
  'WEALTH_PRODUCT',
  CURRENT_TIMESTAMP
);

INSERT INTO finapp.wealth_product_details (
  asset_id, product_name, product_subtype, issuer,
  expected_return, total_investment, current_value
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  '测试分红产品',
  'DIVIDEND',
  '测试银行',
  5.0,
  100000,
  102500
);
```

---

## 🧪 功能测试

### Test 1: 获取产品汇总

**目的**: 验证产品汇总接口功能

```bash
# 请求
curl -X GET http://localhost:3000/api/wealth/users/<user-id>/summary \
  -H "Authorization: Bearer $TOKEN"

# 预期响应
{
  "success": true,
  "data": {
    "summary": {
      "totalProducts": 1,
      "productsByType": {
        "DIVIDEND": 1
      },
      "products": [
        {
          "assetId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
          "name": "测试分红产品",
          "type": "WEALTH_PRODUCT",
          "subtype": "DIVIDEND",
          "issuer": "测试银行",
          "expectedReturn": 5,
          "totalInvestment": 100000,
          "dividendsReceived": 0,
          "currentValue": 102500,
          "transactionCount": 0,
          "lastTransactionDate": null
        }
      ]
    }
  }
}

# 验证点
✓ status code: 200
✓ success: true
✓ totalProducts > 0
✓ products 数组非空
```

---

### Test 2: 分红型产品收益对比

**目的**: 验证分红型产品收益计算

```bash
# 记录分红交易
curl -X POST http://localhost:3000/api/wealth/transaction \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "type": "DIVIDEND",
    "date": "2025-11-01",
    "amount": 1500,
    "dividendRate": 3.0,
    "notes": "第一次分红"
  }'

# 预期响应
{
  "success": true,
  "message": "Transaction recorded successfully"
}

# 获取收益对比
curl -X POST http://localhost:3000/api/wealth/dividend/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11/comparison \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "investment": 100000,
    "expectedReturn": 5,
    "startDate": "2025-01-01"
  }'

# 预期响应
{
  "success": true,
  "data": {
    "productType": "DIVIDEND",
    "totalDividends": 1500,
    "expectedReturn": 5000,
    "actualReturn": 1500,
    "deviation": -3500,
    "deviationRatio": -70,
    "status": "ALERT",
    "analysis": {
      "status": "ALERT",
      "deviationPercentage": "-70.00",
      "recommendation": "收益偏差严重，建议咨询经理或考虑赎回",
      "alert": true
    }
  }
}

# 验证点
✓ totalDividends: 1500
✓ deviation < 0 (表示收益不足)
✓ status: ALERT (偏差超过-50%)
✓ recommendation 包含建议文本
```

---

### Test 3: 净值型产品收益对比

**目的**: 验证净值型产品收益计算

```bash
# 创建净值产品
INSERT INTO finapp.wealth_product_details (
  asset_id, product_name, product_subtype, issuer,
  expected_return, total_investment, current_value
) VALUES (
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,
  '测试净值产品',
  'NAV',
  '测试基金公司',
  6.0,
  100000,
  105000
);

# 记录净值历史
curl -X POST http://localhost:3000/api/wealth/transaction \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    "type": "PURCHASE",
    "date": "2025-11-01",
    "amount": 100000,
    "quantity": 10000,
    "navPerShare": 10.0,
    "notes": "初始购买"
  }'

# 获取收益对比
curl -X POST http://localhost:3000/api/wealth/nav/b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22/comparison \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "investment": 100000,
    "purchaseNav": 10.0,
    "expectedAnnualReturn": 6,
    "holdingDays": 7
  }'

# 预期响应包含
✓ productType: NAV
✓ gainAmount: > 0 (正收益)
✓ gainRate: 接近5%
✓ status: NORMAL (收益正常)
```

---

### Test 4: 偏差分析

**目的**: 验证偏差原因分析

```bash
# 获取分析结果
curl -X GET http://localhost:3000/api/wealth/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11/analysis \
  -H "Authorization: Bearer $TOKEN"

# 预期响应
{
  "success": true,
  "data": {
    "assetId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "analysis": {
      "level": "ALERT",
      "threshold": "±10%",
      "reasons": ["分红延迟"],
      "recommendation": "收益偏差严重，建议咨询经理或考虑赎回",
      "trend": [2.1, 1.8, 3.2, -0.5],
      "trendSummary": "偏差相对稳定"
    }
  }
}

# 验证点
✓ level 为三个级别之一
✓ reasons 是数组格式
✓ recommendation 不为空
✓ trend 包含数值
```

---

### Test 5: 收益趋势

**目的**: 验证历史数据查询

```bash
# 插入净值历史数据
INSERT INTO finapp.wealth_product_nav_history (
  asset_id, nav_date, nav_per_share, daily_return, holding_period_return
) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, '2025-11-01', 10.00, 0.0, 0.0),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, '2025-11-02', 10.05, 0.5, 0.5),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, '2025-11-03', 10.12, 0.7, 1.2);

# 获取趋势数据
curl -X GET "http://localhost:3000/api/wealth/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11/trend?days=30&groupBy=daily" \
  -H "Authorization: Bearer $TOKEN"

# 预期响应
{
  "success": true,
  "data": {
    "assetId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "period": "30 days",
    "granularity": "daily",
    "data": [
      {
        "date": "2025-11-01",
        "nav": "10.0000",
        "dailyReturn": "0.00",
        "cumulativeReturn": "0.00"
      },
      {
        "date": "2025-11-02",
        "nav": "10.0500",
        "dailyReturn": "0.50",
        "cumulativeReturn": "0.50"
      }
    ]
  }
}

# 验证点
✓ data 数组长度 > 0
✓ 每条记录包含 date, nav, dailyReturn, cumulativeReturn
✓ 时间序列正确
```

---

### Test 6: 告警管理

**目的**: 验证告警系统

```bash
# 获取用户告警
curl -X GET "http://localhost:3000/api/wealth/users/<user-id>/alerts?days=30&status=ACTIVE" \
  -H "Authorization: Bearer $TOKEN"

# 预期响应
{
  "success": true,
  "data": {
    "userId": "<user-id>",
    "total": 1,
    "alerts": [
      {
        "id": "alert-uuid",
        "assetId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "alertLevel": "ALERT",
        "message": "🚨 告警 - 测试分红产品: 偏差: -70.00%",
        "deviationRatio": -70,
        "recommendation": "收益偏差严重，建议咨询经理或考虑赎回",
        "triggeredAt": "2025-11-08T10:30:00Z",
        "status": "ACTIVE"
      }
    ]
  }
}

# 获取告警统计
curl -X GET "http://localhost:3000/api/wealth/users/<user-id>/alerts/stats" \
  -H "Authorization: Bearer $TOKEN"

# 预期响应
{
  "success": true,
  "data": {
    "userId": "<user-id>",
    "stats": {
      "total": 10,
      "active": 3,
      "byLevel": {
        "NORMAL": { "total": 2, "active": 0 },
        "WARNING": { "total": 5, "active": 2 },
        "ALERT": { "total": 3, "active": 1 }
      }
    }
  }
}

# 确认告警
curl -X PUT "http://localhost:3000/api/wealth/alerts/<alert-id>/acknowledge" \
  -H "Authorization: Bearer $TOKEN"

# 预期响应
{
  "success": true,
  "message": "Alert acknowledged"
}

# 解决告警
curl -X PUT "http://localhost:3000/api/wealth/alerts/<alert-id>/resolve" \
  -H "Authorization: Bearer $TOKEN"

# 验证点
✓ 告警成功保存
✓ 告警状态可以改变
✓ 统计数据准确
```

---

### Test 7: 前端UI测试

**目的**: 验证前端组件显示

```
步骤：
1. 打开浏览器 http://localhost:5173
2. 登录到应用
3. 导航到财富产品管理页面

验证内容：
✓ 汇总卡片显示正确的数据
  - 累计投资: ¥100,000
  - 当前资产: ¥102,500
  - 累计分红: ¥1,500
  - 总收益率: 2.50%

✓ 产品列表显示
  - 产品名称可点击
  - 类型标签显示正确
  - 发行机构显示
  - 投资金额和当前价值

✓ 收益对比选项卡
  - 显示偏差进度条
  - 显示建议文本
  - 显示告警级别

✓ 趋势分析选项卡
  - 净值走势折线图显示
  - 日收益率柱状图显示
  - 时间标签正确

✓ 交易记录Modal
  - 表单字段完整
  - 可以提交交易
  - 成功提示显示

✓ 过滤和刷新功能
  - 产品类型过滤工作
  - 刷新按钮更新数据
```

---

## 🔍 API 集成测试

### Postman/Insomnia 集合

```json
{
  "name": "Wealth Product System",
  "item": [
    {
      "name": "1. Get Product Summary",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/wealth/users/{{userId}}/summary",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "wealth", "users", "{{userId}}", "summary"]
        }
      }
    },
    {
      "name": "2. Record Transaction",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"assetId\": \"{{assetId}}\",\n  \"type\": \"DIVIDEND\",\n  \"date\": \"2025-11-08\",\n  \"amount\": 1500\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/wealth/transaction",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "wealth", "transaction"]
        }
      }
    }
  ]
}
```

---

## 📊 性能测试

### 并发请求测试

```bash
# 使用 Apache Bench 进行负载测试
ab -n 1000 -c 10 -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/wealth/users/<user-id>/summary

# 预期结果
✓ Requests per second: > 100
✓ Failed requests: 0
✓ Mean time per request: < 100ms
```

### 数据库查询性能

```bash
# 在数据库中查询执行时间
EXPLAIN ANALYZE
SELECT * FROM finapp.wealth_product_details
WHERE user_id = '<user-id>';

# 预期
✓ Execution time: < 50ms
✓ Rows: 少于1000
```

---

## 🐛 常见问题排查

### 问题1: API 返回 401

```
排查步骤：
1. 检查 token 是否过期
2. 重新登录获取新 token
3. 检查 Authorization 头格式
4. 验证用户权限
```

### 问题2: 前端无法加载组件

```
排查步骤：
1. 检查浏览器控制台错误
2. 验证 API 调用是否成功
3. 检查数据格式是否匹配
4. 清除浏览器缓存
```

### 问题3: 监控告警未生成

```
排查步骤：
1. 检查 ENABLE_WEALTH_MONITORING=true
2. 查看后端日志中的监控信息
3. 验证产品数据完整性
4. 手动触发 checkAllProducts()
```

---

## ✅ 测试检查清单

在完成所有测试后，使用此清单确保一切正常：

- [ ] 产品汇总 API 返回正确数据
- [ ] 分红型产品收益计算准确
- [ ] 净值型产品收益计算准确
- [ ] 偏差分析显示合理的原因
- [ ] 收益趋势数据完整
- [ ] 告警系统正常工作
- [ ] 告警管理功能可用
- [ ] 前端UI显示美观
- [ ] 所有表单提交成功
- [ ] 权限验证正常
- [ ] 错误处理得当
- [ ] 性能指标达到要求

---

## 📈 测试结果记录

| 测试项 | 状态 | 备注 | 时间 |
|-------|------|------|------|
| Product Summary | ✅/❌ | | |
| Dividend Comparison | ✅/❌ | | |
| NAV Comparison | ✅/❌ | | |
| Deviation Analysis | ✅/❌ | | |
| Return Trend | ✅/❌ | | |
| Alert Management | ✅/❌ | | |
| Frontend UI | ✅/❌ | | |
| Performance | ✅/❌ | | |

---

## 🎯 通过标准

项目通过测试当且仅当：

1. ✅ 所有 6 个 API 端点功能正常
2. ✅ 前端组件显示和交互正常
3. ✅ 数据准确性验证通过
4. ✅ 性能指标达到要求
5. ✅ 无关键缺陷或错误

---

**最后更新**: 2025-11-08  
**测试环境**: localhost:3000 / localhost:5173  
**联系方式**: [支持信息]
