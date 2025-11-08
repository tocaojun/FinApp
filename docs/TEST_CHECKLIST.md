# FinApp 测试清单

## ✅ 服务状态检查

### 1. 后端服务
- [x] 后端运行在端口8000
- [x] 健康检查通过: http://localhost:8000/health
- [x] 数据库连接正常
- [x] API文档可访问: http://localhost:8000/api/docs

### 2. 前端服务
- [x] 前端运行在端口3001
- [x] 页面可访问: http://localhost:3001
- [x] Vite开发服务器正常

### 3. 数据库服务
- [x] PostgreSQL运行在端口5432
- [x] 数据库: finapp_test
- [x] 用户: finapp_user
- [x] 编码: UTF-8

## ✅ 功能测试

### 登录功能
- [ ] 打开 http://localhost:3001
- [ ] 输入邮箱: `testapi@finapp.com`
- [ ] 输入密码: `testapi123`
- [ ] 点击登录
- [ ] **预期**: 成功登录，无500错误

### 流动性标签加载
- [ ] 登录后进入"产品管理"页面
- [ ] **预期**: 页面正常加载，无"加载流动性标签失败"错误

### 流动性标签下拉框
- [ ] 点击"新增产品"按钮
- [ ] 查看"流动性标签"下拉框
- [ ] **预期**: 显示5个选项：
  - ✅ 高流动性 (绿色 #22c55e)
  - ✅ 中等流动性 (橙色 #f59e0b)
  - ✅ 低流动性 (红色 #ef4444)
  - ✅ 锁定期 (紫色 #8b5cf6)
  - ✅ 不可交易 (灰色 #6b7280)
- [ ] **预期**: 中文显示正常，无乱码

### 产品创建
- [ ] 填写产品信息：
  - 产品代码: TEST001
  - 产品名称: 测试产品
  - 产品类型: 选择任意类型
  - 交易市场: 选择任意市场
  - 货币: CNY
  - 风险等级: 中风险
  - 流动性标签: 选择"高流动性"
- [ ] 点击"创建"按钮
- [ ] **预期**: 产品创建成功，无报错

### 产品编辑
- [ ] 在产品列表中点击"编辑"按钮
- [ ] 修改流动性标签为"中等流动性"
- [ ] 点击"更新"按钮
- [ ] **预期**: 产品更新成功，无报错

### 产品筛选
- [ ] 在筛选区域选择流动性标签
- [ ] 点击"搜索"按钮
- [ ] **预期**: 正确筛选出对应流动性标签的产品

## 🔍 API测试

### 流动性标签API
```bash
# 1. 登录获取token
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testapi@finapp.com","password":"testapi123"}' -s \
  | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

# 2. 获取流动性标签
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/liquidity-tags | python3 -m json.tool
```

**预期结果**:
- 返回5个流动性标签
- 每个标签包含: id, name, description, color, sortOrder, isActive
- name和description字段显示中文，无乱码

## 🐛 已知问题检查

### 问题1: 3个硬编码选项
- [x] **已修复**: 前端不再返回硬编码默认值
- [ ] **验证**: 下拉框显示5个选项

### 问题2: 中文乱码
- [x] **已修复**: 数据库编码正确，API返回UTF-8
- [ ] **验证**: 所有中文正常显示

### 问题3: 保存产品失败
- [x] **已修复**: 后端Service层正确处理查询结果
- [ ] **验证**: 创建和更新产品成功

### 问题4: 登录500错误
- [x] **已修复**: 后端服务已启动
- [ ] **验证**: 登录成功

### 问题5: 加载流动性标签失败
- [x] **已修复**: API正常返回数据
- [ ] **验证**: 页面加载无错误

## 📊 性能检查

### API响应时间
- [ ] 登录API < 500ms
- [ ] 流动性标签API < 200ms
- [ ] 产品列表API < 1000ms

### 页面加载
- [ ] 首页加载 < 2s
- [ ] 产品管理页面加载 < 3s
- [ ] 无明显卡顿

## 🔄 浏览器兼容性

### Chrome
- [ ] 登录正常
- [ ] 流动性标签显示正常
- [ ] 产品操作正常

### Safari
- [ ] 登录正常
- [ ] 流动性标签显示正常
- [ ] 产品操作正常

### Firefox
- [ ] 登录正常
- [ ] 流动性标签显示正常
- [ ] 产品操作正常

## 📝 测试记录

### 测试日期: ___________
### 测试人员: ___________

### 测试结果
- [ ] 所有测试通过
- [ ] 部分测试失败（请在下方记录）

### 失败项目
```
记录失败的测试项目和错误信息：




```

### 备注
```
其他需要记录的信息：




```

---

## 🚀 快速测试命令

```bash
# 1. 启动所有服务
./start-services.sh

# 2. 等待5秒后测试API
sleep 5 && curl http://localhost:8000/health

# 3. 测试登录
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testapi@finapp.com","password":"testapi123"}'

# 4. 在浏览器中打开
open http://localhost:3001
```

## 📞 遇到问题？

1. 查看日志:
   ```bash
   tail -f /tmp/finapp-backend.log
   tail -f /tmp/finapp-frontend.log
   ```

2. 重启服务:
   ```bash
   ./start-services.sh
   ```

3. 清除浏览器缓存: `Cmd + Shift + R`

4. 查看文档:
   - `FINAL_FIX_SUMMARY.md` - 修复总结
   - `QUICK_START.md` - 快速启动指南
