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

async function getMaximumMarks(req, res) {
    const school_id = req.params.id;
    let connection;
    try {
        connection = await getConnection();
        const [[marks]] = await connection.execute('SELECT * FROM maximum_marks WHERE id = ?', [school_id]);

        return marks;
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: error.sqlMessage });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function getMarks(req, res) {
    const school_id = req.params.id;
    let connection;
    try {
        connection = await getConnection();
        const [[rows1]] = await connection.execute('SELECT * FROM marks1 where id = ?', [school_id]);
        const [[rows2]] = await connection.execute('SELECT * FROM marks2 where id = ?', [school_id]);
        const [[rows3]] = await connection.execute('SELECT * FROM marks3 where id = ?', [school_id]);
        return { rows1, rows2, rows3 };
    } catch (error) {
        console.log(error);
        res.json({ status: error.sqlMessage });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function inputMarks(table, marks, school_id) {
    if (table == "marks1") {
        const {
            english1,
            hindi1,
            mathematics1,
            social_science1,
            science1,
            computer1,
            drawing1,
            gn1,
            grandTotal1,
            percentage1,
            rank1,
            remarks1,
        } = marks;

        const query = `
        INSERT INTO ${table} 
        (id, english1, hindi1, mathematics1, social_science1, science1, computer1, drawing1, gn1, grandTotal1, percentage1, rank1, remarks1)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            english1 = VALUES(english1),
            hindi1 = VALUES(hindi1),
            mathematics1 = VALUES(mathematics1),
            social_science1 = VALUES(social_science1),
            science1 = VALUES(science1),
            computer1 = VALUES(computer1),
            drawing1 = VALUES(drawing1),
            gn1 = VALUES(gn1),
            grandTotal1 = VALUES(grandTotal1),
            percentage1 = VALUES(percentage1),
            rank1 = VALUES(rank1),
            remarks1 = VALUES(remarks1)
    `;

        const values = [
            school_id,
            english1,
            hindi1,
            mathematics1,
            social_science1,
            science1,
            computer1,
            drawing1,
            gn1,
            grandTotal1,
            percentage1,
            rank1,
            remarks1,
        ];

        let connection;
        try {
            connection = await getConnection();
            const [rows] = await connection.execute(query, values);

            return { rows };

        } catch (error) {
            console.log(error);
            return { status: error.sqlMessage };
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }
    else if (table == "marks2") {
        const {
            english2,
            hindi2,
            mathematics2,
            social_science2,
            science2,
            computer2,
            drawing2,
            gn2,
            grandTotal2,
            percentage2,
            rank2,
            remarks2,
        } = marks;
        const query = `
        INSERT INTO ${table} 
        (id, english2, hindi2, mathematics2, social_science2, science2, computer2, drawing2, gn2, grandTotal2, percentage2, rank2, remarks2)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            english2 = VALUES(english2),
            hindi2 = VALUES(hindi2),
            mathematics2 = VALUES(mathematics2),
            social_science2 = VALUES(social_science2),
            science2 = VALUES(science2),
            computer2 = VALUES(computer2),
            drawing2 = VALUES(drawing2),
            gn2 = VALUES(gn2),
            grandTotal2 = VALUES(grandTotal2),
            percentage2 = VALUES(percentage2),
            rank2 = VALUES(rank2),
            remarks2 = VALUES(remarks2)
    `;

        const values = [
            school_id,
            english2,
            hindi2,
            mathematics2,
            social_science2,
            science2,
            computer2,
            drawing2,
            gn2,
            grandTotal2,
            percentage2,
            rank2,
            remarks2,
        ];

        let connection;
        try {
            connection = await getConnection();
            const [rows] = await connection.execute(query, values);

            return { rows };

        } catch (error) {
            console.log(error);
            return { status: error.sqlMessage };
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }
    else if (table == "marks3") {
        const {
            english3,
            hindi3,
            mathematics3,
            social_science3,
            science3,
            computer3,
            drawing3,
            gn3,
            grandTotal3,
            percentage3,
            rank3,
            remarks3
        } = marks;
        const query = `
        INSERT INTO ${table} 
        (id, english3, hindi3, mathematics3, social_science3, science3, computer3, drawing3, gn3, grandTotal3, percentage3, rank3, remarks3)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            english3 = VALUES(english3),
            hindi3 = VALUES(hindi3),
            mathematics3 = VALUES(mathematics3),
            social_science3 = VALUES(social_science3),
            science3 = VALUES(science3),
            computer3 = VALUES(computer3),
            drawing3 = VALUES(drawing3),
            gn3 = VALUES(gn3),
            grandTotal3 = VALUES(grandTotal3),
            percentage3 = VALUES(percentage3),
            rank3 = VALUES(rank3),
            remarks3 = VALUES(remarks3)
    `;

        const values = [
            school_id,
            english3,
            hindi3,
            mathematics3,
            social_science3,
            science3,
            computer3,
            drawing3,
            gn3,
            grandTotal3,
            percentage3,
            rank3,
            remarks3,
        ];

        let connection;
        try {
            connection = await getConnection();
            const [rows] = await connection.execute(query, values);

            return { rows };

        } catch (error) {
            console.log(error);
            return { status: error.sqlMessage };
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }
    else if (table == "max") {
        const {
            maxEng,
            maxHindi,
            maxMaths,
            maxSst,
            maxScience,
            maxComp,
            maxGn,
            maxDrawing,
            maxGrandTotal,
            maxPercentage,
            maxRank
        } = marks;

        const query = `
        INSERT INTO ${table} 
        (id, maxEng, maxHindi, maxMaths, maxSst, maxScience, maxComp, maxGn, maxDrawing, maxGrandTotal, maxPercentage, maxRank)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            maxEng = VALUES(maxEng),
            maxHindi = VALUES(maxHindi),
            maxMaths = VALUES(maxMaths),
            maxSst = VALUES(maxSst),
            maxScience = VALUES(maxScience),
            maxComp = VALUES(maxComp),
            maxGn = VALUES(maxGn),
            maxDrawing = VALUES(maxDrawing),
            maxGrandTotal = VALUES(maxGrandTotal),
            maxPercentage = VALUES(maxPercentage),
            maxRank = VALUES(maxRank)
        `;

        const values = [
            school_id,
            maxEng,
            maxHindi,
            maxMaths,
            maxSst,
            maxScience,
            maxComp,
            maxGn,
            maxDrawing,
            maxGrandTotal,

            maxRank
        ];

        let connection;
        try {
            connection = await getConnection();
            const [rows] = await connection.execute(query, values);

            return { rows };

        } catch (error) {
            console.log(error);
            return { status: error.sqlMessage };
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }

}


module.exports = {
    getAllStudent, teacherLogin, getMaximumMarks,
    getStudentDetails, deleteStudent, teacherSignup, get_school_logo,
    getOneStudent, insertPDF, getMarks, inputMarks, getPhoto, getSign, insertOrUpdateStudent
}