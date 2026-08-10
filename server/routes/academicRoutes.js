const express = require("express");

const router = express.Router();

const pool = require("../db");

const authMiddleware = require("../middleware/auth");
const authorizeRoles = require("../middleware/roleMiddleware");


// ---------------------------------------------------------
// Helpers shared with attendanceRoutes.js's scoping pattern.
// ---------------------------------------------------------

async function facultyOwnsSubject(userId, subjectId) {
    const [rows] = await pool.execute(
        `SELECT fs.id
         FROM faculty_subjects fs
         JOIN faculty f ON fs.faculty_id = f.id
         WHERE f.user_id = ? AND fs.subject_id = ?`,
        [userId, subjectId]
    );
    return rows.length > 0;
}

async function logActivity(studentId, performedBy, title, description) {
    try {
        await pool.execute(
            `INSERT INTO activities (student_id, performed_by, title, description, status)
             VALUES (?, ?, ?, ?, 'done')`,
            [studentId, performedBy, title, description]
        );
    } catch (err) {
        console.error("Activity log error:", err);
    }
}

function isValidGrade(marks) {
    return marks >= 0 && marks <= 100;
}


// =====================================================
// ADD ACADEMIC RECORD
// POST /api/academic-records
// Faculty + Admin
// =====================================================

router.post(
    "/",
    authMiddleware,
    authorizeRoles("faculty", "admin"),
    async (req, res) => {

        const {
            student_id,
            subject_id,
            semester,
            marks,
            grade
        } = req.body;


        // Validate required fields
        if (
            !student_id ||
            !subject_id ||
            !semester ||
            marks === undefined ||
            !grade
        ) {
            return res.status(400).json({
                error: "student_id, subject_id, semester, marks and grade are required"
            });
        }


        // Validate marks
        if (typeof marks !== "number" || !isValidGrade(marks)) {
            return res.status(400).json({
                error: "Marks must be a number between 0 and 100"
            });
        }


        try {

            // -------------------------------------------------
            // Check student
            // -------------------------------------------------

            const [students] = await pool.execute(
                `SELECT id
                 FROM students
                 WHERE id = ?`,
                [student_id]
            );

            if (students.length === 0) {

                return res.status(404).json({
                    error: "Student not found"
                });
            }


            // -------------------------------------------------
            // Check subject
            // -------------------------------------------------

            const [subjects] = await pool.execute(
                `SELECT id, subject_name
                 FROM subjects
                 WHERE id = ?`,
                [subject_id]
            );

            if (subjects.length === 0) {

                return res.status(404).json({
                    error: "Subject not found"
                });
            }


            // -------------------------------------------------
            // Faculty may only add marks for subjects they
            // are assigned to (admin bypasses this).
            // -------------------------------------------------

            if (req.user.role === "faculty") {
                const owns = await facultyOwnsSubject(req.user.id, subject_id);
                if (!owns) {
                    return res.status(403).json({
                        error: "You are not assigned to this subject"
                    });
                }
            }


            // -------------------------------------------------
            // Insert academic record
            // -------------------------------------------------

            const [result] = await pool.execute(
                `INSERT INTO academic_records
                    (student_id, subject_id, semester, marks, grade)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    student_id,
                    subject_id,
                    semester,
                    marks,
                    grade
                ]
            );

            await logActivity(
                student_id,
                req.user.id,
                "Marks entered",
                `Entered marks (${marks}, grade ${grade}) for ${subjects[0].subject_name}`
            );


            res.status(201).json({

                message: "Academic record added successfully",

                record_id: result.insertId

            });


        } catch (err) {

            console.error(
                "Add academic record error:",
                err
            );

            res.status(500).json({
                error: "Server error"
            });
        }
    }
);


// =====================================================
// UPDATE ACADEMIC RECORD
// PUT /api/academic-records/:id
// Faculty (own subjects only) + Admin
// =====================================================

router.put(
    "/:id",
    authMiddleware,
    authorizeRoles("faculty", "admin"),
    async (req, res) => {

        const { marks, grade } = req.body;

        if (marks === undefined || !grade) {
            return res.status(400).json({
                error: "marks and grade are required"
            });
        }

        if (typeof marks !== "number" || !isValidGrade(marks)) {
            return res.status(400).json({
                error: "Marks must be a number between 0 and 100"
            });
        }

        try {

            const [existing] = await pool.execute(
                `SELECT id, student_id, subject_id
                 FROM academic_records
                 WHERE id = ?`,
                [req.params.id]
            );

            if (existing.length === 0) {
                return res.status(404).json({ error: "Academic record not found" });
            }

            if (req.user.role === "faculty") {
                const owns = await facultyOwnsSubject(req.user.id, existing[0].subject_id);
                if (!owns) {
                    return res.status(403).json({
                        error: "You are not assigned to this subject"
                    });
                }
            }

            await pool.execute(
                `UPDATE academic_records SET marks = ?, grade = ? WHERE id = ?`,
                [marks, grade, req.params.id]
            );

            await logActivity(
                existing[0].student_id,
                req.user.id,
                "Marks updated",
                `Updated marks to ${marks} (grade ${grade})`
            );

            res.json({ message: "Academic record updated successfully" });

        } catch (err) {
            console.error("Update academic record error:", err);
            res.status(500).json({ error: "Server error" });
        }
    }
);


// =====================================================
// FACULTY - VIEW ALL RECORDS FOR ONE OF THEIR SUBJECTS
// GET /api/academic-records/subject/:subjectId
// Faculty + Admin. Faculty limited to their own subjects.
// =====================================================

router.get(
    "/subject/:subjectId",
    authMiddleware,
    authorizeRoles("faculty", "admin"),
    async (req, res) => {

        const { subjectId } = req.params;

        try {
            if (req.user.role === "faculty") {
                const owns = await facultyOwnsSubject(req.user.id, subjectId);
                if (!owns) {
                    return res.status(403).json({
                        error: "You are not assigned to this subject"
                    });
                }
            }

            const [records] = await pool.execute(
                `SELECT
                    ar.id,
                    ar.student_id,
                    s.roll_number,
                    u.name AS student_name,
                    ar.semester,
                    ar.marks,
                    ar.grade,
                    ar.created_at
                 FROM subjects sub
                 JOIN courses c ON sub.course_id = c.id
                 JOIN students s ON s.course = c.course_code
                 JOIN users u ON s.user_id = u.id
                 LEFT JOIN academic_records ar
                    ON ar.student_id = s.id AND ar.subject_id = sub.id
                 WHERE sub.id = ?
                 ORDER BY s.roll_number`,
                [subjectId]
            );

            res.json({ subject_id: Number(subjectId), records });

        } catch (err) {
            console.error("Get subject academic records error:", err);
            res.status(500).json({ error: "Server error" });
        }
    }
);


// =====================================================
// STUDENT - VIEW OWN ACADEMIC RECORDS
// GET /api/academic-records/my
// Student only
// =====================================================

router.get(
    "/my",
    authMiddleware,
    authorizeRoles("student"),
    async (req, res) => {

        try {

            const [records] = await pool.execute(
                `SELECT
                    ar.id,
                    ar.semester,
                    ar.marks,
                    ar.grade,
                    ar.created_at,
                    ar.subject_id,
                    s.subject_name
                 FROM academic_records ar
                 JOIN students st
                    ON ar.student_id = st.id
                 LEFT JOIN subjects s
                    ON ar.subject_id = s.id
                 WHERE st.user_id = ?
                 ORDER BY ar.semester, s.subject_name`,
                [req.user.id]
            );


            res.json({

                student_id: req.user.id,

                total_records: records.length,

                records

            });


        } catch (err) {

            console.error(
                "Get academic records error:",
                err
            );

            res.status(500).json({
                error: "Server error"
            });
        }
    }
);


// =====================================================
// FACULTY / ADMIN - VIEW STUDENT RECORDS
// GET /api/academic-records/student/:studentId
// =====================================================

router.get(
    "/student/:studentId",
    authMiddleware,
    authorizeRoles("faculty", "admin"),
    async (req, res) => {

        try {

            if (req.user.role === "faculty") {
                const [inScope] = await pool.execute(
                    `SELECT 1
                     FROM students s
                     JOIN courses c ON c.course_code = s.course
                     JOIN subjects sub ON sub.course_id = c.id
                     JOIN faculty_subjects fs ON fs.subject_id = sub.id
                     JOIN faculty f ON fs.faculty_id = f.id
                     WHERE f.user_id = ? AND s.id = ?
                     LIMIT 1`,
                    [req.user.id, req.params.studentId]
                );
                if (inScope.length === 0) {
                    return res.status(403).json({
                        error: "This student is not in your assigned classes"
                    });
                }
            }

            const [records] = await pool.execute(
                `SELECT
                    ar.id,
                    ar.semester,
                    ar.marks,
                    ar.grade,
                    ar.created_at,
                    ar.subject_id,
                    s.subject_name
                 FROM academic_records ar
                 LEFT JOIN subjects s
                    ON ar.subject_id = s.id
                 WHERE ar.student_id = ?
                 ORDER BY ar.semester, s.subject_name`,
                [req.params.studentId]
            );


            res.json({

                student_id: Number(req.params.studentId),

                total_records: records.length,

                records

            });


        } catch (err) {

            console.error(
                "Get student academic records error:",
                err
            );

            res.status(500).json({
                error: "Server error"
            });
        }
    }
);


module.exports = router;