-- ============================================================
-- BOYAKA — Supabase to'liq database initialization
-- Supabase Dashboard → SQL Editor ga ko'chirib ishlating
-- ============================================================

-- ── 1. USERS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password      VARCHAR(255) NOT NULL DEFAULT 'oauth_user',
  full_name     VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  DEFAULT 'user',
  currency      VARCHAR(3)   DEFAULT 'USD',
  oauth_provider VARCHAR(20) DEFAULT 'local',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── 2. CATEGORIES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  type       VARCHAR(20)  NOT NULL CHECK (type IN ('income', 'expense')),
  color      VARCHAR(7)   DEFAULT '#3B82F6',
  icon       VARCHAR(50)  DEFAULT 'folder',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── 3. TRANSACTIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category_id      INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  type             VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  amount           DECIMAL(20, 2) NOT NULL,
  currency         VARCHAR(3) DEFAULT 'USD',
  description      TEXT,
  transaction_date DATE NOT NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── 4. BUDGETS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  amount      DECIMAL(20, 2) NOT NULL,
  currency    VARCHAR(3) DEFAULT 'USD',
  month       INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year        INTEGER NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, category_id, month, year)
);

-- ── 5. RECURRING TRANSACTIONS ────────────────────────────────
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category_id     INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  type            VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  amount          DECIMAL(20, 2) NOT NULL,
  currency        VARCHAR(3) DEFAULT 'USD',
  description     TEXT,
  frequency       VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  start_date      DATE NOT NULL,
  end_date        DATE,
  next_occurrence DATE NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── 6. SAVING GOALS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saving_goals (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name           VARCHAR(255) NOT NULL,
  description    TEXT,
  target_amount  DECIMAL(20, 2) NOT NULL,
  current_amount DECIMAL(20, 2) DEFAULT 0,
  currency       VARCHAR(3) DEFAULT 'USD',
  target_date    DATE,
  is_completed   BOOLEAN DEFAULT false,
  color          VARCHAR(7) DEFAULT '#3B82F6',
  icon           VARCHAR(50) DEFAULT 'target',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saving_goals_contributions (
  id                SERIAL PRIMARY KEY,
  goal_id           INTEGER REFERENCES saving_goals(id) ON DELETE CASCADE,
  user_id           INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount            DECIMAL(20, 2) NOT NULL,
  currency          VARCHAR(3) DEFAULT 'USD',
  note              TEXT,
  contribution_date DATE NOT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── 7. DEBTS (P2P) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS debts (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  contact_name VARCHAR(255) NOT NULL,
  amount       DECIMAL(20, 2) NOT NULL,
  currency     VARCHAR(3) DEFAULT 'USD',
  type         VARCHAR(20) NOT NULL CHECK (type IN ('lent', 'borrowed')),
  description  TEXT,
  due_date     DATE,
  status       VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paid', 'partial')),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS debt_payments (
  id           SERIAL PRIMARY KEY,
  debt_id      INTEGER REFERENCES debts(id) ON DELETE CASCADE,
  amount       DECIMAL(20, 2) NOT NULL,
  currency     VARCHAR(3) DEFAULT 'USD',
  note         TEXT,
  payment_date DATE NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── 8. PASSWORD RESETS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_resets (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used       BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── 9. EXCHANGE RATES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exchange_rates (
  id          SERIAL PRIMARY KEY,
  from_currency VARCHAR(3) NOT NULL,
  to_currency   VARCHAR(3) NOT NULL,
  rate          DECIMAL(20, 8) NOT NULL,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(from_currency, to_currency)
);

-- ── 10. FINANCIAL STRATEGIES ─────────────────────────────────
CREATE TABLE IF NOT EXISTS financial_strategies (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  type        VARCHAR(50) DEFAULT 'custom',
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS strategy_items (
  id          SERIAL PRIMARY KEY,
  strategy_id INTEGER REFERENCES financial_strategies(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name        VARCHAR(255) NOT NULL,
  percentage  DECIMAL(5, 2),
  amount      DECIMAL(20, 2),
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── 11. BUSINESS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS business_accounts (
  id          SERIAL PRIMARY KEY,
  owner_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  currency    VARCHAR(3) DEFAULT 'USD',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_members (
  id                 SERIAL PRIMARY KEY,
  business_id        INTEGER REFERENCES business_accounts(id) ON DELETE CASCADE,
  user_id            INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role               VARCHAR(20) DEFAULT 'member',
  profit_share       DECIMAL(5, 2) DEFAULT 0,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(business_id, user_id)
);

CREATE TABLE IF NOT EXISTS business_projects (
  id          SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES business_accounts(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  status      VARCHAR(20) DEFAULT 'active',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_transactions (
  id               SERIAL PRIMARY KEY,
  business_id      INTEGER REFERENCES business_accounts(id) ON DELETE CASCADE,
  project_id       INTEGER REFERENCES business_projects(id) ON DELETE SET NULL,
  user_id          INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type             VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  amount           DECIMAL(20, 2) NOT NULL,
  currency         VARCHAR(3) DEFAULT 'USD',
  description      TEXT,
  transaction_date DATE NOT NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profit_distributions (
  id              SERIAL PRIMARY KEY,
  business_id     INTEGER REFERENCES business_accounts(id) ON DELETE CASCADE,
  total_amount    DECIMAL(20, 2) NOT NULL,
  currency        VARCHAR(3) DEFAULT 'USD',
  period_start    DATE,
  period_end      DATE,
  note            TEXT,
  distributed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profit_distribution_shares (
  id              SERIAL PRIMARY KEY,
  distribution_id INTEGER REFERENCES profit_distributions(id) ON DELETE CASCADE,
  user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount          DECIMAL(20, 2) NOT NULL,
  percentage      DECIMAL(5, 2)
);

-- ── 12. FAMILIES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS families (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  owner_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  currency    VARCHAR(3) DEFAULT 'USD',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS family_members (
  id          SERIAL PRIMARY KEY,
  family_id   INTEGER REFERENCES families(id) ON DELETE CASCADE,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role        VARCHAR(20) DEFAULT 'member',
  can_add_transactions BOOLEAN DEFAULT true,
  can_manage_budget    BOOLEAN DEFAULT false,
  joined_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(family_id, user_id)
);

CREATE TABLE IF NOT EXISTS family_invite_codes (
  id          SERIAL PRIMARY KEY,
  family_id   INTEGER REFERENCES families(id) ON DELETE CASCADE,
  code        VARCHAR(20) UNIQUE NOT NULL,
  created_by  INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role        VARCHAR(20) DEFAULT 'member',
  is_active   BOOLEAN DEFAULT true,
  expires_at  TIMESTAMP,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS family_budgets (
  id          SERIAL PRIMARY KEY,
  family_id   INTEGER REFERENCES families(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  amount      DECIMAL(20, 2) NOT NULL,
  currency    VARCHAR(3) DEFAULT 'USD',
  month       INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year        INTEGER NOT NULL,
  created_by  INTEGER REFERENCES users(id),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(family_id, category_id, month, year)
);

CREATE TABLE IF NOT EXISTS family_goals (
  id             SERIAL PRIMARY KEY,
  family_id      INTEGER REFERENCES families(id) ON DELETE CASCADE,
  name           VARCHAR(255) NOT NULL,
  description    TEXT,
  target_amount  DECIMAL(20, 2) NOT NULL,
  current_amount DECIMAL(20, 2) DEFAULT 0,
  currency       VARCHAR(3) DEFAULT 'USD',
  target_date    DATE,
  is_completed   BOOLEAN DEFAULT false,
  created_by     INTEGER REFERENCES users(id),
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS family_goal_contributions (
  id                SERIAL PRIMARY KEY,
  goal_id           INTEGER REFERENCES family_goals(id) ON DELETE CASCADE,
  user_id           INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount            DECIMAL(20, 2) NOT NULL,
  note              TEXT,
  contribution_date DATE NOT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS family_transactions (
  id             SERIAL PRIMARY KEY,
  family_id      INTEGER REFERENCES families(id) ON DELETE CASCADE,
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
  added_by       INTEGER REFERENCES users(id),
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expense_splits (
  id             SERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
  family_id      INTEGER REFERENCES families(id) ON DELETE CASCADE,
  total_amount   DECIMAL(20, 2) NOT NULL,
  currency       VARCHAR(3) DEFAULT 'USD',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expense_split_members (
  id        SERIAL PRIMARY KEY,
  split_id  INTEGER REFERENCES expense_splits(id) ON DELETE CASCADE,
  user_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount    DECIMAL(20, 2) NOT NULL,
  is_paid   BOOLEAN DEFAULT false
);

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transactions_user_id     ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date        ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_currency    ON transactions(currency);
CREATE INDEX IF NOT EXISTS idx_categories_user_id       ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id          ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_user_id        ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_next_occurrence ON recurring_transactions(next_occurrence) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_saving_goals_user_id     ON saving_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_saving_goals_completed   ON saving_goals(is_completed);
CREATE INDEX IF NOT EXISTS idx_contributions_goal_id    ON saving_goals_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_contributions_user_id    ON saving_goals_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user               ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_status             ON debts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_debt_payments            ON debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_token    ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires  ON password_resets(expires_at);
CREATE INDEX IF NOT EXISTS idx_strategy_user            ON financial_strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_strategy_items           ON strategy_items(strategy_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user      ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family    ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_budgets_family    ON family_budgets(family_id);
CREATE INDEX IF NOT EXISTS idx_family_goals_family      ON family_goals(family_id);
CREATE INDEX IF NOT EXISTS idx_family_invite_codes_code ON family_invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_family_transactions_family ON family_transactions(family_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency);

-- ── DONE ─────────────────────────────────────────────────────
-- Barcha jadvallar muvaffaqiyatli yaratildi!
