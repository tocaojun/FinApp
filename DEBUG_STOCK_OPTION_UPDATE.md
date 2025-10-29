# 调试股票期权更新问题

## 问题现状
更新股票期权产品时显示"更新产品失败"，但后端日志中没有PUT请求记录。

## 已完成的修复
1. ✅ 修复了后端 `expiration_date` 字段的类型转换问题（添加 `::date`）
2. ✅ 增强了前端错误提示，显示详细错误信息
3. ✅ 添加了详细的前端日志输出

## 调试步骤

### 1. 查看浏览器控制台日志

1. 打开浏览器（Chrome/Edge）
2. 按 F12 或右键点击页面 -> "检查"
3. 切换到 **Console** 标签
4. 清空现有日志（点击🚫图标）
5. 尝试更新股票期权产品
6. 查看Console中的输出

**预期日志输出**：
```
=== 开始保存产品 ===
表单原始值: {symbol: "...", name: "...", details: {...}}
编辑中的资产: {id: "...", ...}
处理后的产品数据（日期转换前）: {...}
最终提交的数据: {...}
执行更新操作，资产ID: xxx-xxx-xxx
```

### 2. 查看Network请求

1. 在开发者工具中切换到 **Network** 标签
2. 清空现有请求
3. 尝试更新股票期权产品
4. 查找 PUT 请求到 `/api/assets/xxx`

**检查要点**：
- 请求是否发送成功？
- 状态码是多少？（200=成功，400=客户端错误，500=服务器错误）
- 点击请求查看：
  - **Headers** -> Request Headers（请求头）
  - **Payload** -> Request Payload（请求数据）
  - **Response** -> Response（响应数据）

### 3. 常见问题排查

#### 问题1：请求未发送
**症状**：Network标签中没有PUT请求
**可能原因**：
- 表单验证失败
- JavaScript错误阻止了请求
**解决方法**：
- 查看Console是否有红色错误信息
- 检查表单必填字段是否都已填写

#### 问题2：400错误
**症状**：请求状态码为400
**可能原因**：
- 数据格式不正确
- 缺少必填字段
- 字段类型不匹配
**解决方法**：
- 查看Response中的错误信息
- 检查Payload中的数据格式

#### 问题3：401错误
**症状**：请求状态码为401
**可能原因**：
- 登录已过期
- Token无效
**解决方法**：
- 重新登录系统

#### 问题4：500错误
**症状**：请求状态码为500
**可能原因**：
- 后端代码错误
- 数据库错误
**解决方法**：
- 查看后端日志：`tail -50 /Users/caojun/code/FinApp/backend/backend.log`

## 后端日志查看

```bash
# 实时查看后端日志
cd /Users/caojun/code/FinApp/backend
tail -f backend.log

# 查看最近的错误
tail -100 backend.log | grep -i error

# 查看PUT请求
tail -100 backend.log | grep PUT
```

## 前端代码位置

- 主文件：`frontend/src/pages/admin/ProductManagement.tsx`
- 股票期权字段组件：`frontend/src/components/asset/details/StockOptionDetailsFields.tsx`
- API服务：`frontend/src/services/assetService.ts`

## 后端代码位置

- 控制器：`backend/src/controllers/AssetController.ts`
- 服务：`backend/src/services/AssetService.ts`
- 详情服务：`backend/src/services/AssetDetailsService.ts`（第871行已修复）

## 下一步

请按照上述步骤操作，并提供以下信息：

1. **Console日志**：复制完整的日志输出
2. **Network请求**：
   - 请求URL
   - 状态码
   - Request Payload（请求数据）
   - Response（响应数据）
3. **错误提示**：页面上显示的完整错误信息

有了这些信息，我可以准确定位问题所在。
