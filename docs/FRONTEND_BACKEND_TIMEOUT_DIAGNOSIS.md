# 前后端连接超时 - 诊断与修复

**诊断时间**: 2025-11-08  
**问题状态**: 🔍 已定位  
**严重等级**: 🔴 严重 (前端无法访问后端)

---

## 🔴 问题定位

### 核心问题

**端口不匹配导致连接失败**

```
后端实际运行端口:     3000 ✅
前端配置代理端口:     8000 ❌ (错误!)
Vite开发服务器端口: 3001

结果: 前端 → (代理到8000) ✗ 连接超时
```

### 错误的Vite配置

**文件**: `frontend/vite.config.ts`

```typescript
// ❌ 错误配置
proxy: {
  '/api': {
    target: 'http://localhost:8000',  // ← 后端不在这个端口!
    changeOrigin: true,
    secure: false,
  },
  '/health': {
    target: 'http://localhost:8000',  // ← 同样的错误
    changeOrigin: true,
    secure: false,
  }
}
```

### 为什么超时?

1. 前端(3001)发送请求 → `/api/assets`
2. Vite代理尝试连接 → `http://localhost:8000/api/assets`
3. **8000端口没有任何服务监听** ⚠️
4. 连接被拒绝或超时 ❌
5. 前端收到30秒超时错误 💥

---

## ✅ 修复方案

### 步骤 1: 更新Vite配置

**文件**: `/Users/caojun/code/FinApp/frontend/vite.config.ts`

替换为:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',  // ✅ 修正: 后端实际端口
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'http://localhost:3000',  // ✅ 修正: 后端实际端口
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
```

### 步骤 2: 验证后端服务

```bash
# 检查后端是否在运行
curl http://localhost:3000/health

# 预期响应:
# {"status":"ok"} 或类似的健康检查响应
```

### 步骤 3: 重启前端开发服务器

```bash
# 停止Vite开发服务器 (Ctrl+C)

# 重启Vite
cd frontend
npm run dev

# 前端将在 http://localhost:3001 启动
# 代理将正确转发到 http://localhost:3000
```

### 步骤 4: 验证连接

```bash
# 打开浏览器访问
http://localhost:3001

# 检查浏览器控制台(F12)
# 应该看到成功的API请求，而不是超时错误
```

---

## 🔍 详细诊断信息

### 当前状态

| 组件 | 状态 | 详情 |
|-----|-----|------|
| **后端服务** | ✅ 运行中 | PID: 52158, 端口: 3000 |
| **Vite开发服务器** | ✅ 运行中 | PID: 42112, 端口: 3001 |
| **后端代理配置** | ❌ 错误 | 指向 8000 而非 3000 |
| **连接结果** | ❌ 失败 | 超时 30 秒 |

### 进程状态

```
后端: 运行中 (node ts-node src/server.ts)
  ├─ PID: 52158
  ├─ 端口: 3000 ✅
  ├─ 日志: "Server is running on port 3000"
  └─ 健康状态: 健康 ✅

前端Vite: 运行中
  ├─ PID: 42112
  ├─ 端口: 3001 ✅
  ├─ 代理配置: http://localhost:8000 ❌
  └─ 健康状态: 运行但连接失败 ❌
```

---

## 📊 网络连接流程

### 正确的连接流程 ✅

```
浏览器 (localhost:3001)
    ↓
[发送] GET /api/assets
    ↓
Vite 代理 (localhost:3001)
    ↓
[转发] GET http://localhost:3000/api/assets
    ↓
后端服务 (localhost:3000)
    ↓
[返回] 200 OK { assets: [...] }
    ↓
[接收] 返回给浏览器
    ↓
浏览器显示数据 ✅
```

### 当前的错误连接流程 ❌

```
浏览器 (localhost:3001)
    ↓
[发送] GET /api/assets
    ↓
Vite 代理 (localhost:3001)
    ↓
[转发] GET http://localhost:8000/api/assets  ← 错误!
    ↓
连接被拒绝 (8000 无服务监听)
    ↓
等待 30 秒超时...
    ↓
[返回] 错误: Request timeout
    ↓
