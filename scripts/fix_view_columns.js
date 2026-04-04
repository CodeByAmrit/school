/**
 * Migration 05: Fix StudentPerformance View Columns
 * 
 * This script restores 'session' and 'class_name' to the StudentPerformance view.
 * These were accidentally dropped in the previous tenant isolation migration.
 */

const { getConnection } = require("../models/getConnection");

async function fixView() {
  let connection;
  try {
    connection = await getConnection();
    console.log("✅ Connected to database");

    console.log("\n📌 Updating StudentPerformance view...");
    await connection.execute(`
      CREATE OR REPLACE VIEW StudentPerformance AS
      SELECT
        s.school_id,
        s.name AS student_name,
        s.session AS session,
        s.class AS class_name,
        sm.term,
        (
          SELECT SUM(
            CASE
              WHEN sm_inner.marks REGEXP '^[0-9]+$' THEN CAST(sm_inner.marks AS UNSIGNED)
              ELSE 0
            END
          )
          FROM student_marks AS sm_inner
          WHERE sm_inner.student_id = s.school_id AND sm_inner.term = sm.term
            AND EXISTS (
              SELECT 1 FROM maximum_marks mm_inner
              WHERE mm_inner.subject  = sm_inner.subject
                AND mm_inner.term     = sm_inner.term
                AND mm_inner.class    = s.class
                AND mm_inner.teacher_id = s.teacher_id
            )
            AND EXISTS (
              SELECT 1 FROM subject_config sc
              WHERE sc.subject_name = sm_inner.subject
                AND sc.class_name  = s.class
                AND sc.teacher_id  = s.teacher_id
            )
        ) AS grand_total,
        (
          SELECT SUM(
            CASE
              WHEN mm_inner.max_marks REGEXP '^[0-9]+$' THEN CAST(mm_inner.max_marks AS UNSIGNED)
              ELSE 0
            END
          )
          FROM student_marks AS sm_inner
          JOIN maximum_marks AS mm_inner
            ON sm_inner.subject = mm_inner.subject
            AND sm_inner.term   = mm_inner.term
            AND mm_inner.class  = s.class
            AND mm_inner.teacher_id = s.teacher_id
          WHERE sm_inner.student_id = s.school_id AND sm_inner.term = sm.term
            AND EXISTS (
              SELECT 1 FROM subject_config sc
              WHERE sc.subject_name = sm_inner.subject
                AND sc.class_name  = s.class
                AND sc.teacher_id  = s.teacher_id
            )
        ) AS total_max_marks,
        (
          (
            SELECT SUM(
              CASE
                WHEN sm_inner.marks REGEXP '^[0-9]+$' THEN CAST(sm_inner.marks AS UNSIGNED)
                ELSE 0
              END
            )
            FROM student_marks AS sm_inner
            WHERE sm_inner.student_id = s.school_id AND sm_inner.term = sm.term
              AND EXISTS (
                SELECT 1 FROM maximum_marks mm_inner
                WHERE mm_inner.subject  = sm_inner.subject
                  AND mm_inner.term     = sm_inner.term
                  AND mm_inner.class    = s.class
                  AND mm_inner.teacher_id = s.teacher_id
              )
              AND EXISTS (
                SELECT 1 FROM subject_config sc
                WHERE sc.subject_name = sm_inner.subject
                  AND sc.class_name  = s.class
                  AND sc.teacher_id  = s.teacher_id
              )
          ) * 100
          /
          NULLIF(
            (
              SELECT SUM(
                CASE
                  WHEN mm_inner.max_marks REGEXP '^[0-9]+$' THEN CAST(mm_inner.max_marks AS UNSIGNED)
                  ELSE 0
                END
              )
              FROM student_marks AS sm_inner
              JOIN maximum_marks AS mm_inner
                ON sm_inner.subject = mm_inner.subject
                AND sm_inner.term   = mm_inner.term
                AND mm_inner.class  = s.class
                AND mm_inner.teacher_id = s.teacher_id
              WHERE sm_inner.student_id = s.school_id AND sm_inner.term = sm.term
                AND EXISTS (
                  SELECT 1 FROM subject_config sc
                  WHERE sc.subject_name = sm_inner.subject
                    AND sc.class_name  = s.class
                    AND sc.teacher_id  = s.teacher_id
                )
            ),
            0
          )
        ) AS percentage
      FROM students s
      JOIN student_marks sm ON s.school_id = sm.student_id
      GROUP BY s.school_id, s.name, s.session, s.class, sm.term
    `);
    console.log("✅ StudentPerformance view updated");

    console.log("\n📌 Updating SubjectPerformance view...");
    await connection.execute(`
      CREATE OR REPLACE VIEW SubjectPerformance AS
      SELECT
          s.teacher_id,
          s.class,
          s.session,
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
          maximum_marks mm
            ON s.class        = mm.class
            AND sm.term       = mm.term
            AND sm.subject    = mm.subject
            AND mm.teacher_id = s.teacher_id
      JOIN
          subject_config sc
            ON sc.subject_name = sm.subject
            AND sc.class_name  = s.class
            AND sc.teacher_id  = s.teacher_id
      GROUP BY
          s.teacher_id, s.class, s.session, sm.term, sm.subject
    `);
    console.log("✅ SubjectPerformance view updated");

    console.log("\n🎉 Fix applied successfully!\n");
  } catch (error) {
    console.error("\n❌ Fix failed:", error);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

fixView();
