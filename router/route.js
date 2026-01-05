const express = require("express");
const checkAuth = require("../services/checkauth");
const {
  getAllStudent,
  teacherLogin,
  getStudentMarksBySchoolId,
  getStudentDetails,
  deleteStudent,
  teacherSignup,
  changePassword,
  get_school_logo,
  getOneStudent,
  getStudentMarks,
  storeStudentMarks,
  getPhoto,
  getSign,
  insertOrUpdateStudent,
  getFileCount,
  saveStudentMarks,
  getTotalStudents,
  getSchoolLogo,
  markStudentAsLeft,
} = require("../components/student");
const { generateCertificate } = require("../components/achievement");
const {
  generate,
  preview,
  generateAll,
} = require("../components/create_certificate");
const multer = require("multer");
const { getConnection } = require("../models/getConnection");
require("dotenv").config();

// Configure multer
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Route to get total students count
router.get("/total-students", async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const [[counts]] = await connection.execute(`
      SELECT
        (SELECT COUNT(*) FROM students) AS total_students,
        (SELECT COUNT(*) FROM teacher) AS total_teachers
    `);

    res.json(counts);
  } catch (error) {
    console.error("Error fetching total counts:", error);
    res.status(500).json({
      status: "error",
      message: error.sqlMessage || "Internal Server Error",
    });
  } finally {
    if (connection) connection.release();
  }
});

// Route to fetch the number of male and female students in each class for a given session
router.get("/students/count/:session", checkAuth, async (req, res) => {
  const { session } = req.params;
  const teacher_id = req.user._id;

  if (!session) {
    return res.status(400).json({ error: "Session parameter is required" });
  }

  const query = `
      SELECT 
          class,
          COUNT(CASE WHEN gender = 'Male' THEN 1 END) AS male_count,
          COUNT(CASE WHEN gender = 'Female' THEN 1 END) AS female_count
      FROM students
      WHERE session = ?
      and teacher_id = ?
      GROUP BY class;
  `;

  try {
    const connection = await getConnection(); // Get a connection
    const [results] = await connection.query(query, [session, teacher_id]); // Execute the query with session as a parameter
    connection.release(); // Close the connection

    res.status(200).json({ data: results });
  } catch (error) {
    console.error("Error fetching student count:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching student count" });
  }
});

