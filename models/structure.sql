-- Create the database
CREATE DATABASE IF NOT EXISTS studenttracker;

-- Use the database
USE studenttracker;

-- Create the teacher table
CREATE TABLE IF NOT EXISTS teacher (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
) AUTO_INCREMENT = 1000;

-- Create the students table
CREATE TABLE IF NOT EXISTS students (
    student_id INT UNSIGNED AUTO_INCREMENT,
    teacher_id INT UNSIGNED NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    father_name VARCHAR(100) NOT NULL,
    mother_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone_no VARCHAR(15) NOT NULL,
    house_no VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    zip VARCHAR(10) NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    srn_no VARCHAR(50) NOT NULL UNIQUE,
    pen_no VARCHAR(50) NOT NULL UNIQUE,
    admission_no VARCHAR(50) NOT NULL UNIQUE,
    class VARCHAR(20) NOT NULL,
    section CHAR(1) NOT NULL,
    photo BLOB,
    PRIMARY KEY (student_id),
    FOREIGN KEY (teacher_id) REFERENCES teacher(id)
);

-- Create the studentDocument table
CREATE TABLE IF NOT EXISTS studenttracker.studentDocument (
    student_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    document MEDIUMBLOB NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

CREATE TABLE IF NOT EXISTS marks(
    student_id INT UNSIGNED AUTO_INCREMENT,
    english INTEGER NOT NULL,
    hindi INTEGER NOT NULL,
    mathematics INTEGER NOT NULL,
    social_science INTEGER NOT NULL,
    science INTEGER NOT NULL,
    computer INTEGER NOT NULL,
    drawing VARCHAR(50) NOT NULL,
    gn INTEGER NOT NULL,
    grandTotal INTEGER ,
    percentage DECIMAL(10, 2),
    rank VARCHAR(50),

    PRIMARY KEY(student_id),
    
    FOREIGN KEY(student_id) REFERENCES students(student_id)
);




CREATE USER 'web'@'%' IDENTIFIED BY 'Amrit123';
grant select, insert, delete, update on studenttracker.* to 'web'@'%' ;
flush privileges;

-- Insert fake data into the teacher table
INSERT INTO teacher (first_name, last_name, email, password)
VALUES 
('Naresh', 'Gill', 'naresh@gmail.om', '1234');

-- Insert fake data into the students table
INSERT INTO students (teacher_id, full_name, father_name, mother_name, email, password, phone_no, house_no, state, district, zip, gender, srn_no, pen_no, admission_no, class, section)
VALUES 
(1001, 'Alice Johnson', 'Michael Johnson', 'Sarah Johnson', 'alice.johnson@example.com', 'password111', '1234567890', '101', 'California', 'Los Angeles', '90001', 'Female', 'SRN10001', 'PEN10001', 'ADM10001', '10', 'A'),
(1001, 'David Wilson', 'James Wilson', 'Laura Wilson', 'david.wilson@example.com', 'password222', '2345678901', '102', 'California', 'Los Angeles', '90002', 'Male', 'SRN10002', 'PEN10002', 'ADM10002', '11', 'B'),
(1001, 'Sophia Martinez', 'Carlos Martinez', 'Maria Martinez', 'sophia.martinez@example.com', 'password333', '3456789012', '201', 'Texas', 'Houston', '77001', 'Female', 'SRN10003', 'PEN10003', 'ADM10003', '9', 'A'),
(1001, 'Jacob Anderson', 'Robert Anderson', 'Linda Anderson', 'jacob.anderson@example.com', 'password444', '4567890123', '301', 'New York', 'New York', '10001', 'Male', 'SRN10004', 'PEN10004', 'ADM10004', '12', 'C'),
(1001, 'Olivia Thomas', 'Thomas Thomas', 'Patricia Thomas', 'olivia.thomas@example.com', 'password555', '5678901234', '401', 'Florida', 'Miami', '33101', 'Female', 'SRN10005', 'PEN10005', 'ADM10005', '8', 'B');