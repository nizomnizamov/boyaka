import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const isLocal = (process.env.DATABASE_URL || '').includes('localhost') || (process.env.DATABASE_URL || '').includes('127.0.0.1');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: isLocal ? 20 : 5,                    // Supabase free tier: max 5 connections
  idleTimeoutMillis: 30000,                  // 30s idle timeout
  connectionTimeoutMillis: 10000,            // 10s connection timeout
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err.message);
  // Don't crash on transient errors in production
  if (isLocal) {
    process.exit(-1);
  }
});

export default pool;
