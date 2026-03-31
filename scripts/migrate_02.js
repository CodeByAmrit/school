const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        port: process.env.DB_PORT || 3306,
        ssl: process.env.DB_CA ? { ca: Buffer.from(process.env.DB_CA, 'base64').toString() } : null
    };

    let connection;
    try {
        console.log('🚀 Starting Phase 2 Migration (Updating Views)...');
        connection = await mysql.createConnection(config);

        // 1. Update StudentPerformance View
        console.log('📊 Redefining StudentPerformance View...');
        await connection.query(`
            CREATE OR REPLACE VIEW StudentPerformance AS
            SELECT 
              s.school_id, 
              s.name, 
              sm.term,
              sm.session,
              sm.class_name,
              SUM(
                CASE 
                  WHEN sm.marks REGEXP '^[0-9]+$' THEN CAST(sm.marks AS UNSIGNED) 
                  ELSE 0 
                END
              ) AS grand_total,
              (
                SELECT SUM(CAST(mm_inner.max_marks AS UNSIGNED))
                FROM maximum_marks mm_inner
                WHERE mm_inner.class = sm.class_name AND mm_inner.term = sm.term
                AND mm_inner.subject IN (SELECT subject FROM student_marks sm2 WHERE sm2.student_id = s.school_id AND sm2.term = sm.term AND sm2.session = sm.session AND sm2.class_name = sm.class_name)
              ) as total_max_marks,
              (
                SUM(CASE WHEN sm.marks REGEXP '^[0-9]+$' THEN CAST(sm.marks AS UNSIGNED) ELSE 0 END) * 100 /
                NULLIF((
                  SELECT SUM(CAST(mm_inner.max_marks AS UNSIGNED))
                  FROM maximum_marks mm_inner
                  WHERE mm_inner.class = sm.class_name AND mm_inner.term = sm.term
                  AND mm_inner.subject IN (SELECT subject FROM student_marks sm2 WHERE sm2.student_id = s.school_id AND sm2.term = sm.term AND sm2.session = sm.session AND sm2.class_name = sm.class_name)
                ), 0)
              ) AS percentage
            FROM students s
            JOIN student_marks sm ON s.school_id = sm.student_id
            GROUP BY s.school_id, s.name, sm.term, sm.session, sm.class_name;
        `);

        // 2. Update SubjectPerformance View
        console.log('📊 Redefining SubjectPerformance View...');
        await connection.query(`
            CREATE OR REPLACE VIEW SubjectPerformance AS
            SELECT 
                s.teacher_id, 
                sm.class_name as class, 
                sm.term, 
                sm.subject,
                sm.session,
                AVG(
                    CASE WHEN sm.marks REGEXP '^[0-9]+$' THEN CAST(sm.marks AS DECIMAL(5, 2)) ELSE 0 END / 
                    NULLIF(CAST(mm.max_marks AS DECIMAL(5, 2)), 0)
                ) * 100 AS average_percentage
            FROM students s
            JOIN student_marks sm ON s.school_id = sm.student_id
            JOIN maximum_marks mm ON sm.class_name = mm.class AND sm.term = mm.term AND sm.subject = mm.subject
            GROUP BY s.teacher_id, sm.class_name, sm.term, sm.subject, sm.session;
        `);

        console.log('✅ Migration Phase 2 completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
