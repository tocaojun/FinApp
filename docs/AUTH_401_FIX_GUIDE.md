# 401认证错误修复指南

## 问题描述
模板下载失败，错误信息：`Request failed with status code 401`

## 原因分析
HTTP 401状态码表示**未授权**，可能的原因：

1. ✅ **Token已过期**（最常见）
2. Token不存在或格式错误
3. 用户账户未激活或未验证
4. JWT_SECRET配置问题

## 快速解决方案

### 方案1：重新登录（推荐）⭐

1. **退出当前登录**
   - 在前端页面点击"退出登录"按钮
   - 或者打开浏览器控制台执行：
     ```javascript
     localStorage.removeItem('token');
     localStorage.removeItem('user');
     location.reload();
     ```

2. **重新登录**
   - 访问登录页面：http://localhost:3001/login
   - 输入用户名和密码
   - 登录成功后会获得新的token

3. **测试模板下载**
   - 进入交易管理页面
   - 点击"批量导入"按钮
   - 点击"下载Excel模板"或"下载JSON模板"

### 方案2：检查Token状态

打开浏览器控制台（F12），执行以下命令：

```javascript
// 1. 检查token是否存在
const token = localStorage.getItem('token');
console.log('Token存在:', !!token);

// 2. 解析token查看过期时间
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expireDate = new Date(payload.exp * 1000);
    const now = new Date();
    console.log('Token过期时间:', expireDate.toLocaleString());
    console.log('当前时间:', now.toLocaleString());
    console.log('Token已过期:', expireDate < now);
  } catch (e) {
    console.error('Token格式错误:', e);
  }
}
```

### 方案3：使用测试脚本

```bash
# 给脚本添加执行权限
chmod +x test-auth-status.sh

# 运行测试脚本
./test-auth-status.sh
```

按提示输入token（从浏览器localStorage获取），脚本会自动测试认证状态。

## 技术细节

### 认证流程
```
前端请求 → 携带Token → 后端验证 → 检查用户状态 → 允许/拒绝访问
```

### Token验证步骤（后端）
1. 检查Authorization header是否存在
2. 提取Bearer token
3. 使用JWT_SECRET验证token签名
4. 检查token是否过期
5. 查询用户是否存在
6. 检查用户是否激活（isActive）
7. 检查用户是否验证（isVerified）

### 相关代码位置
- **认证中间件**: `backend/src/middleware/authMiddleware.ts`
- **全局认证配置**: `backend/src/app.ts:133`
- **前端Token存储**: `frontend/src/services/transactionImportService.ts:48,78`

## 预防措施

### 1. 自动刷新Token
考虑实现token自动刷新机制：
- 在token即将过期前自动刷新
- 使用refresh token机制

### 2. 统一错误处理
前端添加全局401拦截器：
```typescript
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // 清除token
      localStorage.removeItem('token');
      // 跳转到登录页
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 3. Token过期提示
在前端添加token过期倒计时提示，提醒用户及时保存数据。

## 验证修复

修复后，执行以下测试：

1. ✅ 登录成功
2. ✅ 访问交易管理页面
3. ✅ 点击"批量导入"按钮
4. ✅ 下载Excel模板成功
5. ✅ 下载JSON模板成功

## 常见问题

### Q1: 为什么之前可以访问其他页面，但下载模板失败？
A: 可能在访问其他页面后token刚好过期，或者浏览器缓存了旧的token。

### Q2: 重新登录后还是401错误？
A: 检查以下几点：
- 浏览器是否硬刷新（Cmd/Ctrl + Shift + R）
- 检查后端服务是否正常运行
- 检查JWT_SECRET环境变量是否配置

### Q3: 如何延长token有效期？
A: 修改后端JWT配置：
```typescript
// backend/src/controllers/AuthController.ts
const token = jwt.sign(
  { userId: user.id, email: user.email },
  jwtSecret,
  { expiresIn: '7d' } // 从默认值改为7天
);
```

## 下一步

如果重新登录后问题仍然存在，请提供：
1. 浏览器控制台的完整错误信息
2. 后端日志（`/tmp/backend.log`）
3. Token解析结果（使用方案2的脚本）

---

**最后更新**: 2025-10-27
**相关文档**: TEMPLATE_DOWNLOAD_FIX.md, NETWORK_ERROR_FIX.md
