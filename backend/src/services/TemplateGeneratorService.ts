/**
 * 模板生成服务
 * 生成Excel和JSON导入模板
 */

import * as XLSX from 'xlsx';
import { ImportContext } from '../types/import.types';

export class TemplateGeneratorService {
  /**
   * 生成Excel模板
   */
  generateExcelTemplate(context?: ImportContext): Buffer {
    // Sheet1: 交易数据
    const dataSheet = XLSX.utils.aoa_to_sheet([
      // 表头
      ['日期', '交易类型', '数量', '价格', '币种', '手续费', '备注', '标签'],
      // 示例数据
      ['2024-01-15', 'buy', 100, 320.5, 'HKD', 10, '建仓', '长期持有,核心资产'],
      ['2024-02-20', 'sell', 50, 185.2, 'USD', 5, '减仓', ''],
      ['2024-03-10', 'dividend', 100, 2.5, 'HKD', 0, '分红收入', '被动收入']
    ]);
    
    // Sheet2: 说明
    const instructionSheet = XLSX.utils.aoa_to_sheet([
      ['批量导入交易说明'],
      [''],
      ['1. 使用前提：'],
      ['   - 必须先在界面选择：投资组合、交易账户、资产（产品）'],
      ['   - 本文件仅包含交易明细，不包含投资组合/账户/资产信息'],
      [''],
      ['2. 必填字段（5个）：'],
      ['   - 日期：格式 YYYY-MM-DD，不能是未来日期'],
      ['   - 交易类型：见下方类型列表'],
      ['   - 数量：必须 > 0'],
      ['   - 价格：必须 ≥ 0'],
      ['   - 币种：3位ISO代码（如CNY、USD、HKD）'],
      [''],
      ['3. 可选字段（3个）：'],
      ['   - 手续费：默认0'],
      ['   - 备注：任意文本'],
      ['   - 标签：多个标签用逗号分隔'],
      [''],
      ['4. 支持的交易类型：'],
      ['   buy - 买入'],
      ['   sell - 卖出'],
      ['   dividend - 分红'],
      ['   split - 拆股'],
      ['   merger - 合并'],
      ['   spin_off - 分拆'],
      ['   deposit - 存入'],
      ['   withdrawal - 取出'],
      [''],
      ['5. 常用币种代码：'],
      ['   CNY-人民币, USD-美元, HKD-港币, EUR-欧元, GBP-英镑, JPY-日元'],
      [''],
      ['6. 注意事项：'],
      ['   - 一批数据要么全部成功，要么全部失败'],
      ['   - 请确保数据准确，避免导入失败']
    ]);
    
    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, dataSheet, '交易数据');
    XLSX.utils.book_append_sheet(workbook, instructionSheet, '说明');
    
    // 生成Buffer
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  /**
   * 生成JSON模板
   */
  generateJsonTemplate(context?: ImportContext): string {
    const template = {
      version: '2.0',
      metadata: {
        description: '交易批量导入模板',
        note: '使用前必须在界面选择：投资组合、交易账户、资产'
      },
      transactions: [
        {
          date: '2024-01-15',
          type: 'buy',
          quantity: 100,
          price: 320.5,
          currency: 'HKD',
          fee: 10,
          notes: '建仓',
          tags: ['长期持有', '核心资产']
        },
        {
          date: '2024-02-20',
          type: 'sell',
          quantity: 50,
          price: 185.2,
          currency: 'USD',
          fee: 5,
          notes: '减仓',
          tags: []
        },
        {
          date: '2024-03-10',
          type: 'dividend',
          quantity: 100,
          price: 2.5,
          currency: 'HKD',
          fee: 0,
          notes: '分红收入',
          tags: ['被动收入']
        }
      ],
      schema: {
        required_fields: ['date', 'type', 'quantity', 'price', 'currency'],
        optional_fields: ['fee', 'notes', 'tags'],
        transaction_types: [
          'buy', 'sell', 'dividend', 'split', 'merger', 'spin_off', 'deposit', 'withdrawal'
        ],
        transaction_type_descriptions: {
          buy: '买入',
          sell: '卖出',
          dividend: '分红',
          split: '拆股',
          merger: '合并',
          spin_off: '分拆',
          deposit: '存入',
          withdrawal: '取出'
        },
        currency_codes: ['CNY', 'USD', 'HKD', 'EUR', 'GBP', 'JPY', 'SGD', 'AUD', 'CAD']
      }
    };
    
    return JSON.stringify(template, null, 2);
  }
}
