# Network Error 修复指南

## 问题描述

用户在下载模板时遇到 "Network Error" 错误。

## 根本原因

前端服务使用了绝对URL（`http://localhost:8000/api`）直接访问后端，绕过了Vite的代理配置，导致：
1. CORS跨域问题
2. 网络连接失败

## 解决方案

### 修复：使用相对路径

**文件**: `frontend/src/services/transactionImportService.ts`

**修改前**:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
```

**修改后**:
```typescript
// 使用相对路径以利用Vite的代理配置，避免CORS问题
const API_BASE_URL = '/api';
```

### 为什么这样修复？

#### Vite代理配置（vite.config.ts）
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
    secure: false,
  }
}
```

#### 请求流程对比

**使用绝对URL（错误）**:
```
浏览器 → http://localhost:8000/api/... (直接访问，CORS错误)
```

**使用相对路径（正确）**:
```
浏览器 → http://localhost:3001/api/... 
       → Vite代理 
       → http://localhost:8000/api/... (代理转发，无CORS问题)
```

## 验证步骤

### 1. 刷新浏览器

**重要**: 修改服务文件后，需要**硬刷新**浏览器：
- **Mac**: `Cmd + Shift + R`
- **Windows**: `Ctrl + Shift + R`
- 或者清除缓存后刷新

### 2. 测试模板下载

1. 访问 http://localhost:3001
2. 登录系统
3. 进入"交易管理"页面
4. 点击"批量导入"按钮
5. 点击"下载Excel模板"
6. 点击"下载JSON模板"

### 3. 检查浏览器控制台

打开浏览器开发者工具（F12），查看：
- **Network标签**: 请求是否成功（状态码200）
- **Console标签**: 是否有错误信息

## 常见问题排查

### Q1: 仍然显示 Network Error？

**解决方法**:
```bash
# 1. 硬刷新浏览器
Cmd + Shift + R (Mac) 或 Ctrl + Shift + R (Windows)

# 2. 清除浏览器缓存
# 开发者工具 → Application → Clear storage → Clear site data

# 3. 重启前端服务
pkill -f "vite.*frontend"
cd /Users/caojun/code/FinApp/frontend && npm run dev
```

### Q2: 显示 401 Unauthorized？

**原因**: Token过期或无效

**解决方法**:
```javascript
// 1. 打开浏览器控制台
// 2. 清除localStorage
localStorage.clear();

// 3. 重新登录
```

### Q3: 显示 404 Not Found？

**原因**: 后端路由未正确配置或后端服务未启动

**解决方法**:
```bash
# 1. 检查后端服务
curl http://localhost:8000/health

# 2. 如果失败，重启后端
cd /Users/caojun/code/FinApp/backend && npm run dev

# 3. 检查路由配置
# 确保 backend/src/routes/transactions.ts 中有模板下载路由
```

### Q4: 代理不工作？

**检查Vite配置**:
```bash
# 查看vite.config.ts
cat /Users/caojun/code/FinApp/frontend/vite.config.ts

# 确保包含代理配置
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
    secure: false,
  }
}
```

## 测试API连接

### 测试1: 通过Vite代理访问

```bash
# 应该返回401（需要认证）
curl http://localhost:3001/api/transactions/import/template/excel

# 预期输出: {"error":"Access token required"}
```

### 测试2: 直接访问后端

```bash
# 应该返回401（需要认证）
curl http://localhost:8000/api/transactions/import/template/excel

# 预期输出: {"error":"Access token required"}
```

### 测试3: 带Token访问

```bash
# 替换<your-token>为实际的token
curl -H "Authorization: Bearer <your-token>" \
  http://localhost:3001/api/transactions/import/template/excel \
  -o template.xlsx

# 预期: 下载template.xlsx文件
```

## 浏览器调试技巧

### 1. 查看Network请求

1. 打开开发者工具（F12）
2. 切换到 **Network** 标签
3. 点击"下载Excel模板"
4. 查看请求详情：
   - **Request URL**: 应该是 `http://localhost:3001/api/transactions/import/template/excel`
   - **Status**: 应该是 `200 OK`
   - **Response Headers**: 应该包含 `Content-Type` 和 `Content-Disposition`

### 2. 查看Console错误

1. 打开开发者工具（F12）
2. 切换到 **Console** 标签
3. 查看是否有错误信息
4. 常见错误：
   - `CORS error`: 使用了绝对URL，未通过代理
   - `Network Error`: 后端服务未启动或无法访问
   - `401 Unauthorized`: Token无效或过期

### 3. 查看Application存储

1. 打开开发者工具（F12）
2. 切换到 **Application** 标签
3. 查看 **Local Storage**
4. 检查是否有 `token` 或 `auth_token`

## 完整的重启流程

如果问题仍然存在，执行完整重启：

```bash
# 1. 停止所有服务
./stop-all.sh

# 2. 清理端口
lsof -ti:8000,3001 | xargs kill -9 2>/dev/null

# 3. 启动所有服务
./start-all-clean.sh

# 4. 等待服务启动（约10秒）

# 5. 打开浏览器
open http://localhost:3001

# 6. 硬刷新浏览器
# Mac: Cmd + Shift + R
# Windows: Ctrl + Shift + R

# 7. 清除localStorage并重新登录
```

## 相关文件

### 已修改
- ✅ `frontend/src/services/transactionImportService.ts` - 使用相对路径
- ✅ `frontend/src/components/transaction/TransactionImportModal.tsx` - 改进错误提示

### 配置文件
- `frontend/vite.config.ts` - Vite代理配置
- `frontend/.env` - 环境变量（可选）
- `backend/src/routes/transactions.ts` - 后端路由
- `backend/src/app.ts` - 全局中间件配置

## 预防措施

### 1. 统一使用相对路径

所有API服务都应该使用相对路径：

```typescript
// ✅ 推荐
const API_BASE_URL = '/api';

// ❌ 不推荐（开发环境）
const API_BASE_URL = 'http://localhost:8000/api';
```

### 2. 环境变量配置

如果需要在生产环境使用不同的URL：

```typescript
// 开发环境使用相对路径（通过代理）
// 生产环境使用环境变量
const API_BASE_URL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_BASE_URL 
  : '/api';
```

### 3. 代理配置检查

定期检查 `vite.config.ts` 中的代理配置是否正确。

## 状态

🟢 **已修复** - 2025-10-27

---

**下一步**: 
1. 硬刷新浏览器（Cmd/Ctrl + Shift + R）
2. 测试模板下载功能
3. 如有问题，查看浏览器控制台
