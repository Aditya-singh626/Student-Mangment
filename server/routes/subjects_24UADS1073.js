const express = require("express");
const router = express.Router();
const pool = require("../db");

// 📚 Get all subjects (for admin / debugging)
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM subject_24UADS1073");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching subjects:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 🎓 Get subjects for a specific student
router.get("/:roll_number", async (req, res) => {
  const { roll_number } = req.params;
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM subject_24UADS1073 WHERE student_roll_number = ?",
      [roll_number]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching student subjects:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ➕ Add new subject
router.post("/", async (req, res) => {
  const { student_roll_number, subject_name, description, course_id } = req.body;

  if (!student_roll_number) {
    return res.status(400).json({ error: "student_roll_number is required" });
  }

  try {
    await pool.execute(
      `INSERT INTO subject_24UADS1073 
       (student_roll_number, subject_name, description, course_id) 
       VALUES (?, ?, ?, ?)`,
      [
        student_roll_number,
        subject_name || "",
        description || "",
        course_id || null,
      ]
    );

    res.json({ message: "✅ Subject added successfully" });
  } catch (err) {
    console.error("Error adding subject:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
