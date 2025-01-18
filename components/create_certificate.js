const { PDFDocument, rgb } = require("pdf-lib");
const sharp = require("sharp");
const { getConnection } = require("../models/getConnection");
const fs = require("fs");
const path = require("path");

// Query the database
async function generate(req, res) {
    const studentId = req.params.school_id;
    let connection;

    try {
        connection = await getConnection();

        // Fetch student details
        const studentResults = await connection.execute(
            "SELECT s.*, p.image FROM students s LEFT JOIN photo p ON s.school_id = p.id WHERE s.school_id = ?",
            [studentId]
        );

        if (studentResults[0].length === 0) {
            return res.status(404).send("Student not found.");
        }

        const marks1result = await connection.execute("SELECT * FROM marks1 WHERE id = ?", [studentId]);
        const marks2result = await connection.execute("SELECT * FROM marks2 WHERE id = ?", [studentId]);
        const marks3result = await connection.execute("SELECT * FROM marks3 WHERE id = ?", [studentId]);

        const student = studentResults[0][0];
        const marks1 = marks1result[0][0];
        const marks2 = marks2result[0][0];
        const marks3 = marks3result[0][0];

        // Load the certificate template
        const templatePath = path.join(__dirname, "../template/certificate_template.pdf");
        const templateBytes = fs.readFileSync(templatePath);
        const pdfDoc = await PDFDocument.load(templateBytes);

        // Embed fonts and edit the PDF
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        // Add student details to the PDF
        firstPage.drawText(student.name, { x: 232, y: 2725, size: 30, color: rgb(0, 0, 0) });
        firstPage.drawText(student.class, { x: 1021, y: 2725, size: 30, color: rgb(0, 0, 0) });
        firstPage.drawText(student.father_name, { x: 232, y: 2586, size: 30, color: rgb(0, 0, 0) });
        firstPage.drawText(student.mother_name, { x: 1021, y: 2586, size: 30, color: rgb(0, 0, 0) });
        firstPage.drawText(student.roll, { x: 232, y: 2444, size: 30, color: rgb(0, 0, 0) });
        firstPage.drawText(student.session, { x: 1021, y: 2444, size: 30, color: rgb(0, 0, 0) });

        // Add marks to the PDF
        let remarksY = 0;
        function addMarks(marks, x, y) {
            if (marks) {
                delete marks.id;
                let remarks = 0;
                if (marks.remarks1) {
                    remarks = marks.remarks1;
                    delete marks.remarks1;
                }
                else if (marks.remarks2) {
                    remarks = marks.remarks2;
                    delete marks.remarks2;
                }
                else if (marks.remarks3) {
                    remarks = marks.remarks3;
                    delete marks.remarks3;
                }
                console.log(marks);

                for (const [key, value] of Object.entries(marks)) {
                    firstPage.drawText(`${value}`, { x: x, y: y, size: 30, color: rgb(0, 0, 0) });
                    y -= 81;
                }
                firstPage.drawText(`${remarks}`, { x: 519, y: 1161 - remarksY, size: 30, color: rgb(0, 0, 0) });
                remarksY = remarksY + 226;
            }
        }

        addMarks(marks1, 1293, 2192);
        addMarks(marks2, 1695, 2192);
        addMarks(marks3, 2087, 2192);

        // Handle raw image bytes from the database
        if (student.image) {
            try {
                const pngBuffer = await sharp(Buffer.from(student.image))
                    .resize(300, 380, { fit: sharp.fit.cover, position: sharp.gravity.center })
                    .toFormat('png')
                    .toBuffer();

                const embeddedImage = await pdfDoc.embedPng(pngBuffer);
                const imageDims = embeddedImage.scale(1.2);

                firstPage.drawImage(embeddedImage, {
                    x: 1913,
                    y: 2386,
                    width: imageDims.width,
                    height: imageDims.height,
                });
            } catch (imageError) {
                console.error("Error processing image:", imageError);
            }
        }

        // Save the certificate
        const pdfBytes = await pdfDoc.save();

        // Set headers to display the PDF in a new tab
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline; filename=certificate.pdf");

        connection.end();
        res.send(Buffer.from(pdfBytes));
    } catch (error) {
        console.error("Error generating certificate:", error);
        res.status(500).send("Error generating certificate.");
        if (connection) connection.end();
    }
};

module.exports = {
    generate
};
