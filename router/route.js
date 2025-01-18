const express = require('express');
const checkAuth = require('../services/checkauth');
const { getAllStudent, insertOrUpdateStudent, getMaximumMarks, teacherLogin, get_school_logo, teacherSignup, getStudentDetails, deleteStudent, getOneStudent, getMarks, inputMarks, getPhoto, getSign } = require('../components/student');
const { generate, preview, generateAll } = require("../components/create_certificate");
const multer = require('multer');
const crypto = require('crypto');
const { getConnection } = require('../models/getConnection');
const pdf = require('pdf-lib'); // Import pdf-lib for PDF conversion
// Configure multer
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

async function getSchoolLogo(req, res) {
  let school_logo_url = "/image/graduated.png";
  const school_logo = await get_school_logo(req, res);
  if (school_logo !== null) {
    const school_logo_ = school_logo.school_logo.toString('base64');
    school_logo_url = `data:image/png;base64,${school_logo_}`;
  }
  return school_logo_url;
}


// Fetch dashboard information
router.get('/dashboard', checkAuth, async (req, res) => {
  const school_logo_url = await getSchoolLogo(req, res);
  let user = req.user;
  user.school_logo = school_logo_url;

  const teacherId = req.user._id; // Assume teacher_id is passed in the query params

  try {
    const connection = await getConnection();

    // Fetch teacher details
    const [teacher] = await connection.execute(
      'SELECT first_name, last_name, school_name, school_address, school_phone FROM teacher WHERE id = ?',
      [teacherId]
    );

    // Fetch total students assigned to the teacher
    const [studentsCount] = await connection.execute(
      'SELECT COUNT(*) AS total_students FROM students WHERE teacher_id = ?',
      [teacherId]
    );

    // Fetch student performance summaries
    const [marksSummary] = await connection.execute(
      `SELECT 
        AVG(marks1.percentage1) AS avg_percentage_term1,
        AVG(marks2.percentage2) AS avg_percentage_term2,
        AVG(marks3.percentage3) AS avg_percentage_term3
      FROM students 
      LEFT JOIN marks1 ON students.school_id = marks1.id
      LEFT JOIN marks2 ON students.school_id = marks2.id
      LEFT JOIN marks3 ON students.school_id = marks3.id
      WHERE students.teacher_id = ?`,
      [teacherId]
    );

    // Fetch recent uploads by the teacher's students
    const [recentFiles] = await connection.execute(
      `SELECT file_name, upload_date, students.name AS student_name 
      FROM student_files 
      INNER JOIN students ON student_files.school_id = students.school_id 
      WHERE students.teacher_id = ? 
      ORDER BY upload_date DESC 
      LIMIT 5`,
      [teacherId]
    );

    const nonce = 'ozfWMSeQ06g862KcEoWVKg==';

    // Render dashboard EJS
    res.render('index', {
      nonce,
      teacher: teacher[0],
      total_students: studentsCount[0].total_students,
      marks_summary: marksSummary[0],
      recent_files: recentFiles,
      user
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).send('Server Error');
  }
});



router.get('/certificates', checkAuth, async (req, res) => {
  try {
    const school_logo_url = await getSchoolLogo(req, res);
    let user = req.user;
    user.school_logo = school_logo_url;

    const studentlist = await getAllStudent(req, res);
    res.render('certificates', { studentlist, user });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/students', checkAuth, async (req, res) => {
  try {
    let school_logo_url = "/image/graduated.png";
    const school_logo = await get_school_logo(req, res);
    // console.log(school_logo);
    if (school_logo !== null) {
      const school_logo_ = school_logo.school_logo.toString('base64');
      school_logo_url = `data:image/png;base64,${school_logo_}`; // Convert to base64 and prepare data URL
    }

    let user = req.user;
    user.school_logo = school_logo_url;

    const studentlist = await getAllStudent(req, res);
    res.render('students', { studentlist, user });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).send('Internal Server Error');
  }
});

// route to search for students
router.get('/search', checkAuth, async (req, res) => {

  try {
    const school_logo_url = await getSchoolLogo(req, res);
    let user = req.user;
    user.school_logo = school_logo_url;
    const studentlist = await getStudentDetails(req, res);
    res.render('students', { studentlist, user });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).send('Internal Server Error');
  }
});

