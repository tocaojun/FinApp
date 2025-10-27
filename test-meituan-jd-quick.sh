#!/bin/bash

# 美团和京东价格同步快速测试脚本

echo "=== 美团和京东价格同步快速测试 ==="
echo ""

# 检查后端服务
echo "1. 检查后端服务..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
  echo "   ✅ 后端服务正常运行"
else
  echo "   ❌ 后端服务未运行，请先启动后端"
  exit 1
fi

echo ""
echo "2. 查询美团和京东资产..."
cd backend
npx ts-node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const assets = await prisma.asset.findMany({
    where: { symbol: { in: ['03690', '09618'] } },
    include: { market: true }
  });
  
  if (assets.length === 0) {
    console.log('   ❌ 未找到美团或京东资产');
    await prisma.\$disconnect();
    process.exit(1);
  }
  
  console.log(\`   ✅ 找到 \${assets.length} 个资产:\`);
  assets.forEach(a => {
    console.log(\`      - \${a.symbol} (\${a.name}), Market: \${a.market.code}\`);
  });
  
  await prisma.\$disconnect();
}

check();
" 2>&1 | grep -v "error TS"

echo ""
echo "3. 查询价格数据..."
npx ts-node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const assets = await prisma.asset.findMany({
    where: { symbol: { in: ['03690', '09618'] } }
  });
  
  for (const asset of assets) {
    const count = await prisma.assetPrice.count({
      where: { assetId: asset.id }
    });
    
    console.log(\`   \${asset.symbol} (\${asset.name}): \${count} 条价格记录\`);
    
    if (count > 0) {
      const latest = await prisma.assetPrice.findFirst({
        where: { assetId: asset.id },
        orderBy: { priceDate: 'desc' }
      });
      console.log(\`      最新: \${latest.priceDate.toISOString().split('T')[0]}, 收盘价: \${latest.closePrice} \${latest.currency}\`);
    }
  }
  
  await prisma.\$disconnect();
}

check();
" 2>&1 | grep -v "error TS"

echo ""
echo "=== 测试完成 ==="
echo ""
echo "如果看到价格记录数 > 0，说明同步成功！"
echo "如果价格记录数 = 0，请运行完整同步测试："
echo "  cd backend && npx ts-node test-meituan-jd-sync.ts"
echo ""
