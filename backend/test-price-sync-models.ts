import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPriceSyncModels() {
  console.log('🔍 测试价格同步模型是否可访问...\n');

  try {
    // 测试 1: price_data_sources
    console.log('1️⃣ 测试 price_data_sources:');
    const dataSources = await prisma.price_data_sources.findMany();
    console.log(`   ✅ 找到 ${dataSources.length} 个数据源`);
    dataSources.forEach(ds => {
      console.log(`      - ${ds.name} (${ds.provider})`);
    });
    console.log();

    // 测试 2: price_sync_tasks
    console.log('2️⃣ 测试 price_sync_tasks:');
    const tasks = await prisma.price_sync_tasks.findMany();
    console.log(`   ✅ 找到 ${tasks.length} 个同步任务`);
    tasks.forEach(task => {
      console.log(`      - ${task.name} (${task.schedule_type})`);
    });
    console.log();

    // 测试 3: price_sync_logs
    console.log('3️⃣ 测试 price_sync_logs:');
    const logs = await prisma.price_sync_logs.findMany({
      take: 5,
      orderBy: { started_at: 'desc' }
    });
    console.log(`   ✅ 找到 ${logs.length} 条最近的日志`);
    logs.forEach(log => {
      console.log(`      - ${log.started_at.toISOString()} | ${log.status} | 记录数: ${log.total_records}`);
    });
    console.log();

    // 测试 4: price_sync_errors
    console.log('4️⃣ 测试 price_sync_errors:');
    const errors = await prisma.price_sync_errors.findMany({
      take: 5,
      orderBy: { occurred_at: 'desc' }
    });
    console.log(`   ✅ 找到 ${errors.length} 个错误记录`);
    if (errors.length > 0) {
      errors.forEach(err => {
        console.log(`      - ${err.error_type}: ${err.error_message?.substring(0, 50)}...`);
      });
    } else {
      console.log('      (没有错误记录)');
    }
    console.log();

    console.log('✅ 所有模型都可以正常访问！');
    console.log('\n💡 这意味着：');
    console.log('   - Prisma Schema 配置正确');
    console.log('   - Prisma Client 已正确生成');
    console.log('   - 数据库连接正常');
    console.log('   - 这些模型应该在 Prisma Studio 中可见');
    console.log('\n🌐 请访问 Prisma Studio: http://localhost:5555');
    console.log('   在左侧列表中查找：');
    console.log('   - price_data_sources');
    console.log('   - price_sync_tasks');
    console.log('   - price_sync_logs');
    console.log('   - price_sync_errors');

  } catch (error) {
    console.error('❌ 错误:', error);
    console.log('\n可能的原因：');
    console.log('1. Prisma Client 未正确生成');
    console.log('2. 数据库连接失败');
    console.log('3. Schema 配置有误');
    console.log('\n请运行: cd backend && npx prisma generate');
  } finally {
    await prisma.$disconnect();
  }
}

testPriceSyncModels();
