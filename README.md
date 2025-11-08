# FinApp - 个人资产管理应用

一个功能完整的个人资产管理应用，支持多币种投资组合管理、交易记录、IRR分析和流动性分析。

## 🚀 快速开始

### 系统要求

- macOS (推荐 macOS 12+)
- Homebrew 包管理器
- Node.js 18+ (用于后续开发)
- Python 3.8+ (用于 Mock API 服务)

### 安装和启动

1. **克隆项目**
   ```bash
   git clone https://github.com/tocaojun/FinApp.git
   cd FinApp
   ```

2. **启动所有服务**
   ```bash
   ./scripts/start-all-services.sh
   ```

3. **访问应用**
   - 主应用: http://localhost
   - Mock API: http://localhost:8001
   - 健康检查: http://localhost/health

4. **停止所有服务**
   ```bash
   ./scripts/stop-all-services.sh
   ```

## 📁 项目结构

```
FinApp/
├── backend/                 # 后端 API 服务
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── services/        # 业务逻辑服务
│   │   ├── models/          # 数据模型
│   │   ├── middleware/      # 中间件
│   │   ├── utils/           # 工具函数
│   │   ├── types/           # TypeScript 类型定义
│   │   └── config/          # 配置文件
│   ├── tests/               # 测试文件
│   └── scripts/             # 构建脚本
├── frontend/                # Web 前端应用
│   ├── src/
│   │   ├── components/      # React 组件
│   │   ├── pages/           # 页面组件
│   │   ├── hooks/           # 自定义 Hooks
│   │   ├── services/        # API 服务
│   │   ├── stores/          # 状态管理
│   │   └── utils/           # 工具函数
│   ├── public/              # 静态资源
│   └── tests/               # 测试文件
├── mobile/                  # React Native 移动端
├── miniprogram/             # 微信小程序
├── config/                  # 配置文件
│   ├── postgres/            # PostgreSQL 配置
│   ├── nginx/               # Nginx 配置
│   └── mock-api/            # Mock API 数据
├── scripts/                 # 项目脚本
└── docs/                    # 文档
```

## 🛠️ 开发环境

### 已安装的服务

- **PostgreSQL@13**: 数据库服务 (端口: 5432)
- **Nginx**: 反向代理和静态文件服务 (端口: 80)
- **Mock API**: 模拟外部 API 服务 (端口: 8001)

### 数据库连接

```bash
# 连接到数据库
psql -h localhost -U finapp_user -d finapp_test

# 查看数据库状态
brew services list | grep postgresql@13
```

### 服务管理

```bash
# 查看所有服务状态
brew services list

# 单独启动/停止服务
brew services start postgresql@13
brew services stop postgresql@13
brew services start nginx
brew services stop nginx
```

## 📊 核心功能

### 已规划的功能模块

1. **用户认证系统**
   - JWT 认证
   - 角色权限管理
   - 用户信息管理

2. **投资组合管理**
   - 多投资组合支持
   - 多币种资产管理
   - 交易账户管理

3. **交易记录管理**
   - 股票、基金、债券、期权交易
   - 批量导入功能
   - 交易标签系统

4. **价格数据同步系统** ⭐
   - 支持多个数据源：Yahoo Finance、EastMoney（东方财富）、Tushare
   - 自动化定时同步历史价格数据
   - 支持 1 天至 10+ 年的历史数据回溯
   - 灵活的同步任务配置
   - 完整的同步日志和错误追踪

5. **分析计算系统**
   - IRR (内部收益率) 计算
   - 绩效分析
   - 流动性分析
   - 风险指标计算

6. **报表系统**
   - 季度报表生成
   - 自定义报表
   - 数据导出功能

7. **多平台支持**
   - Web 前端 (React + TypeScript)
   - 移动端 APP (React Native)
   - 微信小程序 (Taro)

## 🔧 配置说明

### 环境变量

复制 `.env.template` 到 `.env` 并根据需要修改配置：

```bash
cp .env.template .env
```

### 数据库配置

