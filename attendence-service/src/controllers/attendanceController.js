const publishEvent =
require("../utils/publisher");

const pool =
require("../config/db");

const {
  validateEmployee
} = require(
  "../services/employeeService"
);

// Convert timestamp to IST date string
const toISTDateString = (timestamp) => {
  const date = new Date(timestamp);
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset);
  return istDate.toISOString().split("T")[0];
};

exports.punchIn =
async (req, res) => {


try {

  const {
    employeeId,
    timestamp
  } = req.body;

  if (
    !employeeId ||
    !timestamp
  ) {

    return res.status(400).json({
      success: false,
      message:
        "employeeId and timestamp required"
    });

  }

  if (
    isNaN(
      new Date(timestamp)
    )
  ) {

    return res.status(400).json({
      success: false,
      message:
        "Invalid timestamp format"
    });

  }

  if (
    new Date(timestamp) >
    new Date()
  ) {

    return res.status(400).json({
      success: false,
      message:
        "Future timestamps not allowed"
    });

  }

  const employeeExists =
    await validateEmployee(
      employeeId
    );

  if (!employeeExists) {

    return res.status(404).json({
      success: false,
      message:
        "Employee not found"
    });

  }

  const attendanceDate =
    toISTDateString(timestamp);

  const officeStartTime =
    new Date(
      attendanceDate +
      " 09:00:00"
    );

  const isLate =
    new Date(timestamp) >
    officeStartTime;

  const [existingAttendance] =
    await pool.query(
      `
      SELECT *
      FROM attendance
      WHERE employee_id = ?
      AND attendance_date = ?
      `,
      [
        employeeId,
        attendanceDate
      ]
    );

  if (
    existingAttendance.length > 0
  ) {

    return res.status(400).json({
      success: false,
      message:
        "Employee already punched in today"
    });

  }

  await pool.query(
    `
    INSERT INTO attendance
    (
      employee_id,
      punch_in,
      attendance_date,
      is_late
    )
    VALUES (?, ?, ?, ?)
    `,
    [
      employeeId,
      timestamp,
      attendanceDate,
      isLate
    ]
  );

  await publishEvent(
    "attendance.punchin",
    {
      employeeId,
      timestamp
    }
  );

  res.status(201).json({
    success: true,
    message:
      "Punch In Successful"
  });

} catch (error) {

  console.error(error);

  res.status(500).json({
    success: false,
    message:
      error.message
  });

}


};

exports.punchOut =
async (req, res) => {


try {

  const {
    employeeId,
    timestamp
  } = req.body;

  if (
    !employeeId ||
    !timestamp
  ) {

    return res.status(400).json({
      success: false,
      message:
        "employeeId and timestamp required"
    });

  }

  if (
    isNaN(
      new Date(timestamp)
    )
  ) {

    return res.status(400).json({
      success: false,
      message:
        "Invalid timestamp format"
    });

  }

  if (
    new Date(timestamp) >
    new Date()
  ) {

    return res.status(400).json({
      success: false,
      message:
        "Future timestamps not allowed"
    });

  }

  const employeeExists =
    await validateEmployee(
      employeeId
    );

  if (!employeeExists) {

    return res.status(404).json({
      success: false,
      message:
        "Employee not found"
    });

  }

  const attendanceDate =
    toISTDateString(timestamp);

  const [attendanceRecord] =
    await pool.query(
      `
      SELECT *
      FROM attendance
      WHERE employee_id = ?
      AND attendance_date = ?
      `,
      [
        employeeId,
        attendanceDate
      ]
    );

  if (
    attendanceRecord.length === 0
  ) {

    return res.status(404).json({
      success: false,
      message:
        "No punch-in record found for today"
    });

  }

  if (
    attendanceRecord[0].punch_out
  ) {

    return res.status(400).json({
      success: false,
      message:
        "Employee already punched out"
    });

  }

  const punchInTime =
    new Date(
      attendanceRecord[0].punch_in
    );

  const punchOutTime =
    new Date(timestamp);

  if (
    punchOutTime < punchInTime
  ) {

    return res.status(400).json({
      success: false,
      message:
        "Punch out time cannot be earlier than punch in time"
    });

  }

  const workingHours =
    (
      (
        punchOutTime -
        punchInTime
      ) /
      (
        1000 *
        60 *
        60
      )
    ).toFixed(2);

  const overtimeHours =
    Math.max(
      0,
      Number(workingHours) - 8
    );

  const officeEndHour = 18;

  const earlyDeparture =
    punchOutTime.getHours()
    < officeEndHour;

  await pool.query(
    `
    UPDATE attendance
    SET
      punch_out = ?,
      working_hours = ?,
      overtime_hours = ?,
      early_departure = ?
    WHERE employee_id = ?
    AND attendance_date = ?
    `,
    [
      timestamp,
      workingHours,
      overtimeHours,
      earlyDeparture,
      employeeId,
      attendanceDate
    ]
  );

  await publishEvent(
    "attendance.punchout",
    {
      employeeId,
      timestamp,
      workingHours,
      overtimeHours
    }
  );

  res.json({
    success: true,
    message:
      "Punch Out Successful",
    workingHours,
    overtimeHours,
    earlyDeparture
  });

} catch (error) {

  console.error(error);

  res.status(500).json({
    success: false,
    message:
      error.message
  });

}


};

