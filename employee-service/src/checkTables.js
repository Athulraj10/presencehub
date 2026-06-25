const db = require("./db");

async function checkTables() {
  try {
    const [rows] = await db.query("SHOW TABLES");
    console.table(rows);
  } catch (error) {
    console.error(error);
  }
}

checkTables();