- 配置文件: `config/postgres/postgresql.conf`
- 初始化脚本: `config/postgres/init.sql`
- 默认用户: `finapp_user`
- 默认密码: `FinApp2025!`
- 默认数据库: `finapp_test`

### Nginx 配置

- 配置文件: `config/nginx/finapp-local.conf`
- 自动代理到前端开发服务器 (3000端口)
- 自动代理 API 请求到后端服务器 (8000端口)
- 自动代理 Mock API 请求 (8001端口)

## 📝 开发指南

### Git 工作流

```bash
# 创建功能分支
git checkout -b feature/your-feature-name

# 提交更改
git add .
git commit -m "feat: add your feature description"

# 推送分支
git push origin feature/your-feature-name
```

### 代码规范

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 和 Prettier 代码格式规范
- 编写单元测试和集成测试
- 使用语义化版本控制

### 测试

```bash
# 运行后端测试
cd backend && npm test

# 运行前端测试
cd frontend && npm test

# 运行端到端测试
npm run test:e2e
```

## 📚 API 文档

API 文档将在后端服务启动后自动生成，访问地址：
- Swagger UI: http://localhost:8000/api/docs

## 📊 支持的数据源

### Yahoo Finance (雅虎财经) ⭐
- **特点**：覆盖全球主要市场，无需 API 密钥，免费无限制
- **支持的市场**：NYSE, NASDAQ, HKEX, SSE, SZSE, TSE, LSE, FWB 等
- **数据类型**：股票、ETF、指数
- **历史数据**：支持最多 10 年以上回溯
- **API 地址**：https://query1.finance.yahoo.com/v8/finance/chart/

### EastMoney (东方财富) ⭐
- **特点**：中国本土数据源，中文界面，专注于中国股票
- **支持的市场**：SSE (上证)、SZSE (深证)
- **数据类型**：股票、基金
- **历史数据**：支持最多 1000 天回溯
- **API 地址**：http://push2.eastmoney.com/api/qt/stock/kline/get

### Tushare (可选)
- **特点**：专业金融数据库，数据准确性高
- **支持的市场**：A 股、香港股、美股
- **需求**：需要 API Key（付费）
- **状态**：已集成但默认禁用

## 📚 价格同步使用指南

### 快速开始
1. 打开后台管理 → 数据同步
2. 选择数据源（Yahoo Finance / EastMoney）
3. 创建同步任务，配置资产和频率
4. 运行同步任务获取历史价格数据

### 数据源管理
- 新增数据源：点击"新增数据源"按钮
- 编辑数据源：点击"编辑"修改配置
- 删除数据源：点击"删除"移除已有数据源

### 同步任务配置
- **手动同步**：立即运行一次同步
- **定时同步**：设置 Cron 表达式定时运行
- **间隔同步**：设置间隔分钟数自动运行

### 快速测试数据源

#### 测试 Yahoo Finance
```bash
# 1. 打开后台 → 数据同步 → 数据源
# 2. Yahoo Finance 应该已经启用
# 3. 创建同步任务：选择 Yahoo Finance，选择资产类型（STOCK），选择市场（NYSE）
# 4. 创建同步任务后，点击"立即运行"测试
```

#### 测试 EastMoney
```bash
# 1. 打开后台 → 数据同步 → 数据源
# 2. 点击"编辑" EastMoney，启用该数据源
# 3. 创建同步任务：选择 EastMoney，选择资产类型（STOCK），选择市场（SSE 或 SZSE）
# 4. 创建同步任务后，点击"立即运行"测试
```

#### API 测试
```bash
# 获取所有数据源
curl -X GET http://localhost/api/price-sync/data-sources

# 获取数据源覆盖范围（支持的资产类型和市场）
curl -X GET http://localhost/api/price-sync/data-sources/{dataSourceId}/coverage

# 创建新数据源
curl -X POST http://localhost/api/price-sync/data-sources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新数据源",
    "provider": "yahoo_finance",
    "api_endpoint": "https://query1.finance.yahoo.com/v8/finance/chart/",
    "is_active": true,
    "config": {}
  }'
```

