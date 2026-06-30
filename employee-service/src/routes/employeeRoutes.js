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


const {
  forgotPassword
} = require("../controllers/employeeController");

router.post(
  "/forgot-password",
  forgotPassword
);

const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post(
  "/register",
  upload.single("image"),
  registerEmployee
);

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
  checkRole("admin", "hr"),
  deleteEmployee
);

module.exports = router;