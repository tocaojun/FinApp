-- Migration 010: Remove market dimension from assets
-- Purpose: Simplify the asset model by removing market_id
--          Keep country_id as the primary geographic dimension
--          Support NULL country_id for global assets (crypto, commodities)
--
-- Migration Date: 2025-11-08
-- This migration:
--   1. Validates data integrity before deletion
--   2. Removes the foreign key constraint on market_id
--   3. Removes the existing unique constraint
--   4. Deletes the market_id column
--   5. Creates a new unique constraint on (country_id, symbol)
--   6. Verifies the migration success

BEGIN;

-- ===== Step 1: Verify data integrity =====
-- Check how many assets have market_id
DO $$
DECLARE
  total_count INTEGER;
  with_market_count INTEGER;
  without_market_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM finapp.assets;
  SELECT COUNT(*) INTO with_market_count FROM finapp.assets WHERE market_id IS NOT NULL;
  SELECT COUNT(*) INTO without_market_count FROM finapp.assets WHERE market_id IS NULL;
  
  RAISE NOTICE 'Data validation - Total: %, With market: %, Without market: %',
    total_count, with_market_count, without_market_count;
END $$;

-- ===== Step 2: Drop foreign key constraint =====
ALTER TABLE finapp.assets 
DROP CONSTRAINT IF EXISTS assets_market_id_fkey CASCADE;

-- ===== Step 3: Drop existing unique constraint =====
-- Note: The constraint name might vary, so we check the constraint carefully
ALTER TABLE finapp.assets 
DROP CONSTRAINT IF EXISTS assets_market_id_symbol_key CASCADE;

ALTER TABLE finapp.assets 
DROP CONSTRAINT IF EXISTS "assets_market_id_symbol_key" CASCADE;

-- Also drop if it's named differently
DO $$
DECLARE
  c_name TEXT;
BEGIN
  SELECT tc.constraint_name INTO c_name
  FROM information_schema.table_constraints tc
  WHERE tc.table_schema = 'finapp' 
    AND tc.table_name = 'assets'
    AND tc.constraint_type = 'UNIQUE'
    AND tc.constraint_name LIKE '%market_id%symbol%';
  
  IF c_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE finapp.assets DROP CONSTRAINT ' || c_name;
    RAISE NOTICE 'Dropped constraint: %', c_name;
  END IF;
END $$;

-- ===== Step 4: Drop indexes on market_id =====
DROP INDEX IF EXISTS finapp.idx_assets_market_id CASCADE;

-- ===== Step 5: Delete market_id column =====
ALTER TABLE finapp.assets DROP COLUMN IF EXISTS market_id CASCADE;

-- ===== Step 6: Create new unique constraint on (country_id, symbol) =====
-- PostgreSQL allows NULL values in UNIQUE constraints
-- (NULL, 'BTC') and (NULL, 'ETH') are considered different, which is correct for global assets
ALTER TABLE finapp.assets 
ADD CONSTRAINT assets_country_id_symbol_unique UNIQUE (country_id, symbol);

-- ===== Step 7: Create indexes for query optimization =====
CREATE INDEX IF NOT EXISTS idx_assets_country_id ON finapp.assets(country_id);
CREATE INDEX IF NOT EXISTS idx_assets_symbol ON finapp.assets(symbol);
CREATE INDEX IF NOT EXISTS idx_assets_asset_type_id ON finapp.assets(asset_type_id);

-- ===== Step 8: Verify the changes =====
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  -- Check if market_id column still exists
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'finapp' 
      AND table_name = 'assets'
      AND column_name = 'market_id'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE EXCEPTION 'market_id column still exists! Migration failed!';
  ELSE
    RAISE NOTICE 'market_id column successfully removed';
  END IF;
  
  -- Verify unique constraint exists
  IF EXISTS(
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'finapp'
      AND table_name = 'assets'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'assets_country_id_symbol_unique'
  ) THEN
    RAISE NOTICE 'Unique constraint (country_id, symbol) successfully created';
  ELSE
    RAISE EXCEPTION 'Unique constraint not created! Migration failed!';
  END IF;
END $$;

-- ===== Final verification =====
SELECT COUNT(*) as final_asset_count FROM finapp.assets;
SELECT COUNT(DISTINCT (country_id, symbol)) as unique_combinations FROM finapp.assets;

COMMIT;
