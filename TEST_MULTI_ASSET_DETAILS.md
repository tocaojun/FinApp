# 多资产类型详情字段测试指南

## 快速测试步骤

### 1. 重启后端服务

```bash
cd /Users/caojun/code/FinApp
./restart-backend.sh
```

### 2. 打开前端资产管理页面

访问：`http://localhost:3000/assets`（或你的前端地址）

### 3. 测试创建股票

#### 步骤：
1. 点击"新增资产"按钮
2. 填写基础信息：
   - 代码：`AAPL`
   - 名称：`Apple Inc.`
   - 资产类型：选择"股票"
   - 市场：选择任意市场
   - 货币：`USD`
   - 风险等级：`MEDIUM`
   - 流动性标签：选择任意标签

3. **观察表单变化**：选择"股票"后，应该自动显示股票详情字段：
   - 行业板块
   - 细分行业
   - 市值
   - 市盈率（P/E）
   - 市净率（P/B）
   - 股息率
   - 流通股数
   - 成立年份
   - 公司网站
   - 总部地址

4. 填写股票详情：
   - 行业板块：`科技`
   - 细分行业：`消费电子`
   - 市盈率：`28.5`
   - 市净率：`7.2`
   - 股息率：`0.52`
   - 市值：`2800000000000`

5. 点击"确定"提交

#### 预期结果：
- ✅ 提示"资产创建成功"
- ✅ 资产列表中出现新创建的股票
- ✅ 数据库`stock_details`表中有对应记录

### 4. 测试创建基金

#### 步骤：
1. 点击"新增资产"按钮
2. 填写基础信息：
   - 代码：`000001`
   - 名称：`华夏成长混合`
   - 资产类型：选择"基金"
   - 市场：选择任意市场
   - 货币：`CNY`
   - 风险等级：`MEDIUM`
   - 流动性标签：选择任意标签

3. **观察表单变化**：选择"基金"后，应该自动显示基金详情字段：
   - 基金类型
   - 净值
   - 累计净值
   - 净值日期
   - 管理费率
   - 托管费率
   - 申购费率
   - 赎回费率
   - 基金规模
   - 基金经理
   - 基金公司
   - 最低投资额
   - 最低赎回额

4. 填写基金详情：
   - 基金类型：选择"混合型"
   - 净值：`2.3456`
   - 累计净值：`3.1234`
   - 管理费率：`1.5`
   - 托管费率：`0.25`
   - 基金经理：`张三`
   - 基金公司：`华夏基金`

5. 点击"确定"提交

#### 预期结果：
- ✅ 提示"资产创建成功"
- ✅ 资产列表中出现新创建的基金
- ✅ 数据库`fund_details`表中有对应记录

### 5. 测试创建债券

#### 步骤：
1. 点击"新增资产"按钮
2. 选择资产类型为"债券"
3. **观察表单变化**：应该显示债券详情字段：
   - 债券类型
   - 信用评级
   - 面值
   - 票面利率
   - 付息频率
   - 发行日期
   - 到期日期
   - 剩余年限
   - 到期收益率
   - 当前收益率
   - 发行人
   - 发行规模
   - 是否可赎回
   - 赎回日期
   - 赎回价格

4. 填写债券详情并提交

#### 预期结果：
- ✅ 提示"资产创建成功"
- ✅ 数据库`bond_details`表中有对应记录

### 6. 测试编辑资产

#### 步骤：
1. 在资产列表中找到刚创建的股票
2. 点击"编辑"按钮
3. **验证详情字段加载**：
   - 基础信息应该正确填充
   - 股票详情字段应该正确填充（行业、市盈率等）

4. 修改某些详情字段：
   - 市盈率：改为`30.0`
   - 市净率：改为`8.0`

5. 点击"确定"提交

#### 预期结果：
- ✅ 提示"资产更新成功"
- ✅ 数据库中的详情已更新

### 7. 验证数据库

```sql
-- 查看股票详情
SELECT 
  a.symbol,
  a.name,
  sd.*
FROM finapp.assets a
JOIN finapp.stock_details sd ON a.id = sd.asset_id
WHERE a.symbol = 'AAPL';

-- 查看基金详情
SELECT 
  a.symbol,
  a.name,
  fd.*
FROM finapp.assets a
JOIN finapp.fund_details fd ON a.id = fd.asset_id
WHERE a.symbol = '000001';

-- 使用完整视图查询
SELECT * FROM finapp.v_assets_full
WHERE symbol IN ('AAPL', '000001');
```

