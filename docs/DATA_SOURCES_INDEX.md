# 📚 数据源文档索引

本文档帮助你快速找到所需的数据源信息。

---

## 🎯 按需求查找

### 我想快速了解所有数据源
→ 阅读: **DATA_SOURCES_VISUAL_SUMMARY.txt**
- ✅ 产品 × 数据源矩阵
- ✅ 市场 × 数据源矩阵
- ✅ 覆盖范围排行榜
- ✅ 投资策略推荐

### 我想查看详细的配置说明
→ 阅读: **DATA_SOURCES_COVERAGE_MAP.md**
- ✅ 9个数据源的完整配置
- ✅ 特色功能说明
- ✅ 使用建议
- ✅ API密钥获取方式

### 我想快速参考
→ 阅读: **DATA_SOURCES_QUICK_REFERENCE.txt**
- ✅ 快速选择表
- ✅ 常用操作
- ✅ 同步任务模板
- ✅ 故障排查

### 我想了解完成情况
→ 阅读: **DATA_SOURCES_SETUP_SUMMARY.md**
- ✅ 添加的数据源列表
- ✅ 覆盖范围统计
- ✅ 激活步骤
- ✅ 验证清单

---

## 🔍 按功能查找

### 查看数据库视图
```sql
-- 查看产品覆盖统计
SELECT * FROM v_product_type_source_count;

-- 查看市场覆盖统计
SELECT * FROM v_market_source_count;

-- 查看所有数据源配置
SELECT * FROM v_data_source_config;

-- 查看数据源对比
SELECT * FROM v_data_source_comparison;
```

### 查看SQL脚本
```bash
# 添加数据源的脚本
cat scripts/add-data-sources.sql

# 创建数据库视图的脚本
cat scripts/create-coverage-views.sql
```

---

## 📊 按投资类型查找

