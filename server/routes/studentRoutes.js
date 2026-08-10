const express = require("express");

const router = express.Router();

const pool = require("../db");
const authMiddleware = require("../middleware/auth");
const authorizeRoles = require("../middleware/roleMiddleware");


// =====================================================
// GET OWN STUDENT PROFILE
// GET /api/students/profile
// Student only
// =====================================================

router.get(
    "/profile",
    authMiddleware,
    authorizeRoles("student"),
    async (req, res) => {

        try {

            const [students] = await pool.execute(
                `SELECT
                    s.id,
                    s.roll_number,
                    s.course,
                    s.year,
                    s.phone,
                    s.city,
                    s.school,
                    s.tenth_percentage,
                    s.twelfth_percentage,
                    s.year_of_passing,
                    s.about,
                    u.name,
                    u.email
                 FROM students s
                 JOIN users u ON s.user_id = u.id
                 WHERE s.user_id = ?`,
                [req.user.id]
            );


            if (students.length === 0) {

                return res.status(404).json({
                    error: "Student profile not found"
                });
            }


            res.json({
                student: students[0]
            });

        } catch (err) {

            console.error("Get profile error:", err);

            res.status(500).json({
                error: "Server error"
            });
        }
    }
);


// =====================================================
// UPDATE OWN STUDENT PROFILE
// PUT /api/students/profile
// Student only
// =====================================================

router.put(
    "/profile",
    authMiddleware,
    authorizeRoles("student"),
    async (req, res) => {

        const {
            phone,
            city,
            school,
            tenth_percentage,
            twelfth_percentage,
            year_of_passing,
            about
        } = req.body;


        try {

            const [result] = await pool.execute(
                `UPDATE students
                 SET
                    phone = ?,
                    city = ?,
                    school = ?,
                    tenth_percentage = ?,
                    twelfth_percentage = ?,
                    year_of_passing = ?,
                    about = ?
                 WHERE user_id = ?`,
                [
                    phone || null,
                    city || null,
                    school || null,
                    tenth_percentage || null,
                    twelfth_percentage || null,
                    year_of_passing || null,
                    about || null,
                    req.user.id
                ]
            );


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    error: "Student profile not found"
                });
            }


            res.json({
                message: "Student profile updated successfully"
            });

        } catch (err) {

            console.error("Update profile error:", err);

            res.status(500).json({
                error: "Server error"
            });
        }
    }
);


// =====================================================
// GET ALL STUDENTS
// GET /api/students
// Faculty + Admin
// =====================================================

router.get(
    "/",
    authMiddleware,
    authorizeRoles("faculty", "admin"),
    async (req, res) => {

        try {

            const [students] = await pool.execute(
                `SELECT
                    s.id,
                    s.roll_number,
                    s.course,
                    s.year,
                    s.phone,
                    s.city,
                    s.school,
                    s.twelfth_percentage,
                    u.name,
                    u.email
                 FROM students s
                 JOIN users u ON s.user_id = u.id
                 ORDER BY s.id DESC`
            );


            res.json({
                count: students.length,
                students
            });

        } catch (err) {

            console.error("Get students error:", err);

            res.status(500).json({
                error: "Server error"
            });
        }
    }
);


// =====================================================
// GET STUDENT BY ID
// GET /api/students/:id
// Faculty + Admin
// =====================================================

router.get(
    "/:id",
    authMiddleware,
    authorizeRoles("faculty", "admin"),
    async (req, res) => {

        try {

            const [students] = await pool.execute(
                `SELECT
                    s.id,
                    s.roll_number,
                    s.course,
                    s.year,
                    s.phone,
                    s.city,
                    s.school,
                    s.tenth_percentage,
                    s.twelfth_percentage,
                    s.year_of_passing,
                    s.about,
                    u.name,
                    u.email
                 FROM students s
                 JOIN users u ON s.user_id = u.id
                 WHERE s.id = ?`,
                [req.params.id]
            );


            if (students.length === 0) {

                return res.status(404).json({
                    error: "Student not found"
                });
            }


            res.json({
                student: students[0]
            });

        } catch (err) {

            console.error("Get student error:", err);

            res.status(500).json({
                error: "Server error"
            });
        }
    }
);


// =====================================================
// UPDATE ANY STUDENT
// PUT /api/students/:id
// Admin only
// =====================================================

router.put(
    "/:id",
    authMiddleware,
    authorizeRoles("admin"),
    async (req, res) => {

        const {
            phone,
            city,
            school,
            course,
            year,
            tenth_percentage,
            twelfth_percentage,
            year_of_passing,
            about
        } = req.body;


        try {

            const [result] = await pool.execute(
                `UPDATE students
                 SET
                    phone = ?,
                    city = ?,
                    school = ?,
                    course = ?,
                    year = ?,
                    tenth_percentage = ?,
                    twelfth_percentage = ?,
                    year_of_passing = ?,
                    about = ?
                 WHERE id = ?`,
                [
                    phone || null,
                    city || null,
                    school || null,
                    course || null,
                    year || null,
                    tenth_percentage || null,
                    twelfth_percentage || null,
                    year_of_passing || null,
                    about || null,
                    req.params.id
                ]
            );


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    error: "Student not found"
                });
            }


            res.json({
                message: "Student updated successfully"
            });

        } catch (err) {

            console.error("Admin update error:", err);

            res.status(500).json({
                error: "Server error"
            });
        }
    }
);


// =====================================================
// DELETE STUDENT
// DELETE /api/students/:id
// Admin only
// =====================================================

router.delete(
    "/:id",
    authMiddleware,
    authorizeRoles("admin"),
    async (req, res) => {

        try {

            const [students] = await pool.execute(
                `SELECT user_id
                 FROM students
                 WHERE id = ?`,
                [req.params.id]
            );


            if (students.length === 0) {

                return res.status(404).json({
                    error: "Student not found"
                });
            }


            const userId = students[0].user_id;


            await pool.execute(
                `DELETE FROM users
                 WHERE id = ?`,
                [userId]
            );


            res.json({
                message: "Student deleted successfully"
            });

        } catch (err) {

            console.error("Delete student error:", err);

            res.status(500).json({
                error: "Server error"
            });
        }
    }
);


module.exports = router;