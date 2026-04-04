/**
 * Migration 04: Multi-Tenant Isolation for maximum_marks
 *
 * Changes:
 * 1. Add teacher_id to maximum_marks
 * 2. Populate teacher_id from existing student/marks data
 * 3. Update UNIQUE key to include teacher_id
 * 4. Update StudentPerformance view to filter by subject_config
 * 5. Update SubjectPerformance view similarly
 */

const { getConnection } = require("../models/getConnection");

async function runMigration() {
  let connection;
  try {
    connection = await getConnection();
    console.log("✅ Connected to database");

    // --- Step 1: Add teacher_id column (nullable first) ---
    console.log("\n📌 Step 1: Adding teacher_id to maximum_marks...");
    try {
      await connection.execute(
        `ALTER TABLE maximum_marks ADD COLUMN teacher_id INT NULL`
      );
      console.log("   ✅ Column added");
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME") {
        console.log("   ⚠️  Column already exists, skipping.");
      } else throw e;
    }

    // --- Step 2: Populate teacher_id from existing marks/students ---
    console.log("\n📌 Step 2: Populating teacher_id from existing data...");
    const [updateResult] = await connection.execute(`
      UPDATE maximum_marks mm
      SET mm.teacher_id = (
        SELECT s.teacher_id
        FROM students s
        JOIN student_marks sm ON sm.student_id = s.school_id
        WHERE sm.subject = mm.subject
          AND sm.term   = mm.term
          AND s.class   = mm.class
          AND s.teacher_id IS NOT NULL
        GROUP BY s.teacher_id
        ORDER BY COUNT(*) DESC
        LIMIT 1
      )
      WHERE mm.teacher_id IS NULL
    `);
    console.log(`   ✅ Updated ${updateResult.affectedRows} rows`);

    // --- Step 3: Check for any remaining NULL teacher_ids ---
    const [[nullCheck]] = await connection.execute(
      `SELECT COUNT(*) AS cnt FROM maximum_marks WHERE teacher_id IS NULL`
    );
    if (nullCheck.cnt > 0) {
      console.log(
        `   ⚠️  ${nullCheck.cnt} rows still have NULL teacher_id — these subjects had no associated marks. They will remain nullable.`
      );
    } else {
      console.log("   ✅ All rows have teacher_id populated");
    }

    // --- Step 4: Drop old UNIQUE key and add new one with teacher_id ---
    console.log("\n📌 Step 3: Updating UNIQUE constraint...");
    try {
      await connection.execute(
        `ALTER TABLE maximum_marks DROP INDEX class`
      );
      console.log("   ✅ Old index dropped");
    } catch (e) {
      console.log(`   ⚠️  Could not drop old index: ${e.message}`);
    }
    try {
      await connection.execute(
        `ALTER TABLE maximum_marks ADD UNIQUE KEY idx_mm_tenant (teacher_id, class, term, subject)`
      );
      console.log("   ✅ New tenant-aware index created");
    } catch (e) {
      if (e.code === "ER_DUP_KEYNAME") {
        console.log("   ⚠️  Index already exists, skipping.");
      } else throw e;
    }

    // --- Step 5: Add FK ---
    console.log("\n📌 Step 4: Adding foreign key constraint...");
    try {
      await connection.execute(
        `ALTER TABLE maximum_marks ADD CONSTRAINT fk_mm_teacher FOREIGN KEY (teacher_id) REFERENCES teacher(id)`
      );
      console.log("   ✅ Foreign key added");
    } catch (e) {
      console.log(`   ⚠️  FK skipped: ${e.message}`);
    }

    // --- Step 6: Update StudentPerformance view ---
    console.log("\n📌 Step 5: Updating StudentPerformance view...");
    await connection.execute(`
      CREATE OR REPLACE VIEW StudentPerformance AS
      SELECT
        s.school_id,
        s.name AS student_name,
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
      GROUP BY s.school_id, s.name, sm.term
    `);
    console.log("   ✅ StudentPerformance view updated");

    // --- Step 7: Update SubjectPerformance view ---
    console.log("\n📌 Step 6: Updating SubjectPerformance view...");
    await connection.execute(`
      CREATE OR REPLACE VIEW SubjectPerformance AS
      SELECT
          s.teacher_id,
          s.class,
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
          s.teacher_id, s.class, sm.term, sm.subject
    `);
    console.log("   ✅ SubjectPerformance view updated");

    // --- Step 8: Update students_per_class view ---
    console.log("\n📌 Step 7: Updating students_per_class view...");
    await connection.execute(`
      CREATE OR REPLACE VIEW students_per_class AS
      SELECT 
          teacher_id,
          class,
          session,
          COUNT(CASE WHEN gender = 'MALE' THEN 1 END) AS male_count,
          COUNT(CASE WHEN gender = 'FEMALE' THEN 1 END) AS female_count
      FROM students
      GROUP BY teacher_id, class, session
    `);
    console.log("   ✅ students_per_class view updated");

    console.log("\n🎉 Migration completed successfully!\n");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

runMigration();
