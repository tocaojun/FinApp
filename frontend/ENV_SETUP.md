# 前端环境变量配置指南

## 📋 环境文件说明

FinApp 前端支持多环境配置，提供了以下模板文件：

- `.env.development.template` - 本地开发环境模板
- `.env.staging.template` - 预发布环境模板  
- `.env.production.template` - 生产环境模板

## 🚀 快速开始

### 1. 本地开发（Mac/Windows）

```bash
# 复制开发模板
cd frontend
cp .env.development.template .env

# 或者直接使用现有的 .env
cat > .env << 'EOF'
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_TITLE=FinApp (Dev)
VITE_ENABLE_DEBUG_PANEL=true
EOF

# 启动开发服务器
npm run dev
```

### 2. Ubuntu 生产服务器部署

```bash
cd /var/www/finapp/frontend

# 方案 A: 使用服务器 IP 或域名
cp .env.production.template .env.production
# 编辑 .env.production，设置正确的 API 地址
nano .env.production

# 示例内容：
# VITE_API_BASE_URL=http://43.138.55.236:8000/api
# VITE_APP_TITLE=FinApp

# 方案 B: 使用 Nginx 反向代理（推荐）
cat > .env.production << 'EOF'
VITE_API_BASE_URL=/api
VITE_APP_TITLE=FinApp
VITE_ENABLE_DEBUG_PANEL=false
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_USE_MOCK_DATA=false
EOF

# 构建生产版本
npm run build

# 构建时会自动使用 .env.production
```

### 3. 预发布环境

```bash
cd frontend
cp .env.staging.template .env.staging

# 编辑配置
nano .env.staging

# 使用 staging 环境构建
npm run build -- --mode staging
```

## 🔧 环境变量说明

### 必需变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `VITE_API_BASE_URL` | 后端 API 地址 | `http://localhost:8000/api` |
| `VITE_APP_TITLE` | 应用标题 | `FinApp` |

### 可选变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_ENABLE_DEBUG_PANEL` | 是否显示调试面板 | `false` |
| `VITE_ENABLE_PERFORMANCE_MONITORING` | 性能监控 | `false` |
| `VITE_USE_MOCK_DATA` | 使用模拟数据 | `false` |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics ID | - |
| `VITE_SENTRY_DSN` | Sentry 错误追踪 DSN | - |

## 📝 不同环境的 API 地址配置

### 开发环境（本地）
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### Ubuntu 服务器（直连）
```env
# 使用服务器 IP（腾讯云外网 IP）
VITE_API_BASE_URL=http://43.138.55.236:8000/api

# 或使用域名
VITE_API_BASE_URL=http://finapp.yourdomain.com:8000/api
```

### Ubuntu 服务器（Nginx 反向代理）
```env
# 使用相对路径，由 Nginx 代理到后端
VITE_API_BASE_URL=/api
```

对应的 Nginx 配置：
```nginx
location /api {
    proxy_pass http://localhost:8000/api;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

## 🔒 安全注意事项

1. **不要提交敏感信息**
   - `.env` 文件已在 `.gitignore` 中
   - 只提交 `.template` 模板文件
   - 不要在模板中包含真实的密钥

2. **生产环境配置**
   - 关闭调试功能：`VITE_ENABLE_DEBUG_PANEL=false`
   - 启用性能监控：`VITE_ENABLE_PERFORMANCE_MONITORING=true`
   - 不使用模拟数据：`VITE_USE_MOCK_DATA=false`

3. **HTTPS 部署**
   - 生产环境建议使用 HTTPS
   - 配置 SSL 证书
   - API 地址使用 `https://`

## 🎯 构建命令

```bash
# 开发环境构建（使用 .env）
npm run build

# 生产环境构建（使用 .env.production）
npm run build -- --mode production

# 预发布环境构建（使用 .env.staging）
npm run build -- --mode staging

# 开发服务器（使用 .env）
npm run dev
```

## 🔍 验证配置

启动应用后，可以在浏览器控制台检查：

```javascript
// 查看当前 API 地址
console.log(import.meta.env.VITE_API_BASE_URL)

// 查看所有环境变量
console.log(import.meta.env)
```

## 📚 相关文档

- [Vite 环境变量文档](https://vitejs.dev/guide/env-and-mode.html)
- [FinApp 后端配置](../backend/README.md)
- [部署指南](../docs/deployment.md)
