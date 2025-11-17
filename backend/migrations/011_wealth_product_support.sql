-- Migration: 011_wealth_product_support.sql
-- Description: Add support for wealth products with dual modes (NAV-based and balance-based)
-- Author: AI Assistant
-- Date: 2025-11-11

-- Add product mode and balance fields to positions table
ALTER TABLE positions 
ADD COLUMN product_mode VARCHAR(20) DEFAULT 'QUANTITY' CHECK (product_mode IN ('QUANTITY', 'BALANCE')),
ADD COLUMN balance DECIMAL(20, 8) DEFAULT NULL,
ADD COLUMN net_asset_value DECIMAL(20, 8) DEFAULT NULL,
ADD COLUMN last_nav_update TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add comments for new columns
COMMENT ON COLUMN positions.product_mode IS '产品模式: QUANTITY=净值型(有单位数量), BALANCE=余额型(仅余额)';
COMMENT ON COLUMN positions.balance IS '余额型产品的当前余额';
COMMENT ON COLUMN positions.net_asset_value IS '净值型产品的单位净值';
COMMENT ON COLUMN positions.last_nav_update IS '最后净值更新时间';

-- Create index for product_mode
CREATE INDEX idx_positions_product_mode ON positions(product_mode);

-- Update asset_types to include wealth product categories
INSERT INTO asset_types (code, name, category, description) VALUES
('WEALTH_NAV', '净值型理财产品', 'wealth', '银行理财、基金等有单位净值的产品'),
('WEALTH_BALANCE', '余额型理财产品', 'wealth', '活期存款、现金理财等仅有余额的产品'),
('DEPOSIT', '存款产品', 'cash', '定期存款、活期存款等银行存款产品'),
('CASH_MGMT', '现金管理产品', 'cash', '货币基金、现金管理类理财产品')
ON CONFLICT (code) DO NOTHING;

-- Create a view for wealth products summary
CREATE OR REPLACE VIEW wealth_products_summary AS
SELECT 
    p.id,
    p.portfolio_id,
    p.trading_account_id,
    a.name as product_name,
    a.symbol as product_code,
    p.product_mode,
    CASE 
        WHEN p.product_mode = 'QUANTITY' THEN 
            p.quantity * COALESCE(p.net_asset_value, p.average_cost)
        WHEN p.product_mode = 'BALANCE' THEN 
            p.balance
        ELSE 0
    END as current_value,
    CASE 
        WHEN p.product_mode = 'QUANTITY' THEN 
            (p.quantity * COALESCE(p.net_asset_value, p.average_cost)) - p.total_cost
        WHEN p.product_mode = 'BALANCE' THEN 
            p.balance - p.total_cost
        ELSE 0
    END as unrealized_pnl,
    p.quantity,
    p.net_asset_value,
    p.balance,
    p.total_cost,
    p.currency,
    p.last_nav_update,
    p.first_purchase_date,
    p.last_transaction_date,
    ta.name as account_name,
    at.category as asset_category
FROM positions p
JOIN assets a ON p.asset_id = a.id
JOIN asset_types at ON a.asset_type_id = at.id
JOIN trading_accounts ta ON p.trading_account_id = ta.id
WHERE p.is_active = true 
AND at.category IN ('wealth', 'cash')
AND p.quantity > 0 OR p.balance > 0;

-- Add comment for the view
COMMENT ON VIEW wealth_products_summary IS '理财产品汇总视图，支持净值型和余额型产品';

-- Create trigger to validate product mode consistency
CREATE OR REPLACE FUNCTION validate_wealth_product_mode()
RETURNS TRIGGER AS $$
BEGIN
    -- For QUANTITY mode, ensure quantity and net_asset_value are set
    IF NEW.product_mode = 'QUANTITY' THEN
        IF NEW.quantity IS NULL OR NEW.quantity = 0 THEN
            RAISE EXCEPTION 'QUANTITY mode requires valid quantity value';
        END IF;
        -- Clear balance for QUANTITY mode
        NEW.balance = NULL;
    END IF;
    
    -- For BALANCE mode, ensure balance is set
    IF NEW.product_mode = 'BALANCE' THEN
        IF NEW.balance IS NULL OR NEW.balance = 0 THEN
            RAISE EXCEPTION 'BALANCE mode requires valid balance value';
        END IF;
        -- Clear quantity for BALANCE mode
        NEW.quantity = 0;
        NEW.net_asset_value = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for positions table
CREATE TRIGGER validate_wealth_product_mode_trigger
    BEFORE INSERT OR UPDATE ON positions
    FOR EACH ROW
    WHEN (NEW.product_mode IN ('QUANTITY', 'BALANCE'))
    EXECUTE FUNCTION validate_wealth_product_mode();

-- Add sample wealth products for testing
INSERT INTO assets (symbol, name, asset_type_id, currency, description, metadata) 
SELECT 
    'WEALTH_001', 
    '招商银行理财产品001', 
    at.id, 
    'CNY', 
    '净值型银行理财产品',
    '{"bank": "招商银行", "product_type": "净值型", "risk_level": "R2"}'::jsonb
FROM asset_types at WHERE at.code = 'WEALTH_NAV'
ON CONFLICT DO NOTHING;

INSERT INTO assets (symbol, name, asset_type_id, currency, description, metadata)
SELECT 
    'DEPOSIT_001', 
    '活期存款账户', 
    at.id, 
    'CNY', 
    '银行活期存款',
    '{"bank": "工商银行", "account_type": "活期", "interest_rate": "0.3%"}'::jsonb
FROM asset_types at WHERE at.code = 'WEALTH_BALANCE'
ON CONFLICT DO NOTHING;

-- Migration completed
SELECT 'Migration 011_wealth_product_support completed successfully' as status;