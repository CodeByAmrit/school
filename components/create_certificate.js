const { PDFDocument, rgb } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit"); // Import fontkit
const sharp = require("sharp");
const { getConnection } = require("../models/getConnection");
const fs = require("fs");
const path = require("path");

async function generate(req, res) {
    const studentId = req.params.school_id;
    let connection;

    try {
        connection = await getConnection();

        // Fetch student details
        const [studentResults] = await connection.execute(
            `SELECT s.*, p.image 
             FROM students s 
             LEFT JOIN photo p ON s.school_id = p.id 
             WHERE s.school_id = ?`,
            [studentId]
        );

        if (studentResults.length === 0) {
            return res.status(404).send("Student not found.");
        }

        const student = studentResults[0];

        // Fetch marks for the student by term and subject
        const [marksResults] = await connection.execute(
            `SELECT sm.subject, sm.marks, sm.term 
             FROM student_marks sm 
             WHERE sm.student_id = ?`,
            [studentId]
        );

        // Organize marks by term
        const marksByTerm = {};
        marksResults.forEach((mark) => {
            if (!marksByTerm[mark.term]) {
                marksByTerm[mark.term] = [];
            }
            marksByTerm[mark.term].push({ subject: mark.subject, marks: mark.marks });
        });

        // Fetch maximum marks for each subject based on class and term
        const maxMarksBySubject = {};
        for (const term of Object.keys(marksByTerm)) {
            const [maxMarkResults] = await connection.execute(
                `SELECT max_marks, subject 
                 FROM maximum_marks 
                 WHERE class = ? AND term = ?`,
                [student.class, term]
            );

            maxMarkResults.forEach((maxMark) => {
                maxMarksBySubject[`${term}-${maxMark.subject}`] = parseInt(maxMark.max_marks, 10) || 100;
            });
        }

        // Fetch grand total, total maximum marks, and percentage for each term
        const [performanceResults] = await connection.execute(
            `SELECT term, grand_total, total_max_marks, percentage 
             FROM StudentPerformance 
             WHERE school_id = ?`,
            [studentId]
        );

        const performanceByTerm = {};
        performanceResults.forEach((row) => {
            performanceByTerm[row.term] = {
                grandTotal: row.grand_total,
                totalMaxMarks: row.total_max_marks,
                percentage: row.percentage,
                max: row.max_marks,
            };
        });

        // Fetch attendance and status for the student
        const [[student_attendance_status]] = await connection.execute(
            'SELECT attendance, status FROM student_attendance_status WHERE student_id = ?',
            [studentId]
        );

        // Load the certificate template
        const templatePath = path.join(__dirname, "../template/certificate_template.pdf");
        const templateBytes = fs.readFileSync(templatePath);
        const pdfDoc = await PDFDocument.load(templateBytes);

        // Register fontkit with PDFDocument
        pdfDoc.registerFontkit(fontkit);

        // Embed the bold font
        const fontPath = path.join(__dirname, "../template/Inter_18pt-Bold.ttf");
        const boldFontBytes = fs.readFileSync(fontPath);
        const boldFont = await pdfDoc.embedFont(boldFontBytes);

        // Get the first page of the PDF
        const firstPage = pdfDoc.getPages()[0];

        // Add student details to the PDF
        firstPage.drawText(student.name, { x: 232, y: 2725, size: 30, font: boldFont, color: rgb(0, 0, 0) });
        firstPage.drawText(student.class, { x: 1021, y: 2725, size: 30, font: boldFont, color: rgb(0, 0, 0) });
        firstPage.drawText(student.father_name, { x: 232, y: 2586, size: 30, font: boldFont, color: rgb(0, 0, 0) });
        firstPage.drawText(student.mother_name, { x: 1021, y: 2586, size: 30, font: boldFont, color: rgb(0, 0, 0) });
        firstPage.drawText(student.roll, { x: 232, y: 2444, size: 30, font: boldFont, color: rgb(0, 0, 0) });
        firstPage.drawText(student.session, { x: 1021, y: 2444, size: 30, font: boldFont, color: rgb(0, 0, 0) });

        // attendance and status
        firstPage.drawText(student_attendance_status.attendance.toUpperCase(), { x: 1746, y: 738, size: 38, font: boldFont, color: rgb(0, 0, 0) });
        firstPage.drawText(student_attendance_status.status.toUpperCase(), { x: 1856, y: 668, size: 38, font: boldFont, color: rgb(0, 0, 0) });

        // Add the student's image if available
        if (student.image) {
            try {
                const pngBuffer = await sharp(Buffer.from(student.image))
                    .resize(300, 380)
                    .toFormat("png")
                    .toBuffer();
                const embeddedImage = await pdfDoc.embedPng(pngBuffer);
                const imageDims = embeddedImage.scale(1.2);

                firstPage.drawImage(embeddedImage, {
                    x: 1913,
                    y: 2386,
                    width: imageDims.width,
                    height: imageDims.height,
                });
            } catch (error) {
                console.error("Error embedding student image:", error);
            }
        }

        // Define positions
        const startXPositions = [1293, 1695, 2087]; // X positions for Term columns
        const startYPosition = 2192; // Starting Y position for marks
        const rowHeight = 81; // Height between rows

        // Iterate over each term and add marks
        Object.keys(marksByTerm).forEach((term, termIndex) => {
            const termMarks = marksByTerm[term];
            const startX = startXPositions[termIndex];
            let termGrandTotal = 0;

            termMarks.forEach((mark, i) => {
                const yPosition = startYPosition - (i * rowHeight);

                // Subject (bold)
                firstPage.drawText(mark.subject, { x: 223, y: yPosition, size: 30, font: boldFont, color: rgb(0, 0, 0) });

                // Marks
                firstPage.drawText(mark.marks.toString(), { x: startX, y: yPosition, size: 30, color: rgb(0, 0, 0) });

                // Maximum Marks (display only once for each term)

                const maxMarks = maxMarksBySubject[`${term}-${mark.subject}`];

                if (maxMarks) {
                    firstPage.drawText(maxMarks.toString(), { x: 857, y: yPosition + 10, size: 30, color: rgb(0, 0, 0) });
                    termGrandTotal += maxMarks; // Add to the term's grand total
                }

            });
            firstPage.drawText(performanceResults[0].total_max_marks, { x: 857, y: 1535, size: 30, font: boldFont, color: rgb(0, 0, 0) });

            // Display Total Marks at the correct position
            const totalYPosition = startYPosition - (termMarks.length * rowHeight);
            const performance = performanceByTerm[term] || {};

            // Total Marks
            firstPage.drawText(performance.grandTotal?.toString() || "N/A", {
                x: startX,
                y: totalYPosition,
                size: 30,
                font: boldFont,
                color: rgb(0, 0, 0),
            });

            // Percentage (display in the next line)
            const percentageYPosition = totalYPosition - 81; // Move down by 81
            const percentage = parseFloat(performance.percentage);
            const formattedPercentage = isNaN(percentage) ? "N/A" : `${percentage.toFixed(2)}%`;
            firstPage.drawText(formattedPercentage, {
                x: startX,
                y: percentageYPosition,
                size: 30,
                font: boldFont,
                color: rgb(0, 0, 0),
            });
        });


        // Save the PDF and send it to the client
        const pdfBytes = await pdfDoc.save();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline; filename=certificate.pdf");
        res.send(Buffer.from(pdfBytes));
    } catch (error) {
        console.error("Error generating certificate:", error);
        res.status(500).send("Error generating certificate.");
    } finally {
        if (connection) connection.end();
    }
}

module.exports = {
    generate,
};
