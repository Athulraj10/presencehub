const express = require("express");

const attendanceRoutes =
require("./routes/attendanceRoutes");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    service: "attendance-service",
    status: "UP"
  });
});

app.use("/attendance", attendanceRoutes);

module.exports = app;





