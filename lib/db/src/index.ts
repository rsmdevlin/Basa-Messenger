import { drizzle } from 'drizzle-orm/mysql2/driver';
import mysql from 'mysql2/promise';
import * as schema from './schema/index';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Parse DATABASE_URL
const dbUrl = new URL(process.env.DATABASE_URL);
const config = {
  host: dbUrl.hostname,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.slice(1),
  port: dbUrl.port ? parseInt(dbUrl.port) : 3306,
};

// Create MySQL connection pool
const pool = mysql.createPool(config);

// Create Drizzle instance
export const db = drizzle(pool, { schema, mode: 'default' });

// Verify connection
export async function verifyConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Export schema for direct access
export * from './schema/index';
