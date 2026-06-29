const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const checkRole = require("../middleware/roleMiddleware");

const {
  createHR,
  getAllHR,
  getHRById,
  updateHR,
  deleteHR
} = require("../controllers/hrController");

// Only Admin can create HR
router.post(
  "/",
  verifyToken,
  checkRole("admin"),
  createHR
);

// Admin and HR can view HR list
router.get(
  "/",
  verifyToken,
  checkRole("admin", "hr"),
  getAllHR
);

// Admin and HR can view HR details
router.get(
  "/:employeeId",
  verifyToken,
  checkRole("admin", "hr"),
  getHRById
);

// Only Admin can update HR
router.put(
  "/:employeeId",
  verifyToken,
  checkRole("admin"),
  updateHR
);

// Only Admin can delete HR
router.delete(
  "/:employeeId",
  verifyToken,
  checkRole("admin"),
  deleteHR
);

module.exports = router;
module.exports = router;
