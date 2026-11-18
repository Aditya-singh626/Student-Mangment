require("dotenv").config();

const express = require("express");
const cors = require("cors");

const pool = require("./db");
const { initializeDatabase } = pool;

const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/studentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const academicRoutes = require("./routes/academicRoutes");
const facultyRoutes = require("./routes/facultyRoutes");

const authMiddleware = require("./middleware/auth");
const authorizeRoles = require("./middleware/roleMiddleware");

const app = express();


// =====================================================
// Middleware
// =====================================================

app.use(cors());
app.use(express.json());


// =====================================================
// Health Check
// =====================================================

app.get("/", (req, res) => {
    res.json({
        ok: true,
        message: "Student Management System backend running 🚀"
    });
});


// =====================================================
// Database Connection Test
// =====================================================

app.get("/api/health/db", async (req, res) => {

    try {

        const [rows] = await pool.query(
            "SELECT DATABASE() AS database_name"
        );

        res.json({
            ok: true,
            message: "MySQL connected successfully",
            database: rows[0].database_name
        });

    } catch (error) {

        console.error(
            "❌ Database connection error:",
            error.message
        );

        res.status(500).json({
            ok: false,
            message: "Database connection failed"
        });
    }
});


// =====================================================
// Authentication Routes
// =====================================================

app.use("/api/auth", authRoutes);


// =====================================================
// Student Routes
// =====================================================

app.use("/api/students", studentRoutes);

// =====================================================
// Attendance Routes
// =====================================================

app.use("/api/attendance", attendanceRoutes);

// =====================================================
// Academic Routes
// =====================================================

app.use("/api/academic-records", academicRoutes);

// =====================================================
// Faculty Routes
// =====================================================

app.use("/api/faculty", facultyRoutes);

// =====================================================
// ROLE TEST ROUTES
// =====================================================

// Student test
app.get(
    "/api/test/student",
    authMiddleware,
    authorizeRoles("student"),
    (req, res) => {

        res.json({
            message: "Welcome Student!",
            user: req.user
        });
    }
);


// Faculty test
app.get(
    "/api/test/faculty",
    authMiddleware,
    authorizeRoles("faculty"),
    (req, res) => {

        res.json({
            message: "Welcome Faculty!",
            user: req.user
        });
    }
);


// Admin test
app.get(
    "/api/test/admin",
    authMiddleware,
    authorizeRoles("admin"),
    (req, res) => {

        res.json({
            message: "Welcome Admin!",
            user: req.user
        });
    }
);


// =====================================================
// Global Error Handler
// =====================================================

app.use((err, req, res, next) => {

    console.error("🔥 Server Error:", err);

    res.status(500).json({
        error: "Internal Server Error"
    });
});


// =====================================================
// Start Server
// =====================================================

const PORT = process.env.PORT || 4000;

async function startServer() {
    try {
        await initializeDatabase();
        console.log("✅ Database schema initialized");

        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("❌ Database initialization failed:", error.message);
        process.exitCode = 1;
    }
}

startServer();