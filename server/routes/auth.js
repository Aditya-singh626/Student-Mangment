const express = require("express");
const router = express.Router();

const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const authMiddleware = require("../middleware/auth");

require("dotenv").config();


// =====================================================
// REGISTER
// POST /api/auth/register
// =====================================================

router.post("/register", async (req, res) => {

    const {
        name,
        email,
        password,
        role,
        roll_number,
        course,
        year,
        phone,
        city,
        school,
        tenth_percentage,
        twelfth_percentage,
        year_of_passing,
        about,
        employee_id,
        department,
        designation
    } = req.body;


    // -------------------------------------------------
    // Basic validation
    // -------------------------------------------------

    if (!name || !email || !password) {
        return res.status(400).json({
            error: "Name, email and password are required"
        });
    }


    const userRole = role || "student";


    if (!["student", "faculty", "admin"].includes(userRole)) {
        return res.status(400).json({
            error: "Invalid role"
        });
    }


    // Student-specific validation

    if (userRole === "student" && !roll_number) {
        return res.status(400).json({
            error: "Roll number is required for students"
        });
    }


    // Faculty-specific validation

    if (userRole === "faculty" && !employee_id) {
        return res.status(400).json({
            error: "Employee ID is required for faculty"
        });
    }


    try {

        // -------------------------------------------------
        // Check whether email already exists
        // -------------------------------------------------

        const [existingUser] = await pool.execute(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );


        if (existingUser.length > 0) {
            return res.status(400).json({
                error: "Email already registered"
            });
        }


        // -------------------------------------------------
        // Check student roll number
        // -------------------------------------------------

        if (userRole === "student") {

            const [existingStudent] = await pool.execute(
                "SELECT id FROM students WHERE roll_number = ?",
                [roll_number]
            );

            if (existingStudent.length > 0) {
                return res.status(400).json({
                    error: "Roll number already registered"
                });
            }
        }


        // -------------------------------------------------
        // Check faculty employee ID
        // -------------------------------------------------

        if (userRole === "faculty") {

            const [existingFaculty] = await pool.execute(
                "SELECT id FROM faculty WHERE employee_id = ?",
                [employee_id]
            );

            if (existingFaculty.length > 0) {
                return res.status(400).json({
                    error: "Employee ID already registered"
                });
            }
        }


        // -------------------------------------------------
        // Hash password
        // -------------------------------------------------

        const passwordHash = await bcrypt.hash(password, 10);


        // -------------------------------------------------
        // Create user
        // -------------------------------------------------

        const [userResult] = await pool.execute(
            `INSERT INTO users
            (name, email, password_hash, role)
            VALUES (?, ?, ?, ?)`,
            [
                name,
                email,
                passwordHash,
                userRole
            ]
        );


        const userId = userResult.insertId;


        // =================================================
        // STUDENT
        // =================================================

        if (userRole === "student") {

            await pool.execute(
                `INSERT INTO students
                (
                    user_id,
                    roll_number,
                    course,
                    year,
                    phone,
                    city,
                    school,
                    tenth_percentage,
                    twelfth_percentage,
                    year_of_passing,
                    about
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    roll_number,
                    course || null,
                    year || null,
                    phone || null,
                    city || null,
                    school || null,
                    tenth_percentage || null,
                    twelfth_percentage || null,
                    year_of_passing || null,
                    about || null
                ]
            );
        }


        // =================================================
        // FACULTY
        // =================================================

        if (userRole === "faculty") {

            await pool.execute(
                `INSERT INTO faculty
                (
                    user_id,
                    employee_id,
                    department,
                    phone,
                    designation
                )
                VALUES (?, ?, ?, ?, ?)`,
                [
                    userId,
                    employee_id,
                    department || null,
                    phone || null,
                    designation || null
                ]
            );
        }


        // =================================================
        // ADMIN
        // =================================================

        // Admin doesn't need an additional profile table.
        // Their information is stored in users.


        res.status(201).json({
            message: "Registration successful",
            user: {
                id: userId,
                name,
                email,
                role: userRole
            }
        });

    } catch (err) {

        console.error("Registration error:", err);

        res.status(500).json({
            error: "Server error during registration"
        });
    }
});


// =====================================================
// LOGIN
// POST /api/auth/login
// =====================================================

router.post("/login", async (req, res) => {

    const {
        email,
        password
    } = req.body;


    if (!email || !password) {

        return res.status(400).json({
            error: "Email and password are required"
        });
    }


    try {

        // -------------------------------------------------
        // Find user
        // -------------------------------------------------

        const [users] = await pool.execute(
            `SELECT
                id,
                name,
                email,
                password_hash,
                role
             FROM users
             WHERE email = ?`,
            [email]
        );


        if (users.length === 0) {

            return res.status(401).json({
                error: "Invalid credentials"
            });
        }


        const user = users[0];


        // -------------------------------------------------
        // Compare password
        // -------------------------------------------------

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );


        if (!passwordMatch) {

            return res.status(401).json({
                error: "Invalid credentials"
            });
        }


        // -------------------------------------------------
        // Create JWT
        // -------------------------------------------------

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );


        // -------------------------------------------------
        // Return safe user information
        // -------------------------------------------------

        res.json({

            message: "Login successful",

            token,

            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }

        });


    } catch (err) {

        console.error("Login error:", err);

        res.status(500).json({
            error: "Server error during login"
        });
    }
});


// =====================================================
// CURRENT USER
// GET /api/auth/me
// =====================================================

router.get("/me", authMiddleware, async (req, res) => {

    try {

        const [users] = await pool.execute(
            `SELECT
                id,
                name,
                email,
                role,
                created_at
             FROM users
             WHERE id = ?`,
            [req.user.id]
        );


        if (users.length === 0) {

            return res.status(404).json({
                error: "User not found"
            });
        }


        const user = users[0];


        // -------------------------------------------------
        // Student profile
        // -------------------------------------------------

        if (user.role === "student") {

            const [students] = await pool.execute(
                `SELECT
                    id,
                    roll_number,
                    course,
                    year,
                    phone,
                    city,
                    school,
                    tenth_percentage,
                    twelfth_percentage,
                    year_of_passing,
                    about
                 FROM students
                 WHERE user_id = ?`,
                [user.id]
            );


            return res.json({
                user,
                profile: students[0] || null
            });
        }


        // -------------------------------------------------
        // Faculty profile
        // -------------------------------------------------

        if (user.role === "faculty") {

            const [faculty] = await pool.execute(
                `SELECT
                    id,
                    employee_id,
                    department,
                    phone,
                    designation
                 FROM faculty
                 WHERE user_id = ?`,
                [user.id]
            );


            return res.json({
                user,
                profile: faculty[0] || null
            });
        }


        // -------------------------------------------------
        // Admin
        // -------------------------------------------------

        return res.json({
            user,
            profile: null
        });


    } catch (err) {

        console.error("Me route error:", err);

        res.status(500).json({
            error: "Server error"
        });
    }
});


module.exports = router;