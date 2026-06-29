require("dotenv").config();

const mysql = require("mysql2");
const healthStatus = require("./healthStatus");

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {

    if (err) {

        healthStatus.database = "DISCONNECTED";

        console.log("❌ Database Connection Failed");
        console.log(err.message);

        return;
    }

    healthStatus.database = "CONNECTED";

    console.log("✅ MySQL Connected Successfully");
});

module.exports = db;
