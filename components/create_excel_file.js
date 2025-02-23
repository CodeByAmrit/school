const { getConnection } = require("../models/getConnection");
const ExcelJS = require("exceljs");

// Function to generate Excel file with student data
async function create_excel_selected(req, res) {
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ message: "Invalid or empty student ID list." });
    }

    let connection;
    try {
        connection = await getConnection();
        const placeholders = studentIds.map(() => "?").join(",");
        const [students] = await connection.execute(
            `SELECT school_id, name, father_name, mother_name, session, class
             FROM students WHERE school_id IN (${placeholders})`,
            [...studentIds]
        );

        const [subjects_rows] = await connection.execute(
            `SELECT subject FROM student_marks WHERE student_id = ?`,
            [students[0].school_id]
        );

        // Remove duplicates using Set
        let subjects = ["SR NO", "NAME", "FATHER NAME", "MOTHER NAME", ...new Set(subjects_rows.map(sub => sub.subject))];

        console.log(subjects);

        if (students.length === 0) {
            return res.status(404).json({ message: "No students found for the given IDs." });
        }

        // Create an Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`${students[0].class}`);

        // Merged Header
        worksheet.mergeCells("A1:L1");
        worksheet.getCell("A1").value = `               Annual Exam , ${students[0].session}                                                                  CLASS - ${students[0].class}`;
        worksheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
        worksheet.getCell("A1").font = { bold: true, size: 20 };
        worksheet.getCell("A1").height = 25;

        worksheet.getCell("A1").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "2E2E2E" }
        };

        worksheet.getCell("A1").font = {
            bold: true,
            size: 14,
            color: { argb: "FFFFFF" }
        };

        const headerRow = worksheet.addRow(subjects);
        headerRow.font = { bold: true };
        headerRow.alignment = { horizontal: "center", vertical: "middle" };

        headerRow.eachCell((cell) => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "E6E6E6" }
            };
        });

        // Add Student Data
        students.forEach((student, index) => {
            worksheet.addRow([
                index + 1, // Sr No
                student.name,
                student.father_name,
                student.mother_name,
            ]);
        });

        worksheet.eachRow((row) => {
            row.height = 20;
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" }
                };
            });
        });

        // Set column widths and alignments
        worksheet.getColumn(1).width = 6; // Small width for Sr No
        worksheet.getColumn(1).alignment = { horizontal: "center" }; // Sr No centered


        // Auto-fit column width for Name, Father Name, and Mother Name
        [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach((colIndex) => {
            worksheet.getColumn(colIndex).width = 16;
        });

        // Set correct headers
        res.setHeader("Content-Disposition", "attachment; filename=Class_list.xlsx");
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        // Write Excel file to response stream
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Error Creating Excel:", error);
        res.status(500).json({ message: "Failed to Create Excel." });
    } finally {
        if (connection) await connection.end();
    }
}


module.exports = { create_excel_selected };
