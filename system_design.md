# 个人资产管理应用 - 系统架构设计

## 1. 系统架构概览

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        客户端层 (Client Layer)                    │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Web 前端      │   移动端 APP    │      微信小程序              │
│   React + TS    │  React Native   │   原生/Taro框架              │
└─────────────────┴─────────────────┴─────────────────────────────┘
                              │
                    ┌─────────────────┐
                    │   API 网关      │
                    │  (Nginx/Kong)   │
                    └─────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      应用服务层 (Application Layer)               │
├─────────────┬─────────────┬─────────────┬─────────────────────────┤
│  用户服务   │  交易服务   │  分析服务   │     管理员服务          │
│ User Service│Trade Service│Analytics    │   Admin Service         │
└─────────────┴─────────────┴─────────────┴─────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      数据服务层 (Data Layer)                     │
├─────────────┬─────────────┬─────────────┬─────────────────────────┤
│  数据同步   │  净值更新   │  汇率管理   │     缓存服务            │
│ Data Sync   │ NAV Update  │ FX Service  │   Memory Cache          │
└─────────────┴─────────────┴─────────────┴─────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      存储层 (Storage Layer)                      │
├─────────────┬─────────────┬─────────────┬─────────────────────────┤
│ PostgreSQL  │  内存缓存   │  文件存储   │     消息队列            │
│  主数据库   │ Node Cache  │   MinIO     │   RabbitMQ/Kafka        │
└─────────────┴─────────────┴─────────────┴─────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    外部服务层 (External Services)                 │
├─────────────┬─────────────┬─────────────┬─────────────────────────┤
│  富途API    │ Yahoo API   │  汇率API    │     通知服务            │
│ 港股/A股    │  美股数据   │  实时汇率   │   邮件/短信/推送        │
└─────────────┴─────────────┴─────────────┴─────────────────────────┘
```

### 1.2 技术栈选择

#### 前端技术栈
- **Web前端**: React 18 + TypeScript + Ant Design + Vite
- **移动端**: React Native + TypeScript + NativeBase
- **小程序**: Taro 3.x + React + TypeScript
- **状态管理**: Zustand / Redux Toolkit
- **图表库**: ECharts / Recharts
- **构建工具**: Vite / Metro

#### 后端技术栈
- **API框架**: Node.js + Fastify / Express
- **数据库**: PostgreSQL 15+
- **缓存**: 内存缓存 (node-cache)
- **消息队列**: RabbitMQ / Apache Kafka
- **文件存储**: MinIO / AWS S3
- **搜索引擎**: Elasticsearch (可选)

#### 基础设施
- **包管理**: Homebrew
- **服务管理**: launchd (macOS原生)
- **API网关**: Nginx (本地安装)
- **监控**: 应用日志 + 健康检查端点
- **日志**: 本地日志文件 + 日志轮转

## 2. 前端架构设计

### 2.1 Web前端架构

```
src/
├── components/           # 通用组件
│   ├── common/          # 基础组件
│   ├── charts/          # 图表组件
│   ├── forms/           # 表单组件
│   └── layout/          # 布局组件
├── pages/               # 页面组件
│   ├── dashboard/       # 仪表板
│   ├── portfolio/       # 投资组合
│   ├── transactions/    # 交易管理
│   ├── reports/         # 报表分析
│   ├── settings/        # 设置页面
│   └── admin/           # 管理员页面
├── hooks/               # 自定义Hooks
├── services/            # API服务
├── stores/              # 状态管理
├── utils/               # 工具函数
├── types/               # TypeScript类型定义
├── constants/           # 常量定义
└── assets/              # 静态资源
```

#### 核心页面结构

```typescript
// 主要页面路由
const routes = [
  {
    path: '/dashboard',
    component: Dashboard,
    children: [
      { path: 'overview', component: PortfolioOverview },
      { path: 'performance', component: PerformanceAnalysis },
      { path: 'liquidity', component: LiquidityAnalysis }
    ]
  },
  {
    path: '/portfolio',
    component: Portfolio,
    children: [
      { path: 'positions', component: Positions },
      { path: 'transactions', component: Transactions },
      { path: 'accounts', component: TradingAccounts }
    ]
  },
  {
    path: '/reports',
    component: Reports,
    children: [
      { path: 'quarterly', component: QuarterlyReports },
      { path: 'irr-analysis', component: IRRAnalysis },
      { path: 'risk-analysis', component: RiskAnalysis }
    ]
  },
  {
    path: '/admin',
    component: AdminPanel,
    children: [
      { path: 'products', component: ProductManagement },
      { path: 'exchange-rates', component: ExchangeRateManagement },
      { path: 'users', component: UserManagement }
    ]
  }
];
```

### 2.2 移动端架构

```
src/
├── components/          # 通用组件
├── screens/             # 页面屏幕
│   ├── Dashboard/       # 仪表板
│   ├── Portfolio/       # 投资组合
│   ├── Transactions/    # 交易
│   └── Settings/        # 设置
├── navigation/          # 导航配置
├── services/            # API服务
├── stores/              # 状态管理
├── utils/               # 工具函数
└── assets/              # 静态资源
```

### 2.3 微信小程序架构

```
src/
├── pages/               # 页面
│   ├── index/           # 首页
│   ├── portfolio/       # 投资组合
│   ├── transactions/    # 交易记录
│   └── profile/         # 个人中心
├── components/          # 组件
├── services/            # API服务
├── utils/               # 工具函数
└── assets/              # 静态资源
```

## 3. 后端架构设计

### 3.1 微服务架构

#### 服务划分

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                              │
│                    (路由、认证、限流)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   用户服务    │    │   交易服务    │    │   分析服务    │
│ User Service  │    │Trade Service  │    │Analytics Svc  │
│               │    │               │    │               │
│ - 用户管理    │    │ - 交易录入    │    │ - IRR计算     │
│ - 认证授权    │    │ - 持仓管理    │    │ - 报表生成    │
│ - 权限控制    │    │ - 账户管理    │    │ - 风险分析    │
└───────────────┘    └───────────────┘    └───────────────┘

┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   产品服务    │    │   汇率服务    │    │   通知服务    │
│Product Service│    │  FX Service   │    │Notification   │
│               │    │               │    │   Service     │
│ - 产品管理    │    │ - 汇率更新    │    │ - 消息推送    │
│ - 净值更新    │    │ - 汇率转换    │    │ - 邮件通知    │
│ - 数据同步    │    │ - 历史汇率    │    │ - 短信通知    │
└───────────────┘    └───────────────┘    └───────────────┘

┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   管理服务    │    │   文件服务    │    │   定时任务    │
│ Admin Service │    │ File Service  │    │ Scheduler Svc │
│               │    │               │    │               │
│ - 系统配置    │    │ - 文件上传    │    │ - 数据同步    │
│ - 用户管理    │    │ - 报表导出    │    │ - 净值更新    │
│ - 操作审计    │    │ - 备份恢复    │    │ - 清理任务    │
└───────────────┘    └───────────────┘    └───────────────┘
```

