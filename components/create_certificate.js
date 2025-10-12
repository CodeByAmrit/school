const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit'); // Import fontkit
const sharp = require('sharp');
const { getConnection } = require('../models/getConnection');
const fs = require('fs');
const path = require('path');

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
      return res.status(404).send('Student not found.');
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

    // Fetch maximum marks for the student's class
    const [maxMarksRows] = await connection.execute(
      'SELECT term, subject, max_marks FROM maximum_marks WHERE class = ?',
      [student.class]
    );

    // Organize max marks by term
    const maxMarks = {};
    maxMarksRows.forEach((row) => {
      if (!maxMarks[row.term]) {
        maxMarks[row.term] = {};
      }
      maxMarks[row.term][row.subject] = row.max_marks;
    });

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
      };
    });

    // Fetch attendance and status for the student
    const [[student_attendance_status]] = await connection.execute(
      'SELECT attendance, status FROM student_attendance_status WHERE student_id = ?',
      [studentId]
    );

    // Fetch attendance and status for the student
    const [grade_remarks] = await connection.execute(
      'SELECT * FROM student_grade_remarks WHERE student_id = ?',
      [studentId]
    );

    // Load the certificate template
    const templatePath = path.join(
      __dirname,
      '../template/certificate_template.pdf'
    );
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);

    // Embed the bold font
    const fontPath = path.join(__dirname, '../template/Inter_18pt-Bold.ttf');
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
    const classText = student.class.replace(/(\d+)(st|nd|rd|th)/, '$1');
    const ordinalIndicator = student.class.match(/(\d+)(st|nd|rd|th)/)
      ? student.class.match(/(\d+)(st|nd|rd|th)/)[2]
      : '';
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
      } catch (error) {
        console.error('Error embedding student image:', error);
      }
    }

    // Define positions
    const startXPositions = [1293, 1695, 2087]; // X positions for Term columns
    const startYPosition = 2192; // Starting Y position for marks
    const rowHeight = 81; // Height between rows
    let termGrandTotal = 0;

    // Define the desired order of subjects
    const subjectOrder = [
      'ENGLISH',
      'HINDI',
      'MATHEMATICS',
      'SOCIAL SCIENCE/EVS',
      'SCIENCE',
      'COMPUTER',
      'DRAWING',
      'GENERAL KNOWLEDGE',
    ];

    // Iterate over each term and add marks
    Object.keys(marksByTerm).forEach((term, termIndex) => {
      const termMarks = marksByTerm[term];

      // Sort termMarks based on the desired subject order
      termMarks.sort((a, b) => {
        return (
          subjectOrder.indexOf(a.subject) - subjectOrder.indexOf(b.subject)
        );
      });

      const startX = startXPositions[termIndex];

      termMarks.forEach((mark, i) => {
        const yPosition = startYPosition - i * rowHeight;

        // Subject (bold)
        firstPage.drawText(mark.subject, {
          x: 223,
          y: yPosition,
          size: 34,
          font: boldFont,
          color: rgb(0, 0, 0),
        });

        // Marks
        firstPage.drawText(mark.marks.toString(), {
          x: startX,
          y: yPosition,
          size: 34,
          color: rgb(0, 0, 0),
        });

        // Maximum Marks (only in the first term column, at x = 226)
        if (termIndex === 0) {
          const maxMarksForSubject =
            maxMarks[term] && maxMarks[term][mark.subject]
              ? maxMarks[term][mark.subject]
              : 'N/A';
          firstPage.drawText(maxMarksForSubject.toString(), {
            x: 857,
            y: yPosition,
            size: 34,
            color: rgb(0, 0, 0),
          });
          const maxMarksForSubjectInt = parseInt(maxMarksForSubject, 10);
          if (!isNaN(maxMarksForSubjectInt)) {
            termGrandTotal += maxMarksForSubjectInt;
          }
        }
      });

      // Display Total Marks and Percentage at the correct position
      const totalYPosition = startYPosition - termMarks.length * rowHeight;
      const performance = performanceByTerm[term] || {};

      // Total Marks
      firstPage.drawText(performance.grandTotal?.toString() || 'N/A', {
        x: startX,
        y: totalYPosition,
        size: 34,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      // Percentage (display in the next line)
      const percentageYPosition = totalYPosition - 81; // Move down by 81
      const percentage = parseFloat(performance.percentage);
      const formattedPercentage = isNaN(percentage)
        ? 'N/A'
        : `${percentage.toFixed(2)}%`;
      firstPage.drawText(formattedPercentage, {
        x: startX,
        y: percentageYPosition,
        size: 34,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
    });

    firstPage.drawText(termGrandTotal.toString(), {
      x: 862,
      y: 1544,
      size: 34,
      font: boldFont,
      color: rgb(0, 0, 0),
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
    firstPage.drawText(termGrandTotal.toString(), {
      x: 862,
      y: 1544,
      size: 34,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Save the PDF and send it to the client
    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=certificate.pdf');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).send('Error generating certificate.');
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  generate,
};
