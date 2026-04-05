const { getConnection } = require("../models/getConnection");

async function applyUniversalConfigFilter() {
  let connection;
  try {
    connection = await getConnection();
    console.log("🛠️ Applying Universal Config-Based Filtering to Performance Views...");

    // 1. Refactor StudentPerformance
    // Includes an EXISTS check against subject_config to only count marks for configured subjects.
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
            AND EXISTS (
              SELECT 1 FROM subject_config sc 
              WHERE sc.subject_name = sm_inner.subject 
                AND sc.class_name = sm_inner.class_name 
                AND sc.teacher_id = s.teacher_id
            )
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
            AND EXISTS (
              SELECT 1 FROM subject_config sc 
              WHERE sc.subject_name = sm_inner.subject 
                AND sc.class_name = sm_inner.class_name 
                AND sc.teacher_id = s.teacher_id
            )
        ) AS total_max_marks,
        (
          (SELECT SUM(CASE WHEN sm_inner.marks REGEXP '^[0-9]+$' THEN CAST(sm_inner.marks AS UNSIGNED) ELSE 0 END)
           FROM student_marks AS sm_inner
           WHERE sm_inner.student_id = s.school_id 
             AND sm_inner.term = sm.term
             AND sm_inner.session = sm.session
             AND sm_inner.class_name = sm.class_name
             AND EXISTS (
               SELECT 1 FROM subject_config sc 
               WHERE sc.subject_name = sm_inner.subject 
                 AND sc.class_name = sm_inner.class_name 
                 AND sc.teacher_id = s.teacher_id
             )
          ) * 100
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
                    AND sm_inner.class_name = sm.class_name
                    AND EXISTS (
                      SELECT 1 FROM subject_config sc 
                      WHERE sc.subject_name = sm_inner.subject 
                        AND sc.class_name = sm_inner.class_name 
                        AND sc.teacher_id = s.teacher_id
                    )
                 ), 0)
        ) AS percentage
      FROM students s
      JOIN student_marks sm ON s.school_id = sm.student_id
      GROUP BY s.school_id, s.teacher_id, s.name, sm.session, sm.class_name, sm.term;
    `);

    // 2. Refactor SubjectPerformance (Dashboard Analytics)
    // Only aggregates percentages for subjects currently in config.
    await connection.query(`
      CREATE OR REPLACE VIEW SubjectPerformance AS
      SELECT
          s.teacher_id,
          sm.class_name,
          sm.session,
          sm.term,
          sm.subject,
          AVG(
              (
                  CASE
                      WHEN sm.marks REGEXP '^[0-9]+$' THEN CAST(sm.marks AS DECIMAL(5, 2))
                      ELSE 0
                  END
                  /
                  NULLIF(
                      CASE
                          WHEN mm.max_marks REGEXP '^[0-9]+$' THEN CAST(mm.max_marks AS DECIMAL(5, 2))
                          ELSE 0
                      END,
                      0
                  )
              ) * 100
          ) AS average_percentage
      FROM
          students s
      JOIN
          student_marks sm ON s.school_id = sm.student_id
      JOIN
          maximum_marks mm ON sm.subject = mm.subject 
                        AND sm.term = mm.term 
                        AND sm.class_name = mm.class 
                        AND (mm.teacher_id = s.teacher_id OR mm.teacher_id IS NULL)
      WHERE EXISTS (
        SELECT 1 FROM subject_config sc 
        WHERE sc.subject_name = sm.subject 
          AND sc.class_name = sm.class_name 
          AND sc.teacher_id = s.teacher_id
      )
      GROUP BY
          s.teacher_id, sm.class_name, sm.session, sm.term, sm.subject;
    `);

    console.log("✅ Universal Config Filter applied successfully to both performance views!");
  } catch (error) {
    console.error("❌ Error applying view filters:", error);
  } finally {
    if (connection) connection.release();
    process.exit();
  }
}

applyUniversalConfigFilter();