### 3.2 数据库设计

#### 主要数据表结构

```sql
-- 核心业务表
├── users                    -- 用户表
├── portfolios              -- 投资组合表
├── trading_accounts        -- 交易账户表
├── assets                  -- 资产表
├── transactions            -- 交易记录表
├── positions               -- 持仓表
├── nav_history             -- 净值历史表
├── exchange_rates          -- 汇率表
├── quarterly_snapshots     -- 季度快照表

-- 配置管理表
├── markets                 -- 市场配置表
├── asset_types            -- 资产类型表
├── liquidity_tags         -- 流动性标签表
├── option_details         -- 期权详情表
├── product_categories     -- 产品分类表

-- 权限管理表
├── roles                  -- 角色表
├── permissions            -- 权限表
├── role_permissions       -- 角色权限关联表
├── user_roles            -- 用户角色关联表

-- 分析计算表
├── irr_calculations       -- IRR计算结果表
├── cash_flows            -- 现金流表
├── liquidity_analysis    -- 流动性分析表
├── risk_metrics          -- 风险指标表

-- 系统管理表
├── admin_operation_logs   -- 管理员操作日志
├── system_configs        -- 系统配置表
├── data_sources          -- 数据源配置表
├── notification_logs     -- 通知日志表
```

### 3.3 API设计

#### RESTful API 规范

