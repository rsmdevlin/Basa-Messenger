import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || '80.242.59.112',
  user: process.env.DB_USER || 'gs348298',
  password: process.env.DB_PASSWORD || 'eKDxA99Mc2sf',
  database: process.env.DB_NAME || 'gs348298',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function query<T = any>(sql: string, values?: any[]): Promise<T[]> {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(sql, values || []);
    return rows as T[];
  } finally {
    connection.release();
  }
}

export async function queryOne<T = any>(sql: string, values?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, values);
  return rows[0] || null;
}

export async function execute(sql: string, values?: any[]): Promise<any> {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute(sql, values || []);
    return result;
  } finally {
    connection.release();
  }
}

export function getPool() {
  return pool;
}
