const express = require('express');
const checkAuth = require('../services/checkauth');
const { getConnection } = require("../models/getConnection");
const student = express.Router();
const { getSchoolLogo, getFileCount, getTotalStudents } = require('../components/student');
const {generateVirtualIdCard, generateVirtualIdCards_with_session} = require('../components/virtual_id_card');

student.get('/get/', checkAuth, async (req, res) => {
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

module.exports = student;