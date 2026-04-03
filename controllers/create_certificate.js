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
      [studentId],
    );

    if (studentResults.length === 0) {
      return res.status(404).send("Student not found.");
    }

    const student = studentResults[0];

    // Fetch marks for the student filtered by their CURRENT session and class
    const [marksResults] = await connection.execute(
      `SELECT sm.subject, sm.marks, sm.term 
             FROM student_marks sm 
             WHERE sm.student_id = ? AND sm.session = ? AND sm.class_name = ?`,
      [studentId, student.session, student.class],
    );

    // Organize marks by term
    const marksByTerm = {};
    marksResults.forEach((mark) => {
      if (!marksByTerm[mark.term]) {
        marksByTerm[mark.term] = [];
      }
      marksByTerm[mark.term].push({ subject: mark.subject, marks: mark.marks });
    });

    // Fetch maximum marks for the student's class (from the new config table for consistency)
    const [maxMarksRows] = await connection.execute(
      "SELECT subject_name as subject, max_marks FROM subject_config WHERE class_name = ? AND teacher_id = ?",
      [student.class, student.teacher_id],
    );

    // Organize max marks
    const maxMarks = {};
    maxMarksRows.forEach((row) => {
      // In subject_config, max_marks is set once per subject.
      // We apply it to all terms (1, 2, 3) for the certificate logic.
      [1, 2, 3].forEach((term) => {
        if (!maxMarks[term]) maxMarks[term] = {};
        maxMarks[term][row.subject] = row.max_marks;
      });
    });

    // Fetch grand total, total maximum marks, and percentage for each term
    const [performanceResults] = await connection.execute(
      `SELECT term, grand_total, total_max_marks, percentage 
             FROM StudentPerformance 
             WHERE school_id = ? AND session = ? AND class_name = ?`,
      [studentId, student.session, student.class],
    );

    const performanceByTerm = {};
    performanceResults.forEach((row) => {
      performanceByTerm[row.term] = {
        grandTotal: row.grand_total,
        totalMaxMarks: row.total_max_marks,
        percentage: row.percentage,
      };
    });

    // Fetch attendance and status for the student
    const [[student_attendance_status]] = await connection.execute(
      "SELECT attendance, status FROM student_attendance_status WHERE student_id = ? AND session = ? AND class_name = ?",
      [studentId, student.session, student.class],
    );

    // Fetch grade and remarks
    const [grade_remarks] = await connection.execute(
      "SELECT * FROM student_grade_remarks WHERE student_id = ? AND session = ? AND class_name = ?",
      [studentId, student.session, student.class],
    );

    // Load the certificate template
    const templatePath = path.join(
      __dirname,
      "../template/certificate_template.pdf",
    );
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);

    // Embed the bold font
    const fontPath = path.join(__dirname, "../template/Inter_18pt-Bold.ttf");
    const boldFontBytes = fs.readFileSync(fontPath);
    pdfDoc.registerFontkit(fontkit);
    const boldFont = await pdfDoc.embedFont(boldFontBytes);

    // Get the first page of the PDF
    const firstPage = pdfDoc.getPages()[0];

    // Add student details to the PDF
    firstPage.drawText(student.name, {
      x: 232,
      y: 2725,
      size: 34,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    // Add class and section with superscript for ordinal indicators
    const classText = student.class.replace(/(\d+)(st|nd|rd|th)/, "$1");
    const ordinalIndicator = student.class.match(/(\d+)(st|nd|rd|th)/)
      ? student.class.match(/(\d+)(st|nd|rd|th)/)[2]
      : "";
    firstPage.drawText(classText, {
      x: 1021,
      y: 2725,
      size: 34,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    if (ordinalIndicator) {
      firstPage.drawText(ordinalIndicator, {
        x: 1021 + boldFont.widthOfTextAtSize(classText, 34),
        y: 2725 + 10,
        size: 20,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
    }
    firstPage.drawText(` & ${student.section}`, {
      x: 1021 + boldFont.widthOfTextAtSize(classText + ordinalIndicator, 34),
      y: 2725,
      size: 34,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    firstPage.drawText(student.father_name, {
      x: 232,
      y: 2586,
      size: 34,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    firstPage.drawText(student.mother_name, {
      x: 1021,
      y: 2586,
      size: 34,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    firstPage.drawText(student.roll, {
      x: 232,
      y: 2444,
      size: 34,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    firstPage.drawText(student.session, {
      x: 1021,
      y: 2444,
      size: 34,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // attendance and status
    firstPage.drawText(student_attendance_status.attendance.toUpperCase(), {
      x: 1746,
      y: 738,
      size: 38,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    firstPage.drawText(student_attendance_status.status.toUpperCase(), {
      x: 1856,
      y: 668,
      size: 38,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

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
    let termGrandTotal = 0;

    // ---------------------- DYNAMIC SUBJECTS ----------------------
    // Try to fetch subjects from database configuration first
    const [dbSubjects] = await connection.execute(
      "SELECT subject_name FROM subject_config WHERE teacher_id = ? AND class_name = ? ORDER BY priority",
      [student.teacher_id, student.class],
    );

    let subjectOrder = [];
    if (dbSubjects.length > 0) {
      subjectOrder = dbSubjects.map((s) => s.subject_name);
    }
    // All subjects now pulled from DB config (subject_config)

    // ---------------------- DRAW MARKS ----------------------
    Object.keys(marksByTerm).forEach((term, termIndex) => {
      const termMarks = marksByTerm[term];
      const startX = startXPositions[termIndex];

      subjectOrder.forEach((subject, i) => {
        const yPosition = startYPosition - i * rowHeight;

        // find subject marks safely
        const found = termMarks.find((m) => m.subject === subject);
        const marksValue = found ? found.marks : "N/A";

        // SUBJECT NAME (draw only once - first term)
        if (termIndex === 0) {
          firstPage.drawText(subject, {
            x: 223,
            y: yPosition,
            size: 34,
            font: boldFont,
            color: rgb(0, 0, 0),
          });
        }

        // MARKS
        firstPage.drawText(marksValue.toString(), {
          x: startX,
          y: yPosition,
          size: 34,
          color: rgb(0, 0, 0),
        });

        // MAX MARKS (only first column)
        if (termIndex === 0) {
          const maxMarksForSubject = maxMarks[term]?.[subject] ?? "N/A";
          const maxInt = parseInt(maxMarksForSubject, 10);

          // Display logic for Grading subjects (max marks 0)
          let maxDisplayValue = maxMarksForSubject.toString();
          if (maxInt === 0) {
            // Check original subject names for specific labels if needed, or default to Grading
            maxDisplayValue =
              subject === "GENERAL KNOWLEDGE" ? "NA" : "Grading";
          }

          firstPage.drawText(maxDisplayValue, {
            x: 857,
            y: yPosition,
            size: 34,
            color: rgb(0, 0, 0),
          });

          if (!isNaN(maxInt) && maxInt > 0) {
            termGrandTotal += maxInt;
          }
        }
      });

      // ---------------- TOTAL + % ----------------
      const totalYPosition = startYPosition - subjectOrder.length * rowHeight;
      const performance = performanceByTerm[term] || {};

      // Total Marks (Obtained / Max)
      const obtained = performance.grandTotal?.toString() || "N/A";
      const max = performance.totalMaxMarks?.toString() || "N/A";
      const totalLabel = `${obtained} / ${max}`;

      firstPage.drawText(totalLabel, {
        x: startX,
        y: totalYPosition,
        size: 34,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      // Percentage
      const percentageYPosition = totalYPosition - 81;
      const percentage = parseFloat(performance.percentage);
      const formattedPercentage = isNaN(percentage)
        ? "N/A"
        : `${percentage.toFixed(2)}%`;

      firstPage.drawText(formattedPercentage, {
        x: startX,
        y: percentageYPosition,
        size: 34,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
    });

    let xvalue = 1293;
    let yvalue = 1161;

    grade_remarks.forEach((grade_remark, i) => {
      firstPage.drawText(grade_remark.grade, {
        x: xvalue,
        y: 1380,
        size: 34,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      firstPage.drawText(grade_remark.remarks, {
        x: 525,
        y: yvalue,
        size: 34,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      xvalue += 400;
      yvalue -= 244;
    });

    // Save the PDF and send it to the client
    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=certificate.pdf");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("Error generating certificate:", error);
    res.status(500).send("Error generating certificate.");
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  generate,
};
