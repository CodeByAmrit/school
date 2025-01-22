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
    mobile_no VARCHAR(20),
    paste_file_no VARCHAR(40),
    family_id VARCHAR(40),
    dob VARCHAR(10),
    profile_status VARCHAR(255),
    apaar_id VARCHAR(40),
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

-- Table for storing student marks by term and subject
CREATE TABLE IF NOT EXISTS student_marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    term INT NOT NULL,
    subject VARCHAR(50) NOT NULL,
    marks VARCHAR(10),
    grade VARCHAR(100),
    remarks VARCHAR(100),
    FOREIGN KEY (student_id) REFERENCES students (school_id)
);

CREATE TABLE IF NOT EXISTS student_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    term ENUM('1', '2', '3'),
    attendance INT,
    status ENUM('passed', 'promoted', 'fail', 'pending') DEFAULT 'pending',
    FOREIGN KEY (student_id) REFERENCES students (school_id)
);

-- Create an index on the `class` column
CREATE INDEX idx_class ON students (class);

-- Table for storing maximum marks by term and subject
CREATE TABLE IF NOT EXISTS maximum_marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class VARCHAR(40) NOT NULL,
    term INT NOT NULL,
    subject VARCHAR(50) NOT NULL,
    max_marks VARCHAR(10),
    FOREIGN KEY (class) REFERENCES students (class)
);

-- View to calculate grand total and percentage for each term excluding non-numeric marks
CREATE OR REPLACE VIEW StudentPerformance AS
SELECT
    s.school_id,
    s.name AS student_name,
    sm.term,
    SUM(
        CASE
            WHEN sm.marks REGEXP '^[0-9]+$' THEN CAST(sm.marks AS UNSIGNED)
            ELSE 0
        END
    ) AS grand_total,
    SUM(
        CASE
            WHEN mm.max_marks REGEXP '^[0-9]+$' THEN CAST(mm.max_marks AS UNSIGNED)
            ELSE 0
        END
    ) AS total_max_marks,
    (
        SUM(
            CASE
                WHEN sm.marks REGEXP '^[0-9]+$' THEN CAST(sm.marks AS UNSIGNED)
                ELSE 0
            END
        ) / SUM(
            CASE
                WHEN mm.max_marks REGEXP '^[0-9]+$' THEN CAST(mm.max_marks AS UNSIGNED)
                ELSE 0
            END
        ) * 100
    ) AS percentage
FROM
    students s
    JOIN student_marks sm ON s.school_id = sm.student_id
    JOIN maximum_marks mm ON s.class = mm.class
    AND sm.term = mm.term
    AND sm.subject = mm.subject
GROUP BY
    s.school_id,
    sm.term;

-- Query to fetch student performance
SELECT * FROM StudentPerformance;



DELIMITER $$

CREATE PROCEDURE promote_or_demote_student(IN p_school_id INT, IN p_action VARCHAR(10))
BEGIN
    DECLARE current_class VARCHAR(40);
    DECLARE new_class VARCHAR(40);
    DECLARE class_order VARCHAR(255);
    DECLARE i INT;
    
    -- Define the class order
    SET class_order = 'NURSERY,KG,1ST,2ND,3RD,4TH,5TH,6TH,7TH,8TH,9TH,10TH,11TH,12TH';
    
    -- Get the current class of the student
    SELECT class INTO current_class
    FROM students
    WHERE school_id = p_school_id;
    
    -- If student is not found, exit
    IF current_class IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student not found';
    END IF;
    
    -- Find the index of the current class in the class_order list
    SET i = FIND_IN_SET(current_class, class_order);
    
    -- Promote or demote based on the action
    IF p_action = 'promote' THEN
        -- If it's not the last class, promote to the next class
        IF i < (LENGTH(class_order) - LENGTH(REPLACE(class_order, ',', '')) + 1) THEN
            SET new_class = ELT(i + 1, 'NURSERY', 'KG', '1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH', '9TH', '10TH', '11TH', '12TH');
            UPDATE students SET class = new_class WHERE school_id = p_school_id;
        ELSE
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student is in the highest class';
        END IF;
    ELSEIF p_action = 'demote' THEN
        -- If it's not the first class, demote to the previous class
        IF i > 1 THEN
            SET new_class = ELT(i - 1, 'NURSERY', 'KG', '1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH', '9TH', '10TH', '11TH', '12TH');
            UPDATE students SET class = new_class WHERE school_id = p_school_id;
        ELSE
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student is in the lowest class';
        END IF;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid action. Use "promote" or "demote".';
    END IF;
END $$

DELIMITER;