// route to edit for students
router.get('/student/edit/:id', checkAuth, async (req, res) => {
  try {

    const [student] = await getOneStudent(req, res)
    const photo = await getPhoto(req, res);
    const sign = await getSign(req, res);

    let photoDataUrl = "/image/graduated.png"; // Default photo if none exists
    let signDataUrl = "/image/sign.png"; // Default sign photo if none exists

    if (photo) {
      const photoBase64 = photo.toString('base64');
      photoDataUrl = `data:image/png;base64,${photoBase64}`; // Convert to base64 and prepare data URL
    }
    if (sign) {
      const sign64 = sign.toString('base64');
      signDataUrl = `data:image/png;base64,${sign64}`; // Convert to base64 and prepare data URL
    }

    let school_logo_url = "/image/graduated.png";
    const school_logo = await get_school_logo(req, res);
    if (school_logo !== null) {
      const school_logo_ = school_logo.school_logo.toString('base64');
      school_logo_url = `data:image/png;base64,${school_logo_}`; // Convert to base64 and prepare data URL
    }

    let user = req.user;
    user.school_logo = school_logo_url;
    // Render the profile page with the data
    res.render('profile', { student, user, photo: photoDataUrl, sign: signDataUrl, });
  } catch (error) {
    console.error('Error fetching student or photo:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Add new student (register)
router.get('/student/new', checkAuth, async (req, res) => {
  try {
    const student = null;
    let school_logo_url = "/image/user.png";
    const school_logo = await get_school_logo(req, res);
    // console.log(school_logo);
    if (school_logo !== null) {
      const school_logo_ = school_logo.school_logo.toString('base64');
      school_logo_url = `data:image/png;base64,${school_logo_}`; // Convert to base64 and prepare data URL
    }

    let user = req.user;
    user.school_logo = school_logo_url;
    let photoDataUrl = "/image/graduated.png"; // Default photo if none exists
    let sign = "/image/sign.png"; // Default photo if none exists
    res.render('register', { student, user, photo: photoDataUrl, sign: sign });
  } catch (error) {
    console.error('Error fetching student or photo:', error);
    res.status(500).send('Internal Server Error');
  }
});


// router.get("/user-image/:id", checkAuth,  async (req, res) => {
//   await getPhoto(req, res);
// })

// route to search for students_ certificate
router.get('/search_certificate', checkAuth, async (req, res) => {

  try {
    req.user.school_logo = get_school_logo(req, res);
    const user = req.user;
    const studentlist = await getStudentDetails(req, res);
    res.render('certificates', { studentlist, user });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Teacher authentication routes
router.post('/signup', upload.single("school_logo"), async (req, res) => {
  try {
    await teacherSignup(req, res);

  } catch (error) {
    console.error('Error signing up teacher:', error);
    res.status(400).send('Signup Failed');
  }
});

router.post('/login', async (req, res) => {
  try {
    const token = await teacherLogin(req, res);  // Ensure only one response is sent
  } catch (error) {
    console.error('Login error:', error);

    // Send an error response and return immediately
    return res.status(401).send('Login Failed');
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

router.get('/profile', checkAuth, async (req, res, next) => {
  const studentlist = await getAllStudent(req, res);
  res.render('index', { studentlist });
});

// Generate and Preview certificate routes
router.get('/generate/:school_id', checkAuth, async (req, res) => {
  try {
    await generate(req, res);
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).send('Error generating certificate');
  }
});

// Generate and Preview certificate routes
router.get('/student/certificate/all', checkAuth, async (req, res) => {
  try {
    await generateAll(req, res);
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).send('Error generating certificate');
  }
});

router.get('/preview/:srn_no', checkAuth, async (req, res) => {
  try {
    await preview(req, res);
  } catch (error) {
    console.error('Error previewing certificate:', error);
    res.status(500).send('Error previewing certificate');
  }
});

// Marks certificate routes
router.get('/student/marks/:id', checkAuth, async (req, res) => {
  try {
    const maxMarks = await getMaximumMarks(req, res);
    const { rows1, rows2, rows3 } = await getMarks(req, res);
    const students = await getOneStudent(req, res);
    const student = students[0];
    let school_logo_url = "/image/graduated.png";
    const school_logo = await get_school_logo(req, res);
    // console.log(maxMarks);
    if (school_logo !== null) {
      const school_logo_ = school_logo.school_logo.toString('base64');
      school_logo_url = `data:image/png;base64,${school_logo_}`; // Convert to base64 and prepare data URL
    }

    let user = req.user;
    user.school_logo = school_logo_url;
    res.render('marks', { user, student, rows1, rows2, rows3, maxMarks });

  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).send('Error generating certificate');
  }
});

router.post("/update-student/new", checkAuth, upload.fields([{ name: 'photo' }, { name: 'sign' }]), async (req, res) => {
  try {
    const studentData = req.body;
    const teacher_id = req.user._id;

    const photoFileBuffer = req.files['photo'] ? req.files['photo'][0].buffer : null;
    const signFileBuffer = req.files['sign'] ? req.files['sign'][0].buffer : null;


    // No school_id for new records
    const school_id = await insertOrUpdateStudent(studentData, photoFileBuffer, signFileBuffer, teacher_id);
    res.json({ school_id, message: "Student created successfully!" });

  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// update details 
router.post("/update-student/:id", checkAuth, upload.fields([{ name: 'photo' }, { name: 'sign' }]), async (req, res) => {
  try {
    const studentData = req.body;
    studentData.school_id = req.params.id;
    const teacher_id = req.user._id;

    const photoFileBuffer = req.files['photo'] ? req.files['photo'][0].buffer : null;
    const signFileBuffer = req.files['sign'] ? req.files['sign'][0].buffer : null;

    const [result] = await insertOrUpdateStudent(studentData, photoFileBuffer, signFileBuffer, teacher_id);
    res.json(result);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// enter marks1
router.post("/student/marks1/:id", checkAuth, async (req, res) => {
  const id = req.params.id;
  const marks = req.body;
  const result = await inputMarks("marks1", marks, id);
  if (result.affectedRows > 0) {
    res.json({ ok: "added" });
  } else if (result.changedRows > 0) {
    res.json({ ok: "changed" });
  } else {
    res.json({ message: "error" });
  }
})
// enter marks2
router.post("/student/marks2/:id", checkAuth, async (req, res) => {
  const id = req.params.id;
  const marks = req.body;
  const result = await inputMarks("marks2", marks, id);
  if (result.affectedRows > 0) {
    res.json({ ok: "added" });
  } else if (result.changedRows > 0) {
    res.json({ ok: "changed" });
  } else {
    res.json({ message: "error" });
  }
})

// enter marks3
router.post("/student/marks3/:id", checkAuth, async (req, res) => {
  const id = req.params.id;
  const marks = req.body;
  const result = await inputMarks("marks3", marks, id);

  if (result.affectedRows > 0) {
    res.json({ ok: "added" });
  } else if (result.changedRows > 0) {
    res.json({ ok: "changed" });
  } else {
    res.json({ message: "error" });
  }
})

// enter marks3
router.post("/student/max_marks/:id", checkAuth, async (req, res) => {
  const id = req.params.id;
  const marks = req.body;
  const result = await inputMarks("max", marks, id);

  if (result.affectedRows > 0) {
    res.json({ ok: "added" });
  } else if (result.changedRows > 0) {
    res.json({ ok: "changed" });
  } else {
    res.json({ message: "error" });
  }
})

// Route to upload and convert a file to PDF if necessary
router.post('/upload', upload.single('file'), async (req, res) => {
  const { school_id, file_name } = req.body;
  let { buffer, mimetype } = req.file;

  try {


    const connection = await getConnection();
    // Insert the data into the table, including file_name, mimetype (as type), and file_data
    await connection.execute(
      'INSERT INTO student_files (school_id, file_data, file_name, type) VALUES (?, ?, ?, ?)',
      [school_id, buffer, file_name, mimetype]
    );

    res.redirect(`/files/one/${school_id}`); // Redirect to the file manager page

  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('Server Error');
  }
});

// Route to fetch all files
router.get('/files', checkAuth, async (req, res) => {
  try {
    const connection = await getConnection();
    const [files] = await connection.execute(
      'SELECT id, school_id, LENGTH(file_data) AS size FROM student_files'
    );

    const school_logo_url = await getSchoolLogo(req, res);
    let user = req.user;
    user.school_logo = school_logo_url;

    res.render('files', { files, user });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).send('Server Error');
  }
});

// Route to get files for a particular student
router.get('/files/one/:school_id', checkAuth, async (req, res) => {
  const { school_id } = req.params;

  const connection = await getConnection();
  let [files] = await connection.execute(
    'SELECT id, school_id, file_name, type, upload_date, LENGTH(file_data) AS size FROM student_files where school_id = ?', [school_id]
  );

  const school_logo_url = await getSchoolLogo(req, res);
  let user = req.user;
  user.school_logo = school_logo_url;

  res.render('studentFiles', { files, user, school_id });
});

// Route to view a file
router.get('/files/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await getConnection();
    const [file] = await connection.execute(
      'SELECT file_data FROM student_files WHERE id = ?',
      [id]
    );

    if (file.length === 0) {
      return res.status(404).send('File not found');
    }

    res.contentType('application/pdf'); // Set the content type
    res.send(file[0].file_data); // Send the file data
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).send('Server Error');
  }
});

// Delete file route
router.post('/delete-file/:id', async (req, res) => {
  try {
    let connection = await getConnection();
    const fileId = req.params.id;

    // SQL query to delete the file
    const query = 'DELETE FROM student_files WHERE id = ?';

    const [result] = await connection.execute(query, [fileId]);

    if (result.affectedRows > 0) {
      res.redirect('/files'); // Redirect back to file manager after deletion
    } else {
      res.status(404).send('File not found.');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting file.');
  }
});


// Helper function to execute stored procedures
async function executeProcedure(schoolId, action) {
  let results;
  try {
    const connection = await getConnection();
    const query = 'CALL promote_or_demote_student(?, ?)';
    [results] = await connection.execute(query, [schoolId, action]);

  } catch (error) {
    console.log(error);
  }
  
  return results;
}

// Route for promoting students
router.post('/promote', checkAuth, async (req, res) => {
  const studentIds = req.body.studentIds; // Array of student school_id's to be promoted
  let errors = [];
  let success = 0;

  for (const studentId of studentIds) {
    try {
      console.log(studentId, 'promote');

      await executeProcedure(studentId, 'promote');
      success = success + 1;
    } catch (err) {
      errors.push(`Error promoting student with school_id ${studentId}: ${err.message}`);
    }
  }
  res.status(200).json({ message: `${success} students promoted successfully.` });


});

// Route for demoting students (only one definition now)
router.post('/demote', checkAuth, async (req, res) => {
  const studentIds = req.body.studentIds; // Array of student school_id's to be demoted
  let errors = [];
  let success = 0;

  for (const studentId of studentIds) {
    try {
      await executeProcedure(studentId, 'demote');
      success++;
    } catch (err) {
      errors.push(`Error demoting student with school_id ${studentId}: ${err.message}`);
    }
  }

  if (errors.length > 0) {
    res.status(400).json({ message: 'Some students could not be demoted.', errors });
  } else {
    res.status(200).json({ message: `${success} students demoted successfully.` });
  }
});

// Logout route - Clears token and redirects to login
router.get("/logout", (req, res) => {
  res.clearCookie("token").redirect("/login");
});


// Account page - Renders account management page
router.get("/account", checkAuth, (req, res) => {
  res.render('account');
});

router.get("/delete/:id", checkAuth, deleteStudent);

module.exports = router;