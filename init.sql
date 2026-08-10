-- =========================================================
-- STUDENT MANAGEMENT SYSTEM
-- Database Initialization
-- =========================================================

-- 1. Create database
CREATE DATABASE IF NOT EXISTS student_management_system;

USE student_management_system;


-- =========================================================
-- 2. USERS TABLE
-- Stores login information and roles
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(100) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    role ENUM('student', 'faculty', 'admin')
        NOT NULL DEFAULT 'student',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 3. STUDENTS TABLE
-- Stores student-specific information
-- =========================================================

CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL UNIQUE,

    roll_number VARCHAR(20) NOT NULL UNIQUE,

    course VARCHAR(100),

    year INT,

    phone VARCHAR(20),

    city VARCHAR(100),

    school VARCHAR(150),

    tenth_percentage FLOAT,

    twelfth_percentage FLOAT,

    year_of_passing VARCHAR(10),

    about TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 4. FACULTY TABLE
-- Stores faculty-specific information
-- =========================================================

CREATE TABLE IF NOT EXISTS faculty (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL UNIQUE,

    employee_id VARCHAR(30) NOT NULL UNIQUE,

    department VARCHAR(100),

    phone VARCHAR(20),

    designation VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 5. COURSES TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,

    course_name VARCHAR(100) NOT NULL,

    course_code VARCHAR(20) NOT NULL UNIQUE,

    description TEXT,

    duration_years INT DEFAULT 4,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 6. SUBJECTS TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,

    course_id INT NOT NULL,

    subject_name VARCHAR(100) NOT NULL,

    subject_code VARCHAR(20) NOT NULL UNIQUE,

    description TEXT,

    semester INT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 7. ATTENDANCE TABLE
-- Stores daily student attendance
-- =========================================================

CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    date DATE NOT NULL,

    status ENUM('present', 'absent', 'late') NOT NULL,

    marked_by INT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Student whose attendance is being recorded
    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE,

    -- Faculty/Admin who marked the attendance
    FOREIGN KEY (marked_by)
        REFERENCES users(id)
        ON DELETE CASCADE,

    -- One attendance record per student per day
    UNIQUE KEY unique_student_date (student_id, date),

    -- Faster student attendance queries
    INDEX idx_attendance_student (student_id),

    -- Faster date-based queries
    INDEX idx_attendance_date (date),

    -- Faster faculty/admin tracking
    INDEX idx_attendance_marked_by (marked_by)
);

-- =========================================================
-- 8. ACADEMIC RECORDS TABLE
-- Stores marks and grades
-- =========================================================

