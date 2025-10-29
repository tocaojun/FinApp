# 编辑详情字段快速测试指南

## 问题
期权等产品编辑时，详情字段（如行权价、Delta等）没有预填充到表单中。

## 修复状态
✅ 前端：`handleEditProduct` 正确设置 `details` 到表单  
✅ 后端：`getAssetById` 返回完整的 `details` 字段  
⚠️ 列表查询：暂时不返回 details（为保证列表正常显示）  
✅ 编辑功能：通过单独查询详情，功能正常工作

## 快速测试（3分钟）

### 方法1：自动化测试脚本
```bash
./test-edit-details.sh
```

预期看到：
```
✅ 成功：返回数据包含 details 字段
✓ 期权类型: CALL
✓ 行权价: 15.5
✓ Delta: 0.65
```

### 方法2：浏览器测试

1. **刷新前端页面**（重要！）
   ```bash
   # 前端在 http://localhost:3001
   # 按 Ctrl+Shift+R 强制刷新
   ```

2. **测试编辑功能**：
   - 进入"产品管理"页面
   - 找到任意期权产品
   - 点击"编辑"按钮
   - ✅ 检查：详情字段是否已预填充

3. **如果没有期权产品**：
   - 点击"新增产品"
   - 选择"期权"类型
   - 填写基础信息和详情字段
   - 保存后再测试编辑

## 验证要点

### ✅ 列表数据包含 details
打开浏览器开发者工具 → Network → 找到 `/api/assets/search` 请求：
```json
{
  "data": {
    "assets": [
      {
        "id": "xxx",
        "symbol": "TEST-CALL-001",
        "details": {           // ← 应该有这个字段
          "optionType": "CALL",
          "strikePrice": 15.5,
          "delta": 0.65
        }
      }
    ]
  }
}
```

### ✅ 编辑表单预填充
点击编辑后，表单应该显示：
- ✓ 期权类型：看涨期权 (CALL)
- ✓ 行权价：15.5
- ✓ Delta：0.65
- ✓ Gamma：0.05
- ✓ 到期日：2025-12-31

## 支持的资产类型

| 类型 | 详情字段示例 |
|-----|------------|
| 股票 | 市盈率、市净率、股息率 |
| 基金 | 基金类型、净值、管理费 |
| 债券 | 票面利率、到期日、信用评级 |
| 期权 | 行权价、Delta、Gamma、到期日 |
| 期货 | 合约规模、到期日 |
| 理财 | 预期收益、最低投资额 |
| 国债 | 票面利率、到期日 |

## 如果还有问题

### 检查清单
- [ ] 后端是否已重启？（应该在 8000 端口运行）
- [ ] 前端是否已刷新？（Ctrl+Shift+R 强制刷新）
- [ ] 产品是否有详情数据？（新增时是否填写了详情字段）
- [ ] 浏览器控制台是否有错误？

### 调试步骤
1. 打开浏览器开发者工具
2. 切换到 Console 标签
3. 点击编辑按钮
4. 查看是否有错误信息

### 查看数据库
```bash
# 检查详情表是否有数据
psql -U finapp_user -d finapp_db -c "
SELECT a.symbol, a.name, od.* 
FROM assets a 
JOIN option_details od ON a.id = od.asset_id 
LIMIT 5;
"
```

## 相关文档
- `EDIT_DETAILS_FIX.md` - 完整修复说明
- `OPTION_DETAILS_FIELDS_ADDED.md` - 期权字段定义
- `PRODUCT_MANAGEMENT_MULTI_ASSET_UPDATE.md` - 产品管理更新

---
**修复完成时间**：2025-10-27  
**测试状态**：✅ 后端已重启，⏳ 等待前端测试