### 美股投资
**推荐数据源**: Alpha Vantage  
**文档位置**: [DATA_SOURCES_COVERAGE_MAP.md#1️⃣-alpha-vantage](DATA_SOURCES_COVERAGE_MAP.md)  
**快速参考**: [DATA_SOURCES_QUICK_REFERENCE.txt](#【美股投资】)](DATA_SOURCES_QUICK_REFERENCE.txt)

### A股投资
**推荐数据源**: 新浪财经  
**文档位置**: [DATA_SOURCES_COVERAGE_MAP.md#6️⃣-新浪财经](DATA_SOURCES_COVERAGE_MAP.md)  
**快速参考**: [DATA_SOURCES_QUICK_REFERENCE.txt](#【a股投资】)](DATA_SOURCES_QUICK_REFERENCE.txt)

### 债券投资
**推荐数据源**: FRED  
**文档位置**: [DATA_SOURCES_COVERAGE_MAP.md#2️⃣-fred](DATA_SOURCES_COVERAGE_MAP.md)  
**快速参考**: [DATA_SOURCES_QUICK_REFERENCE.txt](#【债券投资】)](DATA_SOURCES_QUICK_REFERENCE.txt)

### 全球投资
**推荐数据源**: Tiingo  
**文档位置**: [DATA_SOURCES_COVERAGE_MAP.md#7️⃣-tiingo](DATA_SOURCES_COVERAGE_MAP.md)  
**快速参考**: [DATA_SOURCES_QUICK_REFERENCE.txt](#【全球投资】)](DATA_SOURCES_QUICK_REFERENCE.txt)

### 加密投资
**推荐数据源**: Binance API  
**文档位置**: [DATA_SOURCES_COVERAGE_MAP.md#8️⃣-binance-api](DATA_SOURCES_COVERAGE_MAP.md)  
**快速参考**: [DATA_SOURCES_QUICK_REFERENCE.txt](#【加密投资】)](DATA_SOURCES_QUICK_REFERENCE.txt)

---

## 🏪 按市场查找

| 市场 | 推荐数据源 | 覆盖数源 | 文档位置 |
|------|----------|--------|--------|
| NYSE | Alpha Vantage | 6 | [快速参考](#-按市场快速查找) |
| NASDAQ | Alpha Vantage | 6 | [快速参考](#-按市场快速查找) |
| SSE | 新浪财经 | 3 | [覆盖范围](#-按市场快速查找) |
| SZSE | 新浪财经 | 3 | [覆盖范围](#-按市场快速查找) |
| HKEX | 新浪财经 | 2 | [覆盖范围](#-按市场快速查找) |
| CRYPTO | Binance API | 3 | [快速参考](#【加密投资】) |
| USA | FRED | 1 | [完整配置](#📊-详细数据源配置) |

---

## 📦 按产品类型查找

| 产品 | 推荐数据源 | 覆盖数源 | 文档位置 |
|------|----------|--------|--------|
| STOCK | 新浪财经 | 6 | [快速参考](#📈-按产品类型快速查找) |
| FUND | 天天基金 | 4 | [完整配置](#3️⃣-天天基金) |
| ETF | Alpha Vantage | 5 | [快速参考](#📈-按产品类型快速查找) |
| BOND | FRED | 3 | [完整配置](#2️⃣-fred) |
| CRYPTO | Binance API | 3 | [快速参考](#📈-按产品类型快速查找) |
| OPTION | Polygon.io | 1 | [完整配置](#4️⃣-polygonio) |

---

## 🔧 按任务类型查找

### 创建美股日常同步任务
→ 查看: **DATA_SOURCES_QUICK_REFERENCE.txt** - 同步任务模板  
→ 数据源: Alpha Vantage  
→ 文档: [DATA_SOURCES_COVERAGE_MAP.md#1️⃣-alpha-vantage](DATA_SOURCES_COVERAGE_MAP.md)

### 创建A股实时同步任务
→ 查看: **DATA_SOURCES_QUICK_REFERENCE.txt** - 同步任务模板  
→ 数据源: 新浪财经  
→ 文档: [DATA_SOURCES_COVERAGE_MAP.md#6️⃣-新浪财经](DATA_SOURCES_COVERAGE_MAP.md)

### 创建债券周期同步任务
→ 查看: **DATA_SOURCES_QUICK_REFERENCE.txt** - 同步任务模板  
→ 数据源: FRED  
→ 文档: [DATA_SOURCES_COVERAGE_MAP.md#2️⃣-fred](DATA_SOURCES_COVERAGE_MAP.md)

### 配置API密钥
→ 查看: **DATA_SOURCES_COVERAGE_MAP.md** - API密钥配置表  
→ 快速参考: **DATA_SOURCES_QUICK_REFERENCE.txt** - ⚙️ API密钥配置

---

## 📋 文件清单

### 主要文档

| 文件名 | 大小 | 用途 | 推荐阅读时间 |
|--------|------|------|----------|
| **DATA_SOURCES_COVERAGE_MAP.md** | 完整 | 详细配置说明 | 20-30分钟 |
| **DATA_SOURCES_QUICK_REFERENCE.txt** | 紧凑 | 快速查询参考 | 5-10分钟 |
| **DATA_SOURCES_VISUAL_SUMMARY.txt** | 中等 | 可视化总结 | 10-15分钟 |
| **DATA_SOURCES_SETUP_SUMMARY.md** | 中等 | 完成情况总结 | 10-15分钟 |
| **DATA_SOURCES_INDEX.md** | 本文 | 文档索引 | 5分钟 |

### 脚本文件

| 文件名 | 功能 | 执行状态 |
|--------|------|--------|
| **scripts/add-data-sources.sql** | 添加数据源 | ✅ 已执行 |
| **scripts/create-coverage-views.sql** | 创建数据库视图 | ✅ 已执行 |

---

## 🚀 快速启动指南

### 1分钟快速开始
```
1. 打开: DATA_SOURCES_QUICK_REFERENCE.txt
2. 找到你的投资类型
3. 选择推荐的数据源
4. 按照模板创建同步任务
```

### 5分钟了解概况
```
1. 查看: DATA_SOURCES_VISUAL_SUMMARY.txt
2. 了解各数据源的覆盖范围
3. 找到适合你的数据源组合
4. 记下API密钥配置需求
```

### 30分钟完整学习
```
1. 阅读: DATA_SOURCES_COVERAGE_MAP.md
2. 理解每个数据源的特点
3. 查看: DATA_SOURCES_SETUP_SUMMARY.md
4. 了解激活步骤和注意事项
5. 参考: DATA_SOURCES_QUICK_REFERENCE.txt
6. 准备创建第一个同步任务
```

---

## 💾 数据库查询速查

### 快速查看所有激活的数据源
```sql
SELECT name, provider, is_active 
FROM finapp.price_data_sources 
WHERE is_active = true 
ORDER BY name;
```

### 查看特定数据源的覆盖范围
```sql
SELECT * FROM finapp.v_data_source_product_coverage 
WHERE name = '新浪财经';
```

### 查看特定市场的数据源
```sql
SELECT DISTINCT name, provider 
FROM finapp.v_data_source_market_coverage 
WHERE market_code = 'NYSE';
```

### 查看特定产品的数据源
```sql
SELECT DISTINCT name, provider 
FROM finapp.v_data_source_product_coverage 
WHERE product_type = 'STOCK';
```

---

## ❓ 常见问题

### Q: 哪个数据源最适合我？
**A**: 查看 [DATA_SOURCES_QUICK_REFERENCE.txt](#【投资类型快速选择】)，根据你的投资类型选择

### Q: 如何激活一个数据源？
**A**: 查看 [DATA_SOURCES_SETUP_SUMMARY.md#第一步-激活必要的数据源](DATA_SOURCES_SETUP_SUMMARY.md)

### Q: 需要配置API密钥吗？
**A**: 查看 [DATA_SOURCES_COVERAGE_MAP.md#-api密钥配置需求汇总](DATA_SOURCES_COVERAGE_MAP.md)

### Q: 如何创建同步任务？
**A**: 查看 [DATA_SOURCES_QUICK_REFERENCE.txt#-常用操作速查](DATA_SOURCES_QUICK_REFERENCE.txt)

### Q: 某个数据源如何使用？
**A**: 查看 [DATA_SOURCES_COVERAGE_MAP.md#-详细数据源配置](DATA_SOURCES_COVERAGE_MAP.md)

---

## 📞 文档导航

```
📁 docs/
├── 📄 DATA_SOURCES_INDEX.md (本文档)
│   └─ 用于快速找到所需信息
│
├── 📄 DATA_SOURCES_COVERAGE_MAP.md
│   └─ 最详细的配置说明
│
├── 📄 DATA_SOURCES_QUICK_REFERENCE.txt
│   └─ 快速查询卡片
│
├── 📄 DATA_SOURCES_VISUAL_SUMMARY.txt
│   └─ 可视化矩阵和统计
│
└── 📄 DATA_SOURCES_SETUP_SUMMARY.md
    └─ 完成情况和激活指南

📁 scripts/
├── 📜 add-data-sources.sql
│   └─ 添加数据源的SQL脚本
│
└── 📜 create-coverage-views.sql
    └─ 创建数据库视图的脚本
```

---

## 📊 统计数据

- **总数据源**: 9 个
- **已激活**: 7 个 ✅
- **待激活**: 2 个 ⚠️
- **产品类型**: 9 种
- **市场覆盖**: 10 个
- **数据库视图**: 4 个
- **文档数量**: 5 份

---

## 🔄 文档更新历史

| 日期 | 操作 | 内容 |
|------|------|------|
| 2025-11-07 | 创建 | 初始版本，添加8个新数据源 |
| - | - | - |

---

## 💡 建议的阅读顺序

### 对于时间充足的用户
1. **DATA_SOURCES_VISUAL_SUMMARY.txt** (10分钟)
   - 获得整体理解

2. **DATA_SOURCES_COVERAGE_MAP.md** (20分钟)
   - 深入了解每个数据源

3. **DATA_SOURCES_SETUP_SUMMARY.md** (10分钟)
   - 了解激活步骤

4. **DATA_SOURCES_QUICK_REFERENCE.txt** (5分钟)
   - 保存为快速参考

### 对于时间紧张的用户
1. **DATA_SOURCES_QUICK_REFERENCE.txt** (5分钟)
   - 快速了解基本信息

2. **DATA_SOURCES_COVERAGE_MAP.md** (仅查看你需要的部分) (10分钟)
   - 查看特定数据源

3. 立即开始创建同步任务！

---

**有任何问题，请参考对应的文档获取详细说明！**

---

*最后更新: 2025-11-07*  
*版本: v1.0*  
*所有文档已保存到 `/Users/caojun/code/FinApp/docs/` 目录*
