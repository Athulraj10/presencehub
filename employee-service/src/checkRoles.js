require("dotenv").config();

const db = require("./config/db");

async function checkRoles() {
  try {
    const [rows] = await db.query(`
      SELECT employee_id, name, email, role
      FROM employees
    `);

    console.table(rows);
    process.exit();

  } catch (error) {
    console.error(error);
    process.exit();
  }
}

checkRoles();