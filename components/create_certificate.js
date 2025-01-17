const { PDFDocument, rgb } = require("pdf-lib");
const sharp = require("sharp");
const { getConnection } = require("../models/getConnection");
const fs = require("fs");
const path = require("path");

// Query the database
async function generate(req, res) {
    const school_id = req.params.srn_no;
    let connection;

    try {
        connection = await getConnection();
        // Fetch student details
        const studentResults = await connection.execute(
            "SELECT s.*, p.image FROM students s LEFT JOIN photo p ON s.school_id = p.id WHERE s.school_id = ?",
            [school_id]
        );


        if (studentResults.length === 0) {
            return res.status(404).send("Student not found.");
        }

        const marks1result = await connection.execute("SELECT * FROM marks1 WHERE id = ?", [school_id]);
        const marks2result = await connection.execute("SELECT * FROM marks2 WHERE id = ?", [school_id]);
        const marks3result = await connection.execute("SELECT * FROM marks3 WHERE id = ?", [school_id]);


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

        // Add marks to the PDF  mark1
        function addMarks(marks, x, y) {
            if (marks) {

                delete marks.id;

                for (const [key, value] of Object.entries(marks)) {
                    firstPage.drawText(`${value}`, { x: x, y: y, size: 30, color: rgb(0, 0, 0) });
                    y = y - 81;
                }
            }
        }
        addMarks(marks1, 1293, 2192);
        addMarks(marks2, 1695, 2192);
        addMarks(marks3, 2087, 2192);


        // Handle raw image bytes from the database
        if (student.image) {
            try {
                // Convert raw bytes to PNG using sharp
                const pngBuffer = await sharp(Buffer.from(student.image))
                    .resize(300, 380, { fit: sharp.fit.cover, position: sharp.gravity.center }) // Resize and crop dynamically
                    .toFormat('png') // Convert to PNG format
                    .toBuffer(); // Get the processed image as a buffer


                const embeddedImage = await pdfDoc.embedPng(pngBuffer);

                const imageDims = embeddedImage.scale(1.2);
                firstPage.drawImage(embeddedImage, {
                    x: 1913, // Adjust X position as needed
                    y: 2386, // Adjust Y position as needed
                    width: imageDims.width,
                    height: imageDims.height,
                });
            } catch (imageError) {
                console.error("Error processing image:", imageError);
            }
        }

        // Save the certificate
        const pdfBytes = await pdfDoc.save();
        // const outputPath = path.join(__dirname, "../output", `${srnNo}_certificate.pdf`);
        // fs.writeFileSync(outputPath, pdfBytes);

        // Set headers to display the PDF in a new tab
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline; filename=certificate.pdf");

        // Send the PDF as the response
        connection.end();
        res.send(Buffer.from(pdfBytes));
    } catch (error) {
        console.error("Error generating certificate:", error);
        res.status(500).send("Error generating certificate.");
        connection.end();
    }

};

// under development 
async function generateAll(req, res) {
    let connection;

    try {
        connection = await getConnection();

        // Fetch all students with their photos
        const [students] = await connection.execute(
            "SELECT s.*, p.image FROM students s LEFT JOIN photo p ON s.srn_no = p.id"
        );

        if (!students.length) {
            return res.status(404).send("No students found.");
        }

        // Load the certificate template
        const templatePath = path.join(__dirname, "../template/certificate_template.pdf");
        const templateBytes = fs.readFileSync(templatePath);
        const pdfDoc = await PDFDocument.load(templateBytes);

        for (const student of students) {
            // Create a new page for each student
            const page = pdfDoc.addPage();

            // Add student details to the page
            page.drawText(student.name, { x: 232, y: 2725, size: 30, color: rgb(0, 0, 0) });
            page.drawText(student.class, { x: 1021, y: 2725, size: 30, color: rgb(0, 0, 0) });
            page.drawText(student.father_name, { x: 232, y: 2586, size: 30, color: rgb(0, 0, 0) });
            page.drawText(student.mother_name, { x: 1021, y: 2586, size: 30, color: rgb(0, 0, 0) });
            page.drawText(student.roll, { x: 232, y: 2444, size: 30, color: rgb(0, 0, 0) });
            page.drawText(student.session, { x: 1021, y: 2444, size: 30, color: rgb(0, 0, 0) });

            // Fetch marks for the student
            const [marks1] = await connection.execute(
                "SELECT * FROM marks1 WHERE id = ?",
                [student.srn_no]
            );
            const [marks2] = await connection.execute(
                "SELECT * FROM marks2 WHERE id = ?",
                [student.srn_no]
            );
            const [marks3] = await connection.execute(
                "SELECT * FROM marks3 WHERE id = ?",
                [student.srn_no]
            );

            // Add marks to the page
            function addMarks(marks, x, y) {
                if (marks.length) {
                    delete marks[0].id;
                    for (const value of Object.values(marks[0])) {
                        page.drawText(`${value}`, { x, y, size: 30, color: rgb(0, 0, 0) });
                        y -= 81;
                    }
                }
            }
            addMarks(marks1, 1293, 2192);
            addMarks(marks2, 1695, 2192);
            addMarks(marks3, 2087, 2192);

            // Handle photo
            if (student.image) {
                try {
                    const pngBuffer = await sharp(Buffer.from(student.image))
                        .resize(300, 380)
                        .png()
                        .toBuffer();
                    const embeddedImage = await pdfDoc.embedPng(pngBuffer);
                    const imageDims = embeddedImage.scale(1.2);
                    page.drawImage(embeddedImage, {
                        x: 1913,
                        y: 2386,
                        width: imageDims.width,
                        height: imageDims.height,
                    });
                } catch (imageError) {
                    console.error("Error processing image for student:", student.srn_no, imageError);
                }
            }
        }

        const pdfBytes = await pdfDoc.save();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline; filename=all_certificates.pdf");
        res.send(Buffer.from(pdfBytes));
    } catch (error) {
        console.error("Error generating certificates:", error);
        res.status(500).send("Error generating certificates.");
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}




async function preview(req, res) {
    const srnNo = req.params.srn_no;

    // Path to the generated PDF in the output folder
    const pdfPath = path.join(__dirname, "../output", `${srnNo}_certificate.pdf`);

    // Check if the PDF exists
    fs.access(pdfPath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(404).send("Certificate PDF not found.");
        }

        // Serve the PDF to the client
        res.sendFile(pdfPath);
    });
}

module.exports = {
    generate, preview, generateAll
};
