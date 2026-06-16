const express = require("express");

const router =
  express.Router();

const attendanceController =
  require("../controllers/attendanceController");

router.post(
  "/punch-in",
  attendanceController.punchIn
);

router.post(
  "/punch-out",
  attendanceController.punchOut
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
  "/:employeeId",
  attendanceController.getAttendanceHistory
);

module.exports = router;





