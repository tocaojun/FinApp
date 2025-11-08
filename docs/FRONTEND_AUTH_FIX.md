# 前端认证问题修复指南

## 问题诊断

### 症状
- testapi 用户访问投资组合、交易记录、报表中心等页面时被要求重新登录
- 后端返回 401 Unauthorized 错误

### 根本原因
1. **Token 过期** - 之前登录时生成的 JWT token 已过期
2. **缺少 Refresh Token 处理** - 前端没有实现自动 token 刷新逻辑
3. **权限配置完成** - 用户权限已正确配置，问题不在权限

### 验证
- ✅ testapi 用户已标记为已验证 (`is_verified = true`)
- ✅ testapi 用户拥有所有必需权限：
  - portfolios: read, create, update
  - transactions: read, create, update, import
  - reports: read, create, update, export
  - assets: read
  - trading_accounts: read, update
  - user: read, update
- ✅ 后端已实现 `/api/auth/refresh` 端点
- ✅ 权限中间件正确配置所有 API 端点

## 实施的修复

### 1. 改进 API 请求层 (`api.ts`)

**新增功能：**
- 自动 token 刷新机制
- Token 刷新队列（防止多个并发刷新请求）
- 失败后自动重试（最多 1 次）
- 完整的错误处理逻辑

**关键改进：**
```typescript
// Token 过期时自动尝试刷新
if (response.status === 401 && retryCount < maxRetries) {
  const newToken = await refreshToken();
  if (newToken) {
    return apiRequest<T>(endpoint, options, retryCount + 1);
  }
}
```

### 2. 更新认证上下文 (`AuthContext.tsx`)

**新增功能：**
- 登录时保存 refresh token
- 在 localStorage 中使用 `refresh_token` 键存储刷新令牌

### 3. 更新认证服务 (`authService.ts`)

**新增功能：**
- 登出时清除 refresh token

## 使用说明

### 对于用户

1. **清除浏览器存储**
   - 打开浏览器开发者工具（F12）
   - 进入 Application > Local Storage
   - 删除以下键：
     - `auth_token`
     - `auth_user`
     - `refresh_token`

2. **重新登录**
   - 访问 `http://localhost:3001/login`（或自动重定向）
   - 使用测试账户登录：
     - 邮箱：`testapi@finapp.com`
     - 密码：`testapi123`

3. **访问受保护的页面**
   - 投资组合：`http://localhost:3001/portfolios`
   - 交易记录：`http://localhost:3001/transactions`
   - 报表中心：`http://localhost:3001/reports`
   - 图表分析：`http://localhost:3001/analytics`

### 对于开发人员

**测试 Token 刷新流程：**

```bash
# 1. 登录获取初始 token（此时 token 有效期为 24 小时）
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testapi@finapp.com","password":"testapi123"}'

# 响应示例：
# {
#   "success": true,
#   "data": {
#     "user": {...},
#     "tokens": {
#       "accessToken": "eyJhbGci...",
#       "refreshToken": "eyJhbGci...",
#       "expiresIn": 86400
#     }
#   }
# }

# 2. 使用 refresh token 刷新 access token
curl -X POST http://localhost:8000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh_token_from_login>"}'

# 3. 使用新的 access token 访问受保护的资源
curl -X GET http://localhost:8000/api/portfolios \
  -H "Authorization: Bearer <new_access_token>"
```

## 前后端数据流

### 登录流程
```
User Input (邮箱/密码)
    ↓
POST /api/auth/login
    ↓
后端验证，生成 accessToken 和 refreshToken
    ↓
前端保存：
  - auth_token = accessToken
  - refresh_token = refreshToken
  - auth_user = 用户信息
    ↓
用户成功登录
```

### 访问受保护资源流程
```
GET /api/portfolios (带 accessToken)
    ↓
accessToken 有效？
    ├─ 是 → 返回数据
    └─ 否（401）→ Token 过期
        ↓
        使用 refreshToken 调用 POST /api/auth/refresh
        ↓
        后端返回新的 accessToken
        ↓
        前端保存新 token
        ↓
        重试原始请求 GET /api/portfolios
        ↓
        返回数据
```

## 已知限制与后续改进

1. **Refresh Token 过期处理**
   - 当 refresh token 也过期时，用户需要重新登录
   - 后续可以实现 "保持登录" 功能

2. **Token 过期预警**
   - 目前是被动刷新（收到 401 时）
   - 可以实现主动刷新（基于过期时间）

3. **多标签页同步**
   - 目前不同标签页的 token 刷新不同步
   - 可以使用 localStorage 事件监听实现同步

## 故障排除

### 问题：仍然显示"请重新登录"
**解决方案：**
1. 检查浏览器控制台是否有错误信息
2. 确认后端服务运行：`curl http://localhost:8000/health`
3. 清除所有 localStorage 并重新登录
4. 检查网络连接

### 问题：Token 刷新失败
**排查步骤：**
1. 确认 refresh_token 已保存：`console.log(localStorage.getItem('refresh_token'))`
2. 测试 refresh 端点：
   ```bash
   curl -X POST http://localhost:8000/api/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{"refreshToken":"<your_token>"}'
   ```
3. 查看后端日志获取详细错误信息

### 问题：API 响应格式错误
**常见原因：**
- 后端返回 HTML（通常表示 404 或服务未运行）
- 检查 API 端点是否存在
- 查看后端路由配置

## 配置参考

### 后端环境变量 (`.env`)
```
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"
```

### 前端 localStorage 键
- `auth_token` - 访问令牌（有效期 24 小时）
- `refresh_token` - 刷新令牌（有效期 7 天）
- `auth_user` - 用户信息（JSON 格式）

---

**最后更新：** 2025-11-07  
**修复人员：** AI 助手  
**相关 PR/Issue：** Token 过期导致重新登录问题
