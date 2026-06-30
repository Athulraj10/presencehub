require("dotenv").config();
const pool = require("./db");

async function migrate() {
  try {
    // Check if face_embedding column exists
    const [columns] = await pool.query("SHOW COLUMNS FROM employees");
    const hasEmbedding = columns.some(col => col.Field === "face_embedding");
    
    if (!hasEmbedding) {
      console.log("Adding face_embedding column to employees table...");
      await pool.query("ALTER TABLE employees ADD COLUMN face_embedding TEXT DEFAULT NULL");
      console.log("Column face_embedding added successfully.");
    } else {
      console.log("Column face_embedding already exists in employees table.");
    }
  } catch (error) {
    console.error("Migration failed:", error.message);
  } finally {
    process.exit(0);
  }
}

migrate();
