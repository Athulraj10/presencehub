const express = require("express");

const employeeRoutes = require("./routes/employeeRoutes");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    service: "employee-service",
    status: "UP"
  });
});

app.use("/employees", employeeRoutes);

module.exports = app;