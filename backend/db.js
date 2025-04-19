const mysql = require('mysql2');

// Use the exact connection string from Railway
const connectionString = 'mysql://root:PjnewpNEsVkXpbaDLdIwSeNRxQSnfSzZ@trolley.proxy.rlwy.net:21387/railway';

// Create connection
const db = mysql.createConnection(connectionString);

db.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err);
  } else {
    console.log('Connected to MySQL Database');
  }
});

module.exports = db;
