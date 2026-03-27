const { PDFDocument, rgb } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit"); // Import fontkit
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const { getConnection } = require("../models/getConnection");

async function generateCertificate(
  student,
  activity,
  date,
  type,
  position = "",
) {
  if (type === "juniors") {
    try {
      // Load the certificate template
      const templatePath = path.join(__dirname, "../template/kids.pdf");
      const templateBytes = fs.readFileSync(templatePath);
      const pdfDoc = await PDFDocument.load(templateBytes);
      // Register fontkit with PDFDocument
      pdfDoc.registerFontkit(fontkit);
      const fontPath = path.join(__dirname, "../template/Inter_18pt-Bold.ttf");
      const fontBytes = fs.readFileSync(fontPath);
      const boldFont = await pdfDoc.embedFont(fontBytes);

      const firstPage = pdfDoc.getPages()[0];

      // Insert student details
      const pageWidth = firstPage.getWidth();
      const nameText = student.name.toUpperCase();
      const parentText = `Son/Daughter of ${student.father_name.toUpperCase()} & ${student.mother_name.toUpperCase()}`;
      const activityText = activity
        .toUpperCase()
        .split(" ")
        .reduce((acc, word) => {
          if (acc.length === 0) {
            return [word];
          }
          const lastLine = acc[acc.length - 1];
          if ((lastLine + " " + word).length <= 82) {
            acc[acc.length - 1] = lastLine + " " + word;
          } else {
            acc.push(word);
          }
          return acc;
        }, [])
        .join("\n");

      const nameTextWidth = boldFont.widthOfTextAtSize(nameText, 60);
      const activityTextWidth = boldFont.widthOfTextAtSize(activityText, 12);
      const parentTextWidth = boldFont.widthOfTextAtSize(parentText, 12);

      firstPage.drawText(nameText, {
        x: (pageWidth - nameTextWidth) / 2 + 135,
        y: 380,
        size: 60,
        font: boldFont,
        color: rgb(0.705, 0.196, 0.647),
      });
      firstPage.drawText(parentText, {
        x: (pageWidth - parentTextWidth) / 2 + 135,
        y: 350,
        size: 12,
        font: boldFont,
        color: rgb(0.705, 0.196, 0.647),
      });
      firstPage.drawText(activityText, {
        x: (pageWidth - activityTextWidth) / 2 + 135,
        y: 220,
        size: 12,
        font: boldFont,
        color: rgb(0.705, 0.196, 0.647),
      });
      firstPage.drawText(date, {
        x: 390,
        y: 140,
        size: 14,
        font: boldFont,
        color: rgb(0.705, 0.196, 0.647),
      });

      let connection = await getConnection();

      const [rows] = await connection.execute(
        "SELECT school_logo FROM teacher WHERE id = ?",
        [student.teacher_id],
      );
      if (rows.length > 0 && rows[0].school_logo) {
        const schoolLogoBuffer = Buffer.from(rows[0].school_logo);
        const embeddedSchoolLogo = await pdfDoc.embedPng(schoolLogoBuffer);
        const schoolLogoWidth = 200;
        const pageHeight = firstPage.getHeight();
        const yPosition = (pageHeight - schoolLogoWidth) / 2;
        firstPage.drawImage(embeddedSchoolLogo, {
          x: 80,
          y: yPosition + 40,
          width: 200,
          height: 200,
        });
      }

      await connection.release();

      // Save the modified PDF
      const pdfBytes = await pdfDoc.save();
      return pdfBytes;
    } catch (error) {
      console.error("Error generating certificate:", error);
      throw new Error("Failed to generate certificate");
    }
  } else if (type === "seniors") {
    try {
      // Load the certificate template
      const templatePath = path.join(__dirname, "../template/achievement.pdf");
      const templateBytes = fs.readFileSync(templatePath);
      const pdfDoc = await PDFDocument.load(templateBytes);
      // Register fontkit with PDFDocument
      pdfDoc.registerFontkit(fontkit);
      const fontPath = path.join(__dirname, "../template/Inter_18pt-Bold.ttf");
      const fontBytes = fs.readFileSync(fontPath);
      const boldFont = await pdfDoc.embedFont(fontBytes);

      const firstPage = pdfDoc.getPages()[0];

      // Insert student details
      const pageWidth = firstPage.getWidth();
      const nameText =
        `${student.name} S/O - D/O OF ${student.father_name} & ${student.mother_name}`.toUpperCase();
      const father_nameText = student.father_name.toUpperCase();
      const mother_nameText = student.mother_name.toUpperCase();
      const activityText = activity
        .toUpperCase()
        .split(" ")
        .reduce((acc, word) => {
          if (acc.length === 0) {
            return [word];
          }
          const lastLine = acc[acc.length - 1];
          if ((lastLine + " " + word).length <= 82) {
            acc[acc.length - 1] = lastLine + " " + word;
          } else {
            acc.push(word);
          }
          return acc;
        }, [])
        .join("\n");

      const nameTextWidth = boldFont.widthOfTextAtSize(nameText, 24);
      const activityTextWidth = boldFont.widthOfTextAtSize(activityText, 12);

      firstPage.drawText(nameText, {
        x: (pageWidth - nameTextWidth) / 2,
        y: 280,
        size: 24,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      firstPage.drawText(activityText, {
        x: (pageWidth - activityTextWidth) / 2,
        y: 220,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      firstPage.drawText(date, {
        x: 205,
        y: 140,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      let connection = await getConnection();

      const [rows] = await connection.execute(
        "SELECT school_logo FROM teacher WHERE id = ?",
        [student.teacher_id],
      );
      if (rows.length > 0 && rows[0].school_logo) {
        const schoolLogoBuffer = Buffer.from(rows[0].school_logo);
        const embeddedSchoolLogo = await pdfDoc.embedPng(schoolLogoBuffer);
        const schoolLogoWidth = 100;
        const pageWidth = firstPage.getWidth();
        const xPosition = (pageWidth - schoolLogoWidth) / 2;
        firstPage.drawImage(embeddedSchoolLogo, {
          x: xPosition,
          y: 85,
          width: 100,
          height: 100,
        });
      }

      await connection.release();

      // Insert student photo if available
      if (student.image) {
        const studentImageBuffer = await sharp(Buffer.from(student.image))
          .resize(100, 100)
          .toFormat("png")
          .toBuffer();
        const embeddedStudentImage = await pdfDoc.embedPng(studentImageBuffer);
        firstPage.drawImage(embeddedStudentImage, {
          x: 450,
          y: 650,
          width: 100,
          height: 100,
        });
      }

      // Save the modified PDF
      const pdfBytes = await pdfDoc.save();
      return pdfBytes;
    } catch (error) {
      console.error("Error generating certificate:", error);
      throw new Error("Failed to generate certificate");
    }
  } else if (type === "achievement") {
    try {
      console.log("achievement");
      // Load the certificate template
      const templatePath = path.join(__dirname, "../template/annual.pdf");
      const templateBytes = fs.readFileSync(templatePath);
      const pdfDoc = await PDFDocument.load(templateBytes);
      // Register fontkit with PDFDocument
      pdfDoc.registerFontkit(fontkit);
      const fontPath = path.join(__dirname, "../template/oleo.ttf");
      const fontBytes = fs.readFileSync(fontPath);
      const boldFont = await pdfDoc.embedFont(fontBytes);

      const firstPage = pdfDoc.getPages()[0];

      // Insert student details
      const pageWidth = firstPage.getWidth();
      const nameText =
        `S/O - D/O OF ${student.father_name} & ${student.mother_name}`.toUpperCase();
      const first = student.name
        .split(" ")
        .map(
          (element) =>
            element.charAt(0).toUpperCase() + element.slice(1).toLowerCase(),
        )
        .join(" ");
      // const father_nameText = student.father_name.toUpperCase();
      // const mother_nameText = student.mother_name.toUpperCase();
      const activityText = `Session ${student.session} in Class: ${
        student.class
      } and secured: ${position.toUpperCase()} Position.`;

      const firstWidth = boldFont.widthOfTextAtSize(first, 35);
      const parentWidth = boldFont.widthOfTextAtSize(nameText, 18);
      const activityTextWidth = boldFont.widthOfTextAtSize(activityText, 12);

      firstPage.drawText(first, {
        x: (pageWidth - firstWidth) / 2,
        y: 375,
        size: 35,
        font: boldFont,
        color: rgb(0.698, 0.455, 0.035),
      });
      firstPage.drawText(nameText, {
        x: (pageWidth - parentWidth) / 2,
        y: 345,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      firstPage.drawText(activityText, {
        x: (pageWidth - activityTextWidth) / 2.5,
        y: 290,
        size: 14,
        color: rgb(0, 0, 0),
      });
      // firstPage.drawText(date, { x: 205, y: 140, size: 12, font: boldFont, color: rgb(0, 0, 0) });

      let connection = await getConnection();

      const [rows] = await connection.execute(
        "SELECT school_logo FROM teacher WHERE id = ?",
        [student.teacher_id],
      );
      if (rows.length > 0 && rows[0].school_logo) {
        const schoolLogoBuffer = Buffer.from(rows[0].school_logo);
        const embeddedSchoolLogo = await pdfDoc.embedPng(schoolLogoBuffer);
        const schoolLogoWidth = 100;
        const pageWidth = firstPage.getWidth();
        const xPosition = (pageWidth - schoolLogoWidth) / 2;
        firstPage.drawImage(embeddedSchoolLogo, {
          x: xPosition,
          y: 85,
          width: 100,
          height: 100,
        });
      }

      await connection.release();

      // Insert student photo if available
      if (student.image) {
        const studentImageBuffer = await sharp(Buffer.from(student.image))
          .resize(100, 100)
          .toFormat("png")
          .toBuffer();
        const embeddedStudentImage = await pdfDoc.embedPng(studentImageBuffer);
        firstPage.drawImage(embeddedStudentImage, {
          x: 450,
          y: 650,
          width: 100,
          height: 100,
        });
      }

      // Save the modified PDF
      const pdfBytes = await pdfDoc.save();
      return pdfBytes;
    } catch (error) {
      console.error("Error generating certificate:", error);
      throw new Error("Failed to generate certificate");
    }
  } else if (type === "ceremony") {
    try {
      // Load the certificate template
      const templatePath = path.join(__dirname, "../template/ceremony.pdf");
      const templateBytes = fs.readFileSync(templatePath);
      const pdfDoc = await PDFDocument.load(templateBytes);

      // Set metadata
      pdfDoc.setTitle("Felicitation Certificate");
      pdfDoc.setAuthor("Bajrang Vidya Mandir");
      pdfDoc.setSubject("Certificate of Participation");
      pdfDoc.setProducer("PDF-LIB");
      pdfDoc.setCreator("Amrit");

      // Register fontkit with PDFDocument
      pdfDoc.registerFontkit(fontkit);
      const fontPath = path.join(__dirname, "../template/ceremony.ttf");
      const fontBytesCermony = fs.readFileSync(fontPath);
      const boldFont = await pdfDoc.embedFont(fontBytesCermony, {
        subset: true,
      });

      const firstPage = pdfDoc.getPages()[0];

      // Insert student details
      const pageWidth = firstPage.getWidth();
      const nameText =
        `${student.name}`[0].toUpperCase() +
        `${student.name}`.slice(1).toLowerCase();

      var parent;
      if (student.gender === "MALE") {
        parent = `S/O Shri. ${
          student.father_name[0].toUpperCase() +
          student.father_name.slice(1).toLowerCase()
        } & Smt. ${
          student.mother_name[0].toUpperCase() +
          student.mother_name.slice(1).toLowerCase()
        }`;
      } else if (student.gender === "FEMALE") {
        parent = `D/O Shri. ${
          student.father_name[0].toUpperCase() +
          student.father_name.slice(1).toLowerCase()
        } & Smt. ${
          student.mother_name[0].toUpperCase() +
          student.mother_name.slice(1).toLowerCase()
        }`;
      }

      const nameTextWidth = boldFont.widthOfTextAtSize(nameText, 24);
      var parentWidth = boldFont.widthOfTextAtSize(parent, 14);

      firstPage.drawText(nameText, {
        x: (pageWidth - nameTextWidth) / 2,
        y: 420,
        size: 24,
        font: boldFont,
        color: rgb(0.502, 0, 0),
      });

      firstPage.drawText(parent, {
        x: (pageWidth - parentWidth) / 2,
        y: 395,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      let connection = await getConnection();

      const [rows] = await connection.execute(
        "SELECT school_logo FROM teacher WHERE id = ?",
        [student.teacher_id],
      );
      if (rows.length > 0 && rows[0].school_logo) {
        const schoolLogoBuffer = Buffer.from(rows[0].school_logo);
        const embeddedSchoolLogo = await pdfDoc.embedPng(schoolLogoBuffer);
        const schoolLogoWidth = 90;
        const pageWidth = firstPage.getWidth();
        const xPosition = (pageWidth - schoolLogoWidth) / 2;
        firstPage.drawImage(embeddedSchoolLogo, {
          x: xPosition,
          y: 580,
          width: 90,
          height: 90,
        });
      }

      await connection.release();

      // Insert student photo if available
      if (student.image) {
        const studentImageBuffer = await sharp(Buffer.from(student.image))
          .resize(100, 100)
          .toFormat("png")
          .toBuffer();
        const embeddedStudentImage = await pdfDoc.embedPng(studentImageBuffer);
        firstPage.drawImage(embeddedStudentImage, {
          x: 450,
          y: 650,
          width: 100,
          height: 100,
        });
      }

      // Save the modified PDF
      const pdfBytes = await pdfDoc.save();
      return pdfBytes;
    } catch (error) {
      console.error("Error generating certificate:", error);
      throw new Error("Failed to generate certificate");
    }
  }
}

module.exports = {
  generateCertificate,
};
