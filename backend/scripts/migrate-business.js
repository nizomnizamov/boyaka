import pool from '../config/database.js';

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Business accounts (the partnership entity)
    await client.query(`
      CREATE TABLE IF NOT EXISTS business_accounts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        currency VARCHAR(10) DEFAULT 'UZS',
        invite_code VARCHAR(20) UNIQUE,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Business members (partners with profit share)
    await client.query(`
      CREATE TABLE IF NOT EXISTS business_members (
        id SERIAL PRIMARY KEY,
        business_id INTEGER REFERENCES business_accounts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'partner' CHECK (role IN ('owner','partner')),
        profit_share NUMERIC(5,2) DEFAULT 50.00,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','active','left')),
        invited_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        invited_at TIMESTAMP DEFAULT NOW(),
        joined_at TIMESTAMP,
        UNIQUE(business_id, user_id)
      )
    `);

    // Business projects / clients
    await client.query(`
      CREATE TABLE IF NOT EXISTS business_projects (
        id SERIAL PRIMARY KEY,
        business_id INTEGER REFERENCES business_accounts(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        client_name VARCHAR(255),
        description TEXT,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','completed','paused')),
        budget NUMERIC(15,2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'UZS',
        start_date DATE,
        end_date DATE,
        color VARCHAR(7) DEFAULT '#3B82F6',
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Business transactions (income/expense for the shared account)
    await client.query(`
      CREATE TABLE IF NOT EXISTS business_transactions (
        id SERIAL PRIMARY KEY,
        business_id INTEGER REFERENCES business_accounts(id) ON DELETE CASCADE,
        project_id INTEGER REFERENCES business_projects(id) ON DELETE SET NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        type VARCHAR(10) NOT NULL CHECK (type IN ('income','expense')),
        amount NUMERIC(15,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'UZS',
        description TEXT,
        category VARCHAR(100),
        date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Profit distributions (month-end splits)
    await client.query(`
      CREATE TABLE IF NOT EXISTS profit_distributions (
        id SERIAL PRIMARY KEY,
        business_id INTEGER REFERENCES business_accounts(id) ON DELETE CASCADE,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        total_income NUMERIC(15,2) DEFAULT 0,
        total_expense NUMERIC(15,2) DEFAULT 0,
        net_profit NUMERIC(15,2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'UZS',
        note TEXT,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Per-member distribution amounts
    await client.query(`
      CREATE TABLE IF NOT EXISTS profit_distribution_shares (
        id SERIAL PRIMARY KEY,
        distribution_id INTEGER REFERENCES profit_distributions(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        profit_share NUMERIC(5,2),
        amount NUMERIC(15,2),
        currency VARCHAR(10) DEFAULT 'UZS',
        paid BOOLEAN DEFAULT FALSE
      )
    `);

    await client.query('COMMIT');
    console.log('✅ Business tables created successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
};

migrate();
