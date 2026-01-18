-- Setup for image storage references
-- Note: Actual image files are stored in Vercel Blob, not in the database

-- Update manhwa covers to use external storage
-- Example:
-- UPDATE manhwas SET cover_url = 'https://blob.vercel-storage.com/...' WHERE id = '...';

-- Create index for faster image lookups
CREATE INDEX IF NOT EXISTS idx_manhwas_cover ON manhwas(cover_url);
CREATE INDEX IF NOT EXISTS idx_users_avatar ON users(avatar_url);
CREATE INDEX IF NOT EXISTS idx_chapter_pages_image ON chapter_pages(image_url);

-- Add CDN caching headers comment
-- All image URLs from Vercel Blob automatically include optimized caching
-- For production, configure Edge Caching:
-- - Images cached at Vercel's Edge Network
-- - Automatic format optimization (WebP, AVIF)
-- - Smart compression based on device

COMMENT ON TABLE manhwas IS 'Covers are stored in Vercel Blob CDN via cover_url';
COMMENT ON TABLE chapter_pages IS 'Images are stored in Vercel Blob CDN via image_url';
COMMENT ON TABLE users IS 'Avatars are stored in Vercel Blob CDN via avatar_url';
