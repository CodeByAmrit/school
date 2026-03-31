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
        console.log('🚀 Starting Phase 3 Migration (Configuration Sync - Fixed)...');
        connection = await mysql.createConnection(config);

        // 0. Ensure unique key on class_config so we don't get duplicates
        try {
            console.log('🔑 Adding Unique Key to class_config...');
            await connection.query(`ALTER TABLE class_config ADD UNIQUE KEY unique_class (teacher_id, class_name)`);
        } catch (e) { console.log('Unique key unique_class might already exist'); }

        // 1. Populate class_config from existing students
        console.log('📝 Syncing Classes to class_config...');
        await connection.query(`
            INSERT INTO class_config (teacher_id, class_name, sections)
            SELECT DISTINCT teacher_id, class, 'A,B,C,D' as sections
            FROM students
            WHERE class IS NOT NULL
            ON DUPLICATE KEY UPDATE sections = VALUES(sections)
        `);

        // 2. Populate subject_config from existing student_marks
        console.log('📝 Syncing Subjects to subject_config...');
        await connection.query(`
            INSERT INTO subject_config (teacher_id, class_name, subject_name, max_marks, priority)
            SELECT DISTINCT s.teacher_id, sm.class_name, sm.subject, 100 as max_marks, 1 as priority
            FROM student_marks sm
            JOIN students s ON sm.student_id = s.school_id
            WHERE sm.subject IS NOT NULL AND sm.class_name IS NOT NULL
            ON DUPLICATE KEY UPDATE max_marks = VALUES(max_marks)
        `);

        // 3. Update max_marks in subject_config from maximum_marks table (Numeric Only)
        console.log('📝 Refining Max Marks in subject_config (Numeric Only)...');
        await connection.query(`
            UPDATE subject_config sc
            JOIN maximum_marks mm ON sc.class_name = mm.class AND sc.subject_name = mm.subject
            SET sc.max_marks = CAST(mm.max_marks AS UNSIGNED)
            WHERE mm.max_marks REGEXP '^[0-9]+$'
        `);

        console.log('✅ Migration Phase 3 completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
