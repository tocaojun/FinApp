-- Add location_dimension column to asset_types table
ALTER TABLE finapp.asset_types
ADD COLUMN location_dimension VARCHAR(20) DEFAULT 'market';

-- Create index for location_dimension
CREATE INDEX idx_asset_types_location_dimension 
ON finapp.asset_types(location_dimension);

-- Update location_dimension based on asset type code
-- Market-bound assets (default: market)
UPDATE finapp.asset_types 
SET location_dimension = 'market' 
WHERE code IN ('STOCK', 'ETF', 'FUTURE', 'OPTION');

-- Country-bound assets
UPDATE finapp.asset_types 
SET location_dimension = 'country' 
WHERE code IN ('BOND', 'BANK_WEALTH', 'MUTUAL_FUND', 'FUND', 'REIT', 'CASH');

-- Global assets (no geographical restriction)
UPDATE finapp.asset_types 
SET location_dimension = 'global' 
WHERE code IN ('CRYPTO', 'COMMODITY');

-- Add comment to document the column
COMMENT ON COLUMN finapp.asset_types.location_dimension IS 'Location dimension for asset type: market (交易市场), country (国家), or global (全球)';
