const express = require('express');
const checkAuth = require('../services/checkauth');
const { getAllStudent, insertOrUpdateStudent, teacherLogin, get_school_logo, teacherSignup, getStudentDetails, deleteStudent, getOneStudent, getMarks, inputMarks, getPhoto, getSign } = require('../components/student');
const { generate, preview, generateAll } = require("../components/create_certificate");
const multer = require('multer');
const { sign } = require('crypto');
// Configure multer
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Student route - Displays all students with authentication
router.get('/dashboard', checkAuth, async (req, res) => {
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
    res.render('index', { studentlist, user });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/certificates', checkAuth, async (req, res) => {
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
    req.user.school_logo = get_school_logo(req, res);
    const user = req.user;
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
router.get('/generate/:srn_no', checkAuth, async (req, res) => {
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
    const { rows1, rows2, rows3 } = await getMarks(req, res);
    const students = await getOneStudent(req, res);
    const student = students[0];
    let school_logo_url = "/image/graduated.png";
    const school_logo = await get_school_logo(req, res);
    // console.log(school_logo);
    if (school_logo !== null) {
      const school_logo_ = school_logo.school_logo.toString('base64');
      school_logo_url = `data:image/png;base64,${school_logo_}`; // Convert to base64 and prepare data URL
    }

    let user = req.user;
    user.school_logo = school_logo_url;
    res.render('marks', { user, student, rows1, rows2, rows3 });

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
//  QUESTION PAPER
router.post("/question-paper", checkAuth, async (req, res) => {
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