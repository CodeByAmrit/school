-- SQL schema extensions for the BVM Student Portal
-- This file contains additional tables and modifications to support the student-facing application.

USE bvm;

-- Table for student-specific settings to allow personalization of their experience.
CREATE TABLE IF NOT EXISTS student_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    theme VARCHAR(20) DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (student_id),
    FOREIGN KEY (student_id) REFERENCES students (school_id) ON DELETE CASCADE
);

-- Table for storing notifications sent to students, such as announcements or grade updates.
CREATE TABLE IF NOT EXISTS student_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students (school_id) ON DELETE CASCADE
);

-- Add 'last_login' to track student activity.
ALTER TABLE student_credentials
ADD COLUMN last_login TIMESTAMP NULL AFTER password;

-- Add columns to support a secure "Forgot Password" functionality.
ALTER TABLE student_credentials
ADD COLUMN reset_password_token VARCHAR(255) NULL,
ADD COLUMN reset_password_expires TIMESTAMP NULL;

-- Insert default settings for all existing students
INSERT INTO student_settings (student_id)
SELECT school_id FROM students
WHERE school_id NOT IN (SELECT student_id FROM student_settings);
