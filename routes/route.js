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
  getStudentResult,
} = require("../controllers/student");
const {
  getMarksAnalytics,
  getIndividualAnalytics,
} = require("../controllers/analytics");

const {
  getTotalStudentsCounts,
  getStudentsCountBySession,
  getChartData,
  getDashboardView,
  getAiChatView,
} = require("../controllers/dashboard");
const { generateCertificate } = require("../controllers/achievement");
const {
  generate,
  preview,
  generateAll,
} = require("../controllers/create_certificate");
const multer = require("multer");
const { getConnection } = require("../models/getConnection");
const { loginLimiter } = require("../middleware/security");
const { body, validationResult } = require("express-validator");
const { apiCache } = require("../middleware/cache");
require("dotenv").config();

// Configure multer
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Route to get total students count
router.get("/total-students", getTotalStudentsCounts);

// Route to fetch the number of male and female students in each class for a given session
router.get("/students/count/:session", checkAuth, getStudentsCountBySession);

router.post("/action-rank/:term/:id", checkAuth, async (req, res) => {
  const studentId = req.params.id;
  const term = req.params.term;
  const remarks = req.body.remarks;
  const grade = req.body.grade;
  const session = req.body.session;
  const class_name = req.body.class_name;

  try {
    const isOwner = await checkStudentOwnership(studentId, req.user._id);
    if (!isOwner) {
      return res
        .status(404)
        .json({ error: "Student not found or unauthorized." });
    }

    const connection = await getConnection();
    const query = `
            INSERT INTO student_grade_remarks (student_id, term, session, class_name, grade, remarks) 
            VALUES (?, ?, ?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE grade = VALUES(grade), remarks = VALUES(remarks)
        `;

    await connection.execute(query, [
      studentId,
      term,
      session,
      class_name,
      grade,
      remarks,
    ]);
    connection.release();

    res.json({ message: "Remark saved successfully!" });
  } catch (error) {
    console.error("Error saving remark:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/create-certificate", checkAuth, async (req, res) => {
  const { student_id, activity, date, type } = req.body;
  const position = req.body.position || 0;
  let connection;
  try {
    connection = await getConnection();
    const [student] = await connection.execute(
      "SELECT * FROM students WHERE school_id = ? AND teacher_id = ?",
      [student_id, req.user._id],
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

router.get("/chart-data", checkAuth, getChartData);

router.get("/dashboard", checkAuth, apiCache(30), getDashboardView);

router.get("/ai/chat", checkAuth, getAiChatView);

router.get("/generate-certificate/:school_id", checkAuth, async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const school_id = req.params.school_id;

    // Verify student ownership
    const [studentCheck] = await connection.execute(
      "SELECT school_id FROM students WHERE school_id = ? AND teacher_id = ?",
      [school_id, req.user._id],
    );

    if (studentCheck.length === 0) {
      return res.status(404).send("Student not found or access denied.");
    }

    // Fetch total students assigned to the teacher
    const studentsCount = await getTotalStudents(req, res);
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
  } finally {
    if (connection) connection.release();
  }
});

router.get("/students", checkAuth, apiCache(30), async (req, res) => {
  let connection;
  try {
    const school_logo_url = await getSchoolLogo(req, res);
    let user = req.user;
    user.school_logo = school_logo_url;

    // Fetch total students assigned to the teacher
    const [studentsCount] = await connection.execute(
      "SELECT COUNT(*) AS total_students FROM students WHERE teacher_id = ?",
      [req.user._id],
    );

    const studentlist = await getAllStudent(req, res);

    res.render("students", {
      studentlist,
      user,
      total_students: studentsCount[0].total_students,
      query: req.query,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).send("Internal Server Error");
  } finally {
    if (connection) connection.release();
  }
});

// route to search for students
router.get("/search", checkAuth, apiCache(15), async (req, res) => {
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
      query: req.query,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).send("Internal Server Error");
  }
});

// route to analytics platform
router.get("/analytics", checkAuth, getMarksAnalytics);

// route to individual student analytics
router.get("/student/analytics/:id", checkAuth, getIndividualAnalytics);

// route to edit for students
router.get("/student/edit/:id", checkAuth, async (req, res) => {
  try {
    // Fetch total students assigned to the teacher
    const studentsCount = await getTotalStudents(req, res);
    const id = req.params.id;
    const [student] = await getOneStudent(req, res);
    if (!student) {
      return res.status(404).send("Student not found or access denied.");
    }

    // Base64 reduction: Send binary API URLs instead of massive strings
    const photoDataUrl = `/api/student/photo/${id}`;
    const signDataUrl = `/api/student/sign/${id}`;

    let school_logo_url = "/image/graduated.png";
    const school_logo = await get_school_logo(req, res);
    if (school_logo !== null) {
      const school_logo_ = school_logo.school_logo.toString("base64");
      school_logo_url = `data:image/png;base64,${school_logo_}`;
    }

    let user = req.user;
    user.school_logo = school_logo_url;
    // Render the profile page with the binary URLs
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
    const school_logo_url = await getSchoolLogo(req, res);

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
    const school_logo_url = await getSchoolLogo(req, res);

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

router.post(
  "/change-password",
  checkAuth,
  [
    body("currentPassword", "Current password is required").notEmpty(),
    body(
      "newPassword",
      "New password must be at least 8 characters long",
    ).isLength({ min: 8 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    return changePassword(req, res);
  },
);

router.get("/change-password", checkAuth, async (req, res) => {
  const school_logo_url = await getSchoolLogo(req, res);

  const studentsCount = await getTotalStudents(req, res);

  let user = req.user;
  user.school_logo = school_logo_url;

  res.render("change-password", { user, total_students: studentsCount });
});

router.post(
  "/login",
  loginLimiter,
  [
    body("email", "Invalid email address").isEmail(),
    body("password", "Password is required").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const token = await teacherLogin(req);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 3600000,
      });

      return res.json({ status: "success", token });
    } catch (err) {
      if (err.message === "INVALID_CREDENTIALS") {
        return res.status(401).json({ status: "Invalid credentials" });
      }

      console.error("Login route error:", err);
      return res.status(500).json({ status: "Internal Server Error" });
    }
  },
);

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

// Navigation pages
router.get("/features", (req, res) => {
  res.render("features", { nonce: res.locals.nonce });
});

router.get("/pricing", (req, res) => {
  res.render("pricing", { nonce: res.locals.nonce });
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
    const base64Image = await getSchoolLogo(req, res);

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

// Profile Update - SECURED (IDOR Fix)
router.post("/teacher/profile/update/:id", checkAuth, async (req, res) => {
  const teacherId = req.params.id;

  // Authorization check: Teacher can only update their own profile
  if (req.user._id != teacherId) {
    return res.status(403).json({
      error: "Unauthorized: You can only update your own profile.",
    });
  }

  const { school_name, school_phone, school_email, school_address } = req.body;

  try {
    const connection = await getConnection();
    const [result] = await connection.execute(
      "UPDATE teacher SET school_name = ?, school_phone = ?, school_email = ?, school_address = ? WHERE id = ?",
      [school_name, school_phone, school_email, school_address, teacherId],
    );

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Teacher profile not found." });
    }

    res.json({ message: "Profile updated successfully!" });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

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
  const { id } = req.params;
  let connection;
  try {
    connection = await getConnection();

    // Fetch student details and VERIFY OWNERSHIP
    const [studentRows] = await connection.execute(
      "SELECT * FROM students WHERE school_id = ? AND teacher_id = ?",
      [id, req.user._id],
    );
    if (studentRows.length === 0)
      return res.status(404).send("Student not found or access denied.");
    const student = studentRows[0];

    // Fetch marks for the student filtered by their CURRENT session and class
    const [marksRows] = await connection.execute(
      `SELECT term, subject, marks FROM student_marks 
       WHERE student_id = ? AND session = ? AND class_name = ?`,
      [id, student.session, student.class],
    );

    // Fetch maximum marks from configuration
    const [maxMarksRows] = await connection.execute(
      "SELECT subject_name as subject, max_marks FROM subject_config WHERE class_name = ? AND teacher_id = ?",
      [student.class, student.teacher_id],
    );

    // Organize data for the view
    const rows1 = marksRows.filter((m) => m.term === 1);
    const rows2 = marksRows.filter((m) => m.term === 2);
    const rows3 = marksRows.filter((m) => m.term === 3);

    const maxMarks = {};
    maxMarksRows.forEach((row) => {
      // Apply the same max_marks to all terms (1, 2, 3) for the preview view
      [1, 2, 3].forEach((term) => {
        if (!maxMarks[term]) maxMarks[term] = {};
        maxMarks[term][row.subject] = row.max_marks;
      });
    });

    const school_logo_url = await getSchoolLogo(req, res);
    let user = req.user;
    user.school_logo = school_logo_url;

    res.render("marks", { user, student, rows1, rows2, rows3, maxMarks });
  } catch (error) {
    console.error("Error generating marks sheet:", error);
    res.status(500).send("Error generating marks sheet");
  } finally {
    if (connection) connection.release();
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
  let connection;
  try {
    connection = await getConnection();
    // Verify ownership
    const [ownerCheck] = await connection.execute(
      "SELECT school_id FROM students WHERE school_id = ? AND teacher_id = ?",
      [schoolId, req.user._id],
    );

    if (ownerCheck.length === 0) {
      return res.status(404).send("Student not found or access denied.");
    }

    const marks = await getStudentMarksBySchoolId(schoolId, req.user._id);
    res.json(marks);
  } catch (error) {
    res.status(500).send("Error retrieving marks for student");
  } finally {
    if (connection) connection.release();
  }
});

// Route to get marks data
router.get("/marks/:studentId/:term", checkAuth, async (req, res) => {
  const { studentId, term } = req.params;
  let connection;
  try {
    connection = await getConnection();
    // Verify ownership
    const [ownerCheck] = await connection.execute(
      "SELECT school_id FROM students WHERE school_id = ? AND teacher_id = ?",
      [studentId, req.user._id],
    );

    if (ownerCheck.length === 0) {
      return res.status(404).send("Student not found or access denied.");
    }

    const marks = await getStudentMarks(studentId, term, req.user._id);
    res.json(marks);
  } catch (error) {
    res.status(500).send("Error retrieving marks data");
  } finally {
    if (connection) connection.release();
  }
});

// Route to store marks data
router.post("/marks", checkAuth, async (req, res) => {
  const { studentId, term, marksData } = req.body;
  try {
    await storeStudentMarks(studentId, term, marksData, req.user._id);
    res.status(201).send("Marks data stored successfully");
  } catch (error) {
    res.status(500).send("Error storing marks data");
  }
});

// Route to display marks entry/view page
router.get("/student/get_marks/:studentId", checkAuth, async (req, res) => {
  const { studentId } = req.params;
  let connection;
  try {
    connection = await getConnection();

    // Fetch total students assigned to the teacher
    const studentsCount = await getTotalStudents(req, res);

    // Fetch student details and VERIFY OWNERSHIP
    const [studentRows] = await connection.execute(
      "SELECT * FROM students WHERE school_id = ? AND teacher_id = ?",
      [studentId, req.user._id],
    );

    if (studentRows.length === 0) {
      return res.status(404).send("Student not found or access denied.");
    }

    const student = studentRows[0];

    // --- HISTORICAL DATA DETECTION ---
    // Find all sessions and classes this student has records for
    const [historyRows] = await connection.execute(
      "SELECT DISTINCT session, class_name FROM student_marks WHERE student_id = ? ORDER BY session DESC",
      [studentId],
    );

    // Check for query parameters, otherwise default to student's current session/class
    const viewSession = req.query.session || student.session;
    const viewClassName = req.query.class_name || student.class;
    const viewingHistory =
      viewSession !== student.session || viewClassName !== student.class;

    // Fetch regular marks filtered by selected session and class
    const [marksRows] = await connection.execute(
      "SELECT term, subject, marks FROM student_marks WHERE student_id = ? AND session = ? AND class_name = ?",
      [studentId, viewSession, viewClassName],
    );

    // Organize marks by term
    const marks = {};
    marksRows.forEach((row) => {
      if (!marks[row.term]) {
        marks[row.term] = {};
      }
      marks[row.term][row.subject] = row.marks;
    });

    // Fetch maximum marks for the selected class (teacher-scoped)
    const [maxMarksRows] = await connection.execute(
      "SELECT term, subject, max_marks FROM maximum_marks WHERE class = ? AND (teacher_id = ? OR teacher_id IS NULL)",
      [viewClassName, req.user._id],
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
      "SELECT * FROM StudentPerformance WHERE school_id = ? AND session = ? AND class_name = ?",
      [studentId, viewSession, viewClassName],
    );

    const [gradeRankRows] = await connection.execute(
      "SELECT * FROM student_grade_remarks WHERE student_id = ? AND session = ? AND class_name = ?",
      [studentId, viewSession, viewClassName],
    );

    // Fetch attendance and status for the student
    const [[student_attendance_status]] = await connection.execute(
      "SELECT attendance, status FROM student_attendance_status WHERE student_id = ? AND session = ? AND class_name = ?",
      [studentId, viewSession, viewClassName],
    );

    // Fetch school logo and user info
    const school_logo_url = await getSchoolLogo(req, res);
    let user = req.user;
    user.school_logo = school_logo_url;

    // --- DYNAMIC SUBJECTS LOGIC ---
    // Try to fetch subjects from database configuration first (using the class we're viewing)
    const [dbSubjects] = await connection.execute(
      "SELECT subject_name FROM subject_config WHERE teacher_id = ? AND class_name = ? ORDER BY priority",
      [user._id, viewClassName],
    );

    let subjects = [];
    if (dbSubjects.length > 0) {
      subjects = dbSubjects.map((s) => s.subject_name);
    }
    // No more hardcoded fallbacks - rely on DB config

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
      history: historyRows,
      viewSession,
      viewClassName,
      viewingHistory,
    });
  } catch (error) {
    console.error("Error fetching student marks:", error);
    res.status(500).send("Internal server error");
  } finally {
    if (connection) connection.release();
  }
});

router.post("/student/input-marks/:studentId", checkAuth, async (req, res) => {
  const { studentId } = req.params;
  const { marks, maxMarks, session, class_name } = req.body;

  try {
    if (!marks || !maxMarks) {
      return res.status(400).json({ error: "marks or maxMarks are missing" });
    }

    await saveStudentMarks(
      studentId,
      marks,
      maxMarks,
      session,
      class_name,
      req.user._id,
    );
    res.json({ message: "Marks saved successfully!" });
  } catch (error) {
    console.error("Error saving marks:", error);
    res.status(500).json({ error: "Error saving student marks" });
  }
});

// POST route to insert or update attendance status
router.post(
  "/student/attendance-status/:school_id",
  checkAuth,
  async (req, res) => {
    const { school_id } = req.params;
    const { attendance, status } = req.body;
    let connection;
    try {
      // Validate input
      if (!attendance || !status) {
        return res.status(400).json({ error: "Attendance and status are required." });
      }

      // Get a database connection
      connection = await getConnection();

      // Fetch student's current session and class and VERIFY OWNERSHIP
      const [[student]] = await connection.execute(
        "SELECT session, class FROM students WHERE school_id = ? AND teacher_id = ?",
        [school_id, req.user._id],
      );

      if (!student) {
        return res.status(404).json({ error: "Student not found or access denied." });
      }

      // Create or update data in `student_attendance_status` table
      const query = `
      INSERT INTO student_attendance_status (student_id, session, class_name, attendance, status)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        attendance = VALUES(attendance),
        status = VALUES(status)
    `;
      await connection.execute(query, [
        school_id,
        student.session,
        student.class,
        attendance,
        status,
      ]);

      res.json({ message: "Attendance & status updated successfully!" });
    } catch (error) {
      console.error("Error submitting/updating attendance status:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } finally {
      if (connection) connection.release();
    }
  },
);

// Helper for generic ownership check
async function checkStudentOwnership(school_id, teacher_id) {
  const connection = await getConnection();
  const [rows] = await connection.execute(
    "SELECT school_id FROM students WHERE school_id = ? AND teacher_id = ?",
    [school_id, teacher_id],
  );
  connection.release();
  return rows.length > 0;
}

// Upload endpoint for student files
router.post("/upload", checkAuth, upload.single("file"), async (req, res) => {
  const { school_id, type } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const isOwner = await checkStudentOwnership(school_id, req.user._id);
    if (!isOwner) {
      return res
        .status(403)
        .json({ error: "Unauthorized: You do not own this student." });
    }

    const connection = await getConnection();
    const query =
      "INSERT INTO student_files (school_id, file_name, file_data, type) VALUES (?, ?, ?, ?)";
    await connection.execute(query, [
      school_id,
      file.originalname,
      file.buffer,
      type,
    ]);
    connection.release();

    res.json({ message: "File uploaded successfully" });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Route to get files UI for a particular student
router.get("/files/one/:school_id", checkAuth, async (req, res) => {
  const { school_id } = req.params;
  let connection;
  try {
    const isOwner = await checkStudentOwnership(school_id, req.user._id);
    if (!isOwner) {
      return res.status(404).send("Student not found or unauthorized.");
    }

    connection = await getConnection();
    let [files] = await connection.execute(
      "SELECT id, school_id, file_name, type, upload_date, LENGTH(file_data) AS size FROM student_files where school_id = ?",
      [school_id],
    );

    const school_logo_url = await getSchoolLogo(req, res);
    let user = req.user;
    user.school_logo = school_logo_url;
    const studentsCount = await getTotalStudents(req, res);

    res.render("files", {
      files,
      user,
      total_students: studentsCount,
      school_id,
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).send("Server Error");
  } finally {
    if (connection) connection.release();
  }
});

// Route to view a file (IDOR FIX)
router.get("/files/:id", checkAuth, async (req, res) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await getConnection();
    const [file] = await connection.execute(
      `SELECT sf.file_data, sf.type AS file_type 
       FROM student_files sf
       JOIN students s ON sf.school_id = s.school_id
       WHERE sf.id = ? AND s.teacher_id = ?`,
      [id, req.user._id],
    );

    if (file.length === 0) {
      return res.status(404).send("File not found or unauthorized.");
    }

    res.contentType(file[0].file_type || "application/pdf");
    res.send(file[0].file_data);
  } catch (error) {
    console.error("Error fetching file:", error);
    res.status(500).send("Server Error");
  } finally {
    if (connection) connection.release();
  }
});

// Delete file route (IDOR FIX)
router.post("/delete-file/:id", checkAuth, async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const fileId = req.params.id;

    // Fetch the school_id assigned to this file FIRST AND Validate Ownership
    const [fileData] = await connection.execute(
      `SELECT sf.school_id 
       FROM student_files sf
       JOIN students s ON sf.school_id = s.school_id
       WHERE sf.id = ? AND s.teacher_id = ?`,
      [fileId, req.user._id],
    );

    if (fileData.length === 0) {
      return res.status(404).send("File not found or unauthorized.");
    }

    const school_id = fileData[0].school_id;

    // Execute the deletion
    const query = "DELETE FROM student_files WHERE id = ?";
    const [result] = await connection.execute(query, [fileId]);

    if (result.affectedRows > 0) {
      res.redirect(`/files/one/${school_id}`);
    } else {
      res.status(404).send("File could not be deleted.");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting file.");
  } finally {
    if (connection) connection.release();
  }
});

async function executeProcedure(req, res, procedureName) {
  const { studentIds } = req.body;
  const teacherId = req.user._id;

  if (!studentIds || !Array.isArray(studentIds)) {
    return res.status(400).json({ error: "Invalid student IDs" });
  }

  let connection;
  try {
    connection = await getConnection();

    // Secure the procedure execution by ensuring the student belongs to the teacher (BOLA Fix)
    for (const studentId of studentIds) {
      // Inline check for each student
      const [ownerRows] = await connection.execute(
        "SELECT school_id FROM students WHERE school_id = ? AND teacher_id = ?",
        [studentId, teacherId],
      );

      if (ownerRows.length === 0) {
        console.warn(
          `Unauthorized procedure attempt for student ${studentId} by teacher ${teacherId}`,
        );
        continue; // Skip unauthorized students
      }

      await connection.query(`CALL ${procedureName}(?)`, [studentId]);
    }

    res.json({ message: "Operation completed for authorized students." });
  } catch (error) {
    console.error(`Error executing ${procedureName}:`, error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
}

// Route for promoting students
router.post("/promote", checkAuth, async (req, res) => {
  await executeProcedure(req, res, "promote_or_demote_student");
});

// Route for demoting students
router.post("/demote", checkAuth, async (req, res) => {
  await executeProcedure(req, res, "promote_or_demote_student");
});

router.post("/student/mark-left/:schoolId", checkAuth, markStudentAsLeft);

router.get("/students/leaved", checkAuth, async (req, res) => {
  const school_logo_url = await getSchoolLogo(req, res);
  let user = req.user;
  user.school_logo = school_logo_url;

  const teacherId = req.user._id;
  let connection;
  try {
    // Fetch total students assigned to the teacher
    const studentsCount = await getTotalStudents(req, res);

    const count_Files = await getFileCount(req, res);

    const nonce = res.locals.nonce;

    connection = await getConnection();
    const teacherId = req.user._id;
    const [students] = await connection.execute(
      "SELECT * FROM school_leaved_students where teacher_id = ?",
      [teacherId],
    );
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
  } finally {
    if (connection) connection.release();
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

router.post("/delete/:id", checkAuth, deleteStudent);

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

router.get("/result", (req, res) => {
  res.render("result", {
    student: null,
    result: null,
    error: null,
    nonce: res.locals.nonce,
  });
});

router.post("/result", async (req, res) => {
  const { roll, dob } = req.body;
  let connection;
  try {
    connection = await getConnection();
    // 1. Find Student
    const [studentRows] = await connection.execute(
      "SELECT * FROM students WHERE (roll = ? OR (roll REGEXP '^[0-9]+$' AND CAST(roll AS UNSIGNED) = CAST(? AS UNSIGNED))) AND dob = ?",
      [roll, roll, dob],
    );

    if (studentRows.length === 0) {
      return res.render("result", {
        student: null,
        error:
          "Student not found. Please check your Roll Number and Date of Birth.",
        nonce: res.locals.nonce,
      });
    }
    const student = studentRows[0];
    const studentId = student.school_id;

    // 2. School Info
    const [schoolRows] = await connection.execute(
      `SELECT T.school_name, T.school_address, T.school_phone, T.school_logo 
            FROM teacher T
            JOIN students S on S.teacher_id = T.id
            WHERE S.school_id = ?`,
      [studentId],
    );
    const school = schoolRows[0] || {};

    // 3. Fetch all related academic data for the student's CURRENT session and class
    const [marks] = await connection.execute(
      "SELECT * FROM student_marks WHERE student_id = ? AND session = ? AND class_name = ? ORDER BY term, subject",
      [studentId, student.session, student.class],
    );
    const [performance] = await connection.execute(
      "SELECT * FROM StudentPerformance WHERE school_id = ? AND session = ? AND class_name = ? ORDER BY term",
      [studentId, student.session, student.class],
    );
    const [grades] = await connection.execute(
      "SELECT * FROM student_grade_remarks WHERE student_id = ? AND session = ? AND class_name = ? ORDER BY term",
      [studentId, student.session, student.class],
    );
    const [statusRows] = await connection.execute(
      "SELECT * FROM student_attendance_status WHERE student_id = ? AND session = ? AND class_name = ?",
      [studentId, student.session, student.class],
    );

    res.render("result", {
      student,
      school,
      marks,
      performance,
      grades,
      overallStatus: statusRows[0],
      error: null,
      nonce: res.locals.nonce,
    });
  } catch (error) {
    console.error("Error fetching result:", error);
    res.render("result", {
      student: null,
      error: "An error occurred while fetching your result.",
      nonce: res.locals.nonce,
    });
  } finally {
    if (connection) connection.release();
  }
});

// API route to get student details for Quick View
router.get("/api/student/details/:id", checkAuth, async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await getConnection();
    const [studentRows] = await connection.execute(
      "SELECT * FROM students WHERE school_id = ?",
      [id],
    );

    if (studentRows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(studentRows[0]);
  } catch (error) {
    console.error("Error fetching student details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
});

// API route to serve school logo
router.get("/api/school/logo", checkAuth, async (req, res) => {
  try {
    const result = await get_school_logo(req, res);
    if (result && result.school_logo) {
      res.set("Content-Type", "image/png");
      res.set("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
      res.send(result.school_logo);
    } else {
      res.redirect("/image/graduated.png");
    }
  } catch (error) {
    console.error("Error serving logo:", error);
    res.redirect("/image/graduated.png");
  }
});

// API route to serve student photo
router.get("/api/student/photo/:id", checkAuth, async (req, res) => {
  try {
    const photoBuffer = await getPhoto(req, res);
    if (photoBuffer) {
      res.set("Content-Type", "image/png");
      res.set("Cache-Control", "public, max-age=31536000"); // Cache for 1 year (using school_id as cache key)
      res.send(photoBuffer);
    } else {
      res.redirect("/image/graduated.png");
    }
  } catch (error) {
    console.error("Error serving photo:", error);
    res.redirect("/image/graduated.png");
  }
});

// API route to serve student signature
router.get("/api/student/sign/:id", checkAuth, async (req, res) => {
  try {
    const signBuffer = await getSign(req, res);
    if (signBuffer) {
      res.set("Content-Type", "image/png");
      res.set("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
      res.send(signBuffer);
    } else {
      res.redirect("/image/sign.png");
    }
  } catch (error) {
    console.error("Error serving sign:", error);
    res.redirect("/image/sign.png");
  }
});

module.exports = router;
