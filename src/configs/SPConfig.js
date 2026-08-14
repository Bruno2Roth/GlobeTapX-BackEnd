import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;

const positiveInteger = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const DB_QUERY_TIMEOUT_MS = positiveInteger(process.env.DB_QUERY_TIMEOUT_MS, 5000);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: positiveInteger(process.env.DB_POOL_MAX, 10),
  min: 0,
  connectionTimeoutMillis: positiveInteger(process.env.DB_CONNECTION_TIMEOUT_MS, 5000),
  idleTimeoutMillis: positiveInteger(process.env.DB_IDLE_TIMEOUT_MS, 30000),
  query_timeout: DB_QUERY_TIMEOUT_MS,
  statement_timeout: DB_QUERY_TIMEOUT_MS,
  keepAlive: true,
});

console.log(`Configuración de PostgreSQL cargada (timeout=${DB_QUERY_TIMEOUT_MS}ms)`);

// Un error de un cliente ocioso no debe tumbar el proceso ni ser enviado al
// frontend. Las consultas de cada request siguen teniendo timeout propio.
pool.on('error', (error) => {
  console.error('[postgres-pool]', {
    code: error?.code || null,
    message: error?.message || 'error de conexión',
  });
});

export default pool;
