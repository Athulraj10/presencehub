const publishEvent =
require("../utils/publisher");

const pool =
require("../config/db");

const {
  validateEmployee
} = require(
  "../services/employeeService"
);

const parseUTC = (ts) => {
  if (!ts) return new Date();
  if (ts.includes("T") || ts.endsWith("Z")) return new Date(ts);
  return new Date(ts.replace(" ", "T") + "Z");
};

const getLocalDateString = (date) => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
};

const getLocalHour = (date) => {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false
    }).format(date)
  );
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

  const parsedTimestamp = parseUTC(timestamp);
  if (
    isNaN(
      parsedTimestamp.getTime()
    )
  ) {

    return res.status(400).json({
      success: false,
      message:
        "Invalid timestamp format"
    });

  }

  if (
    parsedTimestamp >
    new Date(Date.now() + 5 * 60 * 1000)
  ) {

    return res.status(400).json({
      success: false,
      message:
        "Future timestamps not allowed"
    });

  }

  /*
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
  */

  const attendanceDate =
    getLocalDateString(parsedTimestamp);

  const officeStartTime =
    new Date(
      attendanceDate +
      "T09:00:00+05:30"
    );

  const isLate =
    parsedTimestamp >
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

  const parsedTimestamp = parseUTC(timestamp);
  if (
    isNaN(
      parsedTimestamp.getTime()
    )
  ) {

    return res.status(400).json({
      success: false,
      message:
        "Invalid timestamp format"
    });

  }

  if (
    parsedTimestamp >
    new Date(Date.now() + 5 * 60 * 1000)
  ) {

    return res.status(400).json({
      success: false,
      message:
        "Future timestamps not allowed"
    });

  }

  /*
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
  */

  const attendanceDate =
    getLocalDateString(parsedTimestamp);

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
    parsedTimestamp;

  if (
    punchOutTime <
    punchInTime
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
    getLocalHour(punchOutTime)
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

  // 1. Fetch employee name from database
  const [employee] = await pool.query(
    "SELECT name FROM employees WHERE employee_id = ?",
    [employeeId]
  );
  const employeeName = employee.length > 0 ? employee[0].name : "Employee";

  // 2. Fetch statistics
  const [rows] =
    await pool.query(
      `
      SELECT
        COUNT(*) AS presentDays,

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

  const stats = rows[0] || {};
  const presentDays = stats.presentDays || 0;
  const totalDays = 22; // default denominator in frontend Dashboard.jsx
  const absentDays = Math.max(0, totalDays - presentDays);
  const totalHours = Number(stats.totalHours) || 0;
  const attendancePercentage = totalDays > 0 ? Math.min(100, Math.round((presentDays / totalDays) * 100)) : 0;

  // 3. Check if checked in today
  const todayDate = getLocalDateString(new Date());

  const [currentSession] = await pool.query(
    `
    SELECT *
    FROM attendance
    WHERE employee_id = ?
    AND attendance_date = ?
    `,
    [employeeId, todayDate]
  );

  const isCheckedIn = currentSession.length > 0 && currentSession[0].punch_out === null;

  // 4. Calculate live duration for active session
  let activeDuration = "00:00:00";
  if (isCheckedIn && currentSession[0].punch_in) {
    const punchInTime = new Date(currentSession[0].punch_in);
    const now = new Date();
    const diffMs = now - punchInTime;
    if (diffMs > 0) {
      const diffSecs = Math.floor(diffMs / 1000);
      const secs = diffSecs % 60;
      const mins = Math.floor(diffSecs / 60) % 60;
      const hrs = Math.floor(diffSecs / 3600);
      activeDuration = [
        String(hrs).padStart(2, "0"),
        String(mins).padStart(2, "0"),
        String(secs).padStart(2, "0")
      ].join(":");
    }
  }

  res.json({
    success: true,
    data: {
      employeeName,
      presentDays,
      totalDays,
      absentDays,
      totalHours,
      attendancePercentage,
      isCheckedIn,
      activeDuration,
      lateDays: stats.lateDays || 0,
      overtimeHours: stats.overtimeHours || 0,
      earlyDepartureDays: stats.earlyDepartureDays || 0
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

exports.getAlerts = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const [rows] = await pool.query(
      `
      SELECT COUNT(*) AS lateDays
      FROM attendance
      WHERE employee_id = ?
      AND is_late = TRUE
      `,
      [employeeId]
    );

    const lateDays = rows[0]?.lateDays || 0;
    const alerts = [];

    if (lateDays > 0) {
      alerts.push({
        type: "warning",
        title: "Late Attendance Warning",
        description: `You have been late ${lateDays} times this period. Please adhere to office hours (09:00 AM).`,
        date: getLocalDateString(new Date())
      });
    }

    res.json({
      success: true,
      alerts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
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




