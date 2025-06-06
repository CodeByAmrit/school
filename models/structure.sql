CREATE DATABASE bvm;

USE bvm;

CREATE TABLE IF NOT EXISTS teacher (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100),
    password VARCHAR(255),
    school_name VARCHAR(200),
    school_address VARCHAR(200),
    school_phone VARCHAR(200),
    school_logo MEDIUMBLOB
);

CREATE TABLE IF NOT EXISTS students (
    school_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(40),
    father_name VARCHAR(40),
    mother_name VARCHAR(40),
    srn_no VARCHAR(255),
    pen_no VARCHAR(40),
    admission_no VARCHAR(40),
    class VARCHAR(40),
    session VARCHAR(40),
    roll VARCHAR(40),
    section VARCHAR(40) DEFAULT 'A',
    teacher_id INT,
    permanent_address VARCHAR(255),
    corresponding_address VARCHAR(255),
    mobile_no VARCHAR(40),
    paste_file_no VARCHAR(40),
    family_id VARCHAR(40),
    dob VARCHAR(10),
    profile_status VARCHAR(255),
    apaar_id VARCHAR(40),
    gender ENUM('MALE', 'FEMALE') NOT NULL DEFAULT 'MALE',
    FOREIGN KEY (teacher_id) REFERENCES teacher (id)
);

CREATE TABLE IF NOT EXISTS student_credentials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255) DEFAULT '1234',
    FOREIGN KEY (student_id) REFERENCES students (school_id)
);

CREATE TABLE IF NOT EXISTS student_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT,
    file_data MEDIUMBLOB,
    file_name VARCHAR(255),
    type VARCHAR(20) DEFAULT 'PDF',
    upload_date DATE DEFAULT(CURRENT_DATE),
    FOREIGN KEY (school_id) REFERENCES students (school_id)
);

-- Table for student photos and signatures
CREATE TABLE IF NOT EXISTS photo (
    id INT PRIMARY KEY,
    image MEDIUMBLOB,
    student_sign MEDIUMBLOB,
    FOREIGN KEY (id) REFERENCES students (school_id)
);

CREATE VIEW student_photos_base64 AS
SELECT 
    id,
    TO_BASE64(image) AS image_base64,
    TO_BASE64(student_sign) AS student_sign_base64
FROM photo;


CREATE OR REPLACE VIEW student_photos_view AS
SELECT s.name, s.father_name, s.session, s.mother_name, s.class, s.school_id, s.teacher_id, 
       TO_BASE64(p.image) AS image_base64, 
       TO_BASE64(p.student_sign) AS student_sign_base64
FROM students s
LEFT JOIN photo p ON s.school_id = p.id;


-- Table for storing student marks by term and subject
CREATE TABLE IF NOT EXISTS student_marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    term INT NOT NULL,
    subject VARCHAR(50) NOT NULL,
    marks VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (student_id, term, subject),
    FOREIGN KEY (student_id) REFERENCES students (school_id)
);

CREATE TABLE IF NOT EXISTS student_attendance_status (
    student_id INT PRIMARY KEY,
    attendance VARCHAR(100),
    status ENUM(
        'passed',
        'promoted',
        'fail',
        'pending'
    ) DEFAULT 'pending',
    FOREIGN KEY (student_id) REFERENCES students (school_id)
);

CREATE TABLE IF NOT EXISTS student_grade_remarks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    grade VARCHAR(100),
    remarks VARCHAR(100),
    term INT NOT NULL,
    UNIQUE (student_id, term),
    FOREIGN KEY (student_id) REFERENCES students (school_id)
);

-- Create an index on the `class` column
CREATE INDEX idx_class ON students (class);

-- Create a view for the count of students in each class for a given session
CREATE OR REPLACE VIEW students_per_class AS
SELECT 
    class,
    session,
    COUNT(CASE WHEN gender = 'MALE' THEN 1 END) AS male_count,
    COUNT(CASE WHEN gender = 'FEMALE' THEN 1 END) AS female_count
FROM 
    students
GROUP BY 
    class, session;

-- Table for storing maximum marks by term and subject
CREATE TABLE IF NOT EXISTS maximum_marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class VARCHAR(40) NOT NULL,
    term INT NOT NULL,
    subject VARCHAR(50) NOT NULL,
    max_marks VARCHAR(20) NOT NULL, -- Changed to INT for max_marks
    UNIQUE KEY (class, term, subject) -- Ensure each combination of class, term, and subject is unique
);

CREATE TABLE IF NOT EXISTS school_leaved_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    original_student_id INT,
    name VARCHAR(40),
    father_name VARCHAR(40),
    mother_name VARCHAR(40),
    srn_no VARCHAR(255),
    pen_no VARCHAR(40),
    admission_no VARCHAR(40),
    class VARCHAR(40),
    session VARCHAR(40),
    roll VARCHAR(40),
    section VARCHAR(40),
    teacher_id INT,
    permanent_address VARCHAR(255),
    corresponding_address VARCHAR(255),
    mobile_no VARCHAR(40),
    paste_file_no VARCHAR(40),
    family_id VARCHAR(40),
    dob VARCHAR(10),
    profile_status VARCHAR(255),
    apaar_id VARCHAR(40),
    gender ENUM('MALE', 'FEMALE') NOT NULL DEFAULT 'MALE',
    leave_date DATE DEFAULT(CURRENT_DATE),
    reason TEXT,
    FOREIGN KEY (teacher_id) REFERENCES teacher (id)
);


