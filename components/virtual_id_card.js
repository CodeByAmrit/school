const { PDFDocument, rgb } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit"); // Import fontkit
const sharp = require("sharp");
const { getConnection } = require("../models/getConnection");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");

async function generateVirtualIdCard(req, res, next) {
  const studentId = req.params.school_id;
  const schoolData = req.user;
  let connection;
  try {
    connection = await getConnection();

    const [[student]] = await connection.execute(
      "SELECT name, class, dob, mobile_no, school_id, corresponding_address, mobile_no, session, admission_no FROM students WHERE school_id = ?",
      [studentId],
    );

    const [[photo]] = await connection.execute(
      "SELECT image FROM photo WHERE id = ?",
      [studentId],
    );
    const [[schoolLogo]] = await connection.execute(
      "SELECT school_logo FROM teacher WHERE id = ?",
      [schoolData._id],
    );

    // Load the certificate template
    const templatePath = path.join(__dirname, "../template/id-card.pdf");
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);

    const firstPage = pdfDoc.getPages()[0];

    if (photo != undefined) {
      try {
        const pngBuffer = await sharp(Buffer.from(photo.image))
          .resize(300, 380)
          .composite([
            {
              input: Buffer.from(
                `<svg>
                    <rect x="0" y="0" width="300" height="380" rx="20" ry="20"/>
                    </svg>`,
              ),
              blend: "dest-in",
            },
          ])
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
    firstPage.drawText(schoolData.school_name, {
      x: 254,
      y: 537,
      size: 55,
      color: rgb(0.101, 0.337, 0.859),
      font: pdfDoc.embedStandardFont("Helvetica-Bold"),
    });
    firstPage.drawText(schoolData.school_address, {
      x: 254,
      y: 500,
      size: 20,
      color: rgb(0, 0, 0),
      font: pdfDoc.embedStandardFont("Helvetica-Bold"),
    });
    firstPage.drawText(`Ph - ${schoolData.school_phone}`, {
      x: 254,
      y: 473,
      size: 20,
      color: rgb(0, 0, 0),
      font: pdfDoc.embedStandardFont("Helvetica-Bold"),
    });

    // student details
    let yStudent = 325;
    firstPage.drawText(student.name, {
      x: 417,
      y: yStudent,
      size: 30,
      color: rgb(0, 0, 0),
    });
    yStudent -= 72;
    firstPage.drawText(student.class, {
      x: 417,
      y: yStudent,
      size: 26,
      color: rgb(0, 0, 0),
    });
    firstPage.drawText(student.session, {
      x: 673,
      y: yStudent,
      size: 26,
      color: rgb(0, 0, 0),
    });
    yStudent -= 72;
    firstPage.drawText(student.dob, {
      x: 417,
      y: yStudent,
      size: 26,
      color: rgb(0, 0, 0),
    });
    firstPage.drawText(student.admission_no, {
      x: 673,
      y: yStudent,
      size: 26,
      color: rgb(0, 0, 0),
    });
    yStudent -= 72;
    firstPage.drawText(student.mobile_no, {
      x: 417,
      y: yStudent,
      size: 26,
      color: rgb(0, 0, 0),
    });
    let text_id = `${student.session.replace("-", "")}${studentId}`;
    firstPage.drawText(text_id, {
      x: 673,
      y: yStudent,
      size: 26,
      color: rgb(0, 0, 0),
    });
    yStudent -= 72;
    const addressLines = student.corresponding_address
      .split(" ")
      .reduce((acc, word, index) => {
        if (index % 6 === 0) acc.push([]);
        acc[acc.length - 1].push(word);
        return acc;
      }, [])
      .map((line) => line.join(" "));

    let yAddress = 66;
    addressLines.forEach((line) => {
      firstPage.drawText(line, {
        x: 517,
        y: yAddress,
        size: 20,
        color: rgb(0, 0, 0),
      });
      yAddress -= 24; // Adjust the line height as needed
    });

    // Save the PDF and send it to the client
    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=ID-Card-${text_id}.pdf`,
    );
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
      [req.user._id, session],
    );

    if (students.length === 0) {
      return res.status(404).send("No students found for the given session.");
    }

    // Fetch school logo
    const [[schoolLogo]] = await connection.execute(
      "SELECT school_logo FROM teacher WHERE id = ?",
      [req.user._id],
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
        [student.school_id],
      );

      if (photo && photo.image) {
        try {
          const pngBuffer = await sharp(Buffer.from(photo.image))
            .resize(300, 380)
            .composite([
              {
                input: Buffer.from(
                  `<svg>
                    <rect x="0" y="0" width="300" height="380" rx="20" ry="20"/>
                    </svg>`,
                ),
                blend: "dest-in",
              },
            ])
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
      newPage.drawText(schoolData.school_name, {
        x: 254,
        y: 537,
        size: 55,
        color: rgb(0.101, 0.337, 0.859),
        font: pdfDoc.embedStandardFont("Helvetica-Bold"),
      });
      newPage.drawText(schoolData.school_address, {
        x: 254,
        y: 500,
        size: 20,
        color: rgb(0, 0, 0),
      });
      newPage.drawText(`Ph - ${schoolData.school_phone}`, {
        x: 254,
        y: 473,
        size: 20,
        color: rgb(0, 0, 0),
      });

      // Student details
      newPage.drawText(student.name, {
        x: 417,
        y: 325,
        size: 30,
        color: rgb(0, 0, 0),
      });
      newPage.drawText(student.class, {
        x: 417,
        y: 253,
        size: 26,
        color: rgb(0, 0, 0),
      });
      newPage.drawText(student.session, {
        x: 673,
        y: 253,
        size: 26,
        color: rgb(0, 0, 0),
      });
      newPage.drawText(student.dob, {
        x: 417,
        y: 181,
        size: 26,
        color: rgb(0, 0, 0),
      });
      newPage.drawText(student.admission_no, {
        x: 673,
        y: 181,
        size: 26,
        color: rgb(0, 0, 0),
      });
      newPage.drawText(student.mobile_no, {
        x: 417,
        y: 109,
        size: 26,
        color: rgb(0, 0, 0),
      });

      let text_id = `${student.session.replace("-", "")}${student.school_id}`;
      newPage.drawText(text_id, {
        x: 673,
        y: 109,
        size: 26,
        color: rgb(0, 0, 0),
      });
    }

    // Save the PDF and send it to the client
    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=ID-Cards-${session}.pdf`,
    );
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("Error generating ID cards:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function selectedVirtualIdCard(req, res) {
  const { studentIds } = req.body;
  const schoolData = req.user;

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res
      .status(400)
      .json({ message: "Invalid or empty student ID list." });
  }

  let connection;
  try {
    connection = await getConnection();

    // Fix SQL query for IN clause
    const placeholders = studentIds.map(() => "?").join(",");
    const [students] = await connection.execute(
      `SELECT school_id, name, class, dob, mobile_no, session, admission_no, corresponding_address 
             FROM students 
             WHERE teacher_id = ? AND school_id IN (${placeholders})`,
      [req.user._id, ...studentIds],
    );

    if (students.length === 0) {
      return res
        .status(404)
        .json({ message: "No students found for the given IDs." });
    }

    // Fetch school logo
    const [[schoolLogo]] = await connection.execute(
      "SELECT school_logo FROM teacher WHERE id = ?",
      [req.user._id],
    );

    // Load the certificate template
    const templatePath = path.join(__dirname, "../template/id-card.pdf");
    const templateBytes = fs.readFileSync(templatePath);
    const templatePDF = await PDFDocument.load(templateBytes);

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    for (const student of students) {
      const [templatePage] = await pdfDoc.copyPages(templatePDF, [0]);
      pdfDoc.addPage(templatePage);
      const newPage = pdfDoc.getPage(pdfDoc.getPageCount() - 1);

      // Fetch student photo
      const [[photo]] = await connection.execute(
        "SELECT image FROM photo WHERE id = ?",
        [student.school_id],
      );

      if (photo && photo.image) {
        try {
          const pngBuffer = await sharp(Buffer.from(photo.image))
            .resize(300, 380)
            .composite([
              {
                input: Buffer.from(
                  '<svg><rect x="0" y="0" width="300" height="380" rx="20" ry="20"/></svg>',
                ),
                blend: "dest-in",
              },
            ])
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
      newPage.drawText(schoolData.school_name, {
        x: 254,
        y: 537,
        size: 55,
        color: rgb(0.101, 0.337, 0.859),
        font: pdfDoc.embedStandardFont("Helvetica-Bold"),
      });
      newPage.drawText(schoolData.school_address, {
        x: 254,
        y: 500,
        size: 20,
        color: rgb(0, 0, 0),
      });
      newPage.drawText(`Ph - ${schoolData.school_phone}`, {
        x: 254,
        y: 473,
        size: 20,
        color: rgb(0, 0, 0),
      });

      // Student details
      newPage.drawText(student.name, {
        x: 417,
        y: 325,
        size: 30,
        color: rgb(0, 0, 0),
      });
      newPage.drawText(student.class, {
        x: 417,
        y: 253,
        size: 26,
        color: rgb(0, 0, 0),
      });
      newPage.drawText(student.session, {
        x: 673,
        y: 253,
        size: 26,
        color: rgb(0, 0, 0),
      });
      newPage.drawText(student.dob, {
        x: 417,
        y: 181,
        size: 26,
        color: rgb(0, 0, 0),
      });
      newPage.drawText(student.admission_no, {
        x: 673,
        y: 181,
        size: 26,
        color: rgb(0, 0, 0),
      });
      newPage.drawText(student.mobile_no, {
        x: 417,
        y: 109,
        size: 26,
        color: rgb(0, 0, 0),
      });

      let text_id = `${student.session.replace("-", "")}${student.school_id}`;
      newPage.drawText(text_id, {
        x: 673,
        y: 109,
        size: 26,
        color: rgb(0, 0, 0),
      });
    }

    // Save the PDF and send it to the client
    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=ID-Card-range.pdf`);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("Error generating ID cards:", error);
    res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
}

async function selectedCeremonyCertificate(req, res) {
  const { studentIds } = req.body;
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res
      .status(400)
      .json({ message: "Invalid or empty student ID list." });
  }

  let connection;
  try {
    connection = await getConnection();
    const placeholders = studentIds.map(() => "?").join(",");
    const [students] = await connection.execute(
      `SELECT school_id, name, gender, father_name, mother_name, teacher_id 
             FROM students WHERE school_id IN (${placeholders})`,
      [...studentIds],
    );

    if (students.length === 0) {
      return res
        .status(404)
        .json({ message: "No students found for the given IDs." });
    }

    const [[schoolLogoRow]] = await connection.execute(
      "SELECT school_logo FROM teacher WHERE id = ?",
      [students[0].teacher_id],
    );

    const templatePath = path.join(__dirname, "../template/ceremony.pdf");
    const templateBytes = fs.readFileSync(templatePath);
    const templatePdf = await PDFDocument.load(templateBytes);
    const pdfDoc = await PDFDocument.create();

    pdfDoc.setTitle("Felicitation Certificates");
    pdfDoc.setAuthor("Bajrang Vidya Mandir");
    pdfDoc.setSubject("Certificate of Participation");
    pdfDoc.setProducer("PDF-LIB");
    pdfDoc.setCreator("Amrit");

    pdfDoc.registerFontkit(fontkit);
    const fontPath = path.join(__dirname, "../template/ceremony.ttf");
    const fontBytes = fs.readFileSync(fontPath);
    const boldFont = await pdfDoc.embedFont(fontBytes, { subset: true });

    for (const student of students) {
      const [templatePage] = await pdfDoc.copyPages(templatePdf, [0]);
      pdfDoc.addPage(templatePage);
      const currentPage = pdfDoc.getPages().at(-1);
      const pageWidth = currentPage.getWidth();

      const capitalizeName = (name) =>
        name
          .split(" ")
          .map(
            (word) =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
          )
          .join(" ");

      const nameText = capitalizeName(student.name);

      const parent = `${
        student.gender === "MALE" ? "S/O" : "D/O"
      } Shri. ${capitalizeName(student.father_name)} & Smt. ${capitalizeName(
        student.mother_name,
      )}`;

      currentPage.drawText(nameText, {
        x: (pageWidth - boldFont.widthOfTextAtSize(nameText, 24)) / 2,
        y: 420,
        size: 24,
        font: boldFont,
        color: rgb(0.502, 0, 0),
      });
      currentPage.drawText(parent, {
        x: (pageWidth - boldFont.widthOfTextAtSize(parent, 14)) / 2,
        y: 395,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      if (schoolLogoRow?.school_logo) {
        const schoolLogoBuffer = Buffer.from(schoolLogoRow.school_logo);
        const embeddedSchoolLogo = await pdfDoc.embedPng(schoolLogoBuffer);
        currentPage.drawImage(embeddedSchoolLogo, {
          x: (pageWidth - 90) / 2,
          y: 580,
          width: 90,
          height: 90,
        });
      }
    }

    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "inline; filename=Ceremony_Certificates.pdf",
    );
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("Error generating certificates:", error);
    res.status(500).json({ message: "Failed to generate certificates." });
  } finally {
    if (connection) await connection.release();
  }
}

async function create_excel_selected(req, res) {
  const { studentIds } = req.body;
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res
      .status(400)
      .json({ message: "Invalid or empty student ID list." });
  }

  let connection;
  try {
    connection = await getConnection();
    const placeholders = studentIds.map(() => "?").join(",");
    const [students] = await connection.execute(
      `SELECT school_id, name, father_name, mother_name, session, class
             FROM students WHERE school_id IN (${placeholders})`,
      [...studentIds],
    );

    const [subjects_rows] = await connection.execute(
      `SELECT subject FROM student_marks WHERE student_id = ?`,
      [students[0].school_id],
    );

    // Remove duplicates using Set
    let subjects = [
      "SR NO",
      "NAME",
      "FATHER NAME",
      "MOTHER NAME",
      ...new Set(subjects_rows.map((sub) => sub.subject)),
    ];

    // console.log(subjects);

    if (students.length === 0) {
      return res
        .status(404)
        .json({ message: "No students found for the given IDs." });
    }

    // Create an Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${students[0].class}`);

    // Merged Header
    worksheet.mergeCells("A1:L1");
    worksheet.getCell("A1").value =
      `               Annual Exam , ${students[0].session}                                                                  CLASS - ${students[0].class}`;
    worksheet.getCell("A1").alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell("A1").font = { bold: true, size: 20 };
    worksheet.getCell("A1").height = 25;

    worksheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2E2E2E" },
    };

    worksheet.getCell("A1").font = {
      bold: true,
      size: 14,
      color: { argb: "FFFFFF" },
    };

    const headerRow = worksheet.addRow(subjects);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "E6E6E6" },
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
          right: { style: "thin" },
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
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Class_list.xlsx",
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    // Write Excel file to response stream
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error Creating Excel:", error);
    res.status(500).json({ message: "Failed to Create Excel." });
  } finally {
    if (connection) await connection.release();
  }
}

module.exports = {
  generateVirtualIdCard,
  generateVirtualIdCards_with_session,
  selectedVirtualIdCard,
  selectedCeremonyCertificate,
  create_excel_selected,
};