// Create Certificate (Generate PDF)
router.post("/create-certificate", checkAuth, async (req, res) => {
  const { student_id, activity, date, type } = req.body;
  const position = req.body.position || 0;
  let connection;
  try {
    const connection = await getConnection();
    const [student] = await connection.execute(
      "SELECT * FROM students WHERE school_id = ?",
      [student_id],
    );
    if (student.length > 0) {
      const studentData = student[0];
      const pdfBytes = await generateCertificate(
        studentData,
        activity,
        date,
        type,
        position,
      );
      res.contentType("application/pdf");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename=${studentData.name}_ceremony.pdf`,
      );
      res.send(Buffer.from(pdfBytes));
    } else {
      res.status(404).send("Student not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

router.get("/chart-data", checkAuth, async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(`
          SELECT class AS label, COUNT(*) AS value
          FROM students
          GROUP BY class
      `);
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error("Error fetching chart data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/dashboard", checkAuth, async (req, res) => {
  const school_logo_url = await getSchoolLogo(req, res);
  let user = req.user;
  user.school_logo = school_logo_url;

  const teacherId = req.user._id;

  try {
    // Fetch total students assigned to the teacher
    const studentsCount = await getTotalStudents(req, res);

    const count_Files = await getFileCount(req, res);

    const nonce = res.locals.nonce;

    // Render dashboard EJS
    res.render("index", {
      nonce,
      total_students: studentsCount,
      files_count: count_Files,
      user,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).send("Server Error");
  }
});

router.get("/ai/chat", checkAuth, async (req, res) => {
  const school_logo_url = await getSchoolLogo(req, res);
  let user = req.user;
  user.school_logo = school_logo_url;

  const teacherId = req.user._id;

  try {
    // Fetch total students assigned to the teacher
    const studentsCount = await getTotalStudents(req, res);

    const count_Files = await getFileCount(req, res);

    const nonce = res.locals.nonce;

    // Render dashboard EJS
    res.render("google_AI", {
      nonce,
      total_students: studentsCount,
      files_count: count_Files,
      user,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).send("Server Error");
  }
});

router.get("/generate-certificate/:school_id", checkAuth, async (req, res) => {
  try {
    // Fetch total students assigned to the teacher
    const studentsCount = await getTotalStudents(req, res);
    const school_id = req.params.school_id;

    const school_logo_url = await getSchoolLogo(req, res);
    let user = req.user;
    user.school_logo = school_logo_url;

    const studentlist = await getAllStudent(req, res);
    res.render("certificates", {
      student_id: school_id,
      studentlist,
      user,
      total_students: studentsCount,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/students", checkAuth, async (req, res) => {
  try {
    let school_logo_url = "/image/graduated.png";
    const connection = await getConnection();
    const school_logo = await get_school_logo(req, res);
    if (school_logo !== null) {
      const school_logo_ = school_logo.school_logo.toString("base64");
      school_logo_url = `data:image/png;base64,${school_logo_}`; // Convert to base64 and prepare data URL
    }

    let user = req.user;
    user.school_logo = school_logo_url;

    // Fetch total students assigned to the teacher
    const [studentsCount] = await connection.execute(
      "SELECT COUNT(*) AS total_students FROM students WHERE teacher_id = ?",
      [req.user._id],
    );

    const studentlist = await getAllStudent(req, res);

    connection.release();
    res.render("students", {
      studentlist,
      user,
      total_students: studentsCount[0].total_students,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).send("Internal Server Error");
  }
});

// route to search for students
router.get("/search", checkAuth, async (req, res) => {
  try {
    const school_logo_url = await getSchoolLogo(req, res);
    let user = req.user;
    user.school_logo = school_logo_url;
    const studentlist = await getStudentDetails(req, res);
    // Fetch total students assigned to the teacher
    const studentsCount = await getTotalStudents(req, res);

    res.render("students", {
      studentlist,
      user,
      total_students: studentsCount,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).send("Internal Server Error");
  }
});

// route to edit for students
router.get("/student/edit/:id", checkAuth, async (req, res) => {
  try {
    // Fetch total students assigned to the teacher
    const studentsCount = await getTotalStudents(req, res);

    const [student] = await getOneStudent(req, res);
    const photo = await getPhoto(req, res);
    const sign = await getSign(req, res);

    let photoDataUrl = "/image/graduated.png"; // Default photo if none exists
    let signDataUrl = "/image/sign.png"; // Default sign photo if none exists

    if (photo) {
      const photoBase64 = photo.toString("base64");
      photoDataUrl = `data:image/png;base64,${photoBase64}`; // Convert to base64 and prepare data URL
    }
    if (sign) {
      const sign64 = sign.toString("base64");
      signDataUrl = `data:image/png;base64,${sign64}`; // Convert to base64 and prepare data URL
    }

    let school_logo_url = "/image/graduated.png";
    const school_logo = await get_school_logo(req, res);
    if (school_logo !== null) {
      const school_logo_ = school_logo.school_logo.toString("base64");
      school_logo_url = `data:image/png;base64,${school_logo_}`; // Convert to base64 and prepare data URL
    }

    let user = req.user;
    user.school_logo = school_logo_url;
    // Render the profile page with the data
    res.render("profile", {
      student,
      user,
      photo: photoDataUrl,
      sign: signDataUrl,
      total_students: studentsCount,
    });
  } catch (error) {
    console.error("Error fetching student or photo:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Add new student (register)
router.get("/student/new", checkAuth, async (req, res) => {
  try {
    const student = null;
    let school_logo_url = "/image/user.png";
    const school_logo = await get_school_logo(req, res);
    // Fetch total students assigned to the teacher
    const studentsCount = await getTotalStudents(req, res);
    if (school_logo !== null) {
      const school_logo_ = school_logo.school_logo.toString("base64");
      school_logo_url = `data:image/png;base64,${school_logo_}`; // Convert to base64 and prepare data URL
    }

    let user = req.user;
    user.school_logo = school_logo_url;
    let photoDataUrl = "/image/graduated.png"; // Default photo if none exists
    let sign = "/image/sign.png"; // Default photo if none exists
    res.render("register", {
      student,
      user,
      photo: photoDataUrl,
      sign: sign,
      total_students: studentsCount,
    });
  } catch (error) {
    console.error("Error fetching student or photo:", error);
    res.status(500).send("Internal Server Error");
  }
});

// route to search for students_ certificate
router.get("/search_certificate", checkAuth, async (req, res) => {
  try {
    let school_logo_url = "/image/graduated.png";
    const school_logo = await get_school_logo(req, res);
    if (school_logo !== null) {
      const school_logo_ = school_logo.school_logo.toString("base64");
      school_logo_url = `data:image/png;base64,${school_logo_}`; // Convert to base64 and prepare data URL
    }

    let user = req.user;
    user.school_logo = school_logo_url;

    const studentlist = await getStudentDetails(req, res);
    res.render("certificates", { studentlist, user });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Teacher authentication routes
router.post("/signup", upload.single("school_logo"), async (req, res) => {
  try {
    await teacherSignup(req, res);
  } catch (error) {
    console.error("Error signing up teacher:", error);
    res.status(400).send("Signup Failed");
  }
});

router.post("/change-password", checkAuth, changePassword);

router.get("/change-password", checkAuth, async (req, res) => {
  let school_logo_url = "/image/graduated.png";
  const school_logo = await get_school_logo(req, res);
  if (school_logo !== null) {
    const school_logo_ = school_logo.school_logo.toString("base64");
    school_logo_url = `data:image/png;base64,${school_logo_}`; // Convert to base64 and prepare data URL
  }

  const studentsCount = await getTotalStudents(req, res);

  let user = req.user;
  user.school_logo = school_logo_url;

  res.render("change-password", { user, total_students: studentsCount });
});

router.post("/login", async (req, res) => {
  try {
    const token = await teacherLogin(req, res); // Ensure only one response is sent
  } catch (error) {
    console.error("Login error:", error);

    // Send an error response and return immediately
    return res.status(401).send("Login Failed");
  }
});

// Login page - Redirect if already authenticated
router.get("/login", async (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    res.redirect("/dashboard");
  } else {
    res.render("login");
  }
});

// Signup page - Redirect if already authenticated
router.get("/signup", (req, res) => {
  res.render("signup");
});

// Route to get teacher details
router.get("/teacher/profile/", checkAuth, async (req, res) => {
  const teacherId = req.user._id;
  let connection;

  try {
    connection = await getConnection();
    const [rows] = await connection.execute(
      "SELECT * FROM teacher WHERE id = ?",
      [teacherId],
    );

    if (rows.length === 0) {
      return res.status(404).send("Teacher not found");
    }

    const teacher = rows[0];
    let base64Image = teacher.school_logo
      ? `data:image/png;base64,${teacher.school_logo.toString("base64")}`
      : null;

    res.render("teacher_profile", {
      teacher,
      base64Image,
      nonce: res.locals.nonce,
    });
  } catch (error) {
    console.error("Error fetching teacher details:", error);
    res.status(500).send("Internal Server Error");
  } finally {
    if (connection) connection.release();
  }
});

// Route to update teacher details
router.post(
  "/teacher/profile/update/:id",
  upload.single("school_logo"),
  async (req, res) => {
    const teacherId = req.params.id;
    const {
      first_name,
      last_name,
      email,
      school_name,
      school_address,
      school_phone,
    } = req.body;
    const school_logo = req.file ? req.file.buffer : null;

    let connection;
    try {
      connection = await getConnection();
      const query = `
          UPDATE teacher 
          SET first_name = ?, last_name = ?, email = ?, school_name = ?, 
              school_address = ?, school_phone = ?, school_logo = ?
          WHERE id = ?`;

      await connection.execute(query, [
        first_name,
        last_name,
        email,
        school_name,
        school_address,
        school_phone,
        school_logo,
        teacherId,
      ]);
      res.redirect(`/teacher/profile/${teacherId}`);
    } catch (error) {
      console.error("Error updating teacher details:", error);
      res.status(500).send("Internal Server Error");
    } finally {
      if (connection) connection.release();
    }
  },
);

// Generate and Preview Report Card routes
router.get("/generate-report/:school_id", checkAuth, async (req, res) => {
  try {
    await generate(req, res);
  } catch (error) {
    console.error("Error generating certificate:", error);
    res.status(500).send("Error generating certificate");
  }
});

// Generate and Preview certificate routes
router.get("/student/certificate/all", checkAuth, async (req, res) => {
  try {
    await generateAll(req, res);
  } catch (error) {
    console.error("Error generating certificate:", error);
    res.status(500).send("Error generating certificate");
  }
});

router.get("/preview/:srn_no", checkAuth, async (req, res) => {
  try {
    await preview(req, res);
  } catch (error) {
    console.error("Error previewing certificate:", error);
    res.status(500).send("Error previewing certificate");
  }
});

// Marks certificate routes
router.get("/student/marks/:id", checkAuth, async (req, res) => {
  try {
    const maxMarks = await getMaximumMarks(req, res);
    const { rows1, rows2, rows3 } = await getMarks(req, res);
    const students = await getOneStudent(req, res);
    const student = students[0];
    let school_logo_url = "/image/graduated.png";
    const school_logo = await get_school_logo(req, res);
    if (school_logo !== null) {
      const school_logo_ = school_logo.school_logo.toString("base64");
      school_logo_url = `data:image/png;base64,${school_logo_}`; // Convert to base64 and prepare data URL
    }

    let user = req.user;
    user.school_logo = school_logo_url;
    res.render("marks", { user, student, rows1, rows2, rows3, maxMarks });
  } catch (error) {
    console.error("Error generating certificate:", error);
    res.status(500).send("Error generating certificate");
  }
});

router.post(
  "/update-student/new",
  checkAuth,
  upload.fields([{ name: "photo" }, { name: "sign" }]),
  async (req, res) => {
    try {
      const studentData = req.body;
      const teacher_id = req.user._id;

      const photoFileBuffer = req.files["photo"]
        ? req.files["photo"][0].buffer
        : null;
      const signFileBuffer = req.files["sign"]
        ? req.files["sign"][0].buffer
        : null;

      // No school_id for new records
      const school_id = await insertOrUpdateStudent(
        studentData,
        photoFileBuffer,
        signFileBuffer,
        teacher_id,
      );
      res.json({ school_id, message: "Student created successfully!" });
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
);

// update details
router.post(
  "/update-student/:id",
  checkAuth,
  upload.fields([{ name: "photo" }, { name: "sign" }]),
  async (req, res) => {
    try {
      const studentData = req.body;
      studentData.school_id = req.params.id;
      const teacher_id = req.user._id;

      const photoFileBuffer = req.files["photo"]
        ? req.files["photo"][0].buffer
        : null;
      const signFileBuffer = req.files["sign"]
        ? req.files["sign"][0].buffer
        : null;

      const [result] = await insertOrUpdateStudent(
        studentData,
        photoFileBuffer,
        signFileBuffer,
        teacher_id,
      );
      res.json(result);
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
);

// Route to get marks for a single student by school ID
router.get("/marks/school/:schoolId", checkAuth, async (req, res) => {
  const { schoolId } = req.params;
  try {
    const marks = await getStudentMarksBySchoolId(schoolId);
    res.json(marks);
  } catch (error) {
    res.status(500).send("Error retrieving marks for student");
  }
});

// Route to get marks data
router.get("/marks/:studentId/:term", checkAuth, async (req, res) => {
  const { studentId, term } = req.params;
  try {
    const marks = await getStudentMarks(studentId, term);
    res.json(marks);
  } catch (error) {
    res.status(500).send("Error retrieving marks data");
  }
});

// Route to store marks data
router.post("/marks", checkAuth, async (req, res) => {
  const { studentId, term, marksData } = req.body;
  try {
    await storeStudentMarks(studentId, term, marksData);
    res.status(201).send("Marks data stored successfully");
  } catch (error) {
    res.status(500).send("Error storing marks data");
  }
});

// Route to display marks entry/view page
router.get("/student/get_marks/:studentId", checkAuth, async (req, res) => {
  const { studentId } = req.params;

  try {
    const connection = await getConnection();

    // Fetch total students assigned to the teacher
    const studentsCount = await getTotalStudents(req, res);

    // Fetch student details
    const [studentRows] = await connection.execute(
      "SELECT * FROM students WHERE school_id = ?",
      [studentId],
    );

    if (studentRows.length === 0) {
      connection.release();
      return res.status(404).send("Student not found");
    }

    const student = studentRows[0];

    // Fetch marks for all terms
    const [marksRows] = await connection.execute(
      "SELECT term, subject, marks FROM student_marks WHERE student_id = ?",
      [studentId],
    );

    // Organize marks by term
    const marks = {};
    marksRows.forEach((row) => {
      if (!marks[row.term]) {
        marks[row.term] = {};
      }
      marks[row.term][row.subject] = row.marks;
    });

    // Fetch maximum marks for the student's class
    const [maxMarksRows] = await connection.execute(
      "SELECT term, subject, max_marks FROM maximum_marks WHERE class = ?",
      [student.class],
    );

    // Organize max marks by term
    const maxMarks = {};
    maxMarksRows.forEach((row) => {
      if (!maxMarks[row.term]) {
        maxMarks[row.term] = {};
      }
      maxMarks[row.term][row.subject] = row.max_marks;
    });

    // Fetch performance summary
    const [performanceRows] = await connection.execute(
      "SELECT * FROM StudentPerformance WHERE school_id = ?",
      [studentId],
    );

    const [gradeRankRows] = await connection.execute(
      "SELECT * FROM student_grade_remarks WHERE student_id = ?",
      [studentId],
    );

    // Fetch attendance and status for the student
    const [[student_attendance_status]] = await connection.execute(
      "SELECT attendance, status FROM student_attendance_status WHERE student_id = ?",
      [studentId],
    );

    // user
    const school_logo_url = await getSchoolLogo(req, res);
    let user = req.user;
    user.school_logo = school_logo_url;

    connection.release();

    let subjects = [
      "ENGLISH",
      "HINDI",
      "MATHEMATICS",
      "SOCIAL SCIENCE/EVS",
      "SCIENCE",
      "COMPUTER",
      "GENERAL KNOWLEDGE",
      "DRAWING",
    ];

    if (student.class === "NURSERY" || student.class === "KG") {
      subjects = [
        "ENGLISH (WR.)",
        "ENGLISH ORAL",
        "HINDI (WR.)",
        "HINDI ORAL",
        "MATHS (WR.)",
        "MATHS ORAL",
        "DRAWING",
        "GENERAL KNOWLEDGE",
      ];
    }
    // Render the EJS view
    res.render("studentMarks", {
      user,
      student,
      subjects,
      marks,
      maxMarks,
      performance: performanceRows,
      rank_remarks: gradeRankRows,
      student_attendance_status,
      total_students: studentsCount,
    });
  } catch (error) {
    console.error("Error fetching student marks:", error);
    res.status(500).send("Internal server error");
  }
});

router.post("/student/input-marks/:studentId", checkAuth, async (req, res) => {
  const { studentId } = req.params;
  const { marks, maxMarks } = req.body; // Use `marks` and `maxMarks` directly

  try {
    if (!marks || !maxMarks) {
      throw new Error("marks or maxMarks are undefined or missing");
    }

    // Proceed to save marks if data is valid
    await saveStudentMarks(studentId, marks, maxMarks);
    res.redirect(`/student/get_marks/${studentId}`);
  } catch (error) {
    console.error("Error saving marks:", error);
    res.status(500).send("Error saving student marks");
  }
});

// POST route to insert or update attendance status
router.post("/student/attendance-status/:school_id", async (req, res) => {
  const { school_id } = req.params;
  const { attendance, status } = req.body;

  try {
    // Validate input
    if (!attendance || !status) {
      return res.status(400).send("Invalid input data");
    }

    // Get a database connection
    const connection = await getConnection();

    // Create or update data in `student_attendance_status` table
    const query = `
      INSERT INTO student_attendance_status (student_id, attendance, status)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        attendance = VALUES(attendance),
        status = VALUES(status)
    `;
    await connection.execute(query, [school_id, attendance, status]);

    // Release the connection and send response
    connection.release();
    res.redirect(`/student/get_marks/${school_id}`);
  } catch (error) {
    console.error("Error submitting/updating attendance status:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route to upload and convert a file to PDF if necessary
router.post("/upload", upload.single("file"), async (req, res) => {
  const { school_id, file_name } = req.body;
  let { buffer, mimetype } = req.file;

  try {
    const connection = await getConnection();
    // Insert the data into the table, including file_name, mimetype (as type), and file_data
    await connection.execute(
      "INSERT INTO student_files (school_id, file_data, file_name, type) VALUES (?, ?, ?, ?)",
      [school_id, buffer, file_name, mimetype],
    );

    connection.release();
    res.redirect(`/files/one/${school_id}`); // Redirect to the file manager page
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).send("Server Error");
  }
});

// Route to fetch all files
router.get("/files", checkAuth, async (req, res) => {
  try {
    // Fetch total students assigned to the teacher
    const studentsCount = await getTotalStudents(req, res);

    const connection = await getConnection();
    const [files] = await connection.execute(
      "SELECT id, school_id, LENGTH(file_data) AS size FROM student_files",
    );

    const school_logo_url = await getSchoolLogo(req, res);
    let user = req.user;
    user.school_logo = school_logo_url;

    connection.release();
    res.render("files", { files, user, total_students: studentsCount });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).send("Server Error");
  }
});

// Route to get files for a particular student
router.get("/files/one/:school_id", checkAuth, async (req, res) => {
  const { school_id } = req.params;

  const connection = await getConnection();
  let [files] = await connection.execute(
    "SELECT id, school_id, file_name, type, upload_date, LENGTH(file_data) AS size FROM student_files where school_id = ?",
    [school_id],
  );

  const school_logo_url = await getSchoolLogo(req, res);
  let user = req.user;
  user.school_logo = school_logo_url;

  // Fetch total students assigned to the teacher
  const studentsCount = await getTotalStudents(req, res);
  connection.release();
  res.render("studentFiles", {
    files,
    user,
    school_id,
    total_students: studentsCount,
  });
});

// Route to view a file
router.get("/files/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await getConnection();
    const [file] = await connection.execute(
      "SELECT file_data, type AS file_type FROM student_files WHERE id = ?",
      [id],
    );

    if (file.length === 0) {
      return res.status(404).send("File not found");
    }

    res.contentType("application/pdf"); // Set the content type
    connection.release();
    res.send(file[0].file_data); // Send the file data
  } catch (error) {
    console.error("Error fetching file:", error);
    res.status(500).send("Server Error");
  }
});

// Delete file route
router.post("/delete-file/:id", async (req, res) => {
  try {
    let connection = await getConnection();
    const fileId = req.params.id;

    // SQL query to delete the file
    const query = "DELETE FROM student_files WHERE id = ?";

    const [result] = await connection.execute(query, [fileId]);
    connection.release();
    if (result.affectedRows > 0) {
      res.redirect(`/files/one/${fileId}`); // Redirect back to file manager after deletion
    } else {
      res.status(404).send("File not found.");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting file.");
  }
});

// Helper function to execute stored procedures
async function executeProcedure(schoolId, action) {
  let results;
  let connection;
  try {
    connection = await getConnection();
    const query = "CALL promote_or_demote_student(?, ?)";
    [results] = await connection.execute(query, [schoolId, action]);
  } catch (error) {
    console.log(error);
  } finally {
    connection.release();
  }

  return results;
}

// Route for rank and grading
router.post("/action-rank/:term/:id", checkAuth, async (req, res) => {
  const { id } = req.params;
  const { term } = req.params;
  const { grade, remarks } = req.body;
  let connection;
  try {
    connection = await getConnection();
    await connection.execute(
      `INSERT INTO student_grade_remarks (student_id, grade, remarks, term) 
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       grade = VALUES(grade),
       remarks = VALUES(remarks)`,
      [id, grade, remarks, term],
    );

    connection.release();

    res.redirect(`/student/get_marks/${id}`);
  } catch (error) {
    console.error("Error ranking students:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route for promoting students
router.post("/promote", checkAuth, async (req, res) => {
  const studentIds = req.body.studentIds; // Array of student school_id's to be promoted
  let errors = [];
  let success = 0;

  for (const studentId of studentIds) {
    try {
      await executeProcedure(studentId, "promote");
      success = success + 1;
    } catch (err) {
      errors.push(
        `Error promoting student with school_id ${studentId}: ${err.message}`,
      );
    }
  }
  res
    .status(200)
    .json({ message: `${success} students promoted successfully.` });
});

// Route for demoting students (only one definition now)
router.post("/demote", checkAuth, async (req, res) => {
  const studentIds = req.body.studentIds; // Array of student school_id's to be demoted
  let errors = [];
  let success = 0;

  for (const studentId of studentIds) {
    try {
      await executeProcedure(studentId, "demote");
      success++;
    } catch (err) {
      errors.push(
        `Error demoting student with school_id ${studentId}: ${err.message}`,
      );
    }
  }

  if (errors.length > 0) {
    res
      .status(400)
      .json({ message: "Some students could not be demoted.", errors });
  } else {
    res
      .status(200)
      .json({ message: `${success} students demoted successfully.` });
  }
});

router.post("/student/mark-left/:schoolId", checkAuth, markStudentAsLeft);

router.get("/students/leaved", checkAuth, async (req, res) => {
  const school_logo_url = await getSchoolLogo(req, res);
  let user = req.user;
  user.school_logo = school_logo_url;

  const teacherId = req.user._id;

  try {
    // Fetch total students assigned to the teacher
    const studentsCount = await getTotalStudents(req, res);

    const count_Files = await getFileCount(req, res);

    const nonce = res.locals.nonce;

    const connection = await getConnection();
    const teacherId = req.user._id;
    const [students] = await connection.execute(
      "SELECT * FROM school_leaved_students where teacher_id = ?",
      [teacherId],
    );
    await connection.release();
    res.render("leave-students", {
      students,
      user,
      nonce,
      total_students: studentsCount,
      files_count: count_Files,
      user,
    }); // View: leave-students.ejs
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load leave students");
  }
});

// Logout route - Clears token and redirects to login
router.get("/logout", (req, res) => {
  res.clearCookie("token").clearCookie("introShown").send(`
    <script nonce='${res.locals.nonce}'>
      localStorage.clear();
      window.location.href = "/login";
    </script>
  `);
});

// Account page - Renders account management page
router.get("/account", checkAuth, (req, res) => {
  res.render("account");
});

router.get("/delete/:id", checkAuth, deleteStudent);

router.get("/", (req, res) => {
  res.render("landing", { nonce: res.locals.nonce });
});

router.get("/term_condition", (req, res) => {
  res.render("term_condition", { nonce: res.locals.nonce });
});

router.get("/privacy", (req, res) => {
  res.render("privacy", { nonce: res.locals.nonce });
});

router.get("/about", (req, res) => {
  res.render("about", { nonce: res.locals.nonce });
});

router.get("/security", (req, res) => {
  res.render("security", { nonce: res.locals.nonce });
});
module.exports = router;
