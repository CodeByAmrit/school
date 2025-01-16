CREATE DATABASE bvm;

USE bvm;

CREATE TABLE IF NOT EXISTS teacher (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100),
    password VARCHAR(255)
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

CREATE TABLE IF NOT EXISTS student_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT,
    file_data MEDIUMBLOB,
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

-- fake
INSERT INTO
    students (
        name,
        father_name,
        mother_name,
        srn_no,
        pen_no,
        admission_no,
        class,
        session,
        roll,
        section,
        teacher_id
    )
VALUES (
        'Riya Malhotra',
        'Arjun Malhotra',
        'Meena Malhotra',
        'SRN010',
        'PEN010',
        'ADM010',
        '12',
        '2024-2025',
        '10',
        'B',
        2
    );

INSERT INTO
    students (
        name,
        father_name,
        mother_name,
        srn_no,
        pen_no,
        admission_no,
        class,
        session,
        roll,
        section,
        teacher_id
    )
VALUES (
        'Aryan Sharma',
        'Rajesh Sharma',
        'Anita Sharma',
        'SRN001',
        'PEN001',
        'ADM001',
        '10',
        '2024-2025',
        '01',
        'A',
        1
    ),
    (
        'Sneha Verma',
        'Manoj Verma',
        'Sunita Verma',
        'SRN002',
        'PEN002',
        'ADM002',
        '10',
        '2024-2025',
        '02',
        'A',
        1
    ),
    (
        'Rahul Gupta',
        'Suresh Gupta',
        'Geeta Gupta',
        'SRN003',
        'PEN003',
        'ADM003',
        '10',
        '2024-2025',
        '03',
        'A',
        1
    ),
    (
        'Priya Singh',
        'Amit Singh',
        'Kavita Singh',
        'SRN004',
        'PEN004',
        'ADM004',
        '10',
        '2024-2025',
        '04',
        'A',
        1
    ),
    (
        'Vikram Kumar',
        'Mahesh Kumar',
        'Naina Kumar',
        'SRN005',
        'PEN005',
        'ADM005',
        '10',
        '2024-2025',
        '05',
        'A',
        1
    );

`