// Import the sqlite3 module
const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database (or create a new one)
let db = new sqlite3.Database('./grocery_products.db', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Example: Create a table
db.run(`CREATE TABLE IF NOT EXISTS products (
  id varchar(30) PRIMARY KEY,
  price float
)`);

// Example: Insert data into the table
// Close the database connection
db.close((err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Closed the database connection.');
  }
});
