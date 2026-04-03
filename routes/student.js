const express = require("express");
const checkAuth = require("../services/checkauth");
const { getConnection } = require("../models/getConnection");
const { apiCache, clearCache } = require("../middleware/cache");
const student = express.Router();
const {
  getSchoolLogo,
  getFileCount,
  getTotalStudents,
} = require("../controllers/student");
const {
  generateVirtualIdCard,
  generateVirtualIdCards_with_session,
  selectedVirtualIdCard,
  selectedCeremonyCertificate,
} = require("../controllers/virtual_id_card");
const { sendEmail, sendOTPEmail } = require("../controllers/email");
const { create_excel_selected } = require("../controllers/create_excel_file");
const { generateCredentials } = require("../controllers/student");

// ✅ **1. Get all students for the authenticated teacher**
student.get("/", checkAuth, apiCache(10), async (req, res) => {
  try {
    const teacher_id = req.user._id;
    const studentClass =
      req.headers["studentclass"] || req.headers["Studentclass"];
    let connection = await getConnection();

    const query = `SELECT name, father_name, session, mother_name, class, school_id, 
                              COALESCE(CONCAT('data:image/png;base64,', image_base64), '/image/graduated.png') AS image 
                       FROM student_photos_view 
                       WHERE teacher_id = ? AND class = ?`;
    const [results] = await connection.execute(query, [
      teacher_id,
      studentClass,
    ]);

    connection.release();
    res.json(results);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ **2. Get a specific student by ID**
student.get("/:id", checkAuth, apiCache(10), async (req, res) => {
  try {
    const teacher_id = req.user._id;
    const studentId = req.params.id;
    let connection = await getConnection();

    const query = `SELECT name, father_name, session, mother_name, class, school_id, 
                              COALESCE(CONCAT('data:image/png;base64,', image_base64), '/image/graduated.png') AS image 
                       FROM student_photos_view 
                       WHERE teacher_id = ? AND id = ?`;
    const [results] = await connection.execute(query, [teacher_id, studentId]);

    connection.release();
    res.json(results.length > 0 ? results[0] : { error: "Student not found" });
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ **3. Add a new student**
student.post("/", checkAuth, async (req, res) => {
  try {
    const teacher_id = req.user._id;
    const {
      name,
      father_name,
      mother_name,
      session,
      class: studentClass,
      school_id,
    } = req.body;
    let connection = await getConnection();

    // Enforce limits for FREE tier
    const [countResult] = await connection.execute(
      "SELECT COUNT(*) as count FROM students WHERE teacher_id = ?",
      [teacher_id],
    );
    const studentCount = countResult[0].count;
    const tier = req.user.subscription_tier || "FREE";

    if (tier === "FREE" && studentCount >= 50) {
      connection.release();
      return res.status(403).json({
        error:
          "Free tier limit reached (50 students). Please upgrade to Premium for unlimited students.",
      });
    }

    const query = `INSERT INTO students (teacher_id, name, father_name, mother_name, session, class, school_id) 
                       VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await connection.execute(query, [
      teacher_id,
      name,
      father_name,
      mother_name,
      session,
      studentClass,
      school_id,
    ]);

    connection.release();
    clearCache(teacher_id);

    res.status(201).json({
      message: "Student added successfully",
      student_id: result.insertId,
    });
  } catch (error) {
    console.error("Error adding student:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ **4. Update student details**
student.put("/:id", checkAuth, async (req, res) => {
  try {
    const teacher_id = req.user._id;
    const studentId = req.params.id;
    const {
      name,
      father_name,
      mother_name,
      session,
      class: studentClass,
      school_id,
    } = req.body;
    let connection = await getConnection();

    const query = `UPDATE students 
                       SET name = ?, father_name = ?, mother_name = ?, session = ?, class = ?, school_id = ? 
                       WHERE id = ? AND teacher_id = ?`;
    const [result] = await connection.execute(query, [
      name,
      father_name,
      mother_name,
      session,
      studentClass,
      school_id,
      studentId,
      teacher_id,
    ]);

    connection.release();
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Student not found or unauthorized" });
    }

    clearCache(teacher_id);
    res.json({ message: "Student updated successfully" });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ **5. Delete a student**
student.delete("/:id", checkAuth, async (req, res) => {
  try {
    const teacher_id = req.user._id;
    const studentId = req.params.id;
    let connection = await getConnection();

    const query = `DELETE FROM students WHERE id = ? AND teacher_id = ?`;
    const [result] = await connection.execute(query, [studentId, teacher_id]);

    connection.release();
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Student not found or unauthorized" });
    }

    clearCache(teacher_id);
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

student.get("/get/virual-card/:school_id", checkAuth, generateVirtualIdCard);
student.get(
  "/all/virual-card/:session",
  checkAuth,
  generateVirtualIdCards_with_session,
);

student.post("/virtual-cards", checkAuth, selectedVirtualIdCard);
student.post("/ceremonty-certificates", checkAuth, selectedCeremonyCertificate);

student.post("/create-excel", checkAuth, create_excel_selected);
student.post("/generate-credentials", checkAuth, generateCredentials);

// email test routes removed for security

module.exports = student;