```typescript
// 用户和认证 API
POST   /api/auth/login              // 用户登录
POST   /api/auth/logout             // 用户登出
POST   /api/auth/refresh            // 刷新Token
GET    /api/users/profile           // 获取用户信息
PUT    /api/users/profile           // 更新用户信息

// 投资组合 API
GET    /api/portfolios              // 获取投资组合列表
POST   /api/portfolios              // 创建投资组合
GET    /api/portfolios/:id          // 获取投资组合详情
PUT    /api/portfolios/:id          // 更新投资组合
DELETE /api/portfolios/:id          // 删除投资组合

// 交易管理 API
GET    /api/transactions            // 获取交易记录
POST   /api/transactions            // 创建交易记录
PUT    /api/transactions/:id        // 更新交易记录
DELETE /api/transactions/:id        // 删除交易记录
POST   /api/transactions/import     // 批量导入交易

// 持仓管理 API
GET    /api/positions               // 获取持仓列表
GET    /api/positions/:id           // 获取持仓详情
GET    /api/positions/summary       // 获取持仓汇总

// 分析报表 API
GET    /api/analytics/irr           // IRR分析
GET    /api/analytics/performance   // 绩效分析
GET    /api/analytics/risk          // 风险分析
GET    /api/analytics/liquidity     // 流动性分析
POST   /api/reports/quarterly       // 生成季度报表
GET    /api/reports/:id/export      // 导出报表

// 产品管理 API
GET    /api/assets                  // 获取资产列表
POST   /api/assets                  // 创建资产
PUT    /api/assets/:id              // 更新资产
DELETE /api/assets/:id              // 删除资产
GET    /api/assets/search           // 搜索资产

// 汇率管理 API
GET    /api/exchange-rates          // 获取汇率
POST   /api/exchange-rates          // 设置汇率
GET    /api/exchange-rates/history  // 历史汇率

// 管理员 API
GET    /api/admin/users             // 用户管理
POST   /api/admin/users/:id/roles   // 分配角色
GET    /api/admin/logs              // 操作日志
GET    /api/admin/system/status     // 系统状态
```

## 4. 核心组件设计

### 4.1 认证和授权组件

```typescript
// JWT认证中间件
class AuthMiddleware {
  async authenticate(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
  
  authorize(permissions: string[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const userPermissions = await this.getUserPermissions(req.user.id);
      const hasPermission = permissions.some(p => userPermissions.includes(p));
      
      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      next();
    };
  }
}
```

### 4.2 数据同步组件

```typescript
// 数据同步服务
class DataSyncService {
  constructor() {
    // 本地数据库连接配置
    this.dbConfig = {
      host: 'localhost',
      port: 5432,
      database: 'finapp_test',
      user: 'finapp_user',
      password: 'FinApp2025!'
    };
    
    // 内存缓存配置
    this.cacheConfig = {
      maxSize: 1000,
      ttl: 300 // 5分钟过期
    };
  }
  
  // 富途API数据同步
  async syncFutuData() {
    const stocks = await this.getActiveStocks(['CN', 'HK']);
    for (const stock of stocks) {
      try {
        const price = await this.futuApi.getStockPrice(stock.symbol);
        await this.updateAssetPrice(stock.id, price);
      } catch (error) {
        console.error(`Failed to sync ${stock.symbol}:`, error);
      }
    }
  }
  
  // Yahoo Finance数据同步
  async syncYahooData() {
    const usStocks = await this.getActiveStocks(['US']);
    for (const stock of usStocks) {
      try {
        const data = await this.yahooApi.getHistoricalData(stock.symbol);
        await this.updateAssetPriceHistory(stock.id, data);
      } catch (error) {
        console.error(`Failed to sync ${stock.symbol}:`, error);
      }
    }
  }
  
  // 汇率数据同步
  async syncExchangeRates() {
    const currencyPairs = ['USDCNY', 'HKDCNY', 'JPYCNY', 'SGDCNY'];
    for (const pair of currencyPairs) {
      try {
        const rate = await this.exchangeRateApi.getRate(pair);
        await this.updateExchangeRate(pair, rate);
      } catch (error) {
        console.error(`Failed to sync ${pair}:`, error);
      }
    }
  }
}
```

### 4.3 IRR计算组件

