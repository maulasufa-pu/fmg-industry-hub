begin;

-- Create portfolio table for music project showcase
-- Run this in Supabase SQL Editor

-- ===========================================
-- CREATE PORTFOLIO TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.portfolio (
  id BIGSERIAL PRIMARY KEY,
  
  -- Basic Info
  genre TEXT NOT NULL,
  song_title TEXT NOT NULL,
  album_title TEXT,
  
  -- Credits (Array fields)
  singer TEXT[] DEFAULT '{}',
  songwriter TEXT[] DEFAULT '{}',
  composer TEXT[] DEFAULT '{}',
  arranger TEXT[] DEFAULT '{}',
  producer TEXT[] DEFAULT '{}',
  mixing_engineer TEXT[] DEFAULT '{}',
  mastering_engineer TEXT[] DEFAULT '{}',
  publisher TEXT[] DEFAULT '{}',
  aggregator TEXT[] DEFAULT '{}',
  
  -- Release Info
  release_date DATE,
  release_date_aggregator DATE,
  youtube_link TEXT,
  spotify_link TEXT,
  apple_music_link TEXT,
  artwork_link TEXT,
  priority_order INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Artwork/Thumbnails
  spotify_artwork TEXT,
  youtube_thumbnail TEXT,
  apple_music_artwork TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_portfolio_genre ON public.portfolio(genre);
CREATE INDEX IF NOT EXISTS idx_portfolio_song_title ON public.portfolio(song_title);
CREATE INDEX IF NOT EXISTS idx_portfolio_release_date ON public.portfolio(release_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_portfolio_created_at ON public.portfolio(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_priority_order ON public.portfolio(priority_order ASC, release_date_aggregator DESC NULLS LAST);

-- ===========================================
-- ENABLE ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- CREATE RLS POLICIES
-- ===========================================

-- Policy 1: Public read access (anyone can view portfolio)
DROP POLICY IF EXISTS "Public can view portfolio" ON public.portfolio;
CREATE POLICY "Public can view portfolio"
  ON public.portfolio
  FOR SELECT
  USING (true);

-- Policy 2: Authenticated users with admin/owner role can insert
DROP POLICY IF EXISTS "Admin/Owner can insert portfolio" ON public.portfolio;
CREATE POLICY "Admin/Owner can insert portfolio"
  ON public.portfolio
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (main_role IN ('admin', 'owner') OR 'admin' = ANY(staff_role) OR 'owner' = ANY(staff_role))
    )
  );

-- Policy 3: Authenticated users with admin/owner role can update
DROP POLICY IF EXISTS "Admin/Owner can update portfolio" ON public.portfolio;
CREATE POLICY "Admin/Owner can update portfolio"
  ON public.portfolio
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (main_role IN ('admin', 'owner') OR 'admin' = ANY(staff_role) OR 'owner' = ANY(staff_role))
    )
  );

-- Policy 4: Authenticated users with admin/owner role can delete
DROP POLICY IF EXISTS "Admin/Owner can delete portfolio" ON public.portfolio;
CREATE POLICY "Admin/Owner can delete portfolio"
  ON public.portfolio
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (main_role IN ('admin', 'owner') OR 'admin' = ANY(staff_role) OR 'owner' = ANY(staff_role))
    )
  );

-- ===========================================
-- CREATE UPDATED_AT TRIGGER
-- ===========================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_portfolio_updated_at ON public.portfolio;
CREATE TRIGGER update_portfolio_updated_at
  BEFORE UPDATE ON public.portfolio
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- VERIFICATION
-- ===========================================

-- Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'portfolio'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'portfolio';

-- Test SELECT (should work)
SELECT COUNT(*) as total_portfolio FROM public.portfolio;

commit;
