const { query } = require("./models/getConnection");

async function test() {
  try {
    const [version] = await query("SELECT VERSION() as v");
    console.log("MySQL Version:", version[0].v);
    
    // Add indexes if they don't exist
    // MySQL 8.0.0+ supports check inside PROCEDURE if we want 'IF NOT EXISTS' behavior
    // For now, let's just try to create them and ignore errors if they exist
    
    const indexesToAdd = [
      "CREATE INDEX idx_students_class ON students(class)",
      "CREATE INDEX idx_students_session ON students(session)",
      "CREATE INDEX idx_students_profile_status ON students(profile_status)",
      "CREATE INDEX idx_students_name ON students(name)",
      "CREATE INDEX idx_students_teacher_id ON students(teacher_id)"
    ];

    for (const sql of indexesToAdd) {
      try {
        await query(sql);
        console.log("Applied:", sql);
      } catch (err) {
        if (err.code === 'ER_DUP_KEYNAME') {
          console.log("Already exists:", sql.split(" ").pop());
        } else {
          console.error("Error applying", sql, ":", err.message);
        }
      }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
