const express = require("express");
const cors = require("cors");

const attendanceRoutes =
require("./routes/attendanceRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    service: "attendance-service",
    status: "UP"
  });
});

app.use("/attendance", attendanceRoutes);

module.exports = app;

app.get("/health", (req, res) => {
  res.json({
    service: "attendance-service",
    status: "UP"
  });
});

app.use("/attendance", attendanceRoutes);

module.exports = app;