## 📋 数据源 JSON 配置指南

在"数据同步"→"数据源"中添加或编辑数据源时，需要填写 JSON 格式的配置。以下是详细说明：

### 配置字段说明

#### 基础字段
- **名称 (name)**: 数据源的显示名称，例如 "Yahoo Finance"
- **提供商 (provider)**: 选择对应的数据源提供商
- **API 端点 (api_endpoint)**: 数据源的 API 基础 URL
- **启用 (is_active)**: 是否启用该数据源（对号=启用）

#### JSON 配置字段

| 字段 | 类型 | 描述 | 示例 |
|------|------|------|------|
| `supports_batch` | boolean | 是否支持批量请求 | `false` |
| `max_days_per_request` | number | 单次请求最多回溯天数 | `365` |
| `max_symbols_per_request` | number | 单次请求最多支持的股票数 | `100` |
| `supports_products` | array | 支持的产品类型 | `["STOCK", "ETF"]` |
| `supports_markets` | array | 支持的市场代码 | `["NYSE", "NASDAQ"]` |
| `requires_api_key` | boolean | 是否需要 API Key | `false` |
| `rate_limit_per_minute` | number | 每分钟请求限制 | `60` |
| `rate_limit_per_day` | number | 每天请求限制 | `5000` |
| `timeout_seconds` | number | 请求超时时间(秒) | `30` |
| `default_interval` | string | 默认 K 线周期 | `"1d"` |

### 常用配置示例

#### 1️⃣ Yahoo Finance 配置
```json
{
  "supports_batch": false,
  "max_days_per_request": 365,
  "supports_products": ["STOCK", "ETF", "INDEX"],
  "supports_markets": ["NYSE", "NASDAQ", "HKEX", "SSE", "SZSE", "TSE", "LSE", "FWB"],
  "rate_limit_per_minute": 60,
  "timeout_seconds": 30,
  "default_interval": "1d"
}
```

#### 2️⃣ EastMoney (东方财富) 配置
```json
{
  "supports_batch": false,
  "max_days_per_request": 1000,
  "supports_products": ["STOCK", "FUND"],
  "supports_markets": ["SSE", "SZSE"],
  "rate_limit_per_minute": 100,
  "timeout_seconds": 30,
  "default_interval": "1d"
}
```

#### 3️⃣ Tushare 配置
```json
{
  "supports_batch": true,
  "max_symbols_per_request": 100,
  "supports_products": ["STOCK", "FUND", "FUTURE", "OPTION"],
  "supports_markets": ["SSE", "SZSE", "HKEX", "NASDAQ", "NYSE"],
  "requires_api_key": true,
  "rate_limit_per_minute": 200,
  "rate_limit_per_day": 5000,
  "timeout_seconds": 30,
  "default_interval": "1d"
}
```

#### 4️⃣ 最小化配置（空配置）
```json
{}
```

### 填写步骤

1. **打开数据源页面**
   - 点击"后台管理"→"数据同步"→"数据源"

2. **新增数据源**
   - 点击"新增数据源"按钮

3. **填写基础字段**
   - 名称: 输入数据源名称
   - 提供商: 从下拉列表选择
   - API 端点: 输入 API 的基础 URL

4. **填写 JSON 配置**
   - 在"配置（JSON 格式）"文本框中输入 JSON
   - 使用上面的示例配置
   - JSON 必须是有效格式，否则会报错

5. **启用数据源**
   - 勾选"启用此数据源"复选框

6. **保存**
   - 点击"确定"按钮保存

### JSON 格式验证

⚠️ **常见错误**

❌ 错误示例 1（缺少引号）
```json
{
  supports_batch: false,
  max_days_per_request: 365
}
```

✅ 正确示例 1
```json
{
  "supports_batch": false,
  "max_days_per_request": 365
}
```

❌ 错误示例 2（数组中字符串缺少引号）
```json
{
  "supports_markets": [NYSE, NASDAQ]
}
```

