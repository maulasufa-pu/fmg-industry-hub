-- Add artwork/thumbnail columns to portfolio table
-- Run this script to add the new columns to your existing portfolio table

ALTER TABLE public.portfolio
ADD COLUMN IF NOT EXISTS spotify_artwork TEXT,
ADD COLUMN IF NOT EXISTS youtube_thumbnail TEXT,
ADD COLUMN IF NOT EXISTS apple_music_artwork TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.portfolio.spotify_artwork IS 'Spotify album/track artwork URL';
COMMENT ON COLUMN public.portfolio.youtube_thumbnail IS 'YouTube video thumbnail URL';
COMMENT ON COLUMN public.portfolio.apple_music_artwork IS 'Apple Music album artwork URL';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'portfolio'
  AND column_name IN ('spotify_artwork', 'youtube_thumbnail', 'apple_music_artwork');
