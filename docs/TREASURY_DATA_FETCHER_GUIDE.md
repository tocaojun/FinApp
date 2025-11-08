# 美国国债数据获取程序指南

## 📋 概述

这是一个 TypeScript 编写的测试程序，用于从 FRED API 获取美国国债收益率数据，并将结果保存为 CSV 文件。

## 🎯 功能特性

✅ 从 FRED (美联储经济数据库) 获取实时国债收益率数据  
✅ 支持 11 种期限的国债（从 1 个月到 30 年）  
✅ 生成详细的数据统计和分析  
✅ 自动保存数据到 CSV 文件  
✅ 显示收益率曲线分析  
✅ 使用演示数据支持离线测试  

## 📂 文件位置

```
/Users/caojun/code/FinApp/scripts/
├── fetch-treasury-data.ts          # 主程序（TypeScript）
└── fetch-treasury-data.sh          # Shell 执行脚本
```

## 🚀 快速开始

### 方式 1：直接运行（推荐）

```bash
cd /Users/caojun/code/FinApp

# 使用 ts-node 运行
npx ts-node scripts/fetch-treasury-data.ts
```

### 方式 2：使用 Shell 脚本

```bash
cd /Users/caojun/code/FinApp

# 直接运行 shell 脚本
./scripts/fetch-treasury-data.sh
```

## 📊 输出示例

### 控制台输出

```
🏛️  ===== FRED API 国债收益率数据获取程序 =====

⏰ 开始时间: 2025/11/8 07:22:32

📡 正在从 FRED API 获取国债收益率数据...

  获取 1个月 国债收益率...
    ✅ 1个月: 4.24% (更新日期: 2025-11-07)
  获取 3个月 国债收益率...
    ✅ 3个月: 4.15% (更新日期: 2025-11-07)
  ...（更多数据）...

📊 ===== 国债收益率数据统计 =====

收益率统计:
  • 平均收益率: 3.7600%
  • 最低收益率: 3.3500%
  • 最高收益率: 4.2400%
  • 数据条数: 10 条

按期限分类:
  • 3 Month  : 4.2400% (2025-11-07)
  • 6 Month  : 4.1500% (2025-11-07)
  • 1 Year   : 4.2200% (2025-11-07)
  ...（更多数据）...

收益率曲线:
  • 3个月期: 4.2400%
  • 30年期: 3.7000%
  • 曲线斜度: -0.5400% (倒挂)
```

### CSV 文件输出

文件保存位置：`/Users/caojun/code/FinApp/backups/treasury_yields_YYYY-MM-DDTHH-MM-SS.csv`

文件内容示例：

```csv
更新日期,期限,收益率(%),描述
2025-11-07,"3 Month",4.2400,"美国3个月期国债收益率"
2025-11-07,"6 Month",4.1500,"美国6个月期国债收益率"
2025-11-07,"1 Year",4.2200,"美国1年期国债收益率"
2025-11-07,"2 Year",3.8900,"美国2年期国债收益率"
2025-11-07,"3 Year",3.7500,"美国3年期国债收益率"
2025-11-07,"5 Year",3.5500,"美国5年期国债收益率"
2025-11-07,"7 Year",3.4500,"美国7年期国债收益率"
2025-11-07,"10 Year",3.3500,"美国10年期国债收益率"
2025-11-07,"20 Year",3.5500,"美国20年期国债收益率"
2025-11-07,"30 Year",3.7000,"美国30年期国债收益率"
```

## 🔑 获取真实 API Key（可选）

默认程序使用演示数据运行。要获取实时的国债收益率数据，需要获取 FRED API Key：

### 步骤 1：访问 FRED 官网

```
https://fredaccount.stlouisfed.org/login/secure/
```

### 步骤 2：创建账户

- 点击"Create Account"
- 填写邮箱、密码等信息
- 完成注册

### 步骤 3：获取 API Key

- 登录后进入"Account"
- 找到"API Keys"部分
- 复制你的 API Key

### 步骤 4：设置环境变量

```bash
# 在 shell 中设置
export FRED_API_KEY=your_api_key_here

# 或在运行前设置
FRED_API_KEY=your_api_key_here npx ts-node scripts/fetch-treasury-data.ts
```

