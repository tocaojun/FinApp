#!/usr/bin/env python3
"""
富途单个资产同步脚本
用于从TypeScript后端调用，同步单个资产的历史价格数据
"""

import sys
import json
import os
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import execute_values

# 禁用futu-api的日志输出
import logging
logging.basicConfig(level=logging.CRITICAL)
os.environ['FUTU_OPEND_DISABLE_LOG'] = '1'

from futu import OpenQuoteContext, RET_OK, KLType, AuType
from futu import SysConfig
SysConfig.enable_proto_encrypt(False)
SysConfig.set_init_rsa_file('')  # 禁用RSA

# 配置
FUTU_HOST = os.getenv('FUTU_API_HOST', '127.0.0.1')
FUTU_PORT = int(os.getenv('FUTU_API_PORT', 11111))

# 数据库配置
db_url_raw = os.getenv('DATABASE_URL', 'postgresql://finapp_user:finapp_password@localhost:5432/finapp_test')
DB_URL = db_url_raw.split('?')[0]  # 移除schema参数


def sync_single_asset(asset_id: str, futu_symbol: str, days_back: int):
    """
    同步单个资产的历史价格数据
    
    Args:
        asset_id: 资产ID
        futu_symbol: 富途股票代码 (例如: HK.00700)
        days_back: 同步多少天的历史数据
        
    Returns:
        dict: {"success": bool, "data": list, "error": str}
    """
    quote_ctx = None
    db_conn = None
    
    try:
        # 连接富途OpenD
        quote_ctx = OpenQuoteContext(host=FUTU_HOST, port=FUTU_PORT)
        
        # 计算日期范围
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        # 获取历史K线数据
        ret, data, page_req_key = quote_ctx.request_history_kline(
            code=futu_symbol,
            start=start_date.strftime('%Y-%m-%d'),
            end=end_date.strftime('%Y-%m-%d'),
            ktype=KLType.K_DAY,  # 日K线
            autype=AuType.QFQ,   # 前复权
            max_count=1000
        )
        
        if ret != RET_OK:
            return {
                "success": False,
                "error": f"富途API返回错误: {data}"
            }
        
        if data.empty:
            return {
                "success": True,
                "data": [],
                "message": "未获取到数据"
            }
        
        # 连接数据库
        db_conn = psycopg2.connect(DB_URL)
        cursor = db_conn.cursor()
        
        # 准备数据
        values = []
        market_code = futu_symbol.split('.')[0] if '.' in futu_symbol else 'HK'
        currency_map = {
            'HK': 'HKD',
            'US': 'USD',
            'CN': 'CNY',
            'SG': 'SGD',
            'JP': 'JPY',
        }
        currency = currency_map.get(market_code, 'HKD')
        
        for idx, row in data.iterrows():
            # 转换日期格式
            date_str = str(row['time_key']).split()[0]  # 取日期部分 YYYY-MM-DD
            
            values.append((
                asset_id,
                date_str,
                float(row['open']),
                float(row['high']),
                float(row['low']),
                float(row['close']),
                int(row['volume']),
                currency,
                'futu',
                'FUTU_API'
            ))
        
        # 批量插入/更新数据库
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
        
        db_conn.commit()
        
        # 转换数据为JSON格式
        price_data = []
        for idx, row in data.iterrows():
            date_str = str(row['time_key']).split()[0]
            price_data.append({
                'date': date_str,
                'open': float(row['open']),
                'high': float(row['high']),
                'low': float(row['low']),
                'close': float(row['close']),
                'volume': int(row['volume']),
                'currency': currency,
            })
        
        return {
            "success": True,
            "data": price_data,
            "message": f"成功同步 {len(price_data)} 条价格记录"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
        
    finally:
        # 关闭连接
        if quote_ctx:
            quote_ctx.close()
        if db_conn:
            db_conn.close()


def main():
    """主函数"""
    # 重定向stderr到null，避免日志干扰JSON输出
    sys.stderr = open(os.devnull, 'w')
    
    if len(sys.argv) < 4:
        result = {
            "success": False,
            "error": "Usage: python3 futu-sync-single.py <asset_id> <futu_symbol> <days_back>"
        }
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(1)
    
    asset_id = sys.argv[1]
    futu_symbol = sys.argv[2]
    days_back = int(sys.argv[3])
    
    # 执行同步
    result = sync_single_asset(asset_id, futu_symbol, days_back)
    
    # 输出JSON结果（最后一行）
    print(json.dumps(result, ensure_ascii=False))
    
    # 返回退出码
    sys.exit(0 if result["success"] else 1)


if __name__ == '__main__':
    main()
