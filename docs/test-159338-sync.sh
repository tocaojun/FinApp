#!/bin/bash

# 测试159338的EastMoney API访问

echo "=== 测试 159338 (中证A500) 的 EastMoney API ==="
echo ""

# 尝试不同的 secid 格式
secids=("0.159338" "159338" "159338.OF" "159338.SZ")

for secid in "${secids[@]}"; do
  echo "尝试 secid: $secid"
  response=$(curl -s "http://push2.eastmoney.com/api/qt/stock/kline/get?secid=$secid&fields1=f1,f2,f3,f4,f5&fields2=f51,f52,f53,f54,f55,f56,f57&klt=101&fqt=1&lmt=5")
  
  rc=$(echo "$response" | grep -o '"rc":[0-9]*' | head -1 | cut -d: -f2)
  echo "响应码: $rc"
  
  if [ "$rc" = "0" ]; then
    echo "✅ 成功!"
    klines=$(echo "$response" | grep -o '"klines":\[.*\]' | head -c 200)
    echo "数据: $klines"
  else
    echo "❌ 失败"
  fi
  echo ""
done

# 也试试用 sina 的 API
echo "=== 尝试 Sina 的 API ==="
echo "尝试 159338:"
curl -s "http://hq.sinajs.cn/list=sz159338" | head -100
echo ""
echo ""

# 尝试 Python 的 tushare
echo "=== 检查 tushare 支持 ==="
echo "159338 是中证A500 ETF，应该在 tushare 中可获取"
echo "建议使用 tushare 库查询该基金的实时数据"
