# FinApp 系统配置信息

## 服务端口配置

### 数据库服务
- **PostgreSQL**: 端口 `5432`
  - 数据库名: `finapp_test`
  - 用户名: `finapp_user`
  - 密码: `finapp_password`
  - 连接字符串: `postgresql://finapp_user:finapp_password@localhost:5432/finapp_test?schema=finapp&client_encoding=utf8`

### 后端服务
- **Node.js/Express API**: 端口 `8000`
  - 启动命令: `npm run dev`
  - 工作目录: `/Users/caojun/code/FinApp/backend`
  - API 基础路径: `http://localhost:8000`

### 前端服务
- **React/Vite 开发服务器**: 端口 `3001`
  - 启动命令: `npm run dev`
  - 工作目录: `/Users/caojun/code/FinApp/frontend`
  - 访问地址: `http://localhost:3001`

## 测试账户信息

### 系统测试用户
- **用户名**: `testapi@finapp.com`
- **密码**: `testapi123`
- **用途**: 系统功能测试和开发调试

- **用户名**: `admin@finapp.com`
- **密码**: `admin123`
- **用途**: 系统管理功能测试和开发调试

## 数据库配置

### PostgreSQL 实例信息
- **实例名**: `finapp_test`
- **模式**: `finapp`
- **表数量**: 33个表（已建立完整表结构）
- **ORM**: Prisma
- **迁移状态**: 已完成初始化

### 主要数据表
- 用户管理: `users`, `user_profiles`
- 投资组合: `portfolios`, `portfolio_positions`
- 交易记录: `transactions`
- 产品信息: `products`, `product_categories`
- 汇率管理: `exchange_rates`
- 权限管理: `permissions`, `user_permissions`

## 认证配置

### JWT Token 配置
- **Token 存储键名**: `auth_token`
- **存储位置**: localStorage
- **Token 类型**: Bearer Token
- **过期时间**: 根据后端配置

### API 认证
- **认证方式**: JWT Bearer Token
- **Header 格式**: `Authorization: Bearer <token>`
- **Token 获取**: 登录接口返回

## 开发环境启动顺序

1. **启动 PostgreSQL 数据库**
   ```bash
   brew services start postgresql@13
   ```

2. **启动后端服务**
   ```bash
   cd /Users/caojun/code/FinApp/backend
   npm run dev
   ```

3. **启动前端服务**
   ```bash
   cd /Users/caojun/code/FinApp/frontend
   npm run dev
   ```

## 环境变量配置

### 后端环境变量 (.env)
```
# 数据库配置
DATABASE_URL="postgresql://finapp_user:finapp_password@localhost:5432/finapp_test?schema=finapp&client_encoding=utf8"

# JWT 配置
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# 服务器配置
PORT=8000
NODE_ENV="development"

# 缓存配置
CACHE_TTL=3600
CACHE_MAX_KEYS=1000

# 日志配置
LOG_LEVEL="info"

# CORS 配置
CORS_ORIGIN="http://localhost:3000,http://localhost:3001,http://localhost:8080"

# 速率限制配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000000

# 汇率自动更新配置
ENABLE_EXCHANGE_RATE_AUTO_UPDATE=true
EXCHANGE_RATE_UPDATE_SCHEDULE="0 */4 * * *"
EXCHANGE_RATE_ALERT_THRESHOLD=2.0
```

### 前端环境变量 (.env)
```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_TITLE=FinApp
```

## 常用命令
- **备份PostgreSQL 数据库**: pg_dump -h localhost -U finapp_user -d finapp_test > backup.sql
- **停止 PostgreSQL 服务**: `brew services stop postgresql@13`
- **重启 PostgreSQL 服务**: `brew services restart postgresql@13`

## 系统状态检查

### 健康检查端点
- **后端健康检查**: `GET http://localhost:8000/health`
- **数据库连接检查**: `GET http://localhost:8000/api/health/db`

### 服务状态验证
- PostgreSQL: `brew services list | grep postgresql`
- 后端服务: 访问 `http://localhost:8000`
- 前端服务: 访问 `http://localhost:3001`

## 故障排除

### 常见问题
1. **数据库连接失败**: 检查 PostgreSQL 服务是否启动
2. **端口占用**: 使用 `lsof -i :端口号` 检查端口占用
3. **认证失败**: 检查 token 命名是否为 `auth_token`
4. **CORS 错误**: 确认后端 CORS 配置正确

### 日志位置
- **后端日志**: 控制台输出
- **前端日志**: 浏览器开发者工具
- **数据库日志**: PostgreSQL 日志文件

---

**最后更新**: 2025-11-07  
**维护人员**: 开发团队  
**版本**: v1.0