```typescript
// IRR计算引擎
class IRRCalculationEngine {
  // 牛顿-拉夫逊方法计算IRR
  calculateIRR(cashFlows: CashFlow[]): number {
    let rate = 0.1; // 初始猜测值
    const maxIterations = 1000;
    const tolerance = 1e-6;
    
    for (let i = 0; i < maxIterations; i++) {
      const npv = this.calculateNPV(cashFlows, rate);
      const npvDerivative = this.calculateNPVDerivative(cashFlows, rate);
      
      if (Math.abs(npv) < tolerance) {
        return rate;
      }
      
      const newRate = rate - npv / npvDerivative;
      if (Math.abs(newRate - rate) < tolerance) {
        return newRate;
      }
      
      rate = newRate;
    }
    
    return NaN; // 未收敛
  }
  
  // 批量计算投资组合IRR
  async calculatePortfolioIRR(portfolioId: string, startDate: Date, endDate: Date) {
    const cashFlows = await this.getCashFlows(portfolioId, startDate, endDate);
    const currentValue = await this.getCurrentPortfolioValue(portfolioId);
    
    // 添加期末价值作为现金流入
    cashFlows.push({
      date: endDate,
      amount: currentValue,
      type: 'CURRENT_VALUE'
    });
    
    return this.calculateIRR(cashFlows);
  }
}
```

### 4.4 流动性分析组件

```typescript
// 流动性分析引擎
class LiquidityAnalysisEngine {
  // 分析投资组合流动性分布
  async analyzeLiquidityDistribution(portfolioId: string) {
    const positions = await this.getPortfolioPositions(portfolioId);
    const distribution = {
      instant: 0,    // 即时流动性
      high: 0,       // 高流动性
      medium: 0,     // 中等流动性
      low: 0,        // 低流动性
      illiquid: 0    // 非流动性
    };
    
    for (const position of positions) {
      const liquidityTag = await this.getAssetLiquidityTag(position.assetId);
      const valueInCNY = await this.convertToCNY(position.marketValue, position.currency);
      
      switch (liquidityTag) {
        case 'INSTANT':
          distribution.instant += valueInCNY;
          break;
        case 'HIGH':
          distribution.high += valueInCNY;
          break;
        case 'MEDIUM':
          distribution.medium += valueInCNY;
          break;
        case 'LOW':
          distribution.low += valueInCNY;
          break;
        case 'ILLIQUID':
          distribution.illiquid += valueInCNY;
          break;
      }
    }
    
    return distribution;
  }
  
  // 流动性压力测试
  async conductStressTest(portfolioId: string, scenarios: StressScenario[]) {
    const results = [];
    
    for (const scenario of scenarios) {
      const liquidationPlan = await this.createLiquidationPlan(
        portfolioId, 
        scenario.liquidationAmount, 
        scenario.timeConstraint
      );
      
      results.push({
        scenarioName: scenario.name,
        feasible: liquidationPlan.feasible,
        totalCost: liquidationPlan.totalCost,
        timeRequired: liquidationPlan.timeRequired
      });
    }
    
    return results;
  }
}
```

## 5. macOS本地部署架构

### 5.1 服务安装和配置

```bash
# 使用Homebrew安装所有依赖
brew install postgresql@13 nginx

# 服务配置文件位置
/usr/local/etc/postgresql@13/postgresql.conf
/usr/local/etc/nginx/nginx.conf

# 环境变量配置
export DATABASE_URL="postgresql://finapp_user:FinApp2025!@localhost:5432/finapp_test"
```

### 5.2 服务管理

```bash
# 启动所有服务
brew services start postgresql@13
brew services start nginx


# 停止所有服务
brew services stop postgresql@13
brew services stop nginx

# 检查服务状态
brew services list
```

### 5.3 数据目录结构

```
/usr/local/var/
├── postgres/          # PostgreSQL数据目录
└── log/               # 各服务日志目录
    ├── postgresql/
    └── nginx/
```

### 5.4 端口分配

```
服务端口分配：
- PostgreSQL: 5432
- Nginx: 80/443
- Mock API: 8001
- 后端API: 8000
```

### 5.5 Mock API服务实现

