-- Add is_admin column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;

-- Optional: Set your email as admin (update with your actual admin email)
-- UPDATE users SET is_admin = TRUE WHERE email = 'akef.minato@gmail.com';
