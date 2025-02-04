const { PDFDocument, rgb } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit"); // Import fontkit
const sharp = require("sharp");
const { getConnection } = require("../models/getConnection");
const fs = require("fs");
const path = require("path");

async function generateVirtualIdCard(req, res, next) {
    const studentId = req.params.school_id;
    const schoolData = req.user;
    let connection;
    try {
        connection = await getConnection();

        const [[student]] = await connection.execute("SELECT name, class, dob, mobile_no, school_id, corresponding_address, mobile_no, session, admission_no FROM students WHERE school_id = ?", [studentId]);

        const [[photo]] = await connection.execute("SELECT image FROM photo WHERE id = ?", [studentId]);
        const [[schoolLogo]] = await connection.execute("SELECT school_logo FROM teacher WHERE id = ?", [schoolData._id]);


        // Load the certificate template
        const templatePath = path.join(__dirname, "../template/id-card.pdf");
        const templateBytes = fs.readFileSync(templatePath);
        const pdfDoc = await PDFDocument.load(templateBytes);

        const firstPage = pdfDoc.getPages()[0];

        if (photo != undefined) {
            try {
                const pngBuffer = await sharp(Buffer.from(photo.image))
                    .resize(300, 380)
                    .composite([{
                        input: Buffer.from(
                            `<svg>
                    <rect x="0" y="0" width="300" height="380" rx="20" ry="20"/>
                    </svg>`
                        ),
                        blend: 'dest-in'
                    }])
                    .toFormat("png")
                    .toBuffer();
                const embeddedImage = await pdfDoc.embedPng(pngBuffer);

                firstPage.drawImage(embeddedImage, {
                    x: 42,
                    y: 31,
                });
            } catch (error) {
                console.error("Error embedding student image:", error);
            }
        }
        if (schoolLogo.school_logo.length > 0) {
            try {
                const pngBuffer = await sharp(Buffer.from(schoolLogo.school_logo))
                    .resize(160, 160)

                    .toFormat("png")
                    .toBuffer();
                const embeddedImage = await pdfDoc.embedPng(pngBuffer);

                firstPage.drawImage(embeddedImage, {
                    x: 42,
                    y: 445,
                });
            } catch (error) {
                console.error("Error embedding student image:", error);
            }
        }

        //school details
        firstPage.drawText(schoolData.school_name, { x: 254, y: 537, size: 55, color: rgb(0.101, 0.337, 0.859), font: pdfDoc.embedStandardFont('Helvetica-Bold') });
        firstPage.drawText(schoolData.school_address, { x: 254, y: 500, size: 20, color: rgb(0, 0, 0), font: pdfDoc.embedStandardFont('Helvetica-Bold') });
        firstPage.drawText(`Ph - ${schoolData.school_phone}`, { x: 254, y: 473, size: 20, color: rgb(0, 0, 0), font: pdfDoc.embedStandardFont('Helvetica-Bold') });

        // student details
        let yStudent = 325;
        firstPage.drawText(student.name, { x: 417, y: yStudent, size: 30, color: rgb(0, 0, 0) });
        yStudent -= 72;
        firstPage.drawText(student.class, { x: 417, y: yStudent, size: 26, color: rgb(0, 0, 0) });
        firstPage.drawText(student.session, { x: 673, y: yStudent, size: 26, color: rgb(0, 0, 0) });
        yStudent -= 72;
        firstPage.drawText(student.dob, { x: 417, y: yStudent, size: 26, color: rgb(0, 0, 0) });
        firstPage.drawText(student.admission_no, { x: 673, y: yStudent, size: 26, color: rgb(0, 0, 0) });
        yStudent -= 72;
        firstPage.drawText(student.mobile_no, { x: 417, y: yStudent, size: 26, color: rgb(0, 0, 0) });
        let text_id = `${student.session.replace("-", "")}${studentId}`;
        firstPage.drawText(text_id, { x: 673, y: yStudent, size: 26, color: rgb(0, 0, 0) });
        yStudent -= 72;
        const addressLines = student.corresponding_address.split(' ').reduce((acc, word, index) => {
            if (index % 6 === 0) acc.push([]);
            acc[acc.length - 1].push(word);
            return acc;
        }, []).map(line => line.join(' '));

        let yAddress = 66;
        addressLines.forEach(line => {
            firstPage.drawText(line, { x: 517, y: yAddress, size: 20, color: rgb(0, 0, 0) });
            yAddress -= 24; // Adjust the line height as needed
        });


        // Save the PDF and send it to the client
        const pdfBytes = await pdfDoc.save();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename=ID-Card-${text_id}.pdf`);
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.send(Buffer.from(pdfBytes));
    } catch (error) {
        console.log(error);

    }
}


async function generateVirtualIdCards_with_session(req, res, next) {
    const session = req.params.session;
    const schoolData = req.user;
    let connection;

    try {
        connection = await getConnection();

        // Fetch all students associated with the teacher and session
        const [students] = await connection.execute(
            "SELECT school_id, name, class, dob, mobile_no, session, admission_no, corresponding_address FROM students WHERE teacher_id = ? AND session = ?",
            [req.user._id, session]
        );

        if (students.length === 0) {
            return res.status(404).send("No students found for the given session.");
        }

        // Fetch school logo
        const [[schoolLogo]] = await connection.execute(
            "SELECT school_logo FROM teacher WHERE id = ?",
            [req.user._id]
        );

        // Load the certificate template
        const templatePath = path.join(__dirname, "../template/id-card.pdf");
        const templateBytes = fs.readFileSync(templatePath);
        const templatePDF = await PDFDocument.load(templateBytes);

        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();

        for (const student of students) {
            // Copy the template page for each student
            const [templatePage] = await pdfDoc.copyPages(templatePDF, [0]);
            pdfDoc.addPage(templatePage);

            // Get the last added page (which is the template)
            const newPage = pdfDoc.getPage(pdfDoc.getPageCount() - 1);

            // Fetch student photo
            const [[photo]] = await connection.execute(
                "SELECT image FROM photo WHERE id = ?",
                [student.school_id]
            );

            if (photo && photo.image) {
                try {
                    const pngBuffer = await sharp(Buffer.from(photo.image))
                        .resize(300, 380)
                        .composite([{
                            input: Buffer.from(
                                `<svg>
                    <rect x="0" y="0" width="300" height="380" rx="20" ry="20"/>
                    </svg>`
                            ),
                            blend: 'dest-in'
                        }])
                        .toFormat("png")
                        .toBuffer();
                    const embeddedImage = await pdfDoc.embedPng(pngBuffer);
                    newPage.drawImage(embeddedImage, { x: 42, y: 31 });
                } catch (error) {
                    console.error("Error embedding student image:", error);
                }
            }

            if (schoolLogo && schoolLogo.school_logo) {
                try {
                    const pngBuffer = await sharp(Buffer.from(schoolLogo.school_logo))
                        .resize(160, 160)
                        .toFormat("png")
                        .toBuffer();
                    const embeddedImage = await pdfDoc.embedPng(pngBuffer);
                    newPage.drawImage(embeddedImage, { x: 42, y: 445 });
                } catch (error) {
                    console.error("Error embedding school logo:", error);
                }
            }

            // School details
            newPage.drawText(schoolData.school_name, { x: 254, y: 537, size: 55, color: rgb(0.101, 0.337, 0.859), font: pdfDoc.embedStandardFont('Helvetica-Bold') });
            newPage.drawText(schoolData.school_address, { x: 254, y: 500, size: 20, color: rgb(0, 0, 0) });
            newPage.drawText(`Ph - ${schoolData.school_phone}`, { x: 254, y: 473, size: 20, color: rgb(0, 0, 0) });

            // Student details
            newPage.drawText(student.name, { x: 417, y: 325, size: 30, color: rgb(0, 0, 0) });
            newPage.drawText(student.class, { x: 417, y: 253, size: 26, color: rgb(0, 0, 0) });
            newPage.drawText(student.session, { x: 673, y: 253, size: 26, color: rgb(0, 0, 0) });
            newPage.drawText(student.dob, { x: 417, y: 181, size: 26, color: rgb(0, 0, 0) });
            newPage.drawText(student.admission_no, { x: 673, y: 181, size: 26, color: rgb(0, 0, 0) });
            newPage.drawText(student.mobile_no, { x: 417, y: 109, size: 26, color: rgb(0, 0, 0) });

            let text_id = `${student.session.replace("-", "")}${student.school_id}`;
            newPage.drawText(text_id, { x: 673, y: 109, size: 26, color: rgb(0, 0, 0) });
        }

        // Save the PDF and send it to the client
        const pdfBytes = await pdfDoc.save();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename=ID-Cards-${session}.pdf`);
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.send(Buffer.from(pdfBytes));
    } catch (error) {
        console.error("Error generating ID cards:", error);
        res.status(500).send("Internal Server Error");
    }
}

module.exports = {
    generateVirtualIdCard, generateVirtualIdCards_with_session
};
