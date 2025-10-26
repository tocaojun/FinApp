const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestApiUser() {
  try {
    // 生成密码哈希
    const passwordHash = await bcrypt.hash('testapi123', 12);
    
    // 创建用户
    const user = await prisma.user.upsert({
      where: { email: 'testapi' },
      update: {
        passwordHash: passwordHash,
        firstName: 'Test',
        lastName: 'API',
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: new Date()
      },
      create: {
        email: 'testapi',
        username: 'testapi',
        passwordHash: passwordHash,
        firstName: 'Test',
        lastName: 'API',
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: new Date()
      }
    });
    
    console.log('✅ TestAPI user created/updated successfully:', user.id);
    
    // 创建默认投资组合
    const portfolio = await prisma.portfolio.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name: '测试投资组合'
        }
      },
      update: {},
      create: {
        userId: user.id,
        name: '测试投资组合',
        description: 'API测试用投资组合',
        baseCurrency: 'CNY',
        isDefault: true
      }
    });
    
    console.log('✅ Default portfolio created:', portfolio.id);
    
  } catch (error) {
    console.error('❌ Error creating testapi user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestApiUser();