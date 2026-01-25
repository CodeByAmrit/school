const express = require("express");
const router = express.Router();
const checkStudentAuth = require("../services/checkStudentAuth");
const controller = require("../components/student_portal_controller");

// Public Routes
router.post("/login", controller.login);

// Protected Routes
router.use(checkStudentAuth); // Apply middleware to all subsequent routes

router.post("/change-password", controller.changePassword); // Force change password


router.get("/me", (req, res) => res.json(req.user)); // Simple user info from token
router.get("/profile", controller.getProfile);
router.get("/result", controller.getResult);

router.get("/files", controller.getFiles);
router.get("/files/:id", controller.downloadFile);

router.get("/settings", controller.getSettings);
router.put("/settings", controller.updateSettings);

router.get("/notifications", controller.getNotifications);
router.put("/notifications/:id/read", controller.markNotificationRead);

module.exports = router;
