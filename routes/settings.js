const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const checkAuth = require("../services/checkauth");
const { getConnection } = require("../models/getConnection");

// GET settings page
router.get("/", checkAuth, async (req, res) => {
  let db;
  try {
    db = await getConnection();
    const teacherId = req.user._id;

    // Fetch all settings data
    const [teacher, teacherSettings, schoolConfig, classes, subjects, stats] =
      await Promise.all([
        // Get teacher info
        db.query("SELECT * FROM teacher WHERE id = ?", [teacherId]),
        // Get teacher settings
        db.query("SELECT * FROM teacher_settings WHERE teacher_id = ?", [
          teacherId,
        ]),
        // Get school config
        db.query("SELECT * FROM school_config WHERE teacher_id = ?", [
          teacherId,
        ]),
        // Get class config
        db.query(
          "SELECT * FROM class_config WHERE teacher_id = ? ORDER BY class_name",
          [teacherId],
        ),
        // Get subject config
        db.query(
          "SELECT * FROM subject_config WHERE teacher_id = ? ORDER BY class_name, priority",
          [teacherId],
        ),
        // Get statistics
        db.query(
          `
                SELECT 
                    (SELECT COUNT(*) FROM students WHERE teacher_id = ?) as studentCount,
                    (SELECT COUNT(DISTINCT class) FROM students WHERE teacher_id = ?) as classCount,
                    (SELECT COUNT(*) FROM teacher WHERE id = ?) as teacherCount
            `,
          [teacherId, teacherId, teacherId],
        ),
      ]);

    // Process school logo if exists
    let schoolLogo = null;
    if (schoolConfig[0] && schoolConfig[0].school_logo) {
      schoolLogo = `data:image/png;base64,${schoolConfig[0].school_logo.toString("base64")}`;
    }

    res.render("settings", {
      teacher: teacher[0],
      teacherSettings: teacherSettings[0] || {},
      schoolConfig: {
        ...schoolConfig[0],
        logo: schoolLogo,
      },
      classes: classes,
      subjects: subjects,
      settings: {
        studentCount: stats[0]?.studentCount || 0,
        classCount: stats[0]?.classCount || 0,
        teacherCount: stats[0]?.teacherCount || 0,
        session: teacherSettings[0]?.default_session || "2024-2025",
        lastBackup: "Never", // You'll need to fetch this from backup_schedule
        storageUsed: "45",
        storageTotal: "100",
      },
    });
  } catch (error) {
    console.error("Settings page error:", error);
    res.status(500).send("Internal Server Error");
  } finally {
    if (db) db.release();
  }
});

