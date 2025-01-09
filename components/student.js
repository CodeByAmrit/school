const bcrypt = require('bcrypt');
const { setUser } = require("../services/aouth")
const { getConnection } = require('../models/getConnection');
const fs = require('fs');

saltRounds = 10;

async function getAllStudent(req, res) {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM students');
        return rows;
    } catch (error) {
        console.log(error);
        res.json({ status: error.sqlMessage });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function getOneStudent(req, res) {
    const srn_no = req.params.id;
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM students where srn_no = ?', [srn_no]);
        return rows;
    } catch (error) {
        console.log(error);
        res.json({ status: error.sqlMessage });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function getStudentDetails(req, res) {
    const { name, roll_no, class: studentClass, srn_no, father_name, mother_name, session } = req.query;
    let connection;
    try {
        connection = await getConnection();
        let query = 'SELECT * FROM students WHERE 1=1';
        const params = [];

        if (name) {
            query += ' AND name LIKE ?';
            params.push(`%${name}%`);
        }
        if (roll_no) {
            query += ' AND roll_no LIKE ?';
            params.push(`%${roll_no}%`);
        }
        if (studentClass) {
            query += ' AND class LIKE ?';
            params.push(`%${studentClass}%`);
        }
        if (srn_no) {
            query += ' AND srn_no LIKE ?';
            params.push(`%${srn_no}%`);
        }
        if (father_name) {
            query += ' AND father_name LIKE ?';
            params.push(`%${father_name}%`);
        }
        if (mother_name) {
            query += ' AND mother_name LIKE ?';
            params.push(`%${mother_name}%`);
        }
        if (session) {
            query += ' AND session LIKE ?';
            params.push(`%${session}%`);
        }

        const [rows] = await connection.execute(query, params);
        return rows;
    } catch (error) {
        console.log(error);
        res.json({ status: error.sqlMessage });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function teacherLogin(req, res) {
    let { email, password } = req.body;
    let connection;
    try {
        connection = await getConnection();

        const [rows] = await connection.execute(
            'SELECT * FROM teacher WHERE email = ?',
            [email]
        );
        if (rows.length === 0) {
            return res.json({ status: 'Invalid email' });
        }
        const teacher = rows[0];
        const passwordMatch = await bcrypt.compare(password, teacher.password);
        if (!passwordMatch) {
            return res.json({ status: 'Invalid Password' });
        }
        // res.removeHeader(Authorization)
        const payload = {
            id: teacher.id,
            first_name: teacher.first_name,
            last_name: teacher.last_name,
            email: teacher.email,
        }; // Return the logged-in teacher's details

        const token = setUser(payload);
        res.cookie('token', token, {
            httpOnly: true,
            secure: true, // Set to true if using https
            sameSite: 'Strict'
        });
        res.redirect("/")


    } catch (error) {
        res.json({ status: error.sqlMessage });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function teacherSignup(req, res) {
    const { firstName, lastName, email, password } = req.body;
    let connection;
    try {
        connection = await getConnection();
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const [result] = await connection.execute(
            'INSERT INTO teacher (first_name, last_name, email, password) VALUES (?, ?, ?, ?)',
            [firstName, lastName, email, hashedPassword]
        );
        res.redirect("/login"); // Return the new teacher's ID
    } catch (error) {
        // console.error(error);
        res.json({ status: error.sqlMessage });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function deleteStudent(req, res) {
    // Check if req.user.id is available
    const studentId = req.params.id;
    // console.log(studentId);

    if (!studentId) {
        return res.status(400).json({ message: 'Student ID required' });
    }

    let connection;
    try {
        connection = await getConnection();

        try {
            await connection.execute(`DELETE from marks1 where id = ?`, [studentId,]);
        } catch (error) {
            console.log("studentDocument", error);
        }
        try {
            await connection.execute(`DELETE from marks2 where id = ?`, [studentId,]);
        } catch (error) {
            console.log("studentDocument", error);
        }
        try {
            await connection.execute(`DELETE from marks3 where id = ?`, [studentId,]);
        } catch (error) {
            console.log("studentDocument", error);
        }

        try {
            await connection.execute(`DELETE from pdf_files where srn_no = ?`, [studentId,]);
        } catch (error) {
            console.log("studentDocument", error);
        }
        try {
            await connection.execute(`DELETE from photo where id = ?`, [studentId,]);
        } catch (error) {
            console.log("studentDocument", error);
        }

        const [result] = await connection.execute(`DELETE from students where srn_no = ?`, [studentId,]);
        const user = req.user;
        if (result.affectedRows === 0) {
            const studentlist = await getAllStudent(req, res);
            const error_message = `No Student found with SRN NO - ${studentId} to delete.`;
            return res.status(400).render("students", { studentlist, user, error_message });
        }
        if (result.affectedRows > 0) {
            const studentlist = await getAllStudent(req, res);
            const message = `Student with SRN No. ${studentId} has been deleted successfully.`;
            return res.status(200).render("students", { studentlist, user, message });
        }
        // res.status(200).render({ message: 'Student Deleted successfully', studentId: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.sqlMessage });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function insertPDF(req, res) {
    let connection;
    const student_id = req.body.student_id;
    const pdf_from_body = req.file.buffer;

    if (!pdf_from_body || !student_id) {
        console.log("No PDF file or student_id");
        res.status(400).json({ result: 'Invalid request, missing PDF or student_id' });
        return;
    }

    try {
        connection = await getConnection();

        // Check if the record already exists
        const checkSql = 'SELECT COUNT(*) as count FROM studentDocument WHERE student_id = ?';
        const [checkResult] = await connection.execute(checkSql, [student_id]);

        if (checkResult[0].count > 0) {
            // Record exists, update it
            const updateSql = 'UPDATE studentDocument SET document = ? WHERE student_id = ?';
            await connection.execute(updateSql, [pdf_from_body, student_id]);
            res.status(200).json({ result: 'Document updated successfully' });
        } else {
            // Record does not exist, insert new record
            const insertSql = 'INSERT INTO studentDocument (student_id, document) VALUES (?, ?)';
            await connection.execute(insertSql, [student_id, pdf_from_body]);
            res.status(200).json({ result: 'Document uploaded successfully' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ result: error.sqlMessage.toString() });
    } finally {
        if (connection) {
            await connection.end();
            console.log("disconnect");
        }
    }
}


module.exports = {
    getAllStudent, teacherLogin, getStudentDetails, deleteStudent, getOneStudent, insertPDF
}