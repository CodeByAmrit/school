const { getConnection } = require("../models/getConnection");
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Function to generate Excel file with student data
async function create_student_excel(req, res) {
    let connection = getConnection();
    const currentYear = req.params.session || '2024-2025';

    try {
        // Get a database connection
        connection = await getConnection();

        // Fetch all student data grouped by class
        const [rows] = await connection.execute('SELECT * FROM students WHERE session = ? ORDER BY class', [currentYear]);

        if (rows.length === 0) {
            return res.status(404).send('No student data found for the given session.');
        }

        // Create a new workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Amrit';
        workbook.created = new Date();

        // Group students by class
        const studentsByClass = rows.reduce((acc, student) => {
            if (!acc[student.class]) acc[student.class] = [];
            acc[student.class].push(student);
            return acc;
        }, {});

        // Create a worksheet for each class
        for (const [className, students] of Object.entries(studentsByClass)) {
            const sheet = workbook.addWorksheet(`Class ${className}`);

            // Define columns for the sheet
            sheet.columns = [
                { header: 'Name', key: 'name', width: 20 },
                { header: 'Father Name', key: 'father_name', width: 20 },
                { header: 'Mother Name', key: 'mother_name', width: 20 },
                { header: 'SRN No', key: 'srn_no', width: 20 },
                { header: 'PEN No', key: 'pen_no', width: 20 },
                { header: 'Admission No', key: 'admission_no', width: 20 },
                { header: 'Class', key: 'class', width: 15 },
                { header: 'Session', key: 'session', width: 15 },
                { header: 'Roll', key: 'roll', width: 10 },
            ];

            // Add rows for each student in the class
            students.forEach((student) => {
                sheet.addRow({
                    name: student.name,
                    father_name: student.father_name,
                    mother_name: student.mother_name,
                    srn_no: student.srn_no,
                    pen_no: student.pen_no,
                    admission_no: student.admission_no,
                    class: student.class,
                    session: student.session,
                    roll: student.roll,
                });
            });
        }

        // Send the Excel file as a response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=students_${currentYear}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Internal Server Error');
    }finally{
        (await connection).end();
    }
};


module.exports = { create_student_excel };
