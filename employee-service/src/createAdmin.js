require("dotenv").config();
const db = require("./config/db");
const bcrypt = require("bcrypt");

async function createAdmin() {
  try {
    const [existing] = await db.query(
      `
      SELECT *
      FROM employees
      WHERE employee_id = ?
      OR email = ?
      `,
      ["ADMIN001", "admin@presencehub.com"]
    );

    if (existing.length > 0) {
      console.log("Admin already exists");
      process.exit();
    }

    const password = await bcrypt.hash(
      "password123",
      10
    );

    await db.query(
      `
      INSERT INTO employees
      (
        employee_id,
        name,
        email,
        department,
        password,
        role
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        "ADMIN001",
        "System Admin",
        "admin@presencehub.com",
        "Administration",
        password,
        "admin"
      ]
    );

    console.log("Admin Created");
    process.exit();

  } catch (error) {
    console.error(error);
    process.exit();
  }
}

createAdmin();