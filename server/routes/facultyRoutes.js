const express = require("express");
const router = express.Router();

const pool = require("../db");
const authMiddleware = require("../middleware/auth");
const authorizeRoles = require("../middleware/roleMiddleware");

// All routes in this file are faculty-only. Backend enforcement,
// not just hiding UI: authMiddleware verifies the JWT and
// authorizeRoles checks the role stored in that verified token.
router.use(authMiddleware, authorizeRoles("faculty"));

// ---------------------------------------------------------
// Helper: resolve the faculty.id (not user.id) for the
// logged-in faculty member. Almost every faculty-scoped query
// needs this.
// ---------------------------------------------------------
async function getFacultyRecord(userId) {
    const [rows] = await pool.execute(
        `SELECT id, employee_id, department, phone, designation
         FROM faculty
         WHERE user_id = ?`,
        [userId]
    );
    return rows[0] || null;
}

// =====================================================
// GET /api/faculty/profile
// =====================================================

router.get("/profile", async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT
                f.id,
                f.employee_id,
                f.department,
                f.phone,
                f.designation,
                u.name,
                u.email,
                u.created_at
             FROM faculty f
             JOIN users u ON f.user_id = u.id
             WHERE f.user_id = ?`,
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Faculty profile not found" });
        }

        const [subjects] = await pool.execute(
            `SELECT s.id, s.subject_name, s.subject_code, s.semester
             FROM faculty_subjects fs
             JOIN subjects s ON fs.subject_id = s.id
             JOIN faculty f ON fs.faculty_id = f.id
             WHERE f.user_id = ?
             ORDER BY s.semester, s.subject_name`,
            [req.user.id]
        );

        res.json({ faculty: rows[0], subjects });
    } catch (err) {
        console.error("Get faculty profile error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// =====================================================
// PUT /api/faculty/profile
// Faculty can update their own contact/designation info.
// =====================================================

router.put("/profile", async (req, res) => {
    const { phone, department, designation } = req.body;

    try {
        const [result] = await pool.execute(
            `UPDATE faculty
             SET phone = ?, department = ?, designation = ?
             WHERE user_id = ?`,
            [phone || null, department || null, designation || null, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Faculty profile not found" });
        }

        res.json({ message: "Faculty profile updated successfully" });
    } catch (err) {
        console.error("Update faculty profile error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// =====================================================
// GET /api/faculty/subjects
// Subjects assigned to the logged-in faculty member.
// =====================================================

router.get("/subjects", async (req, res) => {
    try {
        const [subjects] = await pool.execute(
            `SELECT
                s.id,
                s.subject_code,
                s.subject_name,
                s.semester,
                s.description,
                c.course_name,
                c.course_code,
                fs.section
             FROM faculty_subjects fs
             JOIN subjects s ON fs.subject_id = s.id
             JOIN courses c ON s.course_id = c.id
             JOIN faculty f ON fs.faculty_id = f.id
             WHERE f.user_id = ?
             ORDER BY s.semester, s.subject_name`,
            [req.user.id]
        );

        res.json({ count: subjects.length, subjects });
    } catch (err) {
        console.error("Get faculty subjects error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// =====================================================
// GET /api/faculty/students
// Students enrolled in any course taught by this faculty
// member (via their assigned subjects). Supports:
//   ?search=name-or-roll
//   ?subject_id=123  (restrict to students of one subject's course)
// =====================================================

router.get("/students", async (req, res) => {
    const { search, subject_id } = req.query;

    try {
        const faculty = await getFacultyRecord(req.user.id);
        if (!faculty) {
            return res.status(404).json({ error: "Faculty profile not found" });
        }

        let query = `
            SELECT DISTINCT
                s.id,
                s.roll_number,
                s.course,
                s.year,
                s.phone,
                u.name,
                u.email
            FROM students s
            JOIN users u ON s.user_id = u.id
            JOIN courses c ON c.course_code = s.course
            JOIN subjects sub ON sub.course_id = c.id
            JOIN faculty_subjects fs ON fs.subject_id = sub.id
            WHERE fs.faculty_id = ?
        `;
        const params = [faculty.id];

        if (subject_id) {
            query += " AND sub.id = ?";
            params.push(subject_id);
        }

        if (search) {
            query += " AND (u.name LIKE ? OR s.roll_number LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }

        query += " ORDER BY s.roll_number";

        const [students] = await pool.execute(query, params);

        res.json({ count: students.length, students });
    } catch (err) {
        console.error("Get faculty students error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// =====================================================
// GET /api/faculty/students/:id
// Single student detail -- but only if that student falls
// within this faculty member's scope (enrolled in a course
// tied to one of the faculty's subjects). Prevents a faculty
// member from viewing arbitrary students by guessing IDs.
// =====================================================

router.get("/students/:id", async (req, res) => {
    try {
        const faculty = await getFacultyRecord(req.user.id);
        if (!faculty) {
            return res.status(404).json({ error: "Faculty profile not found" });
        }

        const [rows] = await pool.execute(
            `SELECT DISTINCT
                s.id,
                s.roll_number,
                s.course,
                s.year,
                s.phone,
                s.city,
                s.school,
                u.name,
                u.email
             FROM students s
             JOIN users u ON s.user_id = u.id
             JOIN courses c ON c.course_code = s.course
             JOIN subjects sub ON sub.course_id = c.id
             JOIN faculty_subjects fs ON fs.subject_id = sub.id
             WHERE fs.faculty_id = ? AND s.id = ?`,
            [faculty.id, req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: "Student not found or not in your assigned classes"
            });
        }

        res.json({ student: rows[0] });
    } catch (err) {
        console.error("Get faculty student detail error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// =====================================================
// GET /api/faculty/dashboard
// Aggregate stats for the dashboard overview -- all pulled
// from real data, no mock/random numbers.
// =====================================================

router.get("/dashboard", async (req, res) => {
    try {
        const faculty = await getFacultyRecord(req.user.id);
        if (!faculty) {
            return res.status(404).json({ error: "Faculty profile not found" });
        }

        const [[subjectCountRow]] = await pool.execute(
            `SELECT COUNT(*) AS total_subjects
             FROM faculty_subjects WHERE faculty_id = ?`,
            [faculty.id]
        );

        const [[studentCountRow]] = await pool.execute(
            `SELECT COUNT(DISTINCT s.id) AS total_students
             FROM students s
             JOIN courses c ON c.course_code = s.course
             JOIN subjects sub ON sub.course_id = c.id
             JOIN faculty_subjects fs ON fs.subject_id = sub.id
             WHERE fs.faculty_id = ?`,
            [faculty.id]
        );

        const [[attendanceRow]] = await pool.execute(
            `SELECT
                COUNT(*) AS total_marked,
                SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS total_present
             FROM attendance a
             JOIN faculty_subjects fs ON fs.subject_id = a.subject_id
             WHERE fs.faculty_id = ?`,
            [faculty.id]
        );

        const attendancePct =
            attendanceRow.total_marked > 0
                ? Number(
                      ((attendanceRow.total_present / attendanceRow.total_marked) * 100).toFixed(2)
                  )
                : null;

        const [recentActivities] = await pool.execute(
            `SELECT
                act.id,
                act.title,
                act.description,
                act.status,
                act.date,
                act.created_at,
                st.roll_number,
                u.name AS student_name
             FROM activities act
             LEFT JOIN students st ON act.student_id = st.id
             LEFT JOIN users u ON st.user_id = u.id
             WHERE act.performed_by = ?
             ORDER BY act.created_at DESC
             LIMIT 10`,
            [req.user.id]
        );

        res.json({
            total_subjects: subjectCountRow.total_subjects,
            total_students: studentCountRow.total_students,
            attendance_records_marked: attendanceRow.total_marked,
            attendance_percentage: attendancePct,
            recent_activities: recentActivities
        });
    } catch (err) {
        console.error("Get faculty dashboard error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// =====================================================
// GET /api/faculty/activities
// Full activity log for this faculty member (not just the
// dashboard's top 10).
// =====================================================

router.get("/activities", async (req, res) => {
    try {
        const [activities] = await pool.execute(
            `SELECT
                act.id,
                act.title,
                act.description,
                act.status,
                act.date,
                act.created_at,
                st.roll_number,
                u.name AS student_name
             FROM activities act
             LEFT JOIN students st ON act.student_id = st.id
             LEFT JOIN users u ON st.user_id = u.id
             WHERE act.performed_by = ?
             ORDER BY act.created_at DESC`,
            [req.user.id]
        );

        res.json({ count: activities.length, activities });
    } catch (err) {
        console.error("Get faculty activities error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