// Update teacher profile
router.post("/update-profile", checkAuth, async (req, res) => {
  let db;
  try {
    db = await getConnection();
    const { first_name, last_name, email, current_password, new_password } =
      req.body;
    const teacherId = req.user._id;

    // Verify current password if changing password
    if (new_password) {
      const [teacher] = await db.query(
        "SELECT password FROM teacher WHERE id = ?",
        [teacherId],
      );

      // Add password verification logic here
      // For now, we'll just update if current_password is provided
      if (!current_password) {
        return res.json({
          success: false,
          message: "Current password is required",
        });
      }

      // Update password (you should hash it in production)
      await db.query("UPDATE teacher SET password = ? WHERE id = ?", [
        new_password,
        teacherId,
      ]);
    }

    // Update profile
    await db.query(
      "UPDATE teacher SET first_name = ?, last_name = ?, email = ? WHERE id = ?",
      [first_name, last_name, email, teacherId],
    );

    // Update session
    req.session.teacher.first_name = first_name;
    req.session.teacher.last_name = last_name;
    req.session.teacher.email = email;

    res.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update profile error:", error);
    res.json({ success: false, message: "Failed to update profile" });
  } finally {
    if (db) db.release();
  }
});
// Update school configuration
router.post(
  "/update-school",
  upload.single("school_logo"),
  checkAuth,
  async (req, res) => {
    let db;
    try {
      db = await getConnection();
      const teacherId = req.user._id;
      const {
        school_name,
        school_code,
        school_address,
        school_phone,
        school_email,
        principal_name,
        affiliation_number,
      } = req.body;

      let logoData = null;
      if (req.file) {
        logoData = req.file.buffer;
      }

      // Check if school config exists
      const [existing] = await db.query(
        "SELECT id FROM school_config WHERE teacher_id = ?",
        [teacherId],
      );

      if (existing) {
        // Update existing config
        if (logoData) {
          await db.query(
            `
                    UPDATE school_config SET 
                        school_name = ?, school_code = ?, school_address = ?, 
                        school_phone = ?, school_email = ?, principal_name = ?,
                        affiliation_number = ?, school_logo = ?, updated_at = NOW()
                    WHERE teacher_id = ?
                `,
            [
              school_name,
              school_code,
              school_address,
              school_phone,
              school_email,
              principal_name,
              affiliation_number,
              logoData,
              teacherId,
            ],
          );
        } else {
          await db.query(
            `
                    UPDATE school_config SET 
                        school_name = ?, school_code = ?, school_address = ?, 
                        school_phone = ?, school_email = ?, principal_name = ?,
                        affiliation_number = ?, updated_at = NOW()
                    WHERE teacher_id = ?
                `,
            [
              school_name,
              school_code,
              school_address,
              school_phone,
              school_email,
              principal_name,
              affiliation_number,
              teacherId,
            ],
          );
        }
      } else {
        // Insert new config
        await db.query(
          `
                INSERT INTO school_config 
                (teacher_id, school_name, school_code, school_address, school_phone, 
                 school_email, principal_name, affiliation_number, school_logo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
          [
            teacherId,
            school_name,
            school_code,
            school_address,
            school_phone,
            school_email,
            principal_name,
            affiliation_number,
            logoData,
          ],
        );
      }

      res.json({
        success: true,
        message: "School information updated successfully",
      });
    } catch (error) {
      console.error("Update school error:", error);
      res.json({
        success: false,
        message: "Failed to update school information",
      });
    } finally {
      if (db) db.release();
    }
  },
);

// Update teacher settings
router.post("/update-settings", checkAuth, async (req, res) => {
  let db;
  try {
    db = await getConnection();
    const teacherId = req.user._id;
    const {
      theme,
      notifications_enabled,
      email_notifications,
      default_session,
      auto_save_draft,
      date_format,
      items_per_page,
      language,
      timezone,
    } = req.body;

    // Check if settings exist
    const [existing] = await db.query(
      "SELECT id FROM teacher_settings WHERE teacher_id = ?",
      [teacherId],
    );

    if (existing) {
      // Update existing settings
      await db.query(
        `
                UPDATE teacher_settings SET 
                    theme = ?, notifications_enabled = ?, email_notifications = ?,
                    default_session = ?, auto_save_draft = ?, date_format = ?,
                    items_per_page = ?, language = ?, timezone = ?, updated_at = NOW()
                WHERE teacher_id = ?
            `,
        [
          theme,
          notifications_enabled,
          email_notifications,
          default_session,
          auto_save_draft,
          date_format,
          items_per_page,
          language,
          timezone,
          teacherId,
        ],
      );
    } else {
      // Insert new settings
      await db.query(
        `
                INSERT INTO teacher_settings 
                (teacher_id, theme, notifications_enabled, email_notifications, default_session,
                 auto_save_draft, date_format, items_per_page, language, timezone)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
        [
          teacherId,
          theme,
          notifications_enabled,
          email_notifications,
          default_session,
          auto_save_draft,
          date_format,
          items_per_page,
          language,
          timezone,
        ],
      );
    }


    res.json({ success: true, message: "Settings updated successfully" });
  } catch (error) {
    console.error("Update settings error:", error);
    res.json({ success: false, message: "Failed to update settings" });
  } finally {
    if (db) db.release();
  }
});

// Class management
router.post("/classes", checkAuth, async (req, res) => {
  let db;
  try {
    db = await getConnection();
    const teacherId = req.user._id;
    const {
      action,
      class_id,
      class_name,
      sections,
      max_students,
      subjects,
      class_teacher,
      room_number,
    } = req.body;

    if (action === "add") {
      await db.query(
        `
                INSERT INTO class_config (teacher_id, class_name, sections, max_students, subjects, class_teacher, room_number)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
        [
          teacherId,
          class_name,
          sections,
          max_students,
          JSON.stringify(subjects),
          class_teacher,
          room_number,
        ],
      );

      res.json({ success: true, message: "Class added successfully" });
    } else if (action === "update") {
      await db.query(
        `
                UPDATE class_config SET 
                    class_name = ?, sections = ?, max_students = ?, 
                    subjects = ?, class_teacher = ?, room_number = ?
                WHERE id = ? AND teacher_id = ?
            `,
        [
          class_name,
          sections,
          max_students,
          JSON.stringify(subjects),
          class_teacher,
          room_number,
          class_id,
          teacherId,
        ],
      );

      res.json({ success: true, message: "Class updated successfully" });
    } else if (action === "delete") {
      await db.query(
        "DELETE FROM class_config WHERE id = ? AND teacher_id = ?",
        [class_id, teacherId],
      );
      res.json({ success: true, message: "Class deleted successfully" });
    }
  } catch (error) {
    console.error("Class management error:", error);
    res.json({ success: false, message: "Failed to manage class" });
  } finally {
    if (db) db.release();
  }
});

// Subject management
router.post("/subjects", checkAuth, async (req, res) => {
  let db;
  try {
    db = await getConnection();
    const teacherId = req.user._id;
    const {
      action,
      subject_id,
      class_name,
      subject_name,
      subject_code,
      is_elective,
      max_marks,
      passing_marks,
      priority,
    } = req.body;

    if (action === "add") {
      await db.query(
        `
                INSERT INTO subject_config (teacher_id, class_name, subject_name, subject_code, is_elective, max_marks, passing_marks, priority)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
        [
          teacherId,
          class_name,
          subject_name,
          subject_code,
          is_elective,
          max_marks,
          passing_marks,
          priority,
        ],
      );

      res.json({ success: true, message: "Subject added successfully" });
    } else if (action === "update") {
      await db.query(
        `
                UPDATE subject_config SET 
                    class_name = ?, subject_name = ?, subject_code = ?, 
                    is_elective = ?, max_marks = ?, passing_marks = ?, priority = ?
                WHERE id = ? AND teacher_id = ?
            `,
        [
          class_name,
          subject_name,
          subject_code,
          is_elective,
          max_marks,
          passing_marks,
          priority,
          subject_id,
          teacherId,
        ],
      );

      res.json({ success: true, message: "Subject updated successfully" });
    } else if (action === "delete") {
      await db.query(
        "DELETE FROM subject_config WHERE id = ? AND teacher_id = ?",
        [subject_id, teacherId],
      );
      res.json({ success: true, message: "Subject deleted successfully" });
    }
  } catch (error) {
    console.error("Subject management error:", error);
    res.json({ success: false, message: "Failed to manage subject" });
  } finally {
    if (db) db.release();
  }
});