CREATE OR REPLACE VIEW StudentPerformance AS
SELECT
    s.school_id,
    s.name AS student_name,
    sm.term,
    (
        SELECT SUM(
                CASE
                    WHEN sm2.marks REGEXP '^[0-9]+$' THEN CAST(sm2.marks AS UNSIGNED)
                    ELSE 0
                END
            )
        FROM student_marks sm2
        WHERE
            sm2.student_id = s.school_id
            AND sm2.term = sm.term
    ) AS grand_total,
    (
        SELECT SUM(
                CASE
                    WHEN mm.max_marks REGEXP '^[0-9]+$' THEN CAST(mm.max_marks AS UNSIGNED)
                    ELSE 0
                END
            )
        FROM maximum_marks mm
        WHERE
            mm.class = s.class
            AND mm.term = sm.term
            AND mm.subject IN (
                SELECT DISTINCT
                    sm3.subject
                FROM student_marks sm3
                WHERE
                    sm3.student_id = s.school_id
                    AND sm3.term = sm.term
            )
    ) AS total_max_marks,
    (
        (
            SELECT SUM(
                    CASE
                        WHEN sm2.marks REGEXP '^[0-9]+$' THEN CAST(sm2.marks AS UNSIGNED)
                        ELSE 0
                    END
                )
            FROM student_marks sm2
            WHERE
                sm2.student_id = s.school_id
                AND sm2.term = sm.term
        ) / (
            SELECT SUM(
                    CASE
                        WHEN mm.max_marks REGEXP '^[0-9]+$' THEN CAST(mm.max_marks AS UNSIGNED)
                        ELSE 0
                    END
                )
            FROM maximum_marks mm
            WHERE
                mm.class = s.class
                AND mm.term = sm.term
                AND mm.subject IN (
                    SELECT DISTINCT
                        sm3.subject
                    FROM student_marks sm3
                    WHERE
                        sm3.student_id = s.school_id
                        AND sm3.term = sm.term
                )
        )
    ) * 100 AS percentage
FROM students s
    JOIN student_marks sm ON s.school_id = sm.student_id
GROUP BY
    s.school_id,
    s.name,
    sm.term;

DELIMITER $$

CREATE PROCEDURE promote_or_demote_student(IN p_school_id INT, IN p_action VARCHAR(10))
BEGIN
    DECLARE current_class VARCHAR(40);
    DECLARE new_class VARCHAR(40);
    DECLARE class_order VARCHAR(255);
    DECLARE i INT;
    DECLARE current_session VARCHAR(40);
    DECLARE new_session VARCHAR(40);
    DECLARE start_year INT;
    DECLARE end_year INT;
    
    -- Define the class order
    SET class_order = 'NURSERY,KG,1ST,2ND,3RD,4TH,5TH,6TH,7TH,8TH,9TH,10TH,11TH,12TH';
    
    -- Get the current class and session of the student
    SELECT class, session INTO current_class, current_session
    FROM students
    WHERE school_id = p_school_id;
    
    -- If student is not found, exit
    IF current_class IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student not found';
    END IF;
    
    -- Find the index of the current class in the class_order list
    SET i = FIND_IN_SET(current_class, class_order);
    
    -- Extract the start and end year from the current session
    SET start_year = CAST(SUBSTRING_INDEX(current_session, '-', 1) AS UNSIGNED);
    SET end_year = CAST(SUBSTRING_INDEX(current_session, '-', -1) AS UNSIGNED);
    
    -- Promote or demote based on the action
    IF p_action = 'promote' THEN
        -- If it's not the last class, promote to the next class
        IF i < (LENGTH(class_order) - LENGTH(REPLACE(class_order, ',', '')) + 1) THEN
            SET new_class = ELT(i + 1, 'NURSERY', 'KG', '1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH', '9TH', '10TH', '11TH', '12TH');
            SET new_session = CONCAT(start_year + 1, '-', end_year + 1);
            UPDATE students SET class = new_class, session = new_session WHERE school_id = p_school_id;
        ELSE
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student is in the highest class';
        END IF;
    ELSEIF p_action = 'demote' THEN
        -- If it's not the first class, demote to the previous class
        IF i > 1 THEN
            SET new_class = ELT(i - 1, 'NURSERY', 'KG', '1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH', '9TH', '10TH', '11TH', '12TH');
            SET new_session = CONCAT(start_year - 1, '-', end_year - 1);
            UPDATE students SET class = new_class, session = new_session WHERE school_id = p_school_id;
        ELSE
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student is in the lowest class';
        END IF;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid action. Use "promote" or "demote".';
    END IF;
END $$

DELIMITER;


DELIMITER $$
CREATE PROCEDURE delete_student(IN p_school_id INT)
BEGIN
    -- Delete student marks
    DELETE FROM student_marks WHERE student_id = p_school_id;

    -- Delete student attendance status
    DELETE FROM student_attendance_status WHERE student_id = p_school_id;

    -- Delete student grade remarks
    DELETE FROM student_grade_remarks WHERE student_id = p_school_id;

    -- Delete student credentials
    DELETE FROM student_credentials WHERE student_id = p_school_id;

    -- Delete student files
    DELETE FROM student_files WHERE school_id = p_school_id;

    -- Delete student photos
    DELETE FROM photo WHERE id = p_school_id;

    -- Finally, delete the student record
    DELETE FROM students WHERE school_id = p_school_id;
END $$

DELIMITER ;