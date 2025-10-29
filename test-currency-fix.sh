#!/bin/bash

# Currency 修复验证测试脚本

echo "================================"
echo "Currency 修复验证测试"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试1: 检查所有持仓的 currency 一致性
echo "测试1: 检查持仓 currency 一致性"
echo "--------------------------------"

RESULT=$(cd backend && npx ts-node -e "
import { databaseService } from './src/services/DatabaseService';

(async () => {
  try {
    await databaseService.connect();
    
    const query = \`
      SELECT 
        COUNT(*) as total_positions,
        SUM(CASE WHEN p.currency != a.currency THEN 1 ELSE 0 END) as inconsistent_positions
      FROM finapp.positions p
      JOIN finapp.assets a ON p.asset_id = a.id
    \`;
    
    const result = await databaseService.executeRawQuery(query, []);
    const total = result[0].total_positions;
    const inconsistent = Number(result[0].inconsistent_positions);
    
    console.log(\`总持仓数: \${total}\`);
    console.log(\`不一致数: \${inconsistent}\`);
    
    if (inconsistent === 0) {
      console.log('状态: ✅ 全部一致');
      process.exit(0);
    } else {
      console.log('状态: ❌ 仍有不一致');
      process.exit(1);
    }
    
    await databaseService.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
" 2>&1)

echo "$RESULT"

if echo "$RESULT" | grep -q "✅ 全部一致"; then
    echo -e "${GREEN}✅ 测试1通过${NC}"
else
    echo -e "${RED}❌ 测试1失败${NC}"
fi

echo ""

# 测试2: 检查特定资产的 currency
echo "测试2: 检查特定资产的 currency"
echo "--------------------------------"

RESULT2=$(cd backend && npx ts-node -e "
import { databaseService } from './src/services/DatabaseService';

(async () => {
  try {
    await databaseService.connect();
    
    const query = \`
      SELECT 
        a.symbol,
        a.currency as asset_currency,
        p.currency as position_currency,
        CASE 
          WHEN a.currency = p.currency THEN '✅'
          ELSE '❌'
        END as status
      FROM finapp.positions p
      JOIN finapp.assets a ON p.asset_id = a.id
      WHERE a.symbol IN ('BILI', '00700', '03690', '06186', '09618')
      ORDER BY a.symbol
    \`;
    
    const results = await databaseService.executeRawQuery(query, []);
    
    let allPass = true;
    results.forEach((r: any) => {
      console.log(\`\${r.status} \${r.symbol}: Asset(\${r.asset_currency}) = Position(\${r.position_currency})\`);
      if (r.status === '❌') allPass = false;
    });
    
    if (allPass) {
      process.exit(0);
    } else {
      process.exit(1);
    }
    
    await databaseService.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
" 2>&1)

echo "$RESULT2"

if echo "$RESULT2" | grep -q "❌"; then
    echo -e "${RED}❌ 测试2失败${NC}"
else
    echo -e "${GREEN}✅ 测试2通过${NC}"
fi

echo ""

# 测试3: 检查数据库触发器
echo "测试3: 检查数据库触发器"
echo "--------------------------------"

TRIGGER_CHECK=$(psql postgresql://finapp_user:finapp_password@localhost:5432/finapp_test -t -c "
SELECT COUNT(*) 
FROM information_schema.triggers
WHERE trigger_schema = 'finapp'
  AND event_object_table = 'positions'
  AND trigger_name LIKE '%currency_consistency%'
" 2>&1)

TRIGGER_COUNT=$(echo "$TRIGGER_CHECK" | tr -d ' ')

if [ "$TRIGGER_COUNT" = "2" ]; then
    echo -e "${GREEN}✅ 触发器已正确部署 (2个)${NC}"
else
    echo -e "${RED}❌ 触发器未正确部署 (期望2个，实际${TRIGGER_COUNT}个)${NC}"
fi

echo ""

# 测试4: 检查交易记录的 currency
echo "测试4: 检查交易记录的 currency"
echo "--------------------------------"

RESULT4=$(cd backend && npx ts-node -e "
import { databaseService } from './src/services/DatabaseService';

(async () => {
  try {
    await databaseService.connect();
    
    const query = \`
      SELECT 
        a.symbol,
        a.currency as asset_currency,
        t.currency as transaction_currency,
        COUNT(*) as tx_count,
        CASE 
          WHEN a.currency = t.currency THEN '✅'
          ELSE '❌'
        END as status
      FROM finapp.transactions t
      JOIN finapp.assets a ON t.asset_id = a.id
      WHERE a.symbol IN ('BILI', '00700', '03690', '06186', '09618')
      GROUP BY a.symbol, a.currency, t.currency
      ORDER BY a.symbol
    \`;
    
    const results = await databaseService.executeRawQuery(query, []);
    
    let allPass = true;
    results.forEach((r: any) => {
      console.log(\`\${r.status} \${r.symbol}: Asset(\${r.asset_currency}) = Transaction(\${r.transaction_currency}) - \${r.tx_count}条\`);
      if (r.status === '❌') allPass = false;
    });
    
    if (allPass) {
      process.exit(0);
    } else {
      process.exit(1);
    }
    
    await databaseService.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
" 2>&1)

echo "$RESULT4"

if echo "$RESULT4" | grep -q "❌"; then
    echo -e "${RED}❌ 测试4失败${NC}"
else
    echo -e "${GREEN}✅ 测试4通过${NC}"
fi

echo ""
echo "================================"
echo "测试完成"
echo "================================"
