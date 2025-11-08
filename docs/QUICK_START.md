# FinApp 快速启动指南

## 🚀 一键启动

```bash
cd /Users/caojun/code/FinApp
./start-services.sh
```

## 📱 访问应用

打开浏览器访问: **http://localhost:3001**

## 🔐 测试账户

### 普通用户
- 邮箱: `testapi@finapp.com`
- 密码: `testapi123`

### 管理员
- 邮箱: `admin@finapp.com`
- 密码: `admin123`

## ✅ 验证流动性标签修复

1. 登录系统
2. 进入 **产品管理** 页面
3. 点击 **新增产品** 或 **编辑产品**
4. 查看 **流动性标签** 下拉框
5. 应该看到 **5个选项**：
   - 高流动性 (绿色)
   - 中等流动性 (橙色)
   - 低流动性 (红色)
   - 锁定期 (紫色)
   - 不可交易 (灰色)

## 🔧 服务管理

### 查看服务状态
```bash
# 后端服务
curl http://localhost:8000/health

# 前端服务
curl http://localhost:3001
```

### 查看日志
```bash
# 后端日志
tail -f /tmp/finapp-backend.log

# 前端日志
tail -f /tmp/finapp-frontend.log
```

### 停止服务
```bash
# 停止后端
pkill -f "ts-node.*server.ts"

# 停止前端
pkill -f "vite"
```

### 手动启动服务

#### 后端
```bash
cd /Users/caojun/code/FinApp/backend
npm run dev
```

#### 前端
```bash
cd /Users/caojun/code/FinApp/frontend
npm run dev
```

## 📊 服务端口

| 服务 | 端口 | 地址 |
|------|------|------|
| 前端应用 | 3001 | http://localhost:3001 |
| 后端API | 8000 | http://localhost:8000 |
| API文档 | 8000 | http://localhost:8000/api/docs |
| 数据库 | 5432 | postgresql://localhost:5432/finapp_test |

## 🐛 故障排除

### 登录失败 (500错误)
**原因**: 后端服务未启动
**解决**: 运行 `./start-services.sh`

### 流动性标签显示3个硬编码选项
**原因**: 浏览器缓存
**解决**: 
1. 按 `Cmd + Shift + R` (Mac) 或 `Ctrl + Shift + R` (Windows)
2. 或清空浏览器缓存

### 保存产品失败
**原因**: 后端服务问题
**解决**: 
1. 检查后端日志: `tail -f /tmp/finapp-backend.log`
2. 重启后端服务

### 端口被占用
```bash
# 查看占用进程
lsof -i :8000
lsof -i :3001

# 杀死进程
kill -9 <PID>
```

## 📝 最近修复

### 2025-10-26 流动性标签完整修复
- ✅ 修复前端API服务返回硬编码数据
- ✅ 修复后端Service层`.rows`访问错误
- ✅ 优化路由认证配置
- ✅ 流动性标签从3个增加到5个
- ✅ 修复中文乱码问题
- ✅ 修复保存产品失败问题

详细报告:
- `liquidity-tags-final-fix-report.md`
- `login-500-error-fix-report.md`

## 🎯 下一步

1. 测试产品管理功能
2. 验证流动性标签选择
3. 测试产品保存功能
4. 检查数据显示是否正确

## 💡 提示

- 首次启动可能需要几秒钟
- 如果遇到问题，先查看日志文件
- 确保PostgreSQL数据库正在运行
- 使用 `Cmd + Shift + R` 强制刷新浏览器

---

**需要帮助?** 查看详细文档:
- 系统配置: `config/system-config.md`
- 修复报告: `liquidity-tags-final-fix-report.md`
- 登录问题: `login-500-error-fix-report.md`
