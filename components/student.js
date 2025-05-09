const bcrypt = require('bcrypt');
const { setUser } = require("../services/aouth")
const { getConnection } = require('../models/getConnection');
const { sendWelcomeEmail } = require('./email');
const fs = require('fs');
const sharp = require("sharp");

const saltRounds = 10;

async function getAllStudent(req, res) {
    const teacher_id = req.user._id;
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute(`SELECT name, father_name, session, mother_name, class, school_id, 
                              COALESCE(CONCAT('data:image/png;base64,', image_base64), '/image/graduated.png') AS image 
                              
                                FROM student_photos_view 
                                WHERE class = 'NURSERY' and teacher_id = ?`, [teacher_id]);
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
        connection.end();
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
                .resize(380, 240, { fit: sharp.fit.cover, position: sharp.gravity.center }) // Resize and crop
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
                    permanent_address, corresponding_address, mobile_no, paste_file_no, family_id, dob, profile_status, apaar_id, gender)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                student.apaar_id,
                student.gender
            ];
        } else {
            // Insert or update existing record with school_id
            query = `
                INSERT INTO students (school_id, teacher_id, name, father_name, mother_name, srn_no, pen_no, admission_no, class, session, roll, 
                    permanent_address, corresponding_address, mobile_no, paste_file_no, family_id, dob, profile_status, apaar_id, gender)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                    apaar_id = VALUES(apaar_id),
                    gender = VALUES(gender)
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
                student.apaar_id,
                student.gender
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
                .resize(380, 240, { fit: sharp.fit.cover, position: sharp.gravity.center })
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
        // let query = 'SELECT * FROM student_photos_view WHERE 1=1';
        let query = `SELECT name, father_name, session, mother_name, class, school_id, COALESCE(CONCAT('data:image/png;base64,', image_base64), '/image/graduated.png') AS image FROM student_photos_view
             WHERE teacher_id = ?`;
        const params = [req.user._id];

        if (name) {
            query += ' AND name LIKE ?';
            params.push(`%${name}%`);
        }
        if (roll_no) {
            query += ' AND roll LIKE ?';
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
        // console.log(rows);
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
    let connection;
    try {
        connection = await getConnection();

        const [[result]] = await connection.execute("select school_logo from teacher where email = ?", [email,]);
        connection.end();
        return (result);
    } catch (error) {
        return null;
    }

}

async function teacherLogin(req, res) {
    let connection;
    try {
        let { email, password } = req.body;
        email = email.trim().toLowerCase(); // Normalize email

        connection = await getConnection();

        // Fetch user with LIMIT 1 for performance boost
        const [rows] = await connection.execute(
            'SELECT id, first_name, last_name, email, password, school_name, school_address, school_phone FROM teacher WHERE email = ? LIMIT 1',
            [email]
        );

        if (rows.length === 0) {
            // Delay response slightly to prevent email enumeration attacks
            await new Promise((resolve) => setTimeout(resolve, 500));
            return res.status(401).json({ status: 'Invalid email' });
        }

        const teacher = rows[0];

        // Secure password comparison
        if (!bcrypt.compareSync(password, teacher.password)) {
            return res.status(403).json({ status: 'Invalid Password' });
        }

        // JWT Payload
        const payload = {
            id: teacher.id,
            first_name: teacher.first_name,
            last_name: teacher.last_name,
            email: teacher.email,
            school_name: teacher.school_name,
            school_address: teacher.school_address,
            school_phone: teacher.school_phone,
        };

        // Generate JWT token
        const token = setUser(payload);

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "Strict",
            maxAge: 3600000,
        });
        await connection.end();
        res.json({ status: 'success', token });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ status: 'Internal Server Error' });
    } finally {
        if (connection) await connection.end();
    }
}

async function teacherSignup(req, res) {
    const { firstName, lastName, email, password, school_name, school_address, school_phone } = req.body;
    let school_logo = null;
    if (req.file) {
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

        await sendWelcomeEmail(email, `${firstName} ${lastName}`);
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
            // Call the stored procedure
            const result = await connection.execute('CALL delete_student(?)', [school_id]);

            // Success response
            // res.status(200).json({ message: `Student with ID ${school_id} has been deleted successfully.` });
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
        } catch (err) {
            console.error(`Error executing stored procedure 'delete_student':`, err);
            res.status(500).json({ error: 'An error occurred while deleting the student record.' });
        }
    } catch (error) {
        console.error(`Database connection error:`, error);
        res.status(500).json({ message: 'Failed to connect to the database.' });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (error) {
                console.error(`Error closing the database connection:`, error);
            }
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

async function getFileCount(req, res) {
    const teacherId = req.user._id;

    const query = `
        SELECT COUNT(*) AS total_files
        FROM student_files f
        INNER JOIN students s ON f.school_id = s.school_id
        WHERE s.teacher_id = ?;
    `;

    try {
        const connection = await getConnection();
        const [rows] = await connection.execute(query, [teacherId]);
        connection.end();

        // Return the count
        return rows[0].total_files;
    } catch (error) {
        console.error("Error fetching file count:", error);
        throw new Error("An error occurred while fetching the file count.");
    }
}

async function getSchoolLogo(req, res) {
    let school_logo_url = "/image/graduated.png";
    const school_logo = await get_school_logo(req, res);
    if (school_logo !== null) {
        const school_logo_ = school_logo.school_logo.toString('base64');
        school_logo_url = `data:image/png;base64,${school_logo_}`;
    }
    return school_logo_url;
}

async function changePassword(req, res) {
    let connection;
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id; // Extracted from JWT token

        connection = await getConnection();

        // Fetch the user's current hashed password from DB
        const [rows] = await connection.execute(
            "SELECT password FROM teacher WHERE id = ? LIMIT 1",
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }

        const user = rows[0];

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(403).json({ status: "error", message: "Incorrect current password" });
        }

        // Hash new password before saving
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password in DB
        await connection.execute(
            "UPDATE teacher SET password = ? WHERE id = ?",
            [hashedPassword, userId]
        );

        res.json({ status: "success", message: "Password changed successfully" });

    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ status: "error", message: "Internal Server Error" });
    } finally {
        if (connection) await connection.end();
    }
}

async function markStudentAsLeft(req, res) {
    const { reason } = req.body;
    const studentId = req.params.schoolId;

    if (!studentId || !reason) {
        return res.status(400).json({ message: 'Student ID and reason are required.' });
    }

    const connection = await getConnection();

    try {
        await connection.beginTransaction();

        // Fetch the student record
        const [studentRows] = await connection.execute(
            'SELECT * FROM students WHERE school_id = ?',
            [studentId]
        );

        if (studentRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Student not found.' });
        }

        const student = studentRows[0];

        // Insert into school_leaved_students
        const insertQuery = `
            INSERT INTO school_leaved_students (
                original_student_id, name, father_name, mother_name, srn_no, pen_no, admission_no,
                class, session, roll, section, teacher_id, permanent_address, corresponding_address,
                mobile_no, paste_file_no, family_id, dob, profile_status, apaar_id, gender, reason
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await connection.execute(insertQuery, [
            student.school_id, student.name, student.father_name, student.mother_name, student.srn_no,
            student.pen_no, student.admission_no, student.class, student.session, student.roll,
            student.section, student.teacher_id, student.permanent_address, student.corresponding_address,
            student.mobile_no, student.paste_file_no, student.family_id, student.dob,
            student.profile_status, student.apaar_id, student.gender, reason
        ]);

        // Delete student from main table
        await connection.execute('DELETE FROM students WHERE school_id = ?', [studentId]);

        await connection.commit();

        // Redirect after success
        res.redirect('/students'); // Adjust path if needed

    } catch (err) {
        console.error('Error marking student as left:', err);
        await connection.rollback();
        res.status(500).send('An error occurred while processing the request.');
    } finally {
        await connection.end();
    }
}



module.exports = {
    getAllStudent, teacherLogin, getStudentMarksBySchoolId, getFileCount,
    getStudentDetails, deleteStudent, teacherSignup, changePassword, get_school_logo,
    getOneStudent, insertPDF, getStudentMarks, storeStudentMarks, getPhoto, getSign,
    insertOrUpdateStudent, getStudentMarksWithMaxMarks, saveStudentMarks, getTotalStudents, getSchoolLogo,
    markStudentAsLeft
}