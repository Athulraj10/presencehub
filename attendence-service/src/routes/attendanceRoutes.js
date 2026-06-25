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
    "/location-ping", 
    attendanceController.locationPing
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











