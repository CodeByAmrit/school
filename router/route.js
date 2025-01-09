const express = require('express');
const checkAuth = require('../services/checkauth');
const { getAllStudent, teacherLogin, teacherSignup, getStudentDetails, deleteStudent, getOneStudent } = require('../components/student');
const { generate, preview } = require("../components/create_certificate");

const router = express.Router();

// Student route - Displays all students with authentication
router.get('/', checkAuth, async (req, res) => {
  try {
    const user = req.user;
    const studentlist = await getAllStudent(req, res);
    res.render('index', { studentlist, user });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/certificates', checkAuth, async (req, res) => {
  try {
    const user = req.user;
    const studentlist = await getAllStudent(req, res);
    res.render('certificates', { studentlist, user });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/students', checkAuth, async (req, res) => {
  try {
    const user = req.user;
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
    const user = req.user;
    const student = await getOneStudent(req, res);
    console.log('student:', student);
    res.render('profile', { student, user });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).send('Internal Server Error');
  }
});

// route to search for students_ certificate
router.get('/search_certificate', checkAuth, async (req, res) => {
  
  try {
    const user = req.user;
    const studentlist = await getStudentDetails(req, res);
    res.render('certificates', { studentlist, user });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Teacher authentication routes
router.post('/signup', async (req, res) => {
  try {
    await teacherSignup(req, res);
    res.redirect('/login'); // Redirect to login page after signup
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
router.get("/login", (req, res) => {
  const token = req.cookies.token;
  if (token) {
    res.redirect("/");
  } else {
    res.render("login");
  }
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

router.get('/preview/:srn_no', checkAuth, async (req, res) => {
  try {
    await preview(req, res);
  } catch (error) {
    console.error('Error previewing certificate:', error);
    res.status(500).send('Error previewing certificate');
  }
});

// Logout route - Clears token and redirects to login
router.get("/logout", (req, res) => {
  res.clearCookie("token").redirect("/login");
});

// Signup page - Renders signup form
// router.get("/signup", (req, res) => {
//   res.render("signup");
// });

// Account page - Renders account management page
router.get("/account", checkAuth, (req, res) => {
  res.render('account');
});

router.get("/delete/:id", checkAuth, deleteStudent);

module.exports = router;
