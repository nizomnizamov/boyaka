-- ============================================================
-- MIGRATION: Fix business tables to match backend routes
-- Supabase Dashboard → SQL Editor da ishlating
-- ============================================================

-- 1. business_accounts — yetishmayotgan ustunlar
ALTER TABLE business_accounts ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE business_accounts ADD COLUMN IF NOT EXISTS invite_code VARCHAR(20) UNIQUE;

-- owner_id → created_by ga sync (agar eski data bo'lsa)
UPDATE business_accounts SET created_by = owner_id WHERE created_by IS NULL AND owner_id IS NOT NULL;

-- 2. business_members — yetishmayotgan ustunlar
ALTER TABLE business_members ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE business_members ADD COLUMN IF NOT EXISTS invited_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE business_members ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP;
ALTER TABLE business_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 3. Index
CREATE INDEX IF NOT EXISTS idx_business_invite_code ON business_accounts(invite_code);
CREATE INDEX IF NOT EXISTS idx_business_members_status ON business_members(status);

-- DONE ✅
