const mysql = require('mysql2/promise');

let pool = null;

// Only create pool if database configuration is provided
if (process.env.DB_HOST && process.env.DB_DATABASE) {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE,
    waitForConnections: process.env.DB_WAIT_FOR_CONNECTIONS !== 'false',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,
  });
  console.log('✅ MySQL pool created');
} else {
  console.log('ℹ️ MySQL not configured, database features disabled');
}

module.exports = pool;
