import pool from '../config/database.js';

const migrateStrategy = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Moliyaviy strategiya jadvali
    await client.query(`
      CREATE TABLE IF NOT EXISTS financial_strategies (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL DEFAULT 'Mening strategiyam',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Strategiya elementlari (har bir kategoriya + foiz)
    await client.query(`
      CREATE TABLE IF NOT EXISTS strategy_items (
        id SERIAL PRIMARY KEY,
        strategy_id INTEGER REFERENCES financial_strategies(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        target_percentage DECIMAL(5, 2) NOT NULL CHECK (target_percentage > 0 AND target_percentage <= 100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_strategy_user ON financial_strategies(user_id);
      CREATE INDEX IF NOT EXISTS idx_strategy_items ON strategy_items(strategy_id);
    `);

    await client.query('COMMIT');
    console.log('✅ Strategy migration completed');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    process.exit(0);
  }
};

migrateStrategy();
