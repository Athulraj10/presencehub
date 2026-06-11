require("dotenv").config();

const pool = require("./db");

async function checkEmployees() {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM employees"
    );

    console.table(rows);

  } catch (error) {
    console.error(error.message);
  }
}

checkEmployees();