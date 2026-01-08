const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

/**
 * SSL configuration (Base64 CA supported)
 */
let sslConfig;
if (process.env.DB_CA) {
  sslConfig = {
    ca: Buffer.from(process.env.DB_CA, "base64").toString("utf8"),
  };
}

/**
 * MySQL connection pool (production safe)
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT || 3306),

  ssl: sslConfig,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

/**
 * ✅ USE THIS FOR 90% OF QUERIES
 */
async function query(sql, params = []) {
  return pool.execute(sql, params);
}

/**
 * ⚠️ ONLY FOR TRANSACTIONS
 * NO listeners, NO magic, NO side effects
 */
async function getConnection() {
  return pool.getConnection();
}

/**
 * Graceful shutdown (Docker / Traefik / PM2 safe)
 */
async function shutdown(signal) {
  console.log(`🛑 Closing MySQL pool (${signal})`);
  try {
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("Error closing pool:", err);
    process.exit(1);
  }
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

module.exports = {
  pool,
  query,
  getConnection,
};
