const express = require('express');
const checkAuth = require('../services/checkauth');
const { getAllStudent, insertOrUpdateStudent, teacherLogin, teacherSignup, getStudentDetails, deleteStudent, getOneStudent, getMarks, inputMarks, getPhoto } = require('../components/student');
const { generate, preview, generateAll } = require("../components/create_certificate");
const multer = require('multer');
// Configure multer
const upload = multer({ storage: multer.memoryStorage() });

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
      
      // Fetch the student record
      const [student] = await getOneStudent(req, res);
      
      // Fetch the photo using getPhoto
      const photo = await getPhoto(req, res);

      let photoDataUrl = "/image/user.png"; // Default photo if none exists
      
      if (photo) {
          const photoBase64 = photo.toString('base64');
          photoDataUrl = `data:image/png;base64,${photoBase64}`; // Convert to base64 and prepare data URL
      }

      // Render the profile page with the data
      res.render('profile', { student, user, photo: photoDataUrl });
  } catch (error) {
      console.error('Error fetching student or photo:', error);
      res.status(500).send('Internal Server Error');
  }
});

// Add new student (register)
router.get('/student/new', checkAuth, async (req, res) => {
  try {
      const student = null;
      const user = req.user;
      let photoDataUrl = "/image/user.png"; // Default photo if none exists
      res.render('register', { student, user, photo: photoDataUrl });
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
    const user = req.user;
    res.render('marks', { user, student, rows1, rows2, rows3 });

  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).send('Error generating certificate');
  }
});

// enter marks1
router.post("/update-student/:id", checkAuth, upload.single('photo'), async (req, res) => {
  try {
    const studentData = req.body;
    const srn_no = req.params.id; // Get SRN number from URL parameter

    // Process the photo file if provided
    let photo = null;
    if (req.file) {
      photo = req.file.buffer; // Multer stores the file buffer in req.file.buffer
    }

    // Insert or update student in the database
    const [result] = await insertOrUpdateStudent(srn_no, studentData, photo);
    console.log(result);
    res.json(result); // Respond with the result from the database
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
  // console.log(result);
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
  console.log(result);
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
  // console.log(result);
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
