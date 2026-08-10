const express = require("express");

const router = express.Router();

const pool = require("../db");

const authMiddleware = require("../middleware/auth");
const authorizeRoles = require("../middleware/roleMiddleware");


// ---------------------------------------------------------
// Helper: is this faculty user (by user id) assigned to the
// given subject? Admins bypass this check entirely. Used to
// stop a faculty member marking/updating/viewing attendance
// for a subject that isn't theirs, even if they know the IDs.
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
        // Activity logging is best-effort; never fail the main request over it.
        console.error("Activity log error:", err);
    }
}


// =====================================================
// MARK ATTENDANCE
// POST /api/attendance
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
            date,
            status
        } = req.body;


        // Validate required fields
        if (!student_id || !subject_id || !date || !status) {
            return res.status(400).json({
                error: "student_id, subject_id, date and status are required"
            });
        }


        // Your database allows only present/absent
        if (!["present", "absent"].includes(status)) {
            return res.status(400).json({
                error: "Status must be either present or absent"
            });
        }


        try {

            // -------------------------------------------------
            // Check student exists
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
            // Check subject exists
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
            // Faculty may only mark attendance for subjects
            // they are assigned to (admin bypasses this).
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
            // Insert attendance
            // -------------------------------------------------

            const [result] = await pool.execute(
                `INSERT INTO attendance
                    (student_id, subject_id, date, status, marked_by)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    student_id,
                    subject_id,
                    date,
                    status,
                    req.user.id
                ]
            );

            await logActivity(
                student_id,
                req.user.id,
                "Attendance marked",
                `Marked ${status} for ${subjects[0].subject_name} on ${date}`
            );


            res.status(201).json({
                message: "Attendance marked successfully",
                attendance_id: result.insertId
            });


        } catch (err) {

            // Duplicate attendance
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    error: "Attendance already marked for this student, subject and date"
                });
            }


            console.error(
                "Mark attendance error:",
                err
            );


            res.status(500).json({
                error: "Server error"
            });
        }
    }
);


// =====================================================
// UPDATE ATTENDANCE
// PUT /api/attendance/:id
// Faculty (own subjects only) + Admin
// =====================================================

router.put(
    "/:id",
    authMiddleware,
    authorizeRoles("faculty", "admin"),
    async (req, res) => {

        const { status } = req.body;

        if (!["present", "absent"].includes(status)) {
            return res.status(400).json({
                error: "Status must be either present or absent"
            });
        }

        try {

            const [existing] = await pool.execute(
                `SELECT id, student_id, subject_id, date
                 FROM attendance
                 WHERE id = ?`,
                [req.params.id]
            );

            if (existing.length === 0) {
                return res.status(404).json({ error: "Attendance record not found" });
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
                `UPDATE attendance SET status = ? WHERE id = ?`,
                [status, req.params.id]
            );

            await logActivity(
                existing[0].student_id,
                req.user.id,
                "Attendance updated",
                `Updated attendance to ${status} for record dated ${existing[0].date}`
            );

            res.json({ message: "Attendance updated successfully" });

        } catch (err) {
            console.error("Update attendance error:", err);
            res.status(500).json({ error: "Server error" });
        }
    }
);


// =====================================================
// FACULTY - VIEW/MARK ROSTER FOR A SUBJECT + DATE
// GET /api/attendance/subject/:subjectId?date=YYYY-MM-DD
// Returns every student in that subject's course along with
// their attendance status for the given date (null if not
// yet marked), so the UI can render a mark-attendance sheet.
// Faculty + Admin. Faculty limited to their own subjects.
// =====================================================

router.get(
    "/subject/:subjectId",
    authMiddleware,
    authorizeRoles("faculty", "admin"),
    async (req, res) => {

        const { subjectId } = req.params;
        const date = req.query.date || new Date().toISOString().slice(0, 10);

        try {
            if (req.user.role === "faculty") {
                const owns = await facultyOwnsSubject(req.user.id, subjectId);
                if (!owns) {
                    return res.status(403).json({
                        error: "You are not assigned to this subject"
                    });
                }
            }

            const [roster] = await pool.execute(
                `SELECT
                    s.id AS student_id,
                    s.roll_number,
                    u.name AS student_name,
                    a.id AS attendance_id,
                    a.status
                 FROM subjects sub
                 JOIN courses c ON sub.course_id = c.id
                 JOIN students s ON s.course = c.course_code
                 JOIN users u ON s.user_id = u.id
                 LEFT JOIN attendance a
                    ON a.student_id = s.id
                    AND a.subject_id = sub.id
                    AND a.date = ?
                 WHERE sub.id = ?
                 ORDER BY s.roll_number`,
                [date, subjectId]
            );

            res.json({ subject_id: Number(subjectId), date, roster });

        } catch (err) {
            console.error("Get attendance roster error:", err);
            res.status(500).json({ error: "Server error" });
        }
    }
);


// =====================================================
// STUDENT - VIEW OWN ATTENDANCE
// GET /api/attendance/my
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
                    a.id,
                    a.date,
                    a.status,
                    a.subject_id,
                    sub.subject_name
                 FROM attendance a
                 JOIN students s
                    ON a.student_id = s.id
                 LEFT JOIN subjects sub
                    ON a.subject_id = sub.id
                 WHERE s.user_id = ?
                 ORDER BY a.date DESC`,
                [req.user.id]
            );


            const total = records.length;

            const present = records.filter(
                record => record.status === "present"
            ).length;

            const absent = records.filter(
                record => record.status === "absent"
            ).length;


            const percentage =
                total === 0
                    ? 0
                    : ((present / total) * 100).toFixed(2);


            res.json({

                summary: {
                    total,
                    present,
                    absent,
                    attendance_percentage: Number(percentage)
                },

                records

            });


        } catch (err) {

            console.error(
                "Get attendance error:",
                err
            );

            res.status(500).json({
                error: "Server error"
            });
        }
    }
);


// =====================================================
// FACULTY / ADMIN - VIEW STUDENT ATTENDANCE
// GET /api/attendance/student/:studentId
// =====================================================

router.get(
    "/student/:studentId",
    authMiddleware,
    authorizeRoles("faculty", "admin"),
    async (req, res) => {

        try {

            // Faculty may only view attendance for students who
            // fall within one of their assigned subjects' courses.
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
                    a.id,
                    a.date,
                    a.status,
                    a.subject_id,
                    sub.subject_name,
                    u.name AS marked_by_name
                 FROM attendance a
                 LEFT JOIN subjects sub
                    ON a.subject_id = sub.id
                 JOIN users u
                    ON a.marked_by = u.id
                 WHERE a.student_id = ?
                 ORDER BY a.date DESC`,
                [req.params.studentId]
            );


            const total = records.length;

            const present = records.filter(
                record => record.status === "present"
            ).length;

            const absent = records.filter(
                record => record.status === "absent"
            ).length;


            const percentage =
                total === 0
                    ? 0
                    : ((present / total) * 100).toFixed(2);


            res.json({

                student_id: Number(req.params.studentId),

                summary: {
                    total,
                    present,
                    absent,
                    attendance_percentage: Number(percentage)
                },

                records

            });


        } catch (err) {

            console.error(
                "Get student attendance error:",
                err
            );

            res.status(500).json({
                error: "Server error"
            });
        }
    }
);


module.exports = router;