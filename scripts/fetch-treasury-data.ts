import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface TreasuryData {
  date: string;
  yield: number;
  maturity: string;
  description: string;
}

// 常用国债收益率系列代码
const TREASURY_SERIES = [
  { code: 'DGS1MO', name: '1个月', maturity: '1 Month' },
  { code: 'DGS3MO', name: '3个月', maturity: '3 Month' },
  { code: 'DGS6MO', name: '6个月', maturity: '6 Month' },
  { code: 'DGS1', name: '1年', maturity: '1 Year' },
  { code: 'DGS2', name: '2年', maturity: '2 Year' },
  { code: 'DGS3', name: '3年', maturity: '3 Year' },
  { code: 'DGS5', name: '5年', maturity: '5 Year' },
  { code: 'DGS7', name: '7年', maturity: '7 Year' },
  { code: 'DGS10', name: '10年', maturity: '10 Year' },
  { code: 'DGS20', name: '20年', maturity: '20 Year' },
  { code: 'DGS30', name: '30年', maturity: '30 Year' }
];

interface FredObservation {
  date: string;
  value: string;
}

interface FredResponse {
  observations: FredObservation[];
}

/**
 * 从 FRED API 获取美国国债收益率数据
 * 注意: 需要设置 FRED_API_KEY 环境变量，或使用默认 API Key
 */
async function fetchTreasuryData(): Promise<TreasuryData[]> {
  console.log('📡 正在从 FRED API 获取国债收益率数据...\n');

  // 这是一个演示用的 API Key，实际使用时应该使用自己的
  // 免费注册地址: https://fredaccount.stlouisfed.org/login/secure/
  const apiKey = process.env.FRED_API_KEY || 'demo_key';

  const treasuryData: TreasuryData[] = [];

  try {
    for (const series of TREASURY_SERIES) {
      try {
        console.log(`  获取 ${series.name} 国债收益率...`);

        const response = await axios.get<FredResponse>(
          'https://api.stlouisfed.org/fred/series/observations',
          {
            params: {
              series_id: series.code,
              api_key: apiKey,
              file_type: 'json',
              limit: 1000,  // 获取更多记录以确保有最新数据
              sort_order: 'desc'  // 按日期倒序排列（最新的在前）
            },
            timeout: 10000
          }
        );

        // 获取第一个有效的数据（因为已按倒序排列，第一个就是最新的）
        let latestObservation = null;
        for (const obs of response.data.observations) {
          if (obs.value !== '.') {
            latestObservation = obs;
            break;
          }
        }

        if (latestObservation && latestObservation.value !== '.') {
          treasuryData.push({
            date: latestObservation.date,
            yield: parseFloat(latestObservation.value),
            maturity: series.maturity,
            description: `美国${series.name}期国债收益率`
          });

          console.log(`    ✅ ${series.name}: ${latestObservation.value}% (更新日期: ${latestObservation.date})`);
        } else {
          console.log(`    ⚠️  ${series.name}: 无可用数据`);
        }
      } catch (seriesError) {
        if (axios.isAxiosError(seriesError) && seriesError.response?.status === 400) {
          console.log(`    ⚠️  ${series.name}: API 返回 400 (可能需要有效的 API Key)`);
        } else {
          console.log(`    ⚠️  ${series.name}: 获取失败`);
        }
      }
    }

    if (treasuryData.length === 0) {
      console.warn(`\n⚠️  警告: 未获取到任何数据`);
      console.warn(`   这可能是因为:`);
      console.warn(`   1. 没有设置有效的 FRED_API_KEY 环境变量`);
      console.warn(`   2. FRED API 服务暂时不可用`);
      console.warn(`\n   获取免费 API Key: https://fredaccount.stlouisfed.org/login/secure/`);
      console.warn(`   然后运行: export FRED_API_KEY=your_api_key\n`);

      // 生成示例数据用于演示
      return generateSampleData();
    }

    console.log(`\n✅ 成功获取 ${treasuryData.length} 条国债收益率数据\n`);
    return treasuryData;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`❌ 获取数据失败: ${error.message}`);
      if (error.response) {
        console.error(`   状态码: ${error.response.status}`);
      }
    } else {
      console.error(`❌ 发生错误: ${error}`);
    }
    
    // 出错时返回示例数据以便测试 CSV 生成
    console.log(`\n📝 使用示例数据继续演示...\n`);
    return generateSampleData();
  }
}

/**
 * 生成示例国债数据（用于演示）
 */
function generateSampleData(): TreasuryData[] {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  return [
    { date: dateStr, yield: 4.24, maturity: '3 Month', description: '美国3个月期国债收益率' },
    { date: dateStr, yield: 4.15, maturity: '6 Month', description: '美国6个月期国债收益率' },
    { date: dateStr, yield: 4.22, maturity: '1 Year', description: '美国1年期国债收益率' },
    { date: dateStr, yield: 3.89, maturity: '2 Year', description: '美国2年期国债收益率' },
    { date: dateStr, yield: 3.75, maturity: '3 Year', description: '美国3年期国债收益率' },
    { date: dateStr, yield: 3.55, maturity: '5 Year', description: '美国5年期国债收益率' },
    { date: dateStr, yield: 3.45, maturity: '7 Year', description: '美国7年期国债收益率' },
    { date: dateStr, yield: 3.35, maturity: '10 Year', description: '美国10年期国债收益率' },
    { date: dateStr, yield: 3.55, maturity: '20 Year', description: '美国20年期国债收益率' },
    { date: dateStr, yield: 3.70, maturity: '30 Year', description: '美国30年期国债收益率' }
  ];
}

