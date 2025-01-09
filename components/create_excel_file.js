const { getConnection } = require("../models/getConnection");
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Route to generate and download Excel file
async function create_student_excel(req, res) {
    let connection;

    try {
        connection = await getConnection();
        const sql = 'SELECT student_id, teacher_id, full_name, father_name, mother_name, email, phone_no, house_no, state, district, zip, gender, srn_no, pen_no, admission_no, class, section FROM students WHERE teacher_id = ?';
        const [rows] = await connection.execute(sql, [req.user._id]);

        if (rows.length === 0) {
            return res.status(404).send('No students found for the given teacher ID');
        }

        // Create a new workbook and add a worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Students');

        // Define columns for the worksheet
        worksheet.columns = [
            { header: 'Student ID', key: 'student_id', width: 15 },
            { header: 'Teacher ID', key: 'teacher_id', width: 15 },
            { header: 'Full Name', key: 'full_name', width: 30 },
            { header: 'Father Name', key: 'father_name', width: 30 },
            { header: 'Mother Name', key: 'mother_name', width: 30 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Phone No', key: 'phone_no', width: 15 },
            { header: 'House No', key: 'house_no', width: 15 },
            { header: 'State', key: 'state', width: 20 },
            { header: 'District', key: 'district', width: 20 },
            { header: 'Zip', key: 'zip', width: 10 },
            { header: 'Gender', key: 'gender', width: 10 },
            { header: 'SRN No', key: 'srn_no', width: 20 },
            { header: 'PEN No', key: 'pen_no', width: 20 },
            { header: 'Admission No', key: 'admission_no', width: 20 },
            { header: 'Class', key: 'class', width: 10 },
            { header: 'Section', key: 'section', width: 10 }
        ];

        // Add rows to the worksheet
        rows.forEach(row => {
            worksheet.addRow(row);
        });

        // Write to a file in the server's filesystem
        const filePath = path.join(__dirname, 'students.xlsx');
        await workbook.xlsx.writeFile(filePath);

        // Send the file to the client
        res.download(filePath, 'students.xlsx', (err) => {
            if (err) {
                console.error('Error sending file: ', err);
                return res.status(500).send('Error sending file');
            }

            // Delete the file from the server after sending
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Error deleting file: ', err);
                }
            });
        });
    } catch (error) {
        console.error('Error creating Excel file: ', error);
        res.status(500).send('Error creating Excel file');
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

module.exports = { create_student_excel };
