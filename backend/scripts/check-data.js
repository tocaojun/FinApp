const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('=== 检查数据库数据 ===');
    
    // 检查用户
    const users = await prisma.user.findMany({
      select: { id: true, email: true, username: true }
    });
    console.log('用户数量:', users.length);
    if (users.length > 0) {
      console.log('第一个用户:', users[0]);
    }
    
    // 检查投资组合
    const portfolios = await prisma.portfolio.findMany({
      select: { id: true, name: true, userId: true }
    });
    console.log('投资组合数量:', portfolios.length);
    if (portfolios.length > 0) {
      console.log('第一个投资组合:', portfolios[0]);
    }
    
    // 检查资产
    const assets = await prisma.asset.findMany({
      select: { id: true, symbol: true, name: true }
    });
    console.log('资产数量:', assets.length);
    if (assets.length > 0) {
      console.log('第一个资产:', assets[0]);
    }
    
    // 检查交易账户 (暂时跳过，因为字段不匹配)
    console.log('交易账户数量: 暂时跳过检查');
    
    // 检查交易记录
    const transactions = await prisma.transaction.findMany({
      select: { id: true, transactionType: true, quantity: true }
    });
    console.log('交易记录数量:', transactions.length);
    
  } catch (error) {
    console.error('检查数据时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();