require("dotenv").config();

const mysql = require("mysql2/promise");
const healthStatus = require("./healthStatus");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.getConnection()
  .then(() => {
    healthStatus.database = "CONNECTED";
    console.log("✅ MySQL Connected Successfully");
  })
  .catch((err) => {
    healthStatus.database = "DISCONNECTED";
    console.log("❌ Database Connection Failed:", err.message);
  });

module.exports = db;