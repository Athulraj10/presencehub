const express = require("express");

const router = express.Router();

const {
  registerEmployee,
  getEmployee,
  getAllEmployees,
  updateEmployee,
  deleteEmployee
} = require("../controllers/employeeController");
router.post("/register", registerEmployee);
router.get("/", getAllEmployees);
router.get("/:employeeId", getEmployee);

router.put("/:employeeId", updateEmployee);

router.delete("/:employeeId", deleteEmployee);

module.exports = router;