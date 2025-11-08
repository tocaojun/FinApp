# Token名称不一致问题修复

## 问题根源 🎯

您的直觉完全正确！问题确实是**token的名字不对**。

### 不一致的Token名称

**登录时存储**（AuthContext.tsx）:
```typescript
localStorage.setItem('auth_token', tokensData.accessToken);  // ✅ 使用 'auth_token'
```

**导入服务读取**（transactionImportService.ts）:
```typescript
const token = localStorage.getItem('token');  // ❌ 读取 'token'（不存在！）
```

### 结果
- 导入服务获取到的token是`null`
- 发送请求时：`Authorization: Bearer null`
- 后端认证失败，返回401错误

## 修复内容

### 修改文件
`frontend/src/services/transactionImportService.ts`

### 修改详情
将所有4处`localStorage.getItem('token')`改为`localStorage.getItem('auth_token')`：

```typescript
// 修复前
const token = localStorage.getItem('token');  // ❌

// 修复后
const token = localStorage.getItem('auth_token');  // ✅
```

### 影响的方法
1. ✅ `downloadExcelTemplate()` - 第49行
2. ✅ `downloadJsonTemplate()` - 第80行
3. ✅ `previewImport()` - 第116行
4. ✅ `importTransactions()` - 第154行

## 验证步骤

### 1. 硬刷新浏览器 ⭐
- **Mac**: `Cmd + Shift + R`
- **Windows/Linux**: `Ctrl + Shift + R`

> ⚠️ **必须硬刷新**以加载修复后的代码

### 2. 验证Token存在
打开浏览器控制台（F12），执行：
```javascript
console.log('auth_token:', localStorage.getItem('auth_token'));
console.log('token:', localStorage.getItem('token'));
```

**预期结果**:
- `auth_token`: 显示一个长字符串（JWT token）✅
- `token`: `null` ❌

### 3. 测试模板下载
1. 访问交易管理页面
2. 点击"批量导入"按钮
3. 点击"下载Excel模板"或"下载JSON模板"

**预期结果**: 
- ✅ 文件成功下载
- ✅ 不再出现401错误

## 为什么之前没发现？

### 项目中的Token命名
让我检查一下项目中token的命名规范：

```bash
# 搜索结果显示
frontend/src/contexts/AuthContext.tsx:
  - 存储: localStorage.setItem('auth_token', ...)
  - 读取: localStorage.getItem('auth_token')

frontend/src/services/authService.ts:
  - 读取: localStorage.getItem('auth_token')
  - 拦截器: const token = localStorage.getItem('auth_token')

frontend/src/services/transactionImportService.ts:
  - 读取: localStorage.getItem('token')  ❌ 唯一的错误！
```

### 结论
整个项目统一使用`auth_token`，只有`transactionImportService.ts`使用了错误的`token`名称。

## 技术细节

### localStorage的工作原理
```javascript
// 存储
localStorage.setItem('auth_token', 'eyJhbGc...');

// 读取
localStorage.getItem('auth_token');  // 返回: 'eyJhbGc...'
localStorage.getItem('token');       // 返回: null（不存在）
```

### HTTP请求头
```http
# 正确的请求（修复后）
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 错误的请求（修复前）
Authorization: Bearer null
```

### 后端验证逻辑
```typescript
// backend/src/middleware/authMiddleware.ts
const authHeader = req.headers.authorization;
const token = authHeader && authHeader.split(' ')[1];  // 提取 "Bearer " 后的token

if (!token) {
  throw new AppError('Access token required', 401, 'MISSING_TOKEN');
}

// 当token是null时，这里会抛出401错误
jwt.verify(token, jwtSecret);  // ❌ jwt.verify(null, ...) 失败
```

## 预防措施

### 1. 统一Token命名
建议在项目中创建一个常量文件：

```typescript
// frontend/src/constants/storage.ts
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  AUTH_USER: 'auth_user',
  REFRESH_TOKEN: 'refresh_token'
} as const;

// 使用
import { STORAGE_KEYS } from '@/constants/storage';
const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
```

### 2. 创建Storage工具类
```typescript
// frontend/src/utils/storage.ts
export class StorageService {
  static getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }
  
  static setAuthToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }
  
  static clearAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
}
```

### 3. TypeScript类型检查
```typescript
type StorageKey = 'auth_token' | 'auth_user' | 'refresh_token';

function getItem(key: StorageKey): string | null {
  return localStorage.getItem(key);
}

// 使用时会有类型提示和检查
getItem('auth_token');  // ✅
getItem('token');       // ❌ TypeScript错误
```

## 相关问题排查

### 如果修复后仍然401
1. **清除浏览器缓存**
2. **重新登录**获取新token
3. **检查token是否过期**:
   ```javascript
   const token = localStorage.getItem('auth_token');
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log('过期时间:', new Date(payload.exp * 1000));
   ```

### 如果其他API也有401错误
检查是否使用了统一的axios实例或拦截器：
```typescript
// 推荐：使用统一的axios实例
import { authApi } from '@/services/authService';
authApi.get('/endpoint');  // 自动添加token
```

## 总结

| 项目 | 修复前 | 修复后 |
|------|--------|--------|
| Token存储名 | `auth_token` | `auth_token` |
| 导入服务读取 | `token` ❌ | `auth_token` ✅ |
| 请求头 | `Bearer null` | `Bearer eyJhbGc...` |
| HTTP状态码 | 401 | 200 |
| 结果 | 下载失败 | 下载成功 |

---

**修复时间**: 2025-10-27  
**问题类型**: Token名称不一致  
**影响范围**: 交易批量导入功能  
**修复状态**: ✅ 已完成，等待验证

---

## 快速验证

```javascript
// 在浏览器控制台执行
console.log('=== Token验证 ===');
console.log('auth_token存在:', !!localStorage.getItem('auth_token'));
console.log('token存在:', !!localStorage.getItem('token'));
console.log('应该使用: auth_token');
```

**请硬刷新浏览器后测试！** 🚀
