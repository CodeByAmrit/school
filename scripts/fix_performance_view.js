const { getConnection } = require("../models/getConnection");

async function fixHistoricalPerformance() {
  let connection;
  try {
    connection = await getConnection();
    console.log("🛠️ Updating StudentPerformance view for historical accuracy...");

    // Refactored StudentPerformance view:
    // 1. Joins students and student_marks.
    // 2. Groups by the mark's session and class_name (not the student's current session/class).
    // 3. Subqueries for grand_total and total_max_marks are now scoped by sm.session and sm.class_name.
    
    await connection.query(`
      CREATE OR REPLACE VIEW StudentPerformance AS
      SELECT
        s.school_id,
        s.teacher_id,
        s.name AS student_name,
        sm.session AS session,
        sm.class_name AS class_name,
        sm.term,
        (
          SELECT SUM(CASE WHEN sm_inner.marks REGEXP '^[0-9]+$' THEN CAST(sm_inner.marks AS UNSIGNED) ELSE 0 END)
          FROM student_marks AS sm_inner
          WHERE sm_inner.student_id = s.school_id 
            AND sm_inner.term = sm.term
            AND sm_inner.session = sm.session
            AND sm_inner.class_name = sm.class_name
        ) AS grand_total,
        (
          SELECT SUM(CAST(mm_inner.max_marks AS UNSIGNED))
          FROM maximum_marks AS mm_inner
          JOIN student_marks AS sm_inner ON mm_inner.subject = sm_inner.subject 
            AND mm_inner.term = sm_inner.term
            AND mm_inner.class = sm_inner.class_name
            AND (mm_inner.teacher_id = s.teacher_id OR mm_inner.teacher_id IS NULL)
          WHERE sm_inner.student_id = s.school_id 
            AND sm_inner.term = sm.term
            AND sm_inner.session = sm.session
            AND sm_inner.class_name = sm.class_name
        ) AS total_max_marks,
        (
          (SELECT SUM(CASE WHEN sm_inner.marks REGEXP '^[0-9]+$' THEN CAST(sm_inner.marks AS UNSIGNED) ELSE 0 END)
           FROM student_marks AS sm_inner
           WHERE sm_inner.student_id = s.school_id 
             AND sm_inner.term = sm.term
             AND sm_inner.session = sm.session
             AND sm_inner.class_name = sm.class_name) * 100
          /
          NULLIF((SELECT SUM(CAST(mm_inner.max_marks AS UNSIGNED))
                  FROM maximum_marks AS mm_inner
                  JOIN student_marks AS sm_inner ON mm_inner.subject = sm_inner.subject 
                    AND mm_inner.term = sm_inner.term
                    AND mm_inner.class = sm_inner.class_name
                    AND (mm_inner.teacher_id = s.teacher_id OR mm_inner.teacher_id IS NULL)
                  WHERE sm_inner.student_id = s.school_id 
                    AND sm_inner.term = sm.term
                    AND sm_inner.session = sm.session
                    AND sm_inner.class_name = sm.class_name), 0)
        ) AS percentage
      FROM students s
      JOIN student_marks sm ON s.school_id = sm.student_id
      GROUP BY s.school_id, s.teacher_id, s.name, sm.session, sm.class_name, sm.term;
    `);

    console.log("✅ StudentPerformance view updated successfully! Historical results enabled.");
  } catch (error) {
    console.error("❌ Error updating view:", error);
  } finally {
    if (connection) connection.release();
    process.exit();
  }
}

fixHistoricalPerformance();
