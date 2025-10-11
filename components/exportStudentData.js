const fs = require('fs');
const path = require('path');
const { getConnection } = require('../models/getConnection'); // adjust path as needed

const EXPORT_DIR = path.join(__dirname, 'exports', 'students');

async function exportStudentData() {
  const connection = await getConnection();

  try {
    // Fetch all students
    const [students] = await connection.execute(`
      SELECT s.school_id, s.name, p.image, p.student_sign 
      FROM students s 
      LEFT JOIN photo p ON s.school_id = p.id
    `);

    for (const student of students) {
      const studentDir = path.join(EXPORT_DIR, String(student.school_id));
      const filesDir = path.join(studentDir, 'files');
      fs.mkdirSync(filesDir, { recursive: true });

      // Save profile image
      if (student.image) {
        fs.writeFileSync(path.join(studentDir, 'profile.jpg'), student.image);
      }

      // Save signature
      if (student.student_sign) {
        fs.writeFileSync(
          path.join(studentDir, 'signature.jpg'),
          student.student_sign
        );
      }

      // Fetch PDF files
      const [pdfFiles] = await connection.execute(
        `SELECT file_data, file_name FROM student_files WHERE school_id = ?`,
        [student.school_id]
      );

      for (const file of pdfFiles) {
        const safeFileName =
          file.file_name?.replace(/[^a-zA-Z0-9_\-\.]/g, '_') ||
          `document_${Date.now()}.pdf`;
        const filePath = path.join(filesDir, safeFileName);
        fs.writeFileSync(filePath, file.file_data);
      }

      console.log(`✅ Exported files for student: ${student.school_id}`);
    }

    console.log('🎉 All files exported successfully.');
  } catch (err) {
    console.error('❌ Error exporting student data:', err);
  } finally {
    await connection.end();
  }
}

exportStudentData();
