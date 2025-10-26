# 前端服务重启指南

## 🔄 为什么需要重启？

由于修改了以下内容，需要重启前端服务才能生效：
1. ✅ 创建了新的环境变量文件 `.env`
2. ✅ 优化了流动性标签API服务
3. ✅ 添加了请求/响应拦截器

## 📝 重启步骤

### 方法1: 使用终端重启

1. **找到运行前端的终端窗口**
2. **按 `Ctrl + C` 停止服务**
3. **重新启动：**
   ```bash
   cd /Users/caojun/code/FinApp/frontend
   npm run dev
   ```

### 方法2: 使用一键启动脚本

```bash
# 停止所有服务
pkill -f "vite"
pkill -f "ts-node.*server.ts"

# 使用启动脚本
/Users/caojun/code/FinApp/start-services.sh
```

## ✅ 验证服务状态

### 检查前端服务
```bash
lsof -i :3001 | grep LISTEN
```

**预期输出：**
```
node    xxxxx caojun   19u  IPv6 ...  TCP *:redwood-broker (LISTEN)
```

### 检查后端服务
```bash
lsof -i :8000 | grep LISTEN
```

**预期输出：**
```
node    xxxxx caojun   26u  IPv6 ...  TCP *:irdmi (LISTEN)
```

## 🌐 浏览器操作

### 1. 清除缓存
- **Mac**: `Cmd + Shift + R`
- **Windows**: `Ctrl + Shift + R`

### 2. 访问应用
打开浏览器访问: http://localhost:3001

### 3. 登录测试
- 邮箱: `testapi@finapp.com`
- 密码: `testapi123`

### 4. 测试流动性标签
1. 进入"产品管理"页面
2. 点击"新增产品"或"编辑产品"
3. 查看"流动性标签"下拉框

**预期结果：**
- ✅ 显示5个流动性标签选项
- ✅ 中文显示正常
- ✅ 无"加载失败"错误

## 🔍 故障排除

### 问题1: 端口被占用

**错误信息：**
```
Port 3001 is already in use
```

**解决方案：**
```bash
# 查找占用端口的进程
lsof -i :3001

# 杀死进程
kill -9 <PID>

# 重新启动
npm run dev
```

### 问题2: 仍然显示"加载失败"

**检查步骤：**
1. 确认前端服务已重启
2. 确认浏览器缓存已清除
3. 打开浏览器开发者工具（F12）
4. 查看Console标签的错误信息
5. 查看Network标签的API请求

**查看详细日志：**
新的拦截器会输出详细错误：
```javascript
// 在浏览器Console中会看到：
API请求失败: Error: ...
响应状态: 401
响应数据: { message: "Unauthorized" }
```

### 问题3: Token过期

**解决方案：**
1. 重新登录
2. 或在Console中手动设置：
```javascript
localStorage.setItem('auth_token', '<new_token>');
location.reload();
```

## 📊 服务状态检查

### 完整检查脚本
```bash
#!/bin/bash

echo "检查服务状态..."
echo ""

# 检查后端
if lsof -i :8000 | grep -q LISTEN; then
    echo "✅ 后端服务运行正常 (http://localhost:8000)"
else
    echo "❌ 后端服务未运行"
fi

# 检查前端
if lsof -i :3001 | grep -q LISTEN; then
    echo "✅ 前端服务运行正常 (http://localhost:3001)"
else
    echo "❌ 前端服务未运行"
fi

# 检查数据库
if psql -U postgres -c "SELECT 1" > /dev/null 2>&1; then
    echo "✅ 数据库连接正常"
else
    echo "❌ 数据库连接失败"
fi

echo ""
echo "服务检查完成！"
```

## 📚 相关文档

- `liquidity-tags-complete-fix-report.md` - 完整修复报告
- `QUICK_START.md` - 快速启动指南
- `start-services.sh` - 一键启动脚本

---

**更新时间**: 2025-10-26  
**版本**: v1.0
