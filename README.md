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

4. **分析计算系统**
   - IRR (内部收益率) 计算
   - 绩效分析
   - 流动性分析
   - 风险指标计算

5. **报表系统**
   - 季度报表生成
   - 自定义报表
   - 数据导出功能

6. **多平台支持**
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