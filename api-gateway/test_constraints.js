const mysql = require("mysql2/promise");
require("dotenv").config({ path: "./.env" });

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const [createTable] = await connection.query("SHOW CREATE TABLE attendance");
    console.log("Create Table Query:");
    console.log(createTable[0]['Create Table']);
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