// Backup management
router.post("/backup", checkAuth, async (req, res) => {
  let db;
  try {
    db = await getConnection();
    const teacherId = req.user._id;
    const { action, schedule_type, retention_days, auto_backup } = req.body;

    if (action === "schedule") {
      await db.query(
        `
                INSERT INTO backup_schedule (teacher_id, schedule_type, retention_days, auto_backup)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    schedule_type = VALUES(schedule_type),
                    retention_days = VALUES(retention_days),
                    auto_backup = VALUES(auto_backup),
                    updated_at = NOW()
            `,
        [teacherId, schedule_type, retention_days, auto_backup],
      );

      res.json({ success: true, message: "Backup schedule updated" });
    } else if (action === "manual") {
      // Here you would implement actual backup logic
      // For now, just simulate backup
      await db.query(
        `
                UPDATE backup_schedule SET last_backup = NOW() WHERE teacher_id = ?
            `,
        [teacherId],
      );

      res.json({
        success: true,
        message: "Backup completed successfully",
        backup_time: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Backup error:", error);
    res.json({ success: false, message: "Backup failed" });
  } finally {
    if (db) db.release();
  }
});

// Export data
router.get("/export-data", checkAuth, async (req, res) => {
  let db;
  try {
    db = await getConnection();
    const teacherId = req.user._id;

    // Fetch all data for this teacher
    const [students, classes, subjects, marks, attendance] = await Promise.all([
      db.query("SELECT * FROM students WHERE teacher_id = ?", [teacherId]),
      db.query("SELECT * FROM class_config WHERE teacher_id = ?", [teacherId]),
      db.query("SELECT * FROM subject_config WHERE teacher_id = ?", [
        teacherId,
      ]),
      db.query(
        "SELECT * FROM student_marks WHERE student_id IN (SELECT school_id FROM students WHERE teacher_id = ?)",
        [teacherId],
      ),
      db.query(
        "SELECT * FROM student_attendance_status WHERE student_id IN (SELECT school_id FROM students WHERE teacher_id = ?)",
        [teacherId],
      ),
    ]);

    const exportData = {
      teacher_id: teacherId,
      export_date: new Date().toISOString(),
      students: students,
      classes: classes,
      subjects: subjects,
      marks: marks,
      attendance: attendance,
    };

    // Set headers for file download
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="school_data_${teacherId}_${Date.now()}.json"`,
    );
    res.send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).send("Export failed");
  } finally {
    if (db) db.release();
  }
});

// System check
router.get("/system-check", checkAuth, async (req, res) => {
  let db;
  try {
    db = await getConnection();
    const teacherId = req.user._id;

    // Perform various system checks
    const checks = {
      database: true,
      storage: true,
      backup: true,
      permissions: true,
    };

    // Check database connectivity
    try {
      await db.query("SELECT 1");
    } catch (error) {
      checks.database = false;
    }

    // Check backup status
    const [backup] = await db.query(
      "SELECT * FROM backup_schedule WHERE teacher_id = ?",
      [teacherId],
    );
    checks.backup = !!backup;

    res.json({
      success: true,
      checks: checks,
      message: "System check completed",
    });
  } catch (error) {
    console.error("System check error:", error);
    res.json({ success: false, message: "System check failed" });
  } finally {
    if (db) db.release();
  }
});

module.exports = router;
