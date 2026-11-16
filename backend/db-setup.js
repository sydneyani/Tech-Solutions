const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mysql = require('mysql2');
const fs = require('fs');

function connectionOptions() {
  const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

  if (databaseUrl) {
    return {
      uri: databaseUrl,
      multipleStatements: true,
    };
  }

  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  if (!DB_HOST || !DB_USER || !DB_NAME) {
    console.error(
      'Database configuration is missing. Copy backend/.env.example to backend/.env and set DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME.'
    );
    process.exit(1);
  }

  return {
    host: DB_HOST,
    port: DB_PORT ? Number(DB_PORT) : 3306,
    user: DB_USER,
    password: DB_PASSWORD || '',
    database: DB_NAME,
    multipleStatements: true,
  };
}

const connection = mysql.createConnection(connectionOptions());
const sqlScript = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf8');

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    return;
  }

  console.log('Connected to database. Running setup script...');

  connection.query(sqlScript, (queryErr, results) => {
    if (queryErr) {
      console.error('Error executing SQL script:', queryErr.message);
      return;
    }

    console.log('Database setup completed successfully!');
    console.log('Results:', results);

    connection.end((endErr) => {
      if (endErr) {
        console.error('Error closing connection:', endErr.message);
        return;
      }
      console.log('Database connection closed');
    });
  });
});
