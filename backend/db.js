const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mysql = require('mysql2');

function createConnection() {
  const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

  if (databaseUrl) {
    return mysql.createConnection(databaseUrl);
  }

  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  if (!DB_HOST || !DB_USER || !DB_NAME) {
    console.error(
      'Database configuration is missing. Copy backend/.env.example to backend/.env and set DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME.'
    );
    process.exit(1);
  }

  return mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT ? Number(DB_PORT) : 3306,
    user: DB_USER,
    password: DB_PASSWORD || '',
    database: DB_NAME,
  });
}

const db = createConnection();

db.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err.message);
  } else {
    console.log('Connected to MySQL Database');
  }
});

module.exports = db;
