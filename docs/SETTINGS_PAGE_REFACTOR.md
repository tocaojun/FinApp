# 设置页面数据源改造总结

## 问题描述
设置页面中的用户基本信息之前使用的是**硬编码数据**，不会从后端 API 获取真实的用户信息。

## 改造内容

### 1. 用户个人信息 ✅
- **之前**: 使用硬编码的模拟用户数据
- **现在**: 从后端 API `/api/auth/profile` 获取真实用户信息
- **数据来源**: 数据库中的 `users` 表
- **刷新时机**: 页面加载时自动获取

### 2. 保存个人信息 ✅
- **之前**: 仅在前端本地更新状态，不调用后端 API
- **现在**: 调用后端 API `/api/auth/profile` (PUT) 保存到数据库
- **保存字段**: firstName, lastName, phone, timezone, language, bio

### 3. 系统偏好设置 ✅
- **之前**: 使用硬编码的默认值
- **现在**: 从 localStorage 读取保存的偏好，或使用合理的默认值
- **存储位置**: 浏览器 localStorage
- **保存时**: 点击保存按钮时持久化到 localStorage

### 4. 修改密码 ✅
- **之前**: 模拟 API 调用，不实际修改密码
- **现在**: 调用后端 API `/api/auth/change-password` (PUT) 实际修改密码
- **验证**: 需要提供当前密码和新密码

### 5. 安全设置 ✅
- **双因素认证**: 支持启用/禁用切换
- **登录通知**: 支持启用/禁用
- **会话超时**: 支持设置超时时间
- **信任设备**: 显示和移除设备列表

## 后端 API 端点

已使用的 API 端点：

| 方法 | 端点 | 功能 |
|-----|------|------|
| GET | /api/auth/profile | 获取用户个人资料 |
| PUT | /api/auth/profile | 更新用户个人资料 |
| PUT | /api/auth/change-password | 修改密码 |

## 数据流程

```
┌─────────────────┐
│  设置页面 (React)  │
└────────┬────────┘
         │
         ├─ 页面加载时
         │  └─ GET /api/auth/profile
         │     └─ 获取真实用户数据
         │
         ├─ 保存个人信息时
         │  └─ PUT /api/auth/profile
         │     └─ 保存到数据库
         │
         └─ 修改密码时
            └─ PUT /api/auth/change-password
               └─ 更新密码哈希

┌──────────────────┐
│  后端 (Express)   │
└────────┬─────────┘
         │
         ├─ AuthController
         │  ├─ getProfile()
         │  ├─ updateProfile()
         │  └─ changePassword()
         │
         └─ AuthService
            └─ 调用 Prisma 更新数据库

┌──────────────────┐
│  数据库 (PostgreSQL) │
└──────────────────┘
         │
         └─ users 表
            ├─ firstName
            ├─ lastName
            ├─ phone
            ├─ timezone
            ├─ language
            ├─ passwordHash
            └─ ...
```

## 环境配置

### 后端配置文件
- 文件: `/Users/caojun/code/FinApp/backend/.env`
- JWT_SECRET: 用于生成和验证 token
- DATABASE_URL: PostgreSQL 数据库连接字符串

### 前端配置文件
- 文件: `/Users/caojun/code/FinApp/frontend/.env`
- VITE_API_BASE_URL: API 基础 URL (`http://localhost:8000/api`)

## 测试步骤

### 1. 启动服务
```bash
# 终端1：启动 PostgreSQL
brew services start postgresql@13

# 终端2：启动后端
cd /Users/caojun/code/FinApp/backend
npm run dev

# 终端3：启动前端
cd /Users/caojun/code/FinApp/frontend
npm run dev
```

### 2. 测试个人信息
1. 访问 `http://localhost:3001`
2. 用 testapi@finapp.com / testapi123 登录
3. 进入设置 > 个人信息
4. 验证显示的信息与数据库中的数据一致

### 3. 测试更新个人信息
1. 修改姓名、电话等字段
2. 点击"保存更改"
3. 刷新页面验证更改已保存

### 4. 测试修改密码
1. 点击"修改密码"
2. 输入当前密码 (testapi123) 和新密码
3. 确认修改
4. 尝试用新密码重新登录

## 已知限制

1. **系统偏好设置**: 暂时保存在本地 localStorage，不同设备会有不同设置
   - 后续可添加后端 API 来同步跨设备设置

2. **安全设置**: 双因素认证等功能目前仅作为 UI 展示
   - 需要后端实现具体的双因素认证逻辑

3. **信任设备**: 目前显示硬编码的设备列表
   - 需要后端添加设备跟踪功能

## 后续改进建议

- [ ] 添加头像上传功能（上传到云存储或服务器）
- [ ] 实现系统偏好的后端存储
- [ ] 添加双因素认证 (2FA) 的完整实现
- [ ] 添加设备管理功能（自动跟踪登录设备）
- [ ] 添加登录历史记录显示
- [ ] 支持多语言设置同步

## 修改的文件

- `/Users/caojun/code/FinApp/frontend/src/pages/settings/SettingsPage.tsx`

## 版本信息

- 修改日期: 2025-11-07
- 修改者: AI Assistant
- 状态: 完成 ✅