```python
# services/mock-api-server.py
#!/usr/bin/env python3
import http.server
import socketserver
import os
from pathlib import Path

PORT = 8001
DIRECTORY = Path(__file__).parent.parent / "config" / "mock-api"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Mock API Server running at http://localhost:{PORT}")
    httpd.serve_forever()
```

### 5.6 本地Nginx配置

```nginx
# /usr/local/etc/nginx/conf.d/finapp-local.conf
server {
    listen 80;
    server_name localhost;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # 主页面
    location / {
        proxy_pass http://localhost:3000;  # 前端开发服务器
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:8000/;  # 后端API服务
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Mock API代理
    location /mock-api/ {
        proxy_pass http://localhost:8001/;  # Mock API服务
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }



    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 5.7 服务启动脚本

```bash
#!/bin/bash
# scripts/start-all-services.sh

echo "启动FinApp本地服务..."

# 检查Homebrew是否安装
if ! command -v brew &> /dev/null; then
    echo "错误: 请先安装Homebrew"
    exit 1
fi

# 启动数据库服务
echo "启动PostgreSQL..."
brew services start postgresql@13

# 等待数据库启动
echo "等待数据库启动..."
sleep 5

# 初始化数据库（如果需要）
if ! psql -h localhost -U finapp_user -d finapp_test -c '\q' 2>/dev/null; then
    echo "初始化数据库..."
    createdb -h localhost -U finapp_user finapp_test
    psql -h localhost -U finapp_user -d finapp_test -f config/postgres/init.sql
fi

# 启动Mock API服务
echo "启动Mock API服务..."
if [ -f /tmp/mock-api.pid ] && kill -0 $(cat /tmp/mock-api.pid) 2>/dev/null; then
    echo "Mock API服务已在运行"
else
    python3 services/mock-api-server.py &
    echo $! > /tmp/mock-api.pid
    echo "Mock API服务已启动 (PID: $(cat /tmp/mock-api.pid))"
fi

# 启动Nginx网关
echo "启动Nginx..."
brew services start nginx

echo ""
echo "所有服务启动完成！"
echo "访问地址："
echo "- 应用主页: http://localhost"
echo "- Mock API: http://localhost:8001"
echo ""
echo "服务状态检查："
brew services list | grep -E "(postgresql|nginx)"
```

### 5.8 服务停止脚本

```bash
#!/bin/bash
# scripts/stop-all-services.sh

echo "停止FinApp本地服务..."

# 停止Mock API服务
if [ -f /tmp/mock-api.pid ]; then
    echo "停止Mock API服务..."
    kill $(cat /tmp/mock-api.pid) 2>/dev/null
    rm -f /tmp/mock-api.pid
fi

# 停止其他服务
echo "停止Nginx..."
brew services stop nginx

echo "停止PostgreSQL..."
brew services stop postgresql@13

echo "所有服务已停止！"
```

## 6. 监控和运维

### 6.1 监控体系

```typescript
// 应用性能监控
class MonitoringService {
  private logger = new Logger();
  
  // API响应时间监控
  trackAPIPerformance(endpoint: string, duration: number) {
    this.logger.info('API Performance', {
      endpoint,
      duration,
      timestamp: new Date().toISOString()
    });
    
    // 如果响应时间过长，记录警告
    if (duration > 1000) {
      this.logger.warn('Slow API Response', { endpoint, duration });
    }
  }
  
  // 数据库查询监控
  trackDatabaseQuery(query: string, duration: number) {
    this.logger.info('Database Query', {
      queryType: this.getQueryType(query),
      duration,
      timestamp: new Date().toISOString()
    });
    
    // 如果查询时间过长，记录警告
    if (duration > 500) {
      this.logger.warn('Slow Database Query', { query, duration });
    }
  }
  
  // 业务指标监控
  trackBusinessMetrics(metric: string, value: number) {
    this.logger.info('Business Metric', {
      metricName: metric,
      value,
      timestamp: new Date().toISOString()
    });
  }
  
  // 健康检查
  async healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
    