/**
 * 将国债收益率数据写入 CSV 文件
 */
function saveToCsv(treasuryData: TreasuryData[], outputPath: string): void {
  console.log(`💾 正在写入 CSV 文件: ${outputPath}\n`);

  const headers = [
    '更新日期',
    '期限',
    '收益率(%)',
    '描述'
  ];

  // 准备 CSV 行数据
  const rows = treasuryData.map(data => [
    data.date,
    `"${data.maturity}"`,
    data.yield.toFixed(4),
    `"${data.description}"`
  ]);

  // 写入 CSV 文件
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  fs.writeFileSync(outputPath, csvContent, 'utf-8');

  console.log(`✅ 已保存 ${treasuryData.length} 条国债收益率记录到 CSV 文件`);
  console.log(`📁 文件大小: ${(Buffer.byteLength(csvContent, 'utf-8') / 1024).toFixed(2)} KB\n`);
}

/**
 * 显示数据统计
 */
function printStatistics(treasuryData: TreasuryData[]): void {
  console.log('📊 ===== 国债收益率数据统计 =====\n');

  if (treasuryData.length === 0) {
    console.log('❌ 没有数据可显示\n');
    return;
  }

  // 收益率统计
  const yields = treasuryData.map(d => d.yield);
  const avgYield = yields.reduce((a, b) => a + b, 0) / yields.length;
  const minYield = Math.min(...yields);
  const maxYield = Math.max(...yields);

  console.log('收益率统计:');
  console.log(`  • 平均收益率: ${avgYield.toFixed(4)}%`);
  console.log(`  • 最低收益率: ${minYield.toFixed(4)}%`);
  console.log(`  • 最高收益率: ${maxYield.toFixed(4)}%`);
  console.log(`  • 数据条数: ${treasuryData.length} 条\n`);

  // 按期限分组显示
  console.log('按期限分类:');
  treasuryData.forEach(data => {
    console.log(`  • ${data.maturity.padEnd(10)}: ${data.yield.toFixed(4)}% (${data.date})`);
  });
  console.log();

  // 收益率曲线斜度
  const shortTermYield = treasuryData.find(d => d.maturity === '3 Month')?.yield || 0;
  const longTermYield = treasuryData.find(d => d.maturity === '30 Year')?.yield || 0;
  const slope = longTermYield - shortTermYield;

  console.log('收益率曲线:');
  console.log(`  • 3个月期: ${shortTermYield.toFixed(4)}%`);
  console.log(`  • 30年期: ${longTermYield.toFixed(4)}%`);
  console.log(`  • 曲线斜度: ${slope.toFixed(4)}% (${slope > 0 ? '正常向上' : '倒挂'})\n`);
}

/**
 * 显示样本数据
 */
function printSamples(treasuryData: TreasuryData[], count: number = 5): void {
  console.log(`📋 ===== 样本国债数据 (前 ${Math.min(count, treasuryData.length)} 条) =====\n`);

  treasuryData.slice(0, count).forEach((data, index) => {
    console.log(`${index + 1}. ${data.description}`);
    console.log(`   期限: ${data.maturity}`);
    console.log(`   收益率: ${data.yield.toFixed(4)}%`);
    console.log(`   更新日期: ${data.date}`);
    console.log();
  });
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  console.log('🏛️  ===== FRED API 国债收益率数据获取程序 =====\n');
  console.log(`⏰ 开始时间: ${new Date().toLocaleString('zh-CN')}\n`);

  try {
    // 1. 获取国债数据
    const treasuryData = await fetchTreasuryData();

    // 2. 显示统计信息
    printStatistics(treasuryData);

    // 3. 显示样本数据
    printSamples(treasuryData, treasuryData.length);

    // 4. 保存到 CSV 文件
    const outputDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const csvPath = path.join(outputDir, `treasury_yields_${timestamp}.csv`);

    saveToCsv(treasuryData, csvPath);

    console.log(`✅ 完成时间: ${new Date().toLocaleString('zh-CN')}`);
    console.log(`\n✨ 程序执行成功！\n`);

    // 5. 显示如何使用真实 API Key
    if (process.env.FRED_API_KEY === undefined || process.env.FRED_API_KEY === 'demo_key') {
      console.log('💡 提示: 使用真实 FRED API Key 可获取实时数据');
      console.log('   1. 访问: https://fredaccount.stlouisfed.org/login/secure/');
      console.log('   2. 注册并获取 API Key');
      console.log('   3. 设置环境变量: export FRED_API_KEY=your_api_key');
      console.log('   4. 重新运行此脚本\n');
    }
  } catch (error) {
    console.error(`\n❌ 程序执行失败:`, error);
    process.exit(1);
  }
}

// 运行主函数
main().catch(error => {
  console.error('致命错误:', error);
  process.exit(1);
});