浏览器显示错误 ❌
```

---

## 🚨 其他可能的问题

### 问题 2: CORS 配置

如果修复后仍然有跨域问题，检查后端CORS配置:

```typescript
// backend/src/app.ts
app.use(cors({
  origin: 'http://localhost:3001',  // 前端地址
  credentials: true
}));
```

### 问题 3: API_BASE_URL 硬编码

检查前端的API基础URL配置:

```typescript
// frontend/src/services/api.ts
const API_BASE_URL = '/api';  // ✅ 使用相对路径 (通过代理)
// 不要使用绝对URL: const API_BASE_URL = 'http://localhost:3000/api';
```

### 问题 4: 环境变量配置

确保没有硬编码的后端地址:

```bash
# 不要在.env中设置
# VITE_API_URL=http://localhost:8000/api  ❌

# 使用相对路径
# VITE_API_URL=/api  ✅
```

---

## 🛠️ 快速修复步骤总结

### 第一步: 编辑Vite配置

```bash
# 编辑文件
nano /Users/caojun/code/FinApp/frontend/vite.config.ts

# 或用你的编辑器打开
```

### 第二步: 替换代理端口

```diff
- target: 'http://localhost:8000',
+ target: 'http://localhost:3000',
```

### 第三步: 保存并重启

```bash
# 停止当前Vite (Ctrl+C)
# 重启Vite
cd /Users/caojun/code/FinApp/frontend
npm run dev
```

### 第四步: 验证

```bash
# 打开浏览器
# http://localhost:3001

# 打开开发者工具 (F12)
# 检查 Network 标签
# 应该看到成功的请求 (绿色 ✅)
```

---

## 📝 预防措施

### 1. 配置管理最佳实践

```
开发环境:
  - 后端: localhost:3000
  - 前端: localhost:3001
  - 代理: /api → http://localhost:3000

测试环境:
  - 后端: test-api.example.com:3000
  - 前端: test.example.com:3001
  - 代理: /api → http://test-api.example.com:3000

生产环境:
  - 后端: api.example.com:443 (HTTPS)
  - 前端: example.com:443 (HTTPS)
  - 代理: /api → https://api.example.com
```

### 2. 使用环境变量

```typescript
// vite.config.ts
const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:3000';

proxy: {
  '/api': {
    target: backendUrl,
    changeOrigin: true,
    secure: false,
  }
}
```

### 3. 文档化配置

```markdown
## 本地开发环境设置

### 前置条件
- Node.js 18+
- PostgreSQL 运行中

### 启动后端
```bash
cd backend
npm run dev
# 后端运行在 http://localhost:3000
```

### 启动前端
```bash
cd frontend
npm run dev
# 前端运行在 http://localhost:3001
# 前端代理会将 /api 请求转发到 http://localhost:3000
```

---

## ✅ 完成检查清单

修复完成后，请检查:

- [ ] Vite 配置中的代理地址改为 `http://localhost:3000`
- [ ] 后端服务正在运行 (端口 3000)
- [ ] 前端开发服务器已重启 (端口 3001)
- [ ] 浏览器可以访问 `http://localhost:3001`
- [ ] Network 标签中的 API 请求显示状态 200 (绿色)
- [ ] 浏览器控制台无 "timeout" 错误信息
- [ ] 能够成功登录和加载数据

---

## 🆘 如果问题仍未解决

### 调试步骤

1. **检查后端是否真的在运行**
   ```bash
   curl -v http://localhost:3000/health
   ```

2. **检查Vite是否使用了新配置**
   ```bash
   # 重启Vite后，检查日志中是否显示:
   # VITE v5.0.0 ready in XXX ms
   # ➜ Local: http://localhost:3001/
   # ➜ proxy /api -> http://localhost:3000
   ```

3. **检查浏览器控制台**
   - F12 打开开发者工具
   - Console 标签
   - 查看是否有特定的错误消息

4. **检查 Network 标签**
   - 查看请求是否被发送
   - 查看响应状态码
   - 查看是否有 CORS 错误

### 获取更多帮助

如果以上步骤都无法解决问题，请收集以下信息:

1. 后端日志输出
2. 前端控制台错误信息
3. Network 标签中的请求详情
4. Vite 启动日志

---

**修复预计时间**: 2 分钟 ⏱️  
**难度等级**: 极简单 ⭐  
**风险等级**: 零风险 ✅

**下一步**: 按照修复步骤进行更改，然后重启服务。
