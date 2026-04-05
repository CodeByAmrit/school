const { getConnection } = require("../models/getConnection");

async function cleanupOrphanMarks() {
  let connection;
  try {
    connection = await getConnection();
    console.log("🧹 Cleanup started for Class '1ST' orphan marks...");

    // Target subjects confirmed by the user
    const targetSubjects = [
      "ENGLISH (WR.)",
      "ENGLISH ORAL",
      "HINDI (WR.)",
      "HINDI ORAL",
      "MATHS (WR.)",
      "MATHS ORAL",
      "SCIENCE"
    ];

    // Dry Run check for total rows affected
    const [before] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM student_marks 
      WHERE class_name = '1ST' AND subject IN (?)
    `, [targetSubjects]);

    console.log(`🔍 Found ${before[0].count} matching marks records for Class '1ST'.`);

    if (before[0].count > 0) {
      // Execute deletion
      const [result] = await connection.query(`
        DELETE FROM student_marks 
        WHERE class_name = '1ST' AND subject IN (?)
      `, [targetSubjects]);
      
      console.log(`✅ Successfully deleted ${result.affectedRows} orphan records from student_marks.`);
    } else {
      console.log("ℹ️ No matching records found for deletion.");
    }

  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  } finally {
    if (connection) connection.release();
    process.exit();
  }
}

cleanupOrphanMarks();
