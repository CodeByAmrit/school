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
        console.log('🚀 Starting Phase 1 Migration (Fixed)...');
        connection = await mysql.createConnection(config);

        // 1. Update student_marks
        console.log('📝 Updating student_marks table structure...');
        try {
            await connection.query(`ALTER TABLE student_marks ADD COLUMN session VARCHAR(20), ADD COLUMN class_name VARCHAR(40)`);
        } catch (e) { console.log('Column session/class_name might already exist'); }
        
        console.log('🔄 Backfilling student_marks data...');
        await connection.query(`
            UPDATE student_marks sm
            JOIN students s ON sm.student_id = s.school_id
            SET sm.session = s.session, sm.class_name = s.class
            WHERE sm.session IS NULL OR sm.class_name IS NULL
        `);
        
        console.log('🔑 Updating student_marks Unique Key...');
        try {
            await connection.query(`ALTER TABLE student_marks DROP INDEX student_id`);
        } catch (e) { console.log('Index student_id might already be gone'); }
        
        await connection.query(`ALTER TABLE student_marks ADD UNIQUE KEY unique_student_mark (student_id, session, class_name, term, subject)`);

        // 2. Update student_attendance_status
        console.log('📝 Updating student_attendance_status table structure...');
        try {
            await connection.query(`ALTER TABLE student_attendance_status ADD COLUMN session VARCHAR(20), ADD COLUMN class_name VARCHAR(40), ADD COLUMN term INT DEFAULT 1`);
        } catch (e) { console.log('Column session/class_name might already exist'); }
        
        // Fix Primary Key for attendance (Allow multiple records per student)
        try {
            // Check if student_id is PK
            const [cols] = await connection.query(`SHOW KEYS FROM student_attendance_status WHERE Key_name = 'PRIMARY'`);
            if (cols.length > 0 && cols[0].Column_name === 'student_id') {
                console.log('🔄 Changing student_attendance_status PK from student_id to auto-id...');
                await connection.query(`ALTER TABLE student_attendance_status DROP PRIMARY KEY`);
                await connection.query(`ALTER TABLE student_attendance_status ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST`);
            }
        } catch (e) { console.error('Error fixing attendance PK:', e.message); }

        console.log('🔄 Backfilling student_attendance_status data...');
        await connection.query(`
            UPDATE student_attendance_status sas
            JOIN students s ON sas.student_id = s.school_id
            SET sas.session = s.session, sas.class_name = s.class
            WHERE sas.session IS NULL OR sas.class_name IS NULL
        `);
        
        try {
            await connection.query(`ALTER TABLE student_attendance_status ADD UNIQUE KEY unique_attendance (student_id, session, class_name, term)`);
        } catch (e) { console.log('Unique key unique_attendance might already exist'); }

        // 3. Update student_grade_remarks
        console.log('📝 Updating student_grade_remarks table structure...');
        try {
            await connection.query(`ALTER TABLE student_grade_remarks ADD COLUMN session VARCHAR(20), ADD COLUMN class_name VARCHAR(40)`);
        } catch (e) { console.log('Column session/class_name might already exist'); }
        
        console.log('🔄 Backfilling student_grade_remarks data...');
        await connection.query(`
            UPDATE student_grade_remarks sgr
            JOIN students s ON sgr.student_id = s.school_id
            SET sgr.session = s.session, sgr.class_name = s.class
            WHERE sgr.session IS NULL OR sgr.class_name IS NULL
        `);

        console.log('🔑 Updating student_grade_remarks Unique Key...');
        try {
            await connection.query(`ALTER TABLE student_grade_remarks DROP INDEX student_id`);
        } catch (e) { console.log('Index student_id might already be gone'); }
        
        try {
            await connection.query(`ALTER TABLE student_grade_remarks ADD UNIQUE KEY unique_grade (student_id, session, class_name, term)`);
        } catch (e) { console.log('Unique key unique_grade might already exist'); }

        console.log('✅ Migration Phase 1 completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
