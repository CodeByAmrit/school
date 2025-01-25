const bcrypt = require('bcrypt');
const { setUser } = require("../services/aouth")
const { getConnection } = require('../models/getConnection');
const fs = require('fs');
const sharp = require("sharp");

saltRounds = 10;

async function getAllStudent(req, res) {
    const teacher_id = req.user._id;
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM students WHERE teacher_id = ?', [teacher_id]);
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

async function getTotalStudents(req, res) {
    const teacher_id = req.user._id;
    let connection;
    try {
        connection = await getConnection();
        const [[{ total_students }]] = await connection.execute(
            'SELECT COUNT(*) AS total_students FROM students WHERE teacher_id = ?',
            [teacher_id]
        );
        return total_students;
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
    const teacher_id = req.user._id;
    const school_id = req.params.id;
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM students where school_id = ? AND teacher_id = ?', [school_id, teacher_id]);
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

async function getPhoto(req, res) {
    const school_id = req.params.id;
    const teacher_id = req.user._id;
    let connection;

    try {
        connection = await getConnection();
        const [[result]] = await connection.execute('SELECT image FROM photo WHERE id = ?', [school_id]);

        if (result && result.image) {
            // Dynamically process the image
            const pngBuffer = await sharp(result.image) // Pass the binary data directly
                .resize(300, 380, { fit: sharp.fit.cover, position: sharp.gravity.center }) // Resize and crop
                .toFormat("png") // Convert to PNG format
                .toBuffer(); // Get the processed buffer

            // Set the response content type and send the image buffer

            return (pngBuffer);
        } else {
            return null
        }
    } catch (error) {
        console.error("Error processing image:", error);
        res.status(500).send({ message: "Internal Server Error" });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}
async function getSign(req, res) {
    const school_id = req.params.id;
    const teacher_id = req.user._id;
    let connection;

    try {
        connection = await getConnection();
        const [[result]] = await connection.execute('SELECT student_sign FROM photo WHERE id = ?', [school_id]);

        if (result && result.student_sign) {
            // Dynamically process the image
            const pngBuffer = await sharp(result.student_sign) // Pass the binary data directly
                .resize(300, 380, { fit: sharp.fit.cover, position: sharp.gravity.center }) // Resize and crop
                .toFormat("png") // Convert to PNG format
                .toBuffer(); // Get the processed buffer

            // Set the response content type and send the image buffer

            return (pngBuffer);
        } else {
            return null
        }
    } catch (error) {
        console.error("Error processing image:", error);
        res.status(500).send({ message: "Internal Server Error" });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function insertOrUpdateStudent(studentData, photo, sign, teacher_id) {
    const student = studentData;
    let connection;
    let result = 0;

    try {
        if (!connection) {
            connection = await getConnection();
        }

        const isNewRecord = !student.school_id;

        let query;
        let values;

        if (isNewRecord) {
            // Insert new record without school_id
            query = `
                INSERT INTO students (teacher_id, name, father_name, mother_name, srn_no, pen_no, admission_no, class, session, roll, 
                    permanent_address, corresponding_address, mobile_no, paste_file_no, family_id, dob, profile_status, apaar_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            values = [
                teacher_id,
                student.name,
                student.father_name,
                student.mother_name,
                student.srn_no,
                student.pen_no,
                student.admission_no,
                student.class,
                student.session,
                student.roll_no,
                student.permanent_address,
                student.corresponding_address,
                student.mobile_no,
                student.paste_file_no,
                student.family_id,
                student.dob,
                student.profile_status,
                student.apaar_id
            ];
        } else {
            // Insert or update existing record with school_id
            query = `
                INSERT INTO students (school_id, teacher_id, name, father_name, mother_name, srn_no, pen_no, admission_no, class, session, roll, 
                    permanent_address, corresponding_address, mobile_no, paste_file_no, family_id, dob, profile_status, apaar_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    teacher_id = VALUES(teacher_id),
                    name = VALUES(name),
                    father_name = VALUES(father_name),
                    mother_name = VALUES(mother_name),
                    srn_no = VALUES(srn_no),
                    pen_no = VALUES(pen_no),
                    admission_no = VALUES(admission_no),
                    class = VALUES(class),
                    session = VALUES(session),
                    roll = VALUES(roll),
                    permanent_address = VALUES(permanent_address),
                    corresponding_address = VALUES(corresponding_address),
                    mobile_no = VALUES(mobile_no),
                    paste_file_no = VALUES(paste_file_no),
                    family_id = VALUES(family_id),
                    dob = VALUES(dob),
                    profile_status = VALUES(profile_status),
                    apaar_id = VALUES(apaar_id)
            `;

            values = [
                student.school_id,
                teacher_id,
                student.name,
                student.father_name,
                student.mother_name,
                student.srn_no,
                student.pen_no,
                student.admission_no,
                student.class,
                student.session,
                student.roll_no,
                student.permanent_address,
                student.corresponding_address,
                student.mobile_no,
                student.paste_file_no,
                student.family_id,
                student.dob,
                student.profile_status,
                student.apaar_id
            ];
        }

        result = await connection.query(query, values);

        if (isNewRecord) {
            // Retrieve the auto-incremented school_id
            const [rows] = await connection.query(`SELECT LAST_INSERT_ID() as school_id`);
            studentData.school_id = rows[0].school_id;
        }

    } catch (error) {
        console.log(error);
        throw new Error(error.sqlMessage || "Database error");
    } finally {
        if (connection) connection.end();
    }

    // Handle photo upload
    if (photo) {
        try {
            const processedPhoto = await sharp(photo)
                .resize(300, 380, { fit: sharp.fit.cover, position: sharp.gravity.center })
                .toFormat('png')
                .toBuffer();

            connection = await getConnection();
            const photoQuery = `
                INSERT INTO photo (id, image)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE 
                    image = VALUES(image);
            `;

            const photoValues = [student.school_id, processedPhoto]; // Use the generated or provided school_id
            await connection.query(photoQuery, photoValues);

        } catch (error) {
            console.error("Error storing photo:", error);
        } finally {
            if (connection) connection.end();
        }
    }
    if (sign) {
        try {
            const processedPhoto = await sharp(sign)
                .resize(150, 150, { fit: sharp.fit.cover, position: sharp.gravity.center })
                .toFormat('png')
                .toBuffer();

            connection = await getConnection();
            const photoQuery = `
                INSERT INTO photo (id, student_sign)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE 
                    student_sign = VALUES(student_sign);
            `;

            const photoValues = [student.school_id, processedPhoto];
            await connection.query(photoQuery, photoValues);

        } catch (error) {
            console.error("Error storing photo:", error);
        } finally {
            if (connection) connection.end();
        }
    }

    return result;
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

async function get_school_logo(req, res) {
    const email = req.user.email;
    // console.log(email);
    let connection;
    try {
        connection = await getConnection();

        const [[result]] = await connection.execute("select school_logo from teacher where email = ?", [email,]);
        // console.log(result);
        return (result);
    } catch (error) {
        return null;
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
            school_address: teacher.school_address,
            school_name: teacher.school_name,
            school_phone: teacher.school_phone
        }; // Return the logged-in teacher's details

        const token = setUser(payload);
        res.cookie('token', token, {
            httpOnly: true,
            secure: true, // Set to true if using https
            sameSite: 'Strict'
        });
        res.redirect("/dashboard",)


    } catch (error) {
        res.json({ status: error.sqlMessage });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function teacherSignup(req, res) {
    const { firstName, lastName, email, password, school_name, school_address, school_phone } = req.body;
    let school_logo = null;
    if (req.file) {
        console.log("Photo uploaded");
        school_logo = await sharp(req.file.buffer)
            .resize(300, 300, { fit: sharp.fit.cover, position: sharp.gravity.center })
            .toFormat('png')
            .toBuffer();
    }

    let connection;
    try {
        connection = await getConnection();
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Ensure school_logo is included in the query values
        const [result] = await connection.execute(
            `INSERT INTO teacher 
             (first_name, last_name, email, password, school_name, school_address, school_phone, school_logo) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [firstName, lastName, email, hashedPassword, school_name, school_address, school_phone, school_logo]
        );

        return res.render("show", { result }); // Show the result after successful insert
    } catch (error) {
        console.error(error); // Log the actual error for debugging
        res.json({ status: error.sqlMessage || "An error occurred" });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}


async function deleteStudent(req, res) {
    const school_id = req.params.id;

    if (!school_id) {
        return res.status(400).json({ message: 'Student ID required' });
    }

    let connection;
    try {
        connection = await getConnection();

        try {
            await connection.execute(`DELETE from marks1 where id = ?`, [school_id,]);
        } catch (error) {
            console.log("studentDocument", error);
        }
        try {
            await connection.execute(`DELETE from marks2 where id = ?`, [school_id,]);
        } catch (error) {
            console.log("studentDocument", error);
        }
        try {
            await connection.execute(`DELETE from marks3 where id = ?`, [school_id,]);
        } catch (error) {
            console.log("studentDocument", error);
        }
        try {
            await connection.execute(`DELETE from maximum_marks where id = ?`, [school_id,]);
        } catch (error) {
            console.log("studentDocument", error);
        }

        try {
            await connection.execute(`DELETE from student_files where school_id = ?`, [school_id,]);
        } catch (error) {
            console.log("studentDocument", error);
        }
        try {
            await connection.execute(`DELETE from photo where id = ?`, [school_id,]);
        } catch (error) {
            console.log("studentDocument", error);
        }

        const [result] = await connection.execute(`DELETE from students where school_id = ?`, [school_id,]);
        const user = req.user;
        if (result.affectedRows === 0) {
            const studentlist = await getAllStudent(req, res);
            const error_message = `No Student found with School ID - ${school_id} to delete.`;
            return res.status(400).render("students", { studentlist, user, error_message });
        }
        if (result.affectedRows > 0) {
            const studentlist = await getAllStudent(req, res);
            const message = `Student with School Id. ${school_id} has been deleted successfully.`;
            return res.status(200).render("students", { studentlist, user, message });
        }
        // res.status(200).render({ message: 'Student Deleted successfully', school_id: result });
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

// Function to get marks of a single student by school ID
async function getStudentMarksBySchoolId(schoolId) {
    const query = `
    SELECT 
      sm.subject, 
      sm.marks, 
      sm.term, 
      mm.max_marks 
    FROM student_marks sm
    JOIN maximum_marks mm 
      ON sm.subject = mm.subject 
      AND sm.term = mm.term 
      AND mm.class = (SELECT class FROM students WHERE school_id = ?)
    WHERE sm.student_id = ?
    ORDER BY sm.term, sm.subject
  `;
    try {
        const connection = await getConnection();
        const [results] = await connection.execute(query, [schoolId, schoolId]);
        await connection.end();
        return results;
    } catch (error) {
        console.error('Error fetching marks for student:', error);
        throw error;
    }
}

// Function to get student marks
async function getStudentMarks(studentId, term) {
    const query = `
    SELECT sm.*, mm.max_marks 
    FROM student_marks sm
    JOIN maximum_marks mm 
      ON sm.subject = mm.subject AND sm.term = mm.term AND mm.class = 
          (SELECT class FROM students WHERE school_id = ?)
    WHERE sm.student_id = ? AND sm.term = ?
  `;
    try {
        const connection = await getConnection();
        const [results] = await connection.execute(query, [studentId, studentId, term]);
        await connection.end();
        return results;
    } catch (error) {
        console.error('Error fetching student marks:', error);
        throw error;
    }
}

// Function to store student marks
async function storeStudentMarks(studentId, term, marksData) {
    const query = `
    INSERT INTO student_marks (student_id, term, subject, marks)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE marks = VALUES(marks)
  `;
    try {
        const connection = await getConnection();
        for (const mark of marksData) {
            await connection.execute(query, [studentId, term, mark.subject, mark.marks]);
        }
        await connection.end();
    } catch (error) {
        console.error('Error storing student marks:', error);
        throw error;
    }
}

// Fetch marks and maximum marks for a student
async function getStudentMarksWithMaxMarks(studentId) {
    const query = `
    SELECT sm.term, sm.subject, sm.marks, mm.max_marks
    FROM student_marks sm
    LEFT JOIN maximum_marks mm
      ON sm.term = mm.term AND sm.subject = mm.subject AND
         mm.class = (SELECT class FROM students WHERE school_id = ?)
    WHERE sm.student_id = ?
    ORDER BY sm.term, sm.subject;
  `;
    try {
        const connection = await getConnection();
        const [results] = await connection.execute(query, [studentId, studentId]);
        await connection.end();
        return results;
    } catch (error) {
        console.error('Error fetching marks with max marks:', error);
        throw error;
    }
}

// Save or update marks for a student
async function saveStudentMarks(studentId, marks, maxMarks) {
    const insertMarksQuery = `
        INSERT INTO student_marks (student_id, term, subject, marks)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE marks = VALUES(marks);
    `;

    const insertMaxMarksQuery = `
        INSERT INTO maximum_marks (class, term, subject, max_marks)
        VALUES ((SELECT class FROM students WHERE school_id = ?), ?, ?, ?)
        ON DUPLICATE KEY UPDATE max_marks = VALUES(max_marks);
    `;

    try {
        const connection = await getConnection();

        // Loop through the marks and maxMarks for each term
        for (let term = 0; term < marks.length; term++) {
            // Process the marks and maxMarks for each subject
            for (const subject in marks[term]) {
                const mark = marks[term][subject];
                const maxMark = maxMarks[term][subject];

                // Insert or update marks
                await connection.execute(insertMarksQuery, [studentId, term + 1, subject, mark]);

                // Insert or update maximum marks
                await connection.execute(insertMaxMarksQuery, [studentId, term + 1, subject, maxMark]);
            }
        }

        await connection.end();
    } catch (error) {
        console.error('Error saving marks:', error);
        throw error;
    }
}





module.exports = {
    getAllStudent, teacherLogin, getStudentMarksBySchoolId,
    getStudentDetails, deleteStudent, teacherSignup, get_school_logo,
    getOneStudent, insertPDF, getStudentMarks, storeStudentMarks, getPhoto, getSign,
    insertOrUpdateStudent, getStudentMarksWithMaxMarks, saveStudentMarks, getTotalStudents
}