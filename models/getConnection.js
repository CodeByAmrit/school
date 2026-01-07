const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

/**
 * SSL configuration (supports Base64 CA)
 */
let sslConfig;
if (process.env.DB_CA) {
  sslConfig = {
    ca: Buffer.from(process.env.DB_CA, "base64").toString("utf8"),
  };
}

/**
 * MySQL connection pool
 * - Auto reconnect
 * - Safe for production
 * - Handles idle disconnects
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

  // 🔥 Critical for production stability
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

/**
 * Execute query directly on pool (RECOMMENDED)
 */
async function query(sql, params = []) {
  return pool.execute(sql, params);
}

/**
 * Get pooled connection (ONLY if transaction is needed)
 */
async function getConnection() {
  const conn = await pool.getConnection();

  // Safety: auto-release on unexpected disconnect
  conn.on("error", () => {
    try {
      conn.release();
    } catch (_) {}
  });

  return conn;
}

/**
 * Graceful shutdown (Docker / PM2 safe)
 */
async function shutdown() {
  try {
    console.log("🛑 Closing MySQL pool...");
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
  getConnection,
};
