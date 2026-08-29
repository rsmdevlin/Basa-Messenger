import mysql from 'mysql2/promise';

async function inspectDatabase() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('❌ DATABASE_URL не установлена в .env');
    console.error('Добавь: DATABASE_URL=mysql://user:pass@host:3306/db');
    process.exit(1);
  }

  let connection;
  try {
    // Парсим URL
    const url = new URL(dbUrl);
    const config = {
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      port: url.port ? parseInt(url.port) : 3306,
    };

    console.log(`\n🔗 Подключаемся к MySQL...`);
    console.log(`   Host: ${config.host}`);
    console.log(`   Database: ${config.database}\n`);

    connection = await mysql.createConnection(config);
    console.log('✅ Подключено успешно!\n');

    // Получаем все таблицы
    const [tables]: any = await connection.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME`
    );

    if (tables.length === 0) {
      console.log('⚠️  В БД нет таблиц');
      await connection.end();
      return;
    }

    console.log(`📊 Найдено таблиц: ${tables.length}\n`);
    console.log('='.repeat(80));

    for (const table of tables) {
      const tableName = table.TABLE_NAME;

      // Получаем колонки
      const [columns]: any = await connection.execute(
        `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA, COLUMN_DEFAULT
         FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
         ORDER BY ORDINAL_POSITION`,
        [tableName]
      );

      // Получаем индексы
      const [indexes]: any = await connection.execute(
        `SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY INDEX_NAME, SEQ_IN_INDEX`,
        [tableName]
      );

      // Получаем foreign keys
      const [foreignKeys]: any = await connection.execute(
        `SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
         FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL`,
        [tableName]
      );

      console.log(`\n📌 Таблица: ${tableName}`);
      console.log('-'.repeat(80));

      // Выводим колонки
      console.log('КОЛОНКИ:');
      columns.forEach((col: any, idx: number) => {
        const nullable = col.IS_NULLABLE === 'YES' ? '' : ' NOT NULL';
        const key = col.COLUMN_KEY === 'PRI' ? ' [PRIMARY KEY]' : col.COLUMN_KEY === 'UNI' ? ' [UNIQUE]' : '';
        const autoIncrement = col.EXTRA.includes('auto_increment') ? ' AUTO_INCREMENT' : '';
        const defaultVal = col.COLUMN_DEFAULT ? ` DEFAULT ${col.COLUMN_DEFAULT}` : '';

        console.log(
          `  ${idx + 1}. ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}${nullable}${key}${autoIncrement}${defaultVal}`
        );
      });

      // Выводим индексы
      if (indexes.length > 1) {
        console.log('\nИНДЕКСЫ:');
        const indexMap = new Map();
        indexes.forEach((idx: any) => {
          if (idx.INDEX_NAME !== 'PRIMARY') {
            if (!indexMap.has(idx.INDEX_NAME)) {
              indexMap.set(idx.INDEX_NAME, []);
            }
            indexMap.get(idx.INDEX_NAME).push(idx.COLUMN_NAME);
          }
        });
        indexMap.forEach((cols, name) => {
          console.log(`  ${name}: (${cols.join(', ')})`);
        });
      }

      // Выводим foreign keys
      if (foreignKeys.length > 0) {
        console.log('\nFOREIGN KEYS:');
        foreignKeys.forEach((fk: any) => {
          console.log(
            `  ${fk.CONSTRAINT_NAME}: ${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`
          );
        });
      }

      // Получаем количество строк
      const [rowCount]: any = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`\n  📊 Строк в таблице: ${rowCount[0].count}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Анализ завершён\n');

  } catch (error: any) {
    console.error('\n❌ ОШИБКА:');
    console.error(error.message);

    if (error.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('\n💡 Подсказка: Проверь DATABASE_URL, host и порт');
    } else if (error.code === 'ER_ACCESS_DENIED_FOR_USER') {
      console.error('\n💡 Подсказка: Неверный username/password');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 Подсказка: БД не существует или неверное имя');
    }

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

inspectDatabase();
