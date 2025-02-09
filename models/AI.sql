CREATE TABLE student_face_encodings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    face_encoding TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES students(school_id) ON DELETE CASCADE
);
