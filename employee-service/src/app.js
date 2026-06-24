const express = require("express");
const cors = require("cors");

const employeeRoutes = require("./routes/employeeRoutes");
const hrRoutes = require("./routes/hrRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    service: "employee-service",
    status: "UP"
  });
});

app.use("/employees", employeeRoutes);
app.use("/hr", hrRoutes);

module.exports = app;