#### 预期结果：
- ✅ 股票详情表中有sector、industry、pe_ratio等字段
- ✅ 基金详情表中有fund_type、nav、management_fee等字段
- ✅ 视图查询返回完整的资产信息（包含详情）

## 常见问题排查

### 问题1：选择资产类型后，详情字段没有显示

**可能原因**：
- 前端代码未正确更新
- 浏览器缓存问题

**解决方法**：
```bash
# 重启前端
cd /Users/caojun/code/FinApp
./restart-frontend-only.sh

# 清除浏览器缓存
# 或使用无痕模式访问
```

### 问题2：提交后提示"创建资产失败"

**可能原因**：
- 后端服务未重启
- 数据库迁移未执行

**解决方法**：
```bash
# 重启后端
./restart-backend.sh

# 检查数据库表是否存在
psql -U finapp_user -d finapp_test -c "\dt finapp.*_details"
```

### 问题3：详情字段提交了但没有保存

**可能原因**：
- Controller未正确处理details字段
- 资产类型代码不匹配

**解决方法**：
```bash
# 查看后端日志
tail -f backend/logs/app.log

# 检查Controller代码是否更新
grep -A 10 "if (assetData.details" backend/src/controllers/AssetController.ts
```

### 问题4：编辑时详情字段为空

**可能原因**：
- getAssetById未返回details字段
- 前端未正确设置表单初始值

**解决方法**：
```bash
# 测试API返回
curl -X GET http://localhost:3001/api/assets/ASSET_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# 应该返回包含details字段的数据
```

## 调试技巧

### 1. 查看网络请求

打开浏览器开发者工具（F12）→ Network标签

**创建资产时**：
- 查看POST请求到`/api/assets`
- 检查Request Payload是否包含`details`字段
- 检查Response是否返回成功

**示例Request Payload**：
```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "assetTypeId": "xxx",
  "details": {
    "sector": "科技",
    "industry": "消费电子",
    "peRatio": 28.5
  }
}
```

### 2. 查看后端日志

```bash
# 实时查看日志
tail -f backend/logs/app.log

# 搜索错误
grep -i error backend/logs/app.log
```

### 3. 使用Prisma Studio查看数据

```bash
cd backend
npx prisma studio
```

然后在浏览器中查看：
- `assets`表
- `stock_details`表
- `fund_details`表
- 等等

### 4. 直接测试API

```bash
# 获取认证token
TOKEN="your_auth_token"

# 创建股票
curl -X POST http://localhost:3001/api/assets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "symbol": "TEST001",
    "name": "测试股票",
    "assetTypeId": "STOCK_TYPE_ID",
    "marketId": "MARKET_ID",
    "currency": "CNY",
    "riskLevel": "MEDIUM",
    "liquidityTag": "TAG_ID",
    "details": {
      "sector": "测试行业",
      "industry": "测试子行业",
      "peRatio": 15.5
    }
  }'

# 查询资产
curl -X GET http://localhost:3001/api/assets/ASSET_ID \
  -H "Authorization: Bearer $TOKEN"
```

## 成功标志

✅ **前端表单**：
- 选择不同资产类型时，显示不同的详情字段
- 股票显示：行业、市盈率等
- 基金显示：基金类型、净值等
- 债券显示：债券类型、票面利率等

✅ **数据提交**：
- 提交时Request包含details字段
- 后端返回成功响应
- 响应数据包含details字段

✅ **数据库验证**：
- `stock_details`表有对应记录
- `fund_details`表有对应记录
- `v_assets_full`视图返回完整数据

✅ **编辑功能**：
- 编辑时详情字段正确加载
- 修改后正确保存
- 数据库中的详情已更新

## 下一步优化

1. **添加字段验证**
   - 必填字段检查
   - 数值范围验证
   - 日期格式验证

2. **优化用户体验**
   - 添加字段说明tooltip
   - 添加默认值
   - 添加字段联动

3. **扩展更多资产类型**
   - 完善期货详情字段
   - 完善理财产品详情字段
   - 完善国债详情字段

4. **添加批量导入**
   - 支持Excel导入资产详情
   - 模板包含详情字段
   - 验证详情数据

## 总结

通过本次修复，现在系统已经完全支持多资产类型的详情字段：

- ✅ 前端根据资产类型动态显示详情字段
- ✅ 后端智能路由到对应的详情表
- ✅ 数据库正确存储和查询详情
- ✅ 编辑功能正常工作
- ✅ 保持向后兼容性

**不同资产类型的数据项差异性已经完全体现！** 🎉