    this.logger.info('Health Check', health);
    return health;
  }
}
```

### 6.2 日志管理

```typescript
// 结构化日志
class Logger {
  info(message: string, metadata?: any) {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      metadata,
      service: 'finapp-api',
      version: process.env.APP_VERSION
    }));
  }
  
  error(message: string, error?: Error, metadata?: any) {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      error: error?.stack,
      metadata,
      service: 'finapp-api',
      version: process.env.APP_VERSION
    }));
  }
}
```

## 7. 安全架构

### 7.1 安全措施

```typescript
// 安全中间件
class SecurityMiddleware {
  // 请求限流
  rateLimiting() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 100, // 最多100个请求
      message: 'Too many requests from this IP'
    });
  }
  
  // SQL注入防护
  sqlInjectionProtection() {
    return (req: Request, res: Response, next: NextFunction) => {
      // 使用参数化查询，避免SQL注入
      // 输入验证和清理
      next();
    };
  }
  
  // XSS防护
  xssProtection() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"]
        }
      }
    });
  }
}
```

### 7.2 数据加密

```typescript
// 数据加密服务
class EncryptionService {
  // 敏感数据加密
  encryptSensitiveData(data: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
  
  // 敏感数据解密
  decryptSensitiveData(encryptedData: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
```

## 8. 性能优化策略

### 8.1 数据库优化

```sql
-- 索引优化策略
CREATE INDEX CONCURRENTLY idx_transactions_portfolio_date 
ON transactions(portfolio_id, transaction_date DESC);

CREATE INDEX CONCURRENTLY idx_positions_portfolio_asset 
ON positions(portfolio_id, asset_id);

CREATE INDEX CONCURRENTLY idx_nav_history_asset_date 
ON nav_history(asset_id, nav_date DESC);

-- 分区表优化
CREATE TABLE nav_history_2024 PARTITION OF nav_history
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### 8.2 缓存策略

```typescript
// 内存缓存策略
class CacheService {
  private memoryCache = new Map<string, { data: any; expiry: number }>();
  private maxSize = 1000; // 最大缓存条目数
  
  // 缓存策略
  async getCachedData(key: string, fetchFunction: () => Promise<any>, ttl: number = 300) {
    // 检查内存缓存
    const cached = this.memoryCache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    
    // 缓存未命中或已过期，从数据库获取
    const data = await fetchFunction();
    
    // 存储到内存缓存
    this.setCache(key, data, ttl);
    
    return data;
  }
  
  // 设置缓存
  private setCache(key: string, data: any, ttl: number) {
    // 如果缓存已满，删除最旧的条目
    if (this.memoryCache.size >= this.maxSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    
    const expiry = Date.now() + (ttl * 1000);
    this.memoryCache.set(key, { data, expiry });
  }
  
  // 清除过期缓存
  clearExpired() {
    const now = Date.now();
    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expiry <= now) {
        this.memoryCache.delete(key);
      }
    }
  }
  
  // 清除所有缓存
  clearAll() {
    this.memoryCache.clear();
  }
  
  // 获取缓存统计信息
  getStats() {
    return {
      size: this.memoryCache.size,
      maxSize: this.maxSize
    };
  }
}
```

## 9. 扩展性设计

### 9.1 插件化架构

```typescript
// 插件接口定义
interface MarketPlugin {
  marketCode: string;
  initialize(): Promise<void>;
  fetchPriceData(symbols: string[]): Promise<PriceData[]>;
  fetchHistoricalData(symbol: string, startDate: Date, endDate: Date): Promise<HistoricalData[]>;
}

// 插件管理器
class PluginManager {
  private plugins: Map<string, MarketPlugin> = new Map();
  
  registerPlugin(plugin: MarketPlugin) {
    this.plugins.set(plugin.marketCode, plugin);
  }
  
  async fetchDataForMarket(marketCode: string, symbols: string[]) {
    const plugin = this.plugins.get(marketCode);
    if (!plugin) {
      throw new Error(`No plugin found for market: ${marketCode}`);
    }
    
    return await plugin.fetchPriceData(symbols);
  }
}
```

### 9.2 API版本管理

```typescript
// API版本控制
class APIVersionManager {
  // v1 API
  @Version('1')
  @Get('/portfolios')
  async getPortfoliosV1() {
    // v1版本的实现
  }
  
  // v2 API
  @Version('2')
  @Get('/portfolios')
  async getPortfoliosV2() {
    // v2版本的实现，向后兼容
  }
}
```

---

**文档版本**: v1.0  
**创建日期**: 2025年9月8日  
**最后更新**: 2025年9月8日  
**文档状态**: 待评审