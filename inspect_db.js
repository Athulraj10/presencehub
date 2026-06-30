const mysql = require("mysql2/promise");
require("dotenv").config({ path: "./api-gateway/.env" });

async function inspect() {
  console.log("Connecting to Database using API Gateway environment configurations...");
  console.log("Host:", process.env.DB_HOST);
  console.log("Port:", process.env.DB_PORT);
  console.log("Database:", process.env.DB_NAME);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const [tables] = await connection.query("SHOW TABLES");
    console.log("\nTables found in database:");
    console.table(tables);

    for (const row of tables) {
      const tableName = Object.values(row)[0];
      const [columns] = await connection.query(`DESCRIBE \`${tableName}\``);
      console.log(`\nColumns for table: ${tableName}`);
      console.table(columns);
    }
  } catch (err) {
    console.error("Error inspecting database:", err.message);
  } finally {
    await connection.end();
  }
}

inspect().catch(console.error);
