# Phase 3: API集成 - 快速开始

## 🚀 5分钟快速部署

### 1️⃣ 运行数据库迁移 (1分钟)

```bash
./scripts/migrate-phase3.sh
```

### 2️⃣ 安装依赖 (1分钟)

```bash
cd backend
npm install node-cron axios
```

### 3️⃣ 重启后端 (1分钟)

```bash
cd backend
npm run dev
```

### 4️⃣ 访问界面 (2分钟)

1. 打开浏览器: `http://localhost:3001`
2. 登录系统（管理员账户）
3. 进入 **价格管理中心** → **API自动同步**

## ✨ 创建第一个同步任务

### 示例：每日A股价格同步

1. 点击 **创建同步任务**

2. 填写配置：
   ```
   任务名称: 每日A股价格同步
   数据源: 东方财富
   调度类型: Cron表达式
   Cron表达式: 0 0 16 * * ?
   回溯天数: 1
   启用任务: 是
   ```

3. 点击 **确定**

4. 点击 ▶️ 按钮测试执行

5. 切换到 **同步日志** 查看结果

## 📊 验证数据

```sql
-- 查看同步的价格数据
SELECT a.symbol, a.name, ap.price_date, ap.close_price
FROM assets a
JOIN asset_prices ap ON a.id = ap.asset_id
WHERE ap.source = 'api'
ORDER BY ap.price_date DESC
LIMIT 10;
```

## 📚 详细文档

- [完整部署指南](PHASE3_DEPLOYMENT.md)
- [使用指南](docs/API_Sync_Guide.md)
- [实现总结](docs/Phase3_Implementation_Summary.md)

## ✅ 完成检查

- [ ] 数据库迁移成功
- [ ] 后端服务启动
- [ ] 可以访问界面
- [ ] 可以创建任务
- [ ] 可以执行任务
- [ ] 可以查看日志

## 🎉 完成！

现在您可以使用 API 自动同步功能了！

---

**快速开始时间**: < 5分钟  
**难度**: ⭐⭐☆☆☆