exports.getAttendanceHistory =
async (req, res) => {


try {

  const {
    employeeId
  } = req.params;

  const page =
    parseInt(
      req.query.page
    ) || 1;

  const limit =
    parseInt(
      req.query.limit
    ) || 10;

  const offset =
    (page - 1) * limit;

  const [rows] =
    await pool.query(
      `
      SELECT *
      FROM attendance
      WHERE employee_id = ?
      ORDER BY attendance_date DESC
      LIMIT ?
      OFFSET ?
      `,
      [
        employeeId,
        limit,
        offset
      ]
    );

  res.json({
    success: true,
    page,
    limit,
    data: rows
  });

} catch (error) {

  console.error(error);

  res.status(500).json({
    success: false,
    message:
      error.message
  });

}


};

exports.getAttendanceByDate =
async (req, res) => {


try {

  const { date } =
    req.params;

  const [rows] =
    await pool.query(
      `
      SELECT *
      FROM attendance
      WHERE attendance_date = ?
      `,
      [date]
    );

  res.json({
    success: true,
    data: rows
  });

} catch (error) {

  console.error(error);

  res.status(500).json({
    success: false,
    message:
      error.message
  });

}


};

exports.getMonthlyAttendance =
async (req, res) => {


try {

  const {
    employeeId
  } = req.params;

  const [rows] =
    await pool.query(
      `
      SELECT *
      FROM attendance
      WHERE employee_id = ?
      AND MONTH(attendance_date)
        = MONTH(CURDATE())
      AND YEAR(attendance_date)
        = YEAR(CURDATE())
      ORDER BY attendance_date DESC
      `,
      [employeeId]
    );

  res.json({
    success: true,
    data: rows
  });

} catch (error) {

  console.error(error);

  res.status(500).json({
    success: false,
    message:
      error.message
  });

}


};

exports.getAttendanceSummary =
async (req, res) => {


try {

  const {
    employeeId
  } = req.params;

  const [rows] =
    await pool.query(
      `
      SELECT
        COUNT(
          DISTINCT attendance_date
        ) AS totalDays,
        COALESCE(
          SUM(
            working_hours
          ),
          0
        ) AS totalHours
      FROM attendance
      WHERE employee_id = ?
      `,
      [employeeId]
    );

  res.json({
    success: true,
    data: {
      employeeId,
      totalDays:
        rows[0].totalDays,
      totalHours:
        rows[0].totalHours
    }
  });

} catch (error) {

  console.error(error);

  res.status(500).json({
    success: false,
    message:
      error.message
  });

}


};

exports.getAttendanceReport =
async (req, res) => {


try {

  const {
    employeeId
  } = req.params;

  const {
    startDate,
    endDate
  } = req.query;

  if (
    !startDate ||
    !endDate
  ) {

    return res.status(400).json({
      success: false,
      message:
        "startDate and endDate are required"
    });

  }

  const [rows] =
    await pool.query(
      `
      SELECT *
      FROM attendance
      WHERE employee_id = ?
      AND attendance_date
      BETWEEN ? AND ?
      ORDER BY attendance_date
      `,
      [
        employeeId,
        startDate,
        endDate
      ]
    );

  res.json({
    success: true,
    data: rows
  });

} catch (error) {

  console.error(error);

  res.status(500).json({
    success: false,
    message:
      error.message
  });

}


};

exports.getDashboard =
async (req, res) => {


try {

  const {
    employeeId
  } = req.params;

  const [rows] =
    await pool.query(
      `
      SELECT
        COUNT(*) AS totalDays,

        SUM(
          CASE
            WHEN is_late = TRUE
            THEN 1
            ELSE 0
          END
        ) AS lateDays,

        COALESCE(
          SUM(working_hours),
          0
        ) AS totalHours,

        COALESCE(
          SUM(overtime_hours),
          0
        ) AS overtimeHours,

        SUM(
          CASE
            WHEN early_departure = TRUE
            THEN 1
            ELSE 0
          END
        ) AS earlyDepartureDays

      FROM attendance
      WHERE employee_id = ?
      `,
      [employeeId]
    );

  res.json({
    success: true,
    data: rows[0]
  });

} catch (error) {

  console.error(error);

  res.status(500).json({
    success: false,
    message:
      error.message
  });

}


};

exports.getLateAttendanceCount =
async (req, res) => {


try {

  const {
    employeeId
  } = req.params;

  const [rows] =
    await pool.query(
      `
      SELECT COUNT(*) AS lateDays
      FROM attendance
      WHERE employee_id = ?
      AND is_late = TRUE
      `,
      [employeeId]
    );

  res.json({
    success: true,
    lateDays:
      rows[0].lateDays
  });

} catch (error) {

  console.error(error);

  res.status(500).json({
    success: false,
    message:
      error.message
  });

}


};