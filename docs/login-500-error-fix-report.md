# 登录500错误修复报告

## 问题描述
用户在登录时遇到错误：`Request failed with status code 500`

## 根本原因
**后端服务未运行**

虽然前端服务在端口3001上正常运行，但后端API服务（端口8000）没有启动，导致前端无法连接到后端API，从而产生500错误。

## 解决方案

### 1. 启动后端服务
```bash
cd /Users/caojun/code/FinApp/backend
npm run dev
```

### 2. 验证服务状态
```bash
# 检查后端服务
curl http://localhost:8000/health

# 检查前端服务
curl http://localhost:3001
```

### 3. 测试登录功能
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testapi@finapp.com","password":"testapi123"}'
```

## 当前服务状态

✅ **后端服务**: 运行中 (端口 8000)
- API地址: http://localhost:8000
- 健康检查: http://localhost:8000/health
- API文档: http://localhost:8000/api/docs

✅ **前端服务**: 运行中 (端口 3001)
- 应用地址: http://localhost:3001

✅ **数据库服务**: PostgreSQL 运行中 (端口 5432)

## 流动性标签API验证

已验证流动性标签API正常工作，返回5个标签：

```json
[
  {
    "id": "72441548-4b68-421a-b9b5-2e0fba7a058d",
    "name": "高流动性",
    "description": "大盘股、主要ETF等高流动性资产",
    "color": "#22c55e",
    "sortOrder": 1,
    "isActive": true
  },
  {
    "id": "e56bcdaa-8f82-4326-a96c-bd23bfcb87a7",
    "name": "中等流动性",
    "description": "中盘股、部分基金等中等流动性资产",
    "color": "#f59e0b",
    "sortOrder": 2,
    "isActive": true
  },
  {
    "id": "3847f7bb-e5fb-4586-a5f1-376818270818",
    "name": "低流动性",
    "description": "小盘股、私募基金等低流动性资产",
    "color": "#ef4444",
    "sortOrder": 3,
    "isActive": true
  },
  {
    "id": "c7c28860-b6fb-43ad-8c24-91c3d7571975",
    "name": "锁定期",
    "description": "有锁定期限制的资产",
    "color": "#8b5cf6",
    "sortOrder": 4,
    "isActive": true
  },
  {
    "id": "f6af0909-29e4-4ded-820d-87ab770c82a5",
    "name": "不可交易",
    "description": "暂停交易或退市的资产",
    "color": "#6b7280",
    "sortOrder": 5,
    "isActive": true
  }
]
```

## 便捷启动脚本

已创建一键启动脚本 `start-services.sh`，可以自动启动所有服务：

```bash
./start-services.sh
```

该脚本会：
1. 检查并启动PostgreSQL数据库
2. 启动后端服务（端口8000）
3. 启动前端服务（端口3001）
4. 显示服务状态和日志位置

## 测试步骤

### 1. 访问应用
在浏览器中打开: http://localhost:3001

### 2. 登录测试
使用测试账户登录：
- 邮箱: `testapi@finapp.com`
- 密码: `testapi123`

### 3. 验证流动性标签
1. 登录成功后，进入"产品管理"页面
2. 点击"新增产品"或"编辑产品"
3. 查看"流动性标签"下拉框
4. 应该看到5个选项（而非之前的3个硬编码选项）

## 预期结果

✅ 登录成功，无500错误
✅ 流动性标签下拉框显示5个选项
✅ 中文显示正常，无乱码
✅ 保存产品功能正常

## 日志查看

如果遇到问题，可以查看日志：

```bash
# 后端日志
tail -f /tmp/finapp-backend.log

# 前端日志
tail -f /tmp/finapp-frontend.log
```

## 常见问题

### Q: 如果服务意外停止怎么办？
A: 重新运行启动脚本：
```bash
./start-services.sh
```

### Q: 如何停止服务？
A: 
```bash
# 停止后端
pkill -f "ts-node.*server.ts"

# 停止前端
pkill -f "vite"

# 或者直接在终端按 Ctrl+C
```

### Q: 端口被占用怎么办？
A: 
```bash
# 查看端口占用
lsof -i :8000
lsof -i :3001

# 杀死占用进程
kill -9 <PID>
```

## 总结

所有问题已解决：
1. ✅ 后端服务已启动
2. ✅ 登录功能正常
3. ✅ 流动性标签API返回正确数据
4. ✅ 前端可以正常获取5个流动性标签

现在可以正常使用系统了！

---

**修复时间**: 2025-10-26
**问题类型**: 服务未启动
**解决方案**: 启动后端服务
