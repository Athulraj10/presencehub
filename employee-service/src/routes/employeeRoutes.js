const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const checkRole = require("../middleware/roleMiddleware");

const {
  registerEmployee,
  loginEmployee,
  getEmployee,
  getAllEmployees,
  updateEmployee,
  deleteEmployee,
  employeeExists
} = require("../controllers/employeeController");

router.post("/register", registerEmployee);
router.post("/login", loginEmployee);

router.get(
  "/",
  verifyToken,
  checkRole("admin", "hr"),
  getAllEmployees
);

router.get(
  "/exists/:employeeId",
  employeeExists
);

router.get(
  "/:employeeId",
  verifyToken,
  getEmployee
);

router.put(
  "/:employeeId",
  verifyToken,
  checkRole("admin", "hr"),
  updateEmployee
);

router.delete(
  "/:employeeId",
  verifyToken,
  checkRole("admin"),
  deleteEmployee
);

module.exports = router;