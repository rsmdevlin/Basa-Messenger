import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL не установлена');
  process.exit(1);
}

async function inspectDatabase() {
  let connection;
  try {
    // Подключаемся к MySQL
    const url = new URL(DATABASE_URL);

    connection = await mysql.createConnection({
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      port: url.port ? parseInt(url.port) : 3306,
    });

    console.log('✅ Подключено к MySQL БД');

    // Получаем все таблицы
    const [tables]: any = await connection.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
      [url.pathname.slice(1)]
    );

    console.log(`\n📋 Найдено таблиц: ${tables.length}\n`);

    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      const [columns]: any = await connection.execute(
        `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [url.pathname.slice(1), tableName]
      );

      console.log(`📌 Таблица: ${tableName}`);
      console.log(`   Колонки: ${columns.length}`);
      columns.forEach((col: any) => {
        const key = col.COLUMN_KEY ? ` [${col.COLUMN_KEY}]` : '';
        const nullable = col.IS_NULLABLE === 'YES' ? ' (nullable)' : '';
        console.log(`   - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}${key}${nullable}`);
      });
      console.log('');
    }

  } catch (error: any) {
    console.error('❌ Ошибка подключения:', error.message);
    console.error('Проверь DATABASE_URL в Render environment variables');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

inspectDatabase();
