const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// Use the exact connection string from Railway
const connectionString = 'mysql://root:PjnewpNEsVkXpbaDLdIwSeNRxQSnfSzZ@trolley.proxy.rlwy.net:21387/railway';
const connection = mysql.createConnection({
  uri: connectionString,
  multipleStatements: true // This is crucial to run multiple SQL statements at once
});

// Read your SQL script - save your SQL in a file named 'database.sql'
const sqlScript = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf8');

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  
  console.log('Connected to database. Running setup script...');
  
  // Execute the entire SQL script at once
  connection.query(sqlScript, (err, results) => {
    if (err) {
      console.error('Error executing SQL script:', err);
      console.error(err.message);
      return;
    }
    
    console.log('Database setup completed successfully!');
    console.log('Results:', results);
    
    // Close the connection
    connection.end((err) => {
      if (err) {
        console.error('Error closing connection:', err);
        return;
      }
      console.log('Database connection closed');
    });
  });
});
