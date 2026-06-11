const express = require("express");

const router = express.Router();

const {
  registerEmployee,
  getEmployee,
  getAllEmployees,
  updateEmployee
} = require("../controllers/employeeController");

router.post("/register", registerEmployee);
router.get("/", getAllEmployees);
router.get("/:employeeId", getEmployee);

router.put("/:employeeId", updateEmployee);

module.exports = router;