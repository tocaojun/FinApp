# 生产环境前端重新部署指南

## 📋 背景

修复了前端API配置问题,需要在生产服务器上重新部署前端服务。

## 🔧 修复内容

### 修改的文件
1. `frontend/src/services/api.ts` - 核心API服务
2. `frontend/src/services/authService.ts` - 认证服务(登录相关)
3. `frontend/src/services/assetMonitoringApi.ts` - 资产监控API
4. `frontend/src/services/reportsApi.ts` - 报表API
5. `frontend/src/services/importExportApi.ts` - 导入导出API
6. `frontend/src/services/exchangeRateApi.ts` - 汇率API
7. `frontend/src/services/permissionApi.ts` - 权限API

### 修复原理
**修改前**:
```typescript
const API_BASE_URL = '/api';  // 或 'http://localhost:8000/api'
```

**修改后**:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
```

配合 `.env.production` 文件:
```env
VITE_API_BASE_URL=http://apollo123.cloud:8000/api
```

## 🚀 服务器端操作步骤

### 方法一: 使用自动化脚本(推荐)

SSH登录到服务器后,执行:

```bash
# 切换到项目目录
cd /opt/finapp/releases/$(ls -t /opt/finapp/releases | grep -E '^[0-9]{8}_[0-9]{6}$' | head -1)

# 执行重新部署脚本
bash scripts/redeploy-frontend-ubuntu.sh
```

脚本会自动完成以下操作:
- ✅ 拉取最新代码
- ✅ 停止旧的前端服务
- ✅ 验证环境配置
- ✅ 重新构建前端
- ✅ 验证API配置注入
- ✅ 启动前端服务
- ✅ 显示运行状态和日志

### 方法二: 手动执行步骤

如果需要手动操作,执行以下命令:

```bash
# 1. 切换到项目目录
cd /opt/finapp/releases/$(ls -t /opt/finapp/releases | grep -E '^[0-9]{8}_[0-9]{6}$' | head -1)

# 2. 拉取最新代码
git pull origin master

# 3. 停止前端服务
if [ -f logs/frontend.pid ]; then
  kill $(cat logs/frontend.pid) 2>/dev/null || true
  rm -f logs/frontend.pid
fi
pkill -f "serve.*3001" || true
pkill -f "vite.*preview" || true
sleep 2

# 4. 进入前端目录
cd frontend

# 5. 确认环境配置
cat .env.production
# 应显示: VITE_API_BASE_URL=http://apollo123.cloud:8000/api

# 6. 清除旧构建产物
rm -rf dist

# 7. 重新构建
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
unset NODE_OPTIONS

# 8. 验证API配置注入
grep -r "apollo123.cloud:8000" dist/assets/ | head -3

# 9. 启动前端服务
cd ..
if command -v serve &> /dev/null; then
  nohup serve -s frontend/dist -l 3001 -L > logs/frontend.log 2>&1 &
else
  cd frontend
  nohup npm run preview -- --port 3001 --host 0.0.0.0 > ../logs/frontend.log 2>&1 &
  cd ..
fi
echo $! > logs/frontend.pid

# 10. 查看日志
tail -20 logs/frontend.log
```

## ✅ 验证步骤

### 1. 服务器端验证

```bash
# 检查前端进程
ps aux | grep -E "serve|vite.*preview" | grep -v grep

# 检查端口监听
netstat -tlnp | grep :3001

# 测试本地访问
curl -I http://localhost:3001

# 查看日志
tail -f logs/frontend.log
```

### 2. 本地浏览器验证

1. **打开应用**:
   ```
   http://apollo123.cloud:3001
   ```

2. **打开浏览器开发者工具** (F12)

3. **切换到Network(网络)标签**

4. **尝试登录**:
   - 邮箱: `admin@example.com`
   - 密码: `admin123`

5. **检查API请求**:
   - 应该看到请求发往: `http://apollo123.cloud:8000/api/auth/login`
   - 状态码应该是 `200 OK`
   - 不应该有 `404` 或 `timeout` 错误

### 3. 预期结果