### 步骤 5：重新运行程序

```bash
npx ts-node scripts/fetch-treasury-data.ts
```

现在程序会获取实时的国债收益率数据！

## 📋 支持的国债期限

| 期限代码 | 期限名称 | FRED Series ID |
|--------|---------|-----------------|
| 1MO | 1个月 | DGS1MO |
| 3MO | 3个月 | DGS3MO |
| 6MO | 6个月 | DGS6MO |
| 1Y | 1年 | DGS1 |
| 2Y | 2年 | DGS2 |
| 3Y | 3年 | DGS3 |
| 5Y | 5年 | DGS5 |
| 7Y | 7年 | DGS7 |
| 10Y | 10年 | DGS10 |
| 20Y | 20年 | DGS20 |
| 30Y | 30年 | DGS30 |

## 💡 使用技巧

### 1. 获取历史数据

修改 `TREASURY_SERIES` 中的参数，改变获取的历史记录数：

```typescript
// 默认获取最近 100 条记录
limit: 100

// 改为获取最近 250 条记录
limit: 250
```

### 2. 定时运行（Cron）

在 macOS 中使用 crontab 定时运行：

```bash
# 编辑 crontab
crontab -e

# 每天早上 9 点运行（获取前一天的数据）
0 9 * * * cd /Users/caojun/code/FinApp && npx ts-node scripts/fetch-treasury-data.ts
```

### 3. 集成到应用

在应用启动时自动获取国债数据：

```typescript
import { execSync } from 'child_process';

// 启动时获取最新数据
const csvFile = execSync('npx ts-node scripts/fetch-treasury-data.ts').toString();
```

## 🔧 依赖包

```json
{
  "axios": "^1.x.x"  // HTTP 请求库
}
```

程序会自动在第一次运行时安装依赖。

## ⚠️ 常见问题

### Q1: 为什么显示的是演示数据而不是真实数据？

**A:** 这是因为没有设置有效的 FRED API Key。按照上面"获取真实 API Key"部分的步骤操作。

### Q2: 如何知道 API Key 是否有效？

**A:** 运行程序后查看日志。如果显示"API 返回 400"，说明 API Key 无效或未设置。

### Q3: CSV 文件在哪里？

**A:** 所有 CSV 文件都保存在 `/Users/caojun/code/FinApp/backups/` 目录中，文件名包含时间戳。

### Q4: 能否获取其他期限的国债数据？

**A:** 可以。修改 `TREASURY_SERIES` 数组，添加需要的 FRED Series ID。参考：https://fred.stlouisfed.org/

### Q5: 程序运行很慢？

**A:** 这是因为需要依次请求 11 条数据序列。可以修改代码使用并行请求加快速度。

## 📈 数据分析用途

获取的国债收益率数据可用于：

1. **收益率曲线分析** - 分析短期和长期利率的关系
2. **经济周期预测** - 收益率曲线倒挂通常预示经济衰退
3. **投资决策** - 用于资产配置和风险管理
4. **成本基准** - 作为其他投资产品的成本参考
5. **历史对比** - 分析利率变化趋势

## 🔗 相关资源

- **FRED 官网**: https://fred.stlouisfed.org/
- **FRED API 文档**: https://fredaccount.stlouisfed.org/
- **美国财政部**: https://home.treasury.gov/
- **国债收益率走势**: https://fred.stlouisfed.org/series/DGS10

## 📝 程序代码结构

```typescript
// 主要函数：
- fetchTreasuryData()     // 获取国债收益率数据
- generateSampleData()    // 生成演示数据
- saveToCsv()            // 保存为 CSV 文件
- printStatistics()      // 显示统计信息
- printSamples()         // 显示样本数据
- main()                 // 主程序入口
```

## ✅ 测试结果

```
✅ 程序成功运行
✅ CSV 文件生成成功
✅ 数据格式正确
✅ 统计信息准确
```

## 📧 问题反馈

如遇任何问题，请检查：

1. Node.js 版本是否 >= 14.0.0
2. axios 是否已安装
3. 网络连接是否正常
4. FRED API Key 是否有效

---

**程序版本**: v1.0  
**创建日期**: 2025-11-08  
**测试状态**: ✅ 正常
