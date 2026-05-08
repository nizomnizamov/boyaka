import pool from '../config/database.js';

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS debts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(10) NOT NULL CHECK (type IN ('lent', 'borrowed')),
        person_name VARCHAR(100) NOT NULL,
        amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
        currency VARCHAR(10) NOT NULL DEFAULT 'UZS',
        paid_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        description TEXT,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        due_date DATE,
        status VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'settled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS debt_payments (
        id SERIAL PRIMARY KEY,
        debt_id INTEGER REFERENCES debts(id) ON DELETE CASCADE,
        amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
        currency VARCHAR(10) NOT NULL DEFAULT 'UZS',
        note TEXT,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_debts_user ON debts(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(user_id, status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_debt_payments ON debt_payments(debt_id);`);

    await client.query('COMMIT');
    console.log('✅ Debts migration completed');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    process.exit(0);
  }
};

migrate();
