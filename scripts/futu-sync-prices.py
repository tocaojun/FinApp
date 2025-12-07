#!/usr/bin/env python3
"""
富途证券股票价格同步脚本

功能:
- 通过富途OpenAPI获取香港股票历史价格
- 将数据同步到FinApp数据库

依赖:
pip install futu-api psycopg2-binary python-dotenv
"""

import sys
import os
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

try:
    from futu import OpenQuoteContext, RET_OK, SubType, KLType, AuType
except ImportError:
    print("❌ 未安装futu-api库")
    print("请运行: pip install futu-api")
    sys.exit(1)

# 加载环境变量
load_dotenv('/Users/caojun/code/FinApp/backend/.env')

# 配置
FUTU_HOST = os.getenv('FUTU_API_HOST', '127.0.0.1')
FUTU_PORT = int(os.getenv('FUTU_API_PORT', 11111))

# 数据库配置 - 从DATABASE_URL中移除schema参数
db_url_raw = os.getenv('DATABASE_URL', 'postgresql://finapp_user:finapp_password@localhost:5432/finapp_test')
# 移除 ?schema=xxx 参数,psycopg2不支持这个参数
DB_URL = db_url_raw.split('?')[0]

class FutuPriceSync:
    def __init__(self):
        self.quote_ctx = None
        self.db_conn = None
        
    def connect_futu(self):
        """连接富途OpenD"""
        try:
            print(f"🔌 连接富途OpenD: {FUTU_HOST}:{FUTU_PORT}")
            self.quote_ctx = OpenQuoteContext(host=FUTU_HOST, port=FUTU_PORT)
            print("✅ 富途OpenD连接成功")
            return True
        except Exception as e:
            print(f"❌ 富途OpenD连接失败: {e}")
            return False
    
    def connect_db(self):
        """连接数据库"""
        try:
            print("🔌 连接数据库...")
            self.db_conn = psycopg2.connect(DB_URL)
            print("✅ 数据库连接成功")
            return True
        except Exception as e:
            print(f"❌ 数据库连接失败: {e}")
            return False
    
    def get_hk_stocks(self):
        """从数据库获取香港股票列表"""
        try:
            cursor = self.db_conn.cursor()
            cursor.execute("""
                SELECT a.id, a.symbol, a.name, c.code as country
                FROM finapp.assets a
                LEFT JOIN finapp.countries c ON a.country_id = c.id
                WHERE (c.code = 'HK' OR a.symbol LIKE 'HK.%' OR a.symbol LIKE '%.HK')
                  AND a.is_active = true
                ORDER BY a.symbol
            """)
            stocks = cursor.fetchall()
            cursor.close()
            return stocks
        except Exception as e:
            print(f"❌ 查询香港股票失败: {e}")
            return []
    
    def format_futu_symbol(self, symbol):
        """格式化为富途股票代码 (HK.00700)"""
        # 如果已经是HK.开头
        if symbol.startswith('HK.'):
            return symbol
        
        # 如果是 00700 格式,添加HK前缀
        if symbol.isdigit():
            return f"HK.{symbol}"
        
        # 如果是 00700.HK 格式,转换为 HK.00700
        if '.HK' in symbol.upper():
            code = symbol.split('.')[0]
            return f"HK.{code}"
        
        # 默认添加HK前缀
        return f"HK.{symbol}"
    
    def get_historical_kline(self, symbol, days_back=365):
        """获取历史K线数据"""
        try:
            futu_symbol = self.format_futu_symbol(symbol)
            print(f"📊 获取 {futu_symbol} 历史数据(最近{days_back}天)...")
            
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            ret, data, page_req_key = self.quote_ctx.request_history_kline(
                code=futu_symbol,
                start=start_date.strftime('%Y-%m-%d'),
                end=end_date.strftime('%Y-%m-%d'),
                ktype=KLType.K_DAY,  # 日K线
                autype=AuType.QFQ,   # 前复权
                max_count=1000
            )
            
            if ret == RET_OK:
                print(f"   ✅ 获取到 {len(data)} 条K线数据")
                return data
            else:
                print(f"   ❌ 获取失败: {data}")
                return None
                
        except Exception as e:
            print(f"   ❌ 异常: {e}")
            return None
    
    def save_prices_to_db(self, asset_id, prices_df):
        """保存价格数据到数据库"""
        try:
            cursor = self.db_conn.cursor()
            
            # 准备数据
            values = []
            for idx, row in prices_df.iterrows():
                # 转换日期格式
                date_str = str(row['time_key']).split()[0]  # 取日期部分 YYYY-MM-DD
                
                values.append((
                    asset_id,
                    date_str,  # 日期
                    float(row['open']),
                    float(row['high']),
                    float(row['low']),
                    float(row['close']),
                    int(row['volume']),
                    'HKD',
                    'futu',
                    'FUTU_API'
                ))
            
            # 批量插入/更新
            execute_values(
                cursor,
                """
                INSERT INTO finapp.asset_prices (
                    asset_id, price_date, open_price, high_price, low_price,
                    close_price, volume, currency, data_source, price_source
                ) VALUES %s
                ON CONFLICT (asset_id, price_date) 
                DO UPDATE SET
                    open_price = EXCLUDED.open_price,
                    high_price = EXCLUDED.high_price,
                    low_price = EXCLUDED.low_price,
                    close_price = EXCLUDED.close_price,
                    volume = EXCLUDED.volume,
                    currency = EXCLUDED.currency,
                    data_source = EXCLUDED.data_source,
                    price_source = EXCLUDED.price_source
                """,
                values,
                template="(%s::uuid, %s::date, %s, %s, %s, %s, %s, %s, %s, %s)"
            )
            
            self.db_conn.commit()
            cursor.close()
            print(f"   ✅ 保存了 {len(values)} 条价格记录")
            return True
            
        except Exception as e:
            print(f"   ❌ 保存失败: {e}")
            self.db_conn.rollback()
            return False
    
    def sync_stock(self, asset_id, symbol, name, days_back=365):
        """同步单个股票"""
        print(f"\n{'='*60}")
        print(f"同步股票: {symbol} - {name}")
        print(f"{'='*60}")
        
        # 获取K线数据
        kline_data = self.get_historical_kline(symbol, days_back)
        if kline_data is None or len(kline_data) == 0:
            print(f"⚠️  未获取到数据,跳过")
            return False
        
        # 保存到数据库
        success = self.save_prices_to_db(asset_id, kline_data)
        return success
    
    def sync_all_hk_stocks(self, days_back=365):
        """同步所有香港股票"""
        print("\n" + "="*60)
        print("开始同步香港股票历史价格")
        print("="*60 + "\n")
        
        # 获取股票列表
        stocks = self.get_hk_stocks()
        if not stocks:
            print("❌ 未找到香港股票")
            return
        
        print(f"📋 找到 {len(stocks)} 只香港股票\n")
        
        success_count = 0
        failed_count = 0
        
        for asset_id, symbol, name, country in stocks:
            try:
                if self.sync_stock(asset_id, symbol, name, days_back):
                    success_count += 1
                else:
                    failed_count += 1
            except Exception as e:
                print(f"❌ 同步失败: {e}")
                failed_count += 1
        
        print("\n" + "="*60)
        print("同步完成!")
        print(f"成功: {success_count} | 失败: {failed_count} | 总计: {len(stocks)}")
        print("="*60 + "\n")
    
    def close(self):
        """关闭连接"""
        if self.quote_ctx:
            self.quote_ctx.close()
            print("✅ 关闭富途连接")
        
        if self.db_conn:
            self.db_conn.close()
            print("✅ 关闭数据库连接")

def main():
    """主函数"""
    print("\n" + "="*60)
    print("富途证券香港股票价格同步工具")
    print("="*60 + "\n")
    
    # 解析参数
    days_back = 365
    if len(sys.argv) > 1:
        try:
            days_back = int(sys.argv[1])
        except:
            pass
    
    print(f"⏰ 回溯天数: {days_back} 天\n")
    
    # 创建同步器
    syncer = FutuPriceSync()
    
    try:
        # 连接服务
        if not syncer.connect_futu():
            print("\n⚠️  请确保:")
            print("  1. 富途OpenD程序已启动")
            print("  2. 端口配置为 11111")
            print("  3. 已登录富途账号")
            sys.exit(1)
        
        if not syncer.connect_db():
            print("\n⚠️  请检查数据库连接配置")
            sys.exit(1)
        
        # 同步数据
        syncer.sync_all_hk_stocks(days_back)
        
    except KeyboardInterrupt:
        print("\n\n⚠️  用户中断")
    except Exception as e:
        print(f"\n❌ 发生错误: {e}")
        import traceback
        traceback.print_exc()
    finally:
        syncer.close()

if __name__ == '__main__':
    main()
