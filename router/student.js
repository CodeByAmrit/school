const express = require('express');
const checkAuth = require('../services/checkauth');
const { getConnection } = require("../models/getConnection");
const student = express.Router();
const { getSchoolLogo, getFileCount, getTotalStudents, } = require('../components/student');
const { generateVirtualIdCard, generateVirtualIdCards_with_session, selectedVirtualIdCard,
    selectedCeremonyCertificate, create_excel_selected } = require('../components/virtual_id_card');
const { sendEmail, sendOTPEmail } = require('../components/email');



student.get('/get/', async (req, res) => {
    try {
        const teacher_id = req.user._id;
        let connection = await getConnection();

        const query = `SELECT name, father_name, session, mother_name, class, school_id, 
                              COALESCE(CONCAT('data:image/png;base64,', image_base64), '/image/graduated.png') AS image 
                              
                       FROM student_photos_view 
                       WHERE teacher_id = ?`;
        const [results] = await connection.execute(query, [teacher_id]);

        connection.end();

        res.json(results);
    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

student.get('/', async (req, res) => {
    res.json({ message: "Student data fetched successfully" });
});


student.get('/accounts', checkAuth, async (req, res) => {
    const school_logo_url = await getSchoolLogo(req, res);
    let user = req.user;
    user.school_logo = school_logo_url;

    const teacherId = req.user._id;

    try {
        // Fetch total students assigned to the teacher
        const studentsCount = await getTotalStudents(req, res);

        const count_Files = await getFileCount(req, res);

        // Render dashboard EJS
        res.render('student-accounts', {
            total_students: studentsCount,
            files_count: count_Files,
            user
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).send('Server Error');
    }
});


student.get('/get/virual-card/:school_id', checkAuth, generateVirtualIdCard);
student.get('/all/virual-card/:session', checkAuth, generateVirtualIdCards_with_session);

student.post('/virtual-cards', checkAuth, selectedVirtualIdCard);
student.post('/ceremonty-certificates', checkAuth, selectedCeremonyCertificate);

student.post('/create-excel', checkAuth, create_excel_selected);

// email test route
student.get('/mail', checkAuth, async (req, res) => {
    // Example student data
    const studentData = {
        name: "John Doe",
        admissionStatus: "Approved",
        attendance: 95,
        marksObtained: 450,
        totalMarks: 500,
        percentage: 90,
        actionUrl: "https://student.codebyamrit.co.in/dashboard",
    };

    // Send email
    sendEmail("amritsharma54300@gmail.com", studentData);

});

student.get('/otp', checkAuth, async (req, res) => {
    // Example student data
    const studentData = {
        name: "John Doe",
        admissionStatus: "Approved",
        attendance: 95,
        marksObtained: 450,
        totalMarks: 500,
        percentage: 90,
        actionUrl: "https://student.codebyamrit.co.in/dashboard",
    };

    // Send email
    const otpStatus = sendOTPEmail("amritsharma54300@gmail.com", "654321");
    if(otpStatus){
        return res.json({message: "OTP sent successfully"});
    }
});

module.exports = student;