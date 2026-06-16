require("dotenv").config();

const pool = require("./db");

async function testConnection() {
  try {
    const connection = await pool.getConnection();

    console.log("Database Connected Successfully");

    connection.release();
  } catch (error) {
    console.error("Database Connection Failed");
    console.error(error.message);
  }
}

testConnection();