import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://postgres:admin@localhost:5432/kerpbot';

    const isLocal =
      connectionString.includes('localhost') ||
      connectionString.includes('127.0.0.1');

    pool = new Pool({
      connectionString,
      max: process.env.VERCEL ? 5 : 10,
      idleTimeoutMillis: 30000,
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
    });

    pool.on('error', (err) => {
      console.error('[PostgreSQL Pool] Unexpected error on idle client:', err.message);
    });
  }
  return pool;
}