✅ 正确示例 2
```json
{
  "supports_markets": ["NYSE", "NASDAQ"]
}
```

❌ 错误示例 3（末尾有逗号）
```json
{
  "supports_batch": false,
  "max_days_per_request": 365,
}
```

✅ 正确示例 3
```json
{
  "supports_batch": false,
  "max_days_per_request": 365
}
```

### 产品类型列表

- `STOCK` - 股票
- `ETF` - 交易所交易基金
- `FUND` - 基金
- `BOND` - 债券
- `OPTION` - 期权
- `FUTURE` - 期货
- `INDEX` - 指数
- `CRYPTO` - 加密货币

### 市场代码列表

- `NYSE` - 美国纽约证券交易所
- `NASDAQ` - 美国纳斯达克交易所
- `HKEX` - 香港联合交易所
- `SSE` - 上海证券交易所
- `SZSE` - 深圳证券交易所
- `TSE` - 日本东京证券交易所
- `LSE` - 伦敦证券交易所
- `FWB` - 法兰克福证券交易所

### 在线 JSON 验证工具

如果不确定 JSON 格式是否正确，可以使用以下工具验证：
- https://jsonlint.com/ - 在线 JSON 验证工具
- https://www.json.cn/ - 中文 JSON 验证工具

### 常见问题

**Q: 可以只填写部分字段吗？**  
A: 可以。所有字段都是可选的。如果不填写配置，可以使用空对象 `{}`

**Q: 字段顺序重要吗？**  
A: 不重要。JSON 中字段的顺序不影响功能

**Q: 如何编辑已有的数据源配置？**  
A: 点击数据源列表中的"编辑"按钮，修改配置后保存

**Q: JSON 配置保存后在哪里可以查看？**  
A: 在数据源列表中点击"编辑"可以查看已保存的配置

## 🔍 故障排查

### 常见问题

1. **数据库连接失败**
   ```bash
   # 检查 PostgreSQL 服务状态
   brew services list | grep postgresql@13
   
   # 重启 PostgreSQL
   brew services restart postgresql@13
   ```

2. **Nginx 启动失败**
   ```bash
   # 检查配置文件语法
   nginx -t
   
   # 查看错误日志
   tail -f /opt/homebrew/var/log/nginx/error.log
   ```

3. **Mock API 无法访问**
   ```bash
   # 检查 Mock API 进程
   ps aux | grep python
   
   # 重启 Mock API
   ./scripts/stop-all-services.sh
   ./scripts/start-all-services.sh
   ```

4. **数据源添加时出现 JSONB 类型错误**
   
   **错误信息**：
   ```
   ERROR: column "config" is of type jsonb but expression is of type text
   HINT: You will need to rewrite or cast the expression
   ```
   
   **原因**：数据库字段类型不匹配，需要将字符串转换为 JSONB 类型
   
   **解决方法**：✅ 已修复
   - 在 `backend/src/services/PriceSyncService.ts` 中已添加 `::jsonb` 类型转换
   - 创建数据源时自动将 JSON 字符串转换为 JSONB 类型
   - 更新数据源时也进行了相同的转换处理
   
   **手动测试**：
   ```bash
   # 验证修复是否正确
   curl -X POST http://localhost:8000/api/price-sync/data-sources \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Source",
       "provider": "yahoo_finance",
       "api_endpoint": "https://example.com",
       "config": {"supports_batch": false, "max_days": 365},
       "is_active": true
     }'
   ```

### 日志查看

```bash
# PostgreSQL 日志
tail -f /opt/homebrew/var/log/postgresql@13/postgresql-*.log

# Nginx 日志
tail -f /opt/homebrew/var/log/nginx/access.log
tail -f /opt/homebrew/var/log/nginx/error.log

# 应用日志 (开发阶段)
tail -f logs/app.log
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 创建 Issue
- 发送邮件到: [tocaojun@gmail.com]

---

**版本**: v1.0.0  
**最后更新**: 2025年1月13日