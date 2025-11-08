-- Portfolio Priority/Featured Feature Migration
-- Add columns for priority ordering and featured items
-- Run this in Supabase SQL Editor

-- Add is_featured column (boolean)
ALTER TABLE portfolio 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Add priority_order column (integer)
ALTER TABLE portfolio 
ADD COLUMN IF NOT EXISTS priority_order INTEGER;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_portfolio_featured ON portfolio(is_featured);
CREATE INDEX IF NOT EXISTS idx_portfolio_priority ON portfolio(priority_order);

-- Optional: Set default priority order for existing items (based on release date)
-- UPDATE portfolio 
-- SET priority_order = ROW_NUMBER() OVER (ORDER BY release_date_aggregator DESC NULLS LAST)
-- WHERE priority_order IS NULL;

-- Verification query
-- SELECT id, song_title, is_featured, priority_order, release_date_aggregator 
-- FROM portfolio 
-- ORDER BY is_featured DESC, priority_order ASC NULLS LAST, release_date_aggregator DESC NULLS LAST
-- LIMIT 20;
