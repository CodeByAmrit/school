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

CREATE TABLE IF NOT EXISTS photo (
    id INT PRIMARY KEY,
    image MEDIUMBLOB,
    student_sign MEDIUMBLOB,
    FOREIGN KEY (id) REFERENCES students (school_id)
);

CREATE TABLE IF NOT EXISTS marks1 (
    id INT PRIMARY KEY,
    english1 INTEGER NOT NULL,
    hindi1 INTEGER NOT NULL,
    mathematics1 INTEGER NOT NULL,
    social_science1 INTEGER NOT NULL,
    science1 INTEGER NOT NULL,
    computer1 INTEGER NOT NULL,
    gn1 INTEGER NOT NULL,
    drawing1 VARCHAR(50) NOT NULL,
    grandTotal1 INTEGER,
    percentage1 DECIMAL(10, 2),
    rank1 VARCHAR(50),
    remarks1 VARCHAR(200),
    FOREIGN KEY (id) REFERENCES students (school_id)
);

CREATE TABLE IF NOT EXISTS marks2 (
    id INT PRIMARY KEY,
    english2 INTEGER NOT NULL,
    hindi2 INTEGER NOT NULL,
    mathematics2 INTEGER NOT NULL,
    social_science2 INTEGER NOT NULL,
    science2 INTEGER NOT NULL,
    computer2 INTEGER NOT NULL,
    gn2 INTEGER NOT NULL,
    drawing2 VARCHAR(50) NOT NULL,
    grandTotal2 INTEGER NOT NULL,
    percentage2 DECIMAL(10, 2),
    rank2 VARCHAR(50),
    remarks2 VARCHAR(200),
    FOREIGN KEY (id) REFERENCES students (school_id)
);

CREATE TABLE IF NOT EXISTS marks3 (
    id INT PRIMARY KEY,
    english3 INTEGER NOT NULL,
    hindi3 INTEGER NOT NULL,
    mathematics3 INTEGER NOT NULL,
    social_science3 INTEGER NOT NULL,
    science3 INTEGER NOT NULL,
    computer3 INTEGER NOT NULL,
    gn3 INTEGER NOT NULL,
    drawing3 VARCHAR(50) NOT NULL,
    grandTotal3 INTEGER NOT NULL,
    percentage3 DECIMAL(10, 2),
    rank3 VARCHAR(50),
    remarks3 VARCHAR(200),
    FOREIGN KEY (id) REFERENCES students (school_id)
);

CREATE TABLE IF NOT EXISTS maximum_marks (
    id INT PRIMARY KEY,
    maxEng INTEGER NOT NULL,
    maxHindi INTEGER NOT NULL,
    maxMaths INTEGER NOT NULL,
    maxSst INTEGER NOT NULL,
    maxScience INTEGER NOT NULL,
    maxComp INTEGER NOT NULL,
    maxGn VARCHAR(50) NOT NULL,
    maxDrawing VARCHAR(50) NOT NULL,
    maxGrandTotal INTEGER NOT NULL,
    attendance VARCHAR(50),
    maxRank VARCHAR(50),
    FOREIGN KEY (id) REFERENCES students (school_id)
);




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