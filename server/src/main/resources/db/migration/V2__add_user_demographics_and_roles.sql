-- Migration V2: Add user demographics and roles
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(150);
ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'USER';

-- Create index on role for fast admin lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Set admin role and verify the owner's account
UPDATE users SET role = 'ADMIN', email_verified = true WHERE LOWER(email) IN ('azon1129@gmail.com', 'admin@lockin.app');

-- Verify test accounts
UPDATE users SET email_verified = true WHERE LOWER(email) IN ('demo@lockin.app', 'demo2@lockin.app');
