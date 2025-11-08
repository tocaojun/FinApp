# 股票期权编辑功能快速测试

## 问题
产品管理界面中，编辑股票期权时附加属性（标的股票、行权价格等）显示不出来。

## 修复内容
✅ 修改后端`searchAssets` API，返回完整的资产信息（包含details字段）

## 快速测试步骤

### 1. 重启后端服务
```bash
cd /Users/caojun/code/FinApp/backend
npm run dev
```

### 2. 访问产品管理页面
打开浏览器访问：`http://localhost:3000/admin/products`

### 3. 测试编辑股票期权

#### 查找股票期权
- 在产品列表中找到类型为"股票期权"的资产
- 例如：`T-OPTION-OFFER-7851` (腾讯控股看涨期权)

#### 点击编辑
- 点击该资产行的"编辑"按钮
- 弹出编辑对话框

#### 验证附加属性显示
检查以下字段是否正确显示：

✅ **标的股票信息**
- 标的股票选择器应该显示已选择的股票（如：腾讯控股 00700）

✅ **期权基本信息**
- 期权类型：看涨(CALL) 或 看跌(PUT)
- 行权价格：应显示数值（如：400）
- 到期日期：应显示日期选择器，并有已选日期

✅ **合约信息**
- 合约规模：应显示数值（如：100）
- 行权方式：欧式(EUROPEAN) 或 美式(AMERICAN)

✅ **其他信息**
- 交易所代码
- 备注信息

### 4. 测试修改和保存

#### 修改字段
- 尝试修改行权价格（如：从400改为420）
- 修改到期日期
- 点击"保存"按钮

#### 验证保存
- 检查是否提示"产品更新成功"
- 刷新页面，再次编辑该资产
- 验证修改是否已保存

### 5. 测试其他资产类型

确保修复不影响其他类型：

#### 编辑股票
- 找一个股票类型的资产（如：腾讯控股 00700）
- 点击编辑，验证基本信息正常显示

#### 编辑基金
- 找一个基金类型的资产
- 点击编辑，验证基金特有字段（基金经理、成立日期等）正常显示

## API测试（可选）

### 测试搜索API返回details

```bash
# 获取token（先登录）
TOKEN="your_auth_token"

# 搜索股票期权
curl -X GET "http://localhost:3001/api/assets/search?keyword=期权" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'

# 检查返回的data数组中是否包含details字段
# 应该看到类似：
# {
#   "success": true,
#   "data": [
#     {
#       "id": "...",
#       "symbol": "T-OPTION-OFFER-7851",
#       "name": "腾讯控股看涨期权",
#       "assetTypeCode": "STOCK_OPTION",
#       "details": {
#         "underlyingStockId": "...",
#         "underlyingStockSymbol": "00700",
#         "optionType": "CALL",
#         "strikePrice": 400,
#         ...
#       }
#     }
#   ]
# }
```

### 测试单个资产详情API

```bash
# 获取单个资产详情
ASSET_ID="your_stock_option_asset_id"

curl -X GET "http://localhost:3001/api/assets/$ASSET_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.data.details'

# 应该返回完整的details对象
```

## 预期结果

### ✅ 成功标志
1. 编辑对话框中所有股票期权的附加字段都正确显示
2. 标的股票下拉框显示已选择的股票
3. 所有日期字段正确显示为日期选择器
4. 修改后能成功保存
5. 其他资产类型的编辑功能不受影响

### ❌ 如果仍有问题
1. 检查浏览器控制台是否有错误
2. 检查后端日志是否有错误
3. 验证API返回的数据结构是否包含details字段
4. 检查前端Form组件是否正确设置了初始值

## 常见问题排查

### 问题1: 附加字段仍然不显示
**检查**: 
- 后端是否已重新编译并重启？
- API返回的数据是否包含details字段？
- 浏览器控制台是否有JavaScript错误？

### 问题2: 标的股票下拉框为空
**检查**:
- `StockOptionDetailsFields`组件是否正确加载股票列表？
- `underlyingStockId`字段是否正确传递？

### 问题3: 日期字段显示错误
**检查**:
- `handleEditProduct`中的日期转换逻辑是否正确？
- dayjs是否正确解析日期字符串？

## 性能注意事项

修复后，搜索API会为每个资产查询details，可能影响性能：
- 如果资产列表很长（>50个），加载可能较慢
- 建议使用分页，每页显示20-50个资产
- 未来可考虑优化为批量查询或懒加载

## 相关文档

- 详细修复说明: `test-stock-option-details.md`
- 股票期权实现文档: `STOCK_OPTION_IMPLEMENTATION.md`

---

**测试时间**: 2025-10-29
**预计测试时长**: 5-10分钟
