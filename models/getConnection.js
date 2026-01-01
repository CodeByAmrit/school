const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Decode SSL CA from Base64 (if used)
let sslConfig = undefined;
if (process.env.DB_CA) {
  const caContent = Buffer.from(process.env.DB_CA, "base64").toString("utf8");
  sslConfig = { ca: caContent };
}

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  ssl: sslConfig,
  waitForConnections: true,
  connectionLimit: 10, // adjust as needed
  queueLimit: 0,
});

// Helper function to get a pooled connection
async function getConnection() {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error("❌ Database connection error:", error);
    throw error;
  }
}

process.on("SIGINT", async () => {
  await pool.end();
  console.log("Database pool closed.");
  process.exit(0);
});

module.exports = {
  getConnection,
  pool,
};
