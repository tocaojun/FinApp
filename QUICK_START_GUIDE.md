# FinApp 快速启动指南

## 🚀 一键启动

### 方式1：使用启动脚本（推荐）

```bash
# 进入项目目录
cd /Users/caojun/code/FinApp

# 运行启动脚本
./start-all-clean.sh
```

这个脚本会：
- ✅ 自动清理旧进程
- ✅ 启动后端服务（端口8000）
- ✅ 启动前端服务（端口3001）
- ✅ 检查服务健康状态
- ✅ 显示访问地址

### 方式2：手动启动

**启动后端**：
```bash
cd /Users/caojun/code/FinApp/backend
npm run dev
```

**启动前端**（新终端）：
```bash
cd /Users/caojun/code/FinApp/frontend
npm run dev
```

---

## 🛑 停止服务

### 使用停止脚本

```bash
./stop-all.sh
```

### 手动停止

```bash
# 停止后端
pkill -f "nodemon.*backend"

# 停止前端
pkill -f "vite.*frontend"
```

---

## 🌐 访问应用

### 前端应用
- **地址**: http://localhost:3001
- **说明**: React Web应用

### 后端API
- **健康检查**: http://localhost:8000/health
- **API文档**: http://localhost:8000/api/docs
- **基础地址**: http://localhost:8000/api

---

## 📋 测试批量导入功能

### 步骤1：访问应用
```bash
open http://localhost:3001
```

### 步骤2：登录系统
使用您的账号登录

### 步骤3：进入交易管理
导航到"交易管理"页面

### 步骤4：批量导入
1. 点击"批量导入"按钮
2. 选择投资组合
3. 选择交易账户
4. 选择资产（产品）
5. 下载模板文件
6. 填写交易数据
7. 上传文件
8. 预览并确认导入

---

## 📥 下载导入模板

### Excel模板
```bash
curl -O http://localhost:8000/api/transactions/import/template/excel
```

### JSON模板
```bash
curl -O http://localhost:8000/api/transactions/import/template/json
```

或在浏览器中直接访问：
- Excel: http://localhost:8000/api/transactions/import/template/excel
- JSON: http://localhost:8000/api/transactions/import/template/json

---

## 🔍 查看日志

### 后端日志
```bash
tail -f /tmp/backend.log
```

### 前端日志
```bash
tail -f /tmp/frontend.log
```

---

## 🛠️ 常见问题

### Q1: 服务启动失败？

**检查端口占用**：
```bash
lsof -i:8000  # 后端
lsof -i:3001  # 前端
```

**清理并重启**：
```bash
./stop-all.sh
./start-all-clean.sh
```

### Q2: 前端无法连接后端？

**检查后端健康状态**：
```bash
curl http://localhost:8000/health
```

**检查代理配置**：
查看 `frontend/vite.config.ts` 中的proxy配置

### Q3: 数据库连接失败？

**检查PostgreSQL服务**：
```bash
pg_isready
```

**检查数据库配置**：
查看 `backend/.env` 文件

### Q4: 批量导入报错？

**查看后端日志**：
```bash
tail -f /tmp/backend.log
```

**检查文件格式**：
- 确保使用提供的模板
- 检查字段格式是否正确
- 验证日期格式为 YYYY-MM-DD

---

## 📊 服务状态检查

### 检查进程
```bash
# 查看所有相关进程
ps aux | grep -E "nodemon|vite" | grep -v grep

# 查看后端进程
ps aux | grep "nodemon.*backend" | grep -v grep

# 查看前端进程
ps aux | grep "vite.*frontend" | grep -v grep
```

### 检查端口
```bash
# 检查8000端口（后端）
lsof -i:8000

# 检查3001端口（前端）
lsof -i:3001
```

### 健康检查
```bash
# 后端健康检查
curl http://localhost:8000/health

# 前端访问测试
curl http://localhost:3001
```

---

## 📚 相关文档

### 核心文档
- 📄 [服务重启完成报告](SERVICE_RESTART_COMPLETE.md) - 最新状态
- 📄 [服务状态报告](SERVICE_STATUS_REPORT.md) - 详细状态
- 📄 [快速开始](START_HERE.md) - 功能介绍

### 功能文档
- 📄 [批量导入字段规范](TRANSACTION_IMPORT_FIELDS_SPEC_V2.md)
- 📄 [批量导入实现方案](TRANSACTION_IMPORT_IMPLEMENTATION_V2.md)
- 📄 [批量导入快速参考](TRANSACTION_IMPORT_QUICK_REFERENCE_V2.md)
- 📄 [功能测试指南](TEST_IMPORT_FEATURE.md)

### 问题修复
- 📄 [前端语法错误修复](SYNTAX_ERROR_FIX.md)
- 📄 [后端编译错误修复](BACKEND_ERROR_FIX.md)

---

## 🎯 快速命令参考

```bash
# 启动所有服务
./start-all-clean.sh

# 停止所有服务
./stop-all.sh

# 查看后端日志
tail -f /tmp/backend.log

# 查看前端日志
tail -f /tmp/frontend.log

# 检查服务状态
curl http://localhost:8000/health

# 打开应用
open http://localhost:3001

# 下载Excel模板
curl -O http://localhost:8000/api/transactions/import/template/excel

# 下载JSON模板
curl -O http://localhost:8000/api/transactions/import/template/json
```

---

## 🎉 开始使用

1. **启动服务**：`./start-all-clean.sh`
2. **打开浏览器**：http://localhost:3001
3. **登录系统**
4. **测试批量导入功能**

**祝使用愉快！** 🚀

---

**最后更新**: 2025-10-27
