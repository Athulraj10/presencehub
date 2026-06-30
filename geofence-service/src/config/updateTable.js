require("dotenv").config();

const pool = require("./db");

async function updateTable() {
  try {
    await pool.query(`
      ALTER TABLE employees
      ADD COLUMN password VARCHAR(255)
    `);

    await pool.query(`
      ALTER TABLE employees
      ADD COLUMN role VARCHAR(20) DEFAULT 'employee'
    `);

    console.log("Table updated successfully");

  } catch (error) {
    console.error(error.message);
  }
}

updateTable();