✅ **成功标志**:
- 登录请求URL: `http://apollo123.cloud:8000/api/auth/login`
- 响应状态: `200 OK`
- 响应内容包含: `{"success":true,"data":{"user":{...},"tokens":{...}}}`
- 登录成功后跳转到 Dashboard

❌ **失败标志**:
- 请求URL仍然是: `http://apollo123.cloud:3001/api/...` (错误!)
- 响应状态: `404 Not Found` 或 `timeout`
- 浏览器控制台显示错误

## 🐛 故障排除

### 问题1: 构建失败

**症状**: `npm run build` 报错

**解决**:
```bash
# 检查Node版本
node --version  # 应该 >= 16

# 清除缓存重新安装
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 问题2: API配置未注入

**症状**: 构建后的文件中没有 `apollo123.cloud:8000`

**检查**:
```bash
# 1. 确认环境文件存在
ls -la frontend/.env.production

# 2. 确认环境文件内容
cat frontend/.env.production

# 3. 确认Vite能读取环境变量
cd frontend
npx vite build --mode production 2>&1 | grep -i "vite_api"
```

**解决**:
```bash
# 确保.env.production内容正确
echo 'VITE_API_BASE_URL=http://apollo123.cloud:8000/api' > frontend/.env.production
echo 'VITE_APP_TITLE=FinApp' >> frontend/.env.production
```

### 问题3: 前端服务启动失败

**症状**: 服务启动后立即退出

**检查**:
```bash
# 查看错误日志
tail -50 logs/frontend.log

# 检查端口占用
netstat -tlnp | grep :3001
lsof -i :3001
```

**解决**:
```bash
# 杀死占用端口的进程
kill -9 $(lsof -t -i:3001)

# 重新启动
bash scripts/redeploy-frontend-ubuntu.sh
```

### 问题4: 浏览器仍然看到旧版本

**原因**: 浏览器缓存

**解决**:
1. 硬刷新: `Ctrl+Shift+R` (Chrome) 或 `Cmd+Shift+R` (Mac)
2. 清除浏览器缓存
3. 使用无痕模式测试

### 问题5: CORS错误

**症状**: 浏览器控制台显示CORS错误

**检查后端CORS配置**:
```bash
# 查看后端环境配置
cat backend/.env.production | grep CORS_ORIGIN
```

**应该包含**:
```
CORS_ORIGIN=http://apollo123.cloud,http://apollo123.cloud:8000,http://apollo123.cloud:3001
```

**如果不正确,修复**:
```bash
# 修改后端配置
sed -i 's|CORS_ORIGIN=.*|CORS_ORIGIN=http://apollo123.cloud,http://apollo123.cloud:8000,http://apollo123.cloud:3001|' backend/.env.production

# 重启后端
pkill -f "node.*dist/server"
cd backend
NODE_ENV=production nohup node dist/server.js > ../logs/backend.log 2>&1 &
echo $! > ../logs/backend.pid
```

## 📊 测试清单

完成部署后,逐项验证:

- [ ] 前端页面可以访问 (`http://apollo123.cloud:3001`)
- [ ] 登录页面正常显示
- [ ] 点击登录,Network标签显示请求到 `http://apollo123.cloud:8000/api/auth/login`
- [ ] 登录请求返回 `200 OK`
- [ ] 登录成功后跳转到Dashboard
- [ ] Dashboard页面数据正常加载
- [ ] 其他功能(投资组合、交易记录等)正常工作
- [ ] 没有控制台错误

## 📝 注意事项

1. **备份**: 重新部署前,当前运行的服务会被停止
2. **构建时间**: 前端构建大约需要 2-3 分钟
3. **内存使用**: 构建过程会使用 4GB 内存
4. **服务中断**: 前端服务会有 2-3 分钟的中断时间
5. **浏览器缓存**: 用户可能需要硬刷新才能看到更新

## 🔗 相关文档

- [生产环境部署指南](./production-deployment-guide.md)
- [故障排查指南](./troubleshooting-guide.md)
- [系统配置信息](../config/system-config.md)

---

**创建日期**: 2025-12-09  
**最后更新**: 2025-12-09  
**维护人员**: 开发团队
