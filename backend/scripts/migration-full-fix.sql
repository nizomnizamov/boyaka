-- ============================================================
-- FULL MIGRATION: Fix ALL schema mismatches between routes and DB
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. SAVING GOALS ─────────────────────────────────────────
ALTER TABLE saving_goals ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';
ALTER TABLE saving_goals ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE saving_goals ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Migrate existing target_date to deadline
UPDATE saving_goals SET deadline = target_date WHERE deadline IS NULL AND target_date IS NOT NULL;

-- saving_goals_contributions
ALTER TABLE saving_goals_contributions ADD COLUMN IF NOT EXISTS transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL;

-- ── 2. DEBTS ─────────────────────────────────────────────────
ALTER TABLE debts ADD COLUMN IF NOT EXISTS person_name VARCHAR(255);
ALTER TABLE debts ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE debts ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(20, 2) DEFAULT 0;

-- Migrate existing data
UPDATE debts SET person_name = contact_name WHERE person_name IS NULL AND contact_name IS NOT NULL;
UPDATE debts SET date = created_at::date WHERE date IS NULL;

-- Fix status constraint to allow 'settled'
ALTER TABLE debts DROP CONSTRAINT IF EXISTS debts_status_check;
ALTER TABLE debts ADD CONSTRAINT debts_status_check CHECK (status IN ('active', 'paid', 'partial', 'settled'));

-- debt_payments — add date column
ALTER TABLE debt_payments ADD COLUMN IF NOT EXISTS date DATE;
UPDATE debt_payments SET date = payment_date WHERE date IS NULL AND payment_date IS NOT NULL;

-- ── 3. BUSINESS ACCOUNTS ────────────────────────────────────
ALTER TABLE business_accounts ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE business_accounts ADD COLUMN IF NOT EXISTS invite_code VARCHAR(20) UNIQUE;
UPDATE business_accounts SET created_by = owner_id WHERE created_by IS NULL AND owner_id IS NOT NULL;

-- ── 4. BUSINESS MEMBERS ─────────────────────────────────────
ALTER TABLE business_members ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE business_members ADD COLUMN IF NOT EXISTS invited_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE business_members ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP;
ALTER TABLE business_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ── 5. BUSINESS PROJECTS ────────────────────────────────────
ALTER TABLE business_projects ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);
ALTER TABLE business_projects ADD COLUMN IF NOT EXISTS budget DECIMAL(20, 2) DEFAULT 0;
ALTER TABLE business_projects ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';
ALTER TABLE business_projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE business_projects ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE business_projects ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6';
ALTER TABLE business_projects ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- ── 6. BUSINESS TRANSACTIONS ────────────────────────────────
ALTER TABLE business_transactions ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE business_transactions ADD COLUMN IF NOT EXISTS date DATE;
UPDATE business_transactions SET date = transaction_date WHERE date IS NULL AND transaction_date IS NOT NULL;

-- ── 7. PROFIT DISTRIBUTIONS ─────────────────────────────────
ALTER TABLE profit_distributions ADD COLUMN IF NOT EXISTS total_income DECIMAL(20, 2);
ALTER TABLE profit_distributions ADD COLUMN IF NOT EXISTS total_expense DECIMAL(20, 2);
ALTER TABLE profit_distributions ADD COLUMN IF NOT EXISTS net_profit DECIMAL(20, 2);
ALTER TABLE profit_distributions ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- ── 8. PROFIT DISTRIBUTION SHARES ───────────────────────────
ALTER TABLE profit_distribution_shares ADD COLUMN IF NOT EXISTS profit_share DECIMAL(5, 2);
ALTER TABLE profit_distribution_shares ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';
ALTER TABLE profit_distribution_shares ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT false;

-- Migrate existing percentage to profit_share
UPDATE profit_distribution_shares SET profit_share = percentage WHERE profit_share IS NULL AND percentage IS NOT NULL;

-- ── 9. STRATEGY ITEMS ───────────────────────────────────────
-- Check if target_percentage already exists, if not rename percentage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'strategy_items' AND column_name = 'target_percentage'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'strategy_items' AND column_name = 'percentage'
    ) THEN
      ALTER TABLE strategy_items RENAME COLUMN percentage TO target_percentage;
    ELSE
      ALTER TABLE strategy_items ADD COLUMN target_percentage DECIMAL(5, 2);
    END IF;
  END IF;
END $$;

-- ── 10. FAMILIES ────────────────────────────────────────────
ALTER TABLE families ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE families ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
UPDATE families SET created_by = owner_id WHERE created_by IS NULL AND owner_id IS NOT NULL;

-- ── 11. FAMILY MEMBERS ──────────────────────────────────────
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS invited_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP;

-- ── 12. FAMILY INVITE CODES ─────────────────────────────────
ALTER TABLE family_invite_codes ADD COLUMN IF NOT EXISTS max_uses INTEGER;
ALTER TABLE family_invite_codes ADD COLUMN IF NOT EXISTS uses_count INTEGER DEFAULT 0;

-- ── 13. FAMILY BUDGETS ──────────────────────────────────────
ALTER TABLE family_budgets ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE family_budgets ADD COLUMN IF NOT EXISTS period VARCHAR(20) DEFAULT 'monthly';
ALTER TABLE family_budgets ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE family_budgets ADD COLUMN IF NOT EXISTS end_date DATE;

-- ── 14. FAMILY GOALS ────────────────────────────────────────
ALTER TABLE family_goals ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- ── 15. FAMILY GOAL CONTRIBUTIONS ───────────────────────────
ALTER TABLE family_goal_contributions ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';

-- ── NEW INDEXES ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_business_invite_code ON business_accounts(invite_code);
CREATE INDEX IF NOT EXISTS idx_business_members_status ON business_members(status);
CREATE INDEX IF NOT EXISTS idx_debts_paid_amount ON debts(user_id, paid_amount);
CREATE INDEX IF NOT EXISTS idx_saving_goals_priority ON saving_goals(priority);

-- ============================================================
-- DONE! ✅ Barcha jadvallar yangilandi
-- ============================================================
