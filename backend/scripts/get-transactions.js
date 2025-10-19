const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getTransactions() {
  try {
    console.log('=== 获取数据库中的交易记录 ===');
    
    const transactions = await prisma.transaction.findMany({
      include: {
        asset: {
          select: { symbol: true, name: true }
        },
        portfolio: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('交易记录数量:', transactions.length);
    console.log('\n=== 交易记录详情 ===');
    
    transactions.forEach((tx, index) => {
      console.log(`\n交易 ${index + 1}:`);
      console.log('ID:', tx.id);
      console.log('投资组合:', tx.portfolio.name);
      console.log('资产:', `${tx.asset.name} (${tx.asset.symbol})`);
      console.log('交易类型:', tx.transactionType);
      console.log('数量:', tx.quantity.toString());
      console.log('价格:', tx.price.toString());
      console.log('总金额:', tx.totalAmount.toString());
      console.log('交易日期:', tx.transactionDate.toISOString().split('T')[0]);
    });
    
  } catch (error) {
    console.error('获取交易记录时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getTransactions();