const express = require("express");
const router = express.Router();
const pool = require("../db");

// 🧾 Get all activities (for admin / debugging)
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM activities_24UADS1073");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching activities:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 🧠 Get activities for a specific student
router.get("/:roll_number", async (req, res) => {
  const { roll_number } = req.params;
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM activities_24UADS1073 WHERE student_roll_number = ?",
      [roll_number]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching student activities:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ➕ Add new activity
router.post("/", async (req, res) => {
  const { student_roll_number, title, description, status, date } = req.body;

  if (!student_roll_number) {
    return res.status(400).json({ error: "student_roll_number is required" });
  }

  try {
    await pool.execute(
      `INSERT INTO activities_24UADS1073 
       (student_roll_number, title, description, status, date) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        student_roll_number,
        title || "",
        description || "",
        status || "pending",
        date || new Date(),
      ]
    );

    res.json({ message: "✅ Activity added successfully" });
  } catch (err) {
    console.error("Error adding activity:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ✏️ Update activity
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body;

  try {
    await pool.execute(
      "UPDATE activities_24UADS1073 SET title = ?, description = ?, status = ? WHERE id = ?",
      [title || "", description || "", status || "pending", id]
    );
    res.json({ message: "✅ Activity updated successfully" });
  } catch (err) {
    console.error("Error updating activity:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ❌ Delete activity
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute("DELETE FROM activities_24UADS1073 WHERE id = ?", [id]);
    res.json({ message: "🗑️ Activity deleted successfully" });
  } catch (err) {
    console.error("Error deleting activity:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
