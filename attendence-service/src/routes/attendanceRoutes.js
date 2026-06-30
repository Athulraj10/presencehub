const express = require("express");

const router =
express.Router();

const attendanceController =
require("../controllers/attendanceController");

const verifyToken = require("../middleware/authMiddleware");
const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post(
  "/punch-in",
  verifyToken,
  upload.single("image"),
  attendanceController.punchIn
);

router.post(
"/punch-out",
attendanceController.punchOut
);

router.put(
"/update",
attendanceController.updateAttendance
);

router.get(
"/date/:date",
attendanceController.getAttendanceByDate
);

router.get(
"/month/:employeeId",
attendanceController.getMonthlyAttendance
);

router.get(
"/summary/:employeeId",
attendanceController.getAttendanceSummary
);

router.get(
"/report/:employeeId",
attendanceController.getAttendanceReport
);

router.get(
"/dashboard/:employeeId",
attendanceController.getDashboard
);

router.get(
"/alerts/:employeeId",
attendanceController.getAlerts
);

router.get(
"/late/:employeeId",
attendanceController.getLateAttendanceCount
);

router.get(
"/:employeeId",
attendanceController.getAttendanceHistory
);

module.exports = router;