CREATE TABLE IF NOT EXISTS academic_records (
    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    subject_id INT NOT NULL,

    semester INT NOT NULL,

    marks FLOAT,

    grade VARCHAR(5),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE,

    FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 9. ACTIVITIES TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT,

    title VARCHAR(255) NOT NULL,

    description TEXT,

    status ENUM('pending', 'done', 'in-progress')
        DEFAULT 'pending',

    date DATE DEFAULT (CURRENT_DATE),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 10. SAMPLE COURSES
-- =========================================================

INSERT INTO courses
(course_name, course_code, description, duration_years)

SELECT
    'Artificial Intelligence and Data Science',
    'AI-DS',
    'Bachelor degree program in Artificial Intelligence and Data Science',
    4

WHERE NOT EXISTS (
    SELECT 1
    FROM courses
    WHERE course_code = 'AI-DS'
);


INSERT INTO courses
(course_name, course_code, description, duration_years)

SELECT
    'Computer Science and Engineering',
    'CSE',
    'Bachelor degree program in Computer Science and Engineering',
    4

WHERE NOT EXISTS (
    SELECT 1
    FROM courses
    WHERE course_code = 'CSE'
);


-- =========================================================
-- 11. SAMPLE SUBJECTS
-- =========================================================

INSERT INTO subjects
(course_id, subject_name, subject_code, description, semester)

SELECT
    c.id,
    'Programming Fundamentals',
    'PF',
    'Introduction to programming and problem solving',
    1

FROM courses c

WHERE c.course_code = 'AI-DS'

AND NOT EXISTS (
    SELECT 1
    FROM subjects
    WHERE subject_code = 'PF'
);


INSERT INTO subjects
(course_id, subject_name, subject_code, description, semester)

SELECT
    c.id,
    'Data Structures',
    'DS',
    'Data structures and algorithms',
    3

FROM courses c

WHERE c.course_code = 'AI-DS'

AND NOT EXISTS (
    SELECT 1
    FROM subjects
    WHERE subject_code = 'DS'
);


INSERT INTO subjects
(course_id, subject_name, subject_code, description, semester)

SELECT
    c.id,
    'Artificial Intelligence and Machine Learning',
    'AIML',
    'Introduction to artificial intelligence and machine learning',
    4

FROM courses c

WHERE c.course_code = 'AI-DS'

AND NOT EXISTS (
    SELECT 1
    FROM subjects
    WHERE subject_code = 'AIML'
);


-- =========================================================
-- 12. FACULTY MODULE MIGRATION (idempotent / safe to re-run)
-- Only applies changes that are not already present, so this
-- file can be run against a brand-new database or re-run
-- against an existing one without error.
-- =========================================================

-- ---------------------------------------------------------
-- 12a. attendance.subject_id
-- ---------------------------------------------------------

SET @exist := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'attendance'
      AND COLUMN_NAME = 'subject_id'
);
SET @sql := IF(@exist = 0,
    'ALTER TABLE attendance ADD COLUMN subject_id INT NULL AFTER student_id',
    'SELECT ''attendance.subject_id already exists, skipping'' AS note'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- FK on subject_id
SET @exist := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'attendance'
      AND CONSTRAINT_NAME = 'fk_attendance_subject'
);
SET @sql := IF(@exist = 0,
    'ALTER TABLE attendance ADD CONSTRAINT fk_attendance_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE',
    'SELECT ''fk_attendance_subject already exists, skipping'' AS note'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Drop old (student_id, date) unique key if present
SET @exist := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'attendance'
      AND INDEX_NAME = 'unique_student_date'
);
SET @sql := IF(@exist > 0,
    'ALTER TABLE attendance DROP INDEX unique_student_date',
    'SELECT ''unique_student_date already absent, skipping'' AS note'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add new (student_id, subject_id, date) unique key if missing
SET @exist := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'attendance'
      AND INDEX_NAME = 'unique_student_subject_date'
);
SET @sql := IF(@exist = 0,
    'ALTER TABLE attendance ADD UNIQUE KEY unique_student_subject_date (student_id, subject_id, date)',
    'SELECT ''unique_student_subject_date already exists, skipping'' AS note'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Helper index on subject_id
SET @exist := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'attendance'
      AND INDEX_NAME = 'idx_attendance_subject'
);
SET @sql := IF(@exist = 0,
    'ALTER TABLE attendance ADD INDEX idx_attendance_subject (subject_id)',
    'SELECT ''idx_attendance_subject already exists, skipping'' AS note'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- ---------------------------------------------------------
-- 12b. faculty_subjects
-- Links faculty to the subjects/classes they teach.
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS faculty_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    subject_id INT NOT NULL,
    section VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_faculty_subject (faculty_id, subject_id)
);


-- ---------------------------------------------------------
-- 12c. activities.performed_by
-- Lets faculty-triggered actions (attendance marked, marks
-- entered) be logged and queried back as recent activity.
-- ---------------------------------------------------------

SET @exist := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'activities'
      AND COLUMN_NAME = 'performed_by'
);
SET @sql := IF(@exist = 0,
    'ALTER TABLE activities ADD COLUMN performed_by INT NULL AFTER student_id',
    'SELECT ''activities.performed_by already exists, skipping'' AS note'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'activities'
      AND CONSTRAINT_NAME = 'fk_activities_performed_by'
);
SET @sql := IF(@exist = 0,
    'ALTER TABLE activities ADD CONSTRAINT fk_activities_performed_by FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL',
    'SELECT ''fk_activities_performed_by already exists, skipping'' AS note'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'activities'
      AND INDEX_NAME = 'idx_activities_performed_by'
);
SET @sql := IF(@exist = 0,
    'ALTER TABLE activities ADD INDEX idx_activities_performed_by (performed_by)',
    'SELECT ''idx_activities_performed_by already exists, skipping'' AS note'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- ---------------------------------------------------------
-- 12d. OPTIONAL sample data -- assigns the first faculty
-- member to up to 3 subjects so the dashboard has something
-- to show out of the box.
-- ---------------------------------------------------------

INSERT INTO faculty_subjects (faculty_id, subject_id)
SELECT f.id, s.id
FROM faculty f
JOIN subjects s ON 1 = 1
WHERE f.id = (SELECT MIN(id) FROM faculty)
AND NOT EXISTS (
    SELECT 1 FROM faculty_subjects fs
    WHERE fs.faculty_id = f.id AND fs.subject_id = s.id
)
LIMIT 3;


-- =========================================================
-- 13. VIEW TABLES
-- =========================================================

SHOW TABLES;


-- =========================================================
-- 14. OPTIONAL: CHECK STRUCTURE
-- =========================================================

DESCRIBE users;

DESCRIBE students;

DESCRIBE faculty;

DESCRIBE courses;

DESCRIBE subjects;

DESCRIBE attendance;

DESCRIBE academic_records;

DESCRIBE activities;

DESCRIBE faculty_subjects;