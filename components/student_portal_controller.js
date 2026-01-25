const { getConnection, query } = require("../models/getConnection");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sharp = require("sharp");
require("dotenv").config();

// Reusing the same secret from aouth.js logic (via process.env.jwt_token)
const chabi = process.env.jwt_token;

// Helper to generate token for student
function setStudentUser(student) {
    return jwt.sign(
        {
            _id: student.student_id, // matching req.user._id expectation
            student_id: student.student_id,
            email: student.email,
            name: student.name,
            class: student.class
        },
        chabi,
        { expiresIn: "24h" }
    );
}

const studentController = {
    // Login
    login: async (req, res) => {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        let connection;
        try {
            connection = await getConnection();
            
            // Fetch credentials
            const [creds] = await connection.execute(
                "SELECT * FROM student_credentials WHERE email = ?",
                [email]
            );

            if (creds.length === 0) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            const studentCred = creds[0];
            let isMatch = false;

            // Check password (plaintext '1234' or bcrypt hash)
            if (studentCred.password === password) {
                isMatch = true; // Handle legacy/default plaintext passwords
            } else {
                // Try bcrypt
                isMatch = await bcrypt.compare(password, studentCred.password);
            }

            if (!isMatch) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            // Fetch basic student info for token
            const [studentDetails] = await connection.execute(
                "SELECT name, class, school_id FROM students WHERE school_id = ?",
                [studentCred.student_id]
            );
            
            if (studentDetails.length === 0) {
                 return res.status(401).json({ message: "Student record not found" });
            }

            const studentData = studentDetails[0];
            const tokenPayload = {
                student_id: studentData.school_id,
                email: studentCred.email,
                name: studentData.name,
                class: studentData.class
            };

            const token = setStudentUser(tokenPayload);

            // Check if first login (last_login is NULL)
            let forceChangePassword = false;
            if (studentCred.last_login === null) {
                forceChangePassword = true;
                // Do NOT update last_login yet, wait for password change
            } else {
                // Update last login
                await connection.execute(
                    "UPDATE student_credentials SET last_login = NOW() WHERE id = ?",
                    [studentCred.id]
                );
            }

            res.json({ 
                token, 
                message: "Login successful",
                user: tokenPayload,
                forceChangePassword // Frontend should handle this
            });

        } catch (error) {
            console.error("Student Login Error:", error);
            res.status(500).json({ message: "Internal server error" });
        } finally {
            if (connection) connection.release();
        }
    },

    // Change Password (Student)
    changePassword: async (req, res) => {
        const studentId = req.user.student_id;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
             return res.status(400).json({ message: "Password must be at least 6 characters long." });
        }

        let connection;
        try {
            connection = await getConnection();
            
            // Update password and set last_login
            // Storing as plaintext for now to match '1234' legacy, OR bcrypt if you prefer.
            // User requirement said "password is their dob... forget on first login".
            // Let's use bcrypt for new password for security, consistent with teacher logic?
            // Teacher logic used bcrypt. Student login supports both.
            // Let's encrypt it.
            
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await connection.execute(
                "UPDATE student_credentials SET password = ?, last_login = NOW() WHERE student_id = ?",
                [hashedPassword, studentId]
            );

            res.json({ message: "Password changed successfully." });

        } catch (error) {
            console.error("Change Password Error:", error);
             res.status(500).json({ message: "Internal server error" });
        } finally {
             if (connection) connection.release();
        }
    },

    // Get Profile (Me)
    getProfile: async (req, res) => {
        const studentId = req.user.student_id;
        let connection;
        try {
             connection = await getConnection();
             
             // Using student_photos_view for convenience as it has base64 images
             const [rows] = await connection.execute(
                 `SELECT name, father_name, session, mother_name, class, school_id, profile_status, 
                  COALESCE(CONCAT('data:image/png;base64,', image_base64), '/image/graduated.png') AS image 
                  FROM student_photos_view 
                  WHERE school_id = ?`,
                 [studentId]
             );

             // Also fetch detailed fields from students table if not in view
             const [details] = await connection.execute(
                 `SELECT * FROM students WHERE school_id = ?`,
                  [studentId]
             );

             if (rows.length === 0 || details.length === 0) {
                 return res.status(404).json({ message: "Student not found" });
             }

             const profile = { ...details[0], ...rows[0], photo: rows[0].image_base64 };
             delete profile.image_base64; // Cleanup

             res.json(profile);
        } catch (error) {
             console.error("Get Profile Error:", error);
             res.status(500).json({ message: "Internal server error" });
        } finally {
             if (connection) connection.release();
        }
    },

    // Get Full Results
    getResult: async (req, res) => {
        const studentId = req.user.student_id;
        let connection;
        try {
            connection = await getConnection();
            // Call the stored procedure
            const [results] = await connection.query("CALL get_student_full_result(?)", [studentId]);
            
            // Stored procedure returns multiple result sets
            // 0: Student Details
            // 1: Marks per subject
            // 2: Term-wise performance
            // 3: Grade remarks
            // 4: Attendance
            // 5: School Info
            
            const response = {
                student: results[0][0],
                marks: results[1],
                performance: results[2],
                grades: results[3],
                attendance: results[4][0],
                school: results[5][0]
            };
            
            // Group marks by term for easier frontend consumption
            const terms = {};
            results[1].forEach(mark => {
                 const termKey = `Term ${mark.term}`;
                 if (!terms[termKey]) {
                     terms[termKey] = { subjects: [], percentage: 0 };
                     // Try to find percentage from performance
                     const perf = results[2].find(p => p.term === mark.term);
                     if (perf) terms[termKey].percentage = perf.percentage;
                 }
                 terms[termKey].subjects.push({
                     subject_name: mark.subject,
                     marks_obtained: mark.marks,
                     max_marks: mark.max_marks,
                     grade: "" // Calculate or fetch if needed
                 });
            });

            res.json({ ...response, terms });
        } catch (error) {
            console.error("Get Result Error:", error);
            res.status(500).json({ message: "Internal server error" });
        } finally {
            if (connection) connection.release();
        }
    },

    // Get Files
    getFiles: async (req, res) => {
        const studentId = req.user.student_id;
        let connection;
        try {
            connection = await getConnection();
            const [rows] = await connection.execute(
                "SELECT id, file_name, type, upload_date FROM student_files WHERE school_id = ?",
                [studentId]
            );
            res.json(rows);
        } catch (error) {
             console.error("Get Files Error:", error);
             res.status(500).json({ message: "Internal server error" });
        } finally {
            if (connection) connection.release();
        }
    },

    // Download File
    downloadFile: async (req, res) => {
        const studentId = req.user.student_id;
        const fileId = req.params.id;
        let connection;
        try {
            connection = await getConnection();
            const [rows] = await connection.execute(
                "SELECT file_data, file_name, type FROM student_files WHERE id = ? AND school_id = ?",
                [fileId, studentId]
            );

            if (rows.length === 0) {
                return res.status(404).json({ message: "File not found" });
            }

            const file = rows[0];
            res.setHeader('Content-Disposition', `attachment; filename="${file.file_name}"`);
            // Determine content type based on type or extension
            if (file.type === 'PDF') res.setHeader('Content-Type', 'application/pdf');
            else res.setHeader('Content-Type', 'application/octet-stream');
            
            res.send(file.file_data);

        } catch (error) {
             console.error("Download File Error:", error);
             res.status(500).json({ message: "Internal server error" });
        } finally {
            if (connection) connection.release();
        }
    },

    // Get Settings
    getSettings: async (req, res) => {
        const studentId = req.user.student_id;
        let connection;
        try {
            connection = await getConnection();
            const [rows] = await connection.execute(
                "SELECT * FROM student_settings WHERE student_id = ?",
                [studentId]
            );
            
            if (rows.length > 0) {
                res.json(rows[0]);
            } else {
                // Create default settings if not exists
                await connection.execute(
                    "INSERT INTO student_settings (student_id) VALUES (?)",
                    [studentId]
                );
                const [newRows] = await connection.execute(
                    "SELECT * FROM student_settings WHERE student_id = ?",
                    [studentId]
                );
                res.json(newRows[0]);
            }
        } catch (error) {
             console.error("Get Settings Error:", error);
             res.status(500).json({ message: "Internal server error" });
        } finally {
            if(connection) connection.release();
        }
    },

    // Update Settings
    updateSettings: async (req, res) => {
        const studentId = req.user.student_id;
        const { theme, notifications_enabled } = req.body;
        let connection;
        try {
            connection = await getConnection();
            await connection.execute(
                "UPDATE student_settings SET theme = ?, notifications_enabled = ? WHERE student_id = ?",
                [theme, notifications_enabled, studentId]
            );
            
             const [rows] = await connection.execute(
                "SELECT * FROM student_settings WHERE student_id = ?",
                [studentId]
            );
            res.json(rows[0]);

        } catch (error) {
             console.error("Update Settings Error:", error);
             res.status(500).json({ message: "Internal server error" });
        } finally {
            if (connection) connection.release();
        }
    },

    // Get Notifications
    getNotifications: async (req, res) => {
        const studentId = req.user.student_id;
        let connection;
        try {
             connection = await getConnection();
             const [rows] = await connection.execute(
                 "SELECT * FROM student_notifications WHERE student_id = ? ORDER BY created_at DESC LIMIT 50",
                 [studentId]
             );
             res.json(rows);
        } catch (error) {
             console.error("Get Notifications Error:", error);
             res.status(500).json({ message: "Internal server error" });
        } finally {
             if (connection) connection.release();
        }
    },

    // Mark Notification Read
    markNotificationRead: async (req, res) => {
        const studentId = req.user.student_id;
        const notificationId = req.params.id;
        let connection;
        try {
            connection = await getConnection();
            await connection.execute(
                "UPDATE student_notifications SET is_read = TRUE WHERE id = ? AND student_id = ?",
                [notificationId, studentId]
            );
            res.json({ message: "Marked as read" });
        } catch (error) {
             console.error("Mark Notification Read Error:", error);
             res.status(500).json({ message: "Internal server error" });
        } finally {
             if (connection) connection.release();
        }
    }
};

module.exports = studentController;
