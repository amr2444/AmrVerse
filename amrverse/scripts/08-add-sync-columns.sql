-- Migration: Add sync columns to reading_rooms and fix panel_comments
-- Run this script to update your existing database

-- Add new columns to reading_rooms if they don't exist
DO $$ 
BEGIN
    -- Add current_page_index column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reading_rooms' AND column_name = 'current_page_index') THEN
        ALTER TABLE reading_rooms ADD COLUMN current_page_index INTEGER DEFAULT 0;
    END IF;

    -- Add sync_enabled column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reading_rooms' AND column_name = 'sync_enabled') THEN
        ALTER TABLE reading_rooms ADD COLUMN sync_enabled BOOLEAN DEFAULT TRUE;
    END IF;

    -- Add updated_at column to reading_rooms
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reading_rooms' AND column_name = 'updated_at') THEN
        ALTER TABLE reading_rooms ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Fix panel_comments x_position and y_position to support decimal percentages
ALTER TABLE panel_comments 
    ALTER COLUMN x_position TYPE DECIMAL(5, 2) USING COALESCE(x_position, 0)::DECIMAL(5, 2),
    ALTER COLUMN y_position TYPE DECIMAL(5, 2) USING COALESCE(y_position, 0)::DECIMAL(5, 2);

-- Set defaults
ALTER TABLE panel_comments ALTER COLUMN x_position SET DEFAULT 0;
ALTER TABLE panel_comments ALTER COLUMN y_position SET DEFAULT 0;

-- Add trigger for reading_rooms updated_at if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_reading_rooms_updated_at') THEN
        CREATE TRIGGER update_reading_rooms_updated_at 
        BEFORE UPDATE ON reading_rooms 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create index on updated_at for faster sync queries
CREATE INDEX IF NOT EXISTS idx_rooms_updated ON reading_rooms(updated_at);

COMMENT ON COLUMN reading_rooms.current_page_index IS 'Current page index for scroll sync';
COMMENT ON COLUMN reading_rooms.sync_enabled IS 'Whether scroll sync is enabled for the room';
COMMENT ON COLUMN reading_rooms.updated_at IS 'Last update timestamp for sync polling';
