const fs = require("fs");
const path = require("path");
const { getConnection } = require("../models/getConnection");

async function runMigration() {
  console.log("🚀 Starting database migration...");
  
  const migrationFile = path.join(__dirname, "../migrations/v3_multi_tenant.sql");
  if (!fs.existsSync(migrationFile)) {
    console.error("❌ Migration file not found:", migrationFile);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationFile, "utf8");
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  let connection;
  try {
    connection = await getConnection();
    console.log("✅ Connected to database.");

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await connection.execute(statement);
    }

    console.log("✨ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    if (connection) connection.release();
  }
}

runMigration();
