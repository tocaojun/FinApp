-- Migration: 012_integrate_wealth_products.sql
-- Description: Integrate wealth products into existing positions system
-- Author: AI Assistant  
-- Date: 2025-11-11

-- Add wealth product support fields to positions table
ALTER TABLE finapp.positions 
ADD COLUMN product_mode VARCHAR(20) DEFAULT 'QUANTITY' CHECK (product_mode IN ('QUANTITY', 'BALANCE')),
ADD COLUMN balance DECIMAL(20, 8) DEFAULT NULL,
ADD COLUMN net_asset_value DECIMAL(20, 8) DEFAULT NULL,
ADD COLUMN last_nav_update TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add comments for new columns
COMMENT ON COLUMN finapp.positions.product_mode IS '产品模式: QUANTITY=净值型(有单位数量), BALANCE=余额型(仅余额)';
COMMENT ON COLUMN finapp.positions.balance IS '余额型产品的当前余额';
COMMENT ON COLUMN finapp.positions.net_asset_value IS '净值型产品的单位净值';
COMMENT ON COLUMN finapp.positions.last_nav_update IS '最后净值更新时间';

-- Create index for product_mode
CREATE INDEX idx_positions_product_mode ON finapp.positions(product_mode);

-- Add wealth product asset types
INSERT INTO finapp.asset_types (code, name, category, description) VALUES
('WEALTH_NAV', '净值型理财产品', 'wealth', '银行理财、基金等有单位净值的产品'),
('WEALTH_BALANCE', '余额型理财产品', 'wealth', '活期存款、现金理财等仅有余额的产品'),
('DEPOSIT', '存款产品', 'deposit', '定期存款、活期存款等银行存款产品'),
('CASH_MGMT', '现金管理产品', 'cash', '货币基金、现金管理类理财产品')
ON CONFLICT (code) DO NOTHING;

-- Create view for wealth products (compatible with existing queries)
CREATE OR REPLACE VIEW finapp.wealth_positions AS
SELECT 
    p.id,
    p.portfolio_id,
    p.trading_account_id,
    p.asset_id,
    a.name as product_name,
    a.symbol as product_code,
    p.product_mode,
    p.quantity,
    p.net_asset_value,
    p.balance,
    p.average_cost,
    p.total_cost,
    CASE 
        WHEN p.product_mode = 'QUANTITY' THEN 
            p.quantity * COALESCE(p.net_asset_value, p.average_cost)
        WHEN p.product_mode = 'BALANCE' THEN 
            COALESCE(p.balance, 0)
        ELSE p.quantity * p.average_cost
    END as current_value,
    CASE 
        WHEN p.product_mode = 'QUANTITY' THEN 
            (p.quantity * COALESCE(p.net_asset_value, p.average_cost)) - p.total_cost
        WHEN p.product_mode = 'BALANCE' THEN 
            COALESCE(p.balance, 0) - p.total_cost
        ELSE (p.quantity * p.average_cost) - p.total_cost
    END as unrealized_pnl,
    p.last_nav_update,
    p.created_at as first_purchase_date,
    p.updated_at as last_transaction_date,
    ta.name as account_name,
    at.category as asset_category,
    p.currency
FROM finapp.positions p
JOIN finapp.assets a ON p.asset_id = a.id
JOIN finapp.asset_types at ON a.asset_type_code = at.code
JOIN finapp.trading_accounts ta ON p.trading_account_id = ta.id
WHERE at.category IN ('wealth', 'deposit', 'cash')
ORDER BY p.updated_at DESC;

-- Drop old wealth product table if exists (clean up)
DROP TABLE IF EXISTS finapp.wealth_product_details CASCADE;

-- Drop old wealth products summary view if exists
DROP VIEW IF EXISTS finapp.wealth_products_summary CASCADE;