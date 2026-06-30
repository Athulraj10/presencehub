const publishEvent =
require("../utils/publisher");

const pool =
require("../config/db");

const {
  validateEmployee
} = require(
  "../services/employeeService"
);

const geolib = require("geolib");

const toISTDateString = (timestamp) => {
  const date = new Date(timestamp);
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset);
  return istDate.toISOString().split("T")[0];
};

const parseUTC = (timestamp) => {
  if (!timestamp) return null;
  if (typeof timestamp === "string") {
    const formatted = timestamp.replace(" ", "T");
    if (!formatted.endsWith("Z") && !formatted.includes("+")) {
      return new Date(formatted + "Z");
    }
  } else if (timestamp instanceof Date) {
    const year = timestamp.getFullYear();
    const month = String(timestamp.getMonth() + 1).padStart(2, "0");
    const day = String(timestamp.getDate()).padStart(2, "0");
    const hours = String(timestamp.getHours()).padStart(2, "0");
    const minutes = String(timestamp.getMinutes()).padStart(2, "0");
    const seconds = String(timestamp.getSeconds()).padStart(2, "0");
    return new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`);
  }
  return new Date(timestamp);
};

const getLocalDateString = (date) => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
};

const getWorkingDaysUpToToday = (startDate) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startLimit = startDate && new Date(startDate) > startOfMonth ? new Date(startDate) : startOfMonth;
  
  let workingDays = 0;
  let current = new Date(startLimit);
  current.setHours(0, 0, 0, 0);
  const compareToday = new Date(today);
  compareToday.setHours(23, 59, 59, 999);
  
  while (current <= compareToday) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) { // Monday to Friday
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  return workingDays;
};

const getTotalWorkingDaysInMonth = (startDate) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startLimit = startDate && new Date(startDate) > firstOfMonth ? new Date(startDate) : firstOfMonth;
  const end = new Date(year, month + 1, 0); // Last day of month
  
  let workingDays = 0;
  let current = new Date(startLimit);
  current.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  return workingDays;
};

const getLocalHour = (date) => {
  return parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false
    }).format(date)
  );
};

const getOfficeGeofence = async () => {
  const [results] = await pool.query(
    "SELECT * FROM geofences LIMIT 1"
  );
  if (results.length === 0) {
    throw new Error("No geofence configured");
  }
  return results[0];
};

// ─── FIX #1 helper ───────────────────────────────────────────────────────────
// Validates that latitude and longitude are present and numeric.
// Returns an error response and true if invalid, false if all good.
const validateCoords = (latitude, longitude, res) => {
  if (
    latitude === undefined ||
    longitude === undefined ||
    isNaN(Number(latitude)) ||
    isNaN(Number(longitude))
  ) {
    res.status(400).json({
      success: false,
      message: "Valid latitude and longitude are required"
    });
    return true; // invalid — caller should return immediately
  }
  return false; // valid
};
// ─────────────────────────────────────────────────────────────────────────────

exports.punchIn =
async (req, res) => {

try {

  const {
    employeeId,
    timestamp,
    latitude,
    longitude
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

  // FIX #1 — coordinates are now required for punch-in
  if (validateCoords(latitude, longitude, res)) return;

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

  // Geofence check — always runs now because coords are guaranteed above
  const geofence =
    await getOfficeGeofence();

  const isInsideGeofence =
    geolib.isPointWithinRadius(
      {
        latitude: Number(latitude),
        longitude: Number(longitude)
      },
      {
        latitude: Number(geofence.latitude),
        longitude: Number(geofence.longitude)
      },
      Number(geofence.radius)
    );

  if (!isInsideGeofence) {

    return res.status(403).json({
      success: false,
      message:
        `You are outside ${geofence.office_name}. Punch In not allowed.`
    });

  }

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
    AND punch_out IS NULL
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
        "Employee is already punched in. Please punch out first."
    });

  }

  await pool.query(
    `
    INSERT INTO attendance
    (
      employee_id,
      punch_in,
      attendance_date,
      is_late,
      punch_in_lat,
      punch_in_lng
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      employeeId,
      timestamp,
      attendanceDate,
      isLate,
      latitude,
      longitude
    ]
  );

  console.log(
    `[${new Date().toISOString()}] [INFO] [attendance-service] Punch In recorded | employeeId=${employeeId} | lat=${latitude} | lng=${longitude} | isLate=${isLate}`
  );

  await publishEvent(
    "attendance.punchin",
    {
      employeeId,
      timestamp,
      latitude,
      longitude
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
    timestamp,
    latitude,
    longitude
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

  // FIX #1 — coordinates are now required for punch-out
  if (validateCoords(latitude, longitude, res)) return;

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

  // Geofence check — always runs now because coords are guaranteed above
  const geofence =
    await getOfficeGeofence();

  const isInsideGeofence =
    geolib.isPointWithinRadius(
      {
        latitude: Number(latitude),
        longitude: Number(longitude)
      },
      {
        latitude: Number(geofence.latitude),
        longitude: Number(geofence.longitude)
      },
      Number(geofence.radius)
    );

  if (!isInsideGeofence) {

    return res.status(403).json({
      success: false,
      message:
        `You are outside ${geofence.office_name}. Punch Out not allowed.`
    });

  }

  const attendanceDate =
    getLocalDateString(parsedTimestamp);

  const [attendanceRecord] =
    await pool.query(
      `
      SELECT *
      FROM attendance
      WHERE employee_id = ?
      AND attendance_date = ?
      AND punch_out IS NULL
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
        "No active punch-in record found for today"
    });

  }

  const punchInTime =
    parseUTC(
      attendanceRecord[0].punch_in
    );

  const punchOutTime =
    parsedTimestamp;

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
    getLocalHour(punchOutTime)
    < officeEndHour;

  
  await pool.query(
    `
    UPDATE geofence_breach_alerts
    SET resolved_at = ?
    WHERE employee_id = ?
    AND resolved_at IS NULL
    `,
    [new Date(), employeeId]
  );

  await pool.query(
    `
    UPDATE attendance
    SET
      punch_out = ?,
      working_hours = ?,
      overtime_hours = ?,
      early_departure = ?,
      punch_out_lat = ?,
      punch_out_lng = ?
    WHERE id = ?
    `,
    [
      timestamp,
      workingHours,
      overtimeHours,
      earlyDeparture,
      latitude,
      longitude,
      attendanceRecord[0].id
    ]
  );

  console.log(
    `[${new Date().toISOString()}] [INFO] [attendance-service] Punch Out recorded | employeeId=${employeeId} | lat=${latitude} | lng=${longitude} | workingHours=${workingHours}`
  );

  await publishEvent(
    "attendance.punchout",
    {
      employeeId,
      timestamp,
      workingHours,
      overtimeHours,
      latitude,
      longitude
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




exports.locationPing =
async (req, res) => {

try {

  const {
    employeeId,
    latitude,
    longitude
  } = req.body;

  if (!employeeId) {
    return res.status(400).json({
      success: false,
      message: "employeeId is required"
    });
  }

  if (validateCoords(latitude, longitude, res)) return;

  
  const today = getLocalDateString(new Date());

  const [session] = await pool.query(
    `
    SELECT *
    FROM attendance
    WHERE employee_id = ?
    AND attendance_date = ?
    AND punch_out IS NULL
    `,
    [employeeId, today]
  );

  if (session.length === 0) {
    return res.status(200).json({
      success: true,
      message: "Not checked in — ping ignored"
    });
  }

  const geofence = await getOfficeGeofence();

  const isInside = geolib.isPointWithinRadius(
    {
      latitude: Number(latitude),
      longitude: Number(longitude)
    },
    {
      latitude: Number(geofence.latitude),
      longitude: Number(geofence.longitude)
    },
    Number(geofence.radius)
  );

  // Store the ping for audit trail
  await pool.query(
    `
    INSERT INTO location_pings
    (employee_id, latitude, longitude, is_inside, pinged_at)
    VALUES (?, ?, ?, ?, ?)
    `,
    [employeeId, latitude, longitude, isInside, new Date()]
  );

  if (!isInside) {

    // Check if a breach record already exists for this employee
    const [existingBreach] = await pool.query(
      `
      SELECT *
      FROM geofence_breach_alerts
      WHERE employee_id = ?
      AND resolved_at IS NULL
      `,
      [employeeId]
    );

    if (existingBreach.length === 0) {
      // First ping outside — start the breach clock
      await pool.query(
        `
        INSERT INTO geofence_breach_alerts
        (employee_id, breach_start)
        VALUES (?, ?)
        `,
        [employeeId, new Date()]
      );

      console.log(
        `[${new Date().toISOString()}] [WARN] [attendance-service] Geofence breach started | employeeId=${employeeId} | lat=${latitude} | lng=${longitude}`
      );
    }

  } else {

    
    const [resolved] = await pool.query(
      `
      UPDATE geofence_breach_alerts
      SET resolved_at = ?
      WHERE employee_id = ?
      AND resolved_at IS NULL
      `,
      [new Date(), employeeId]
    );

    if (resolved.affectedRows > 0) {
      console.log(
        `[${new Date().toISOString()}] [INFO] [attendance-service] Geofence breach resolved | employeeId=${employeeId}`
      );
    }

  }

  res.json({
    success: true,
    isInside,
    officeName: geofence.office_name
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
// ─────────────────────────────────────────────────────────────────────────────

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

  const [employee] = await pool.query(
    "SELECT name, created_at FROM employees WHERE employee_id = ?",
    [employeeId]
  );
  const employeeName =
    employee.length > 0
      ? employee[0].name
      : "Employee";
  const employeeCreatedAt =
    employee.length > 0
      ? employee[0].created_at
      : null;

  const [rows] =
    await pool.query(
      `
      SELECT
        COUNT(DISTINCT attendance_date) AS presentDays,

        COUNT(
          DISTINCT CASE
            WHEN is_late = TRUE
            THEN attendance_date
            ELSE NULL
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

        COUNT(
          DISTINCT CASE
            WHEN early_departure = TRUE
            THEN attendance_date
            ELSE NULL
          END
        ) AS earlyDepartureDays

      FROM attendance
      WHERE employee_id = ?
        AND YEAR(attendance_date) = ?
        AND MONTH(attendance_date) = ?
      `,
      [
        employeeId,
        parseInt(getLocalDateString(new Date()).split("-")[0], 10),
        parseInt(getLocalDateString(new Date()).split("-")[1], 10)
      ]
    );

  const stats = rows[0] || {};
  const presentDays = stats.presentDays || 0;
  const totalHours = Number(stats.totalHours) || 0;

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

  const isCheckedInToday = currentSession.length > 0;
  const totalDays = getTotalWorkingDaysInMonth(employeeCreatedAt);
  let totalDaysElapsed = getWorkingDaysUpToToday(employeeCreatedAt);

  // If today is a working day and the employee has NOT punched in yet today,
  // exclude today from the elapsed days count (so they aren't marked absent for today).
  const todayDayOfWeek = new Date().getDay();
  const isTodayWorkingDay = todayDayOfWeek !== 0 && todayDayOfWeek !== 6;
  if (isTodayWorkingDay && !isCheckedInToday) {
    totalDaysElapsed = Math.max(0, totalDaysElapsed - 1);
  }

  const absentDays = Math.max(0, totalDaysElapsed - presentDays);
  const attendancePercentage =
    totalDaysElapsed > 0
      ? Math.min(100, Math.round((presentDays / totalDaysElapsed) * 100))
      : 0;

  const activeSession = currentSession.find(s => s.punch_out === null);
  const isCheckedIn = !!activeSession;

  let totalSeconds = 0;
  
  // 1. Sum up all completed sessions for today
  for (const session of currentSession) {
    if (session.punch_in && session.punch_out) {
      const pIn = parseUTC(session.punch_in);
      const pOut = parseUTC(session.punch_out);
      if (pIn && pOut && !isNaN(pIn.getTime()) && !isNaN(pOut.getTime())) {
        const diffMs = pOut - pIn;
        if (diffMs > 0) {
          totalSeconds += Math.floor(diffMs / 1000);
        }
      }
    }
  }

  // 2. Add current active session duration (if checked in)
  if (isCheckedIn && activeSession.punch_in) {
    const pIn = parseUTC(activeSession.punch_in);
    if (pIn && !isNaN(pIn.getTime())) {
      const now = new Date();
      const diffMs = now - pIn;
      if (diffMs > 0) {
        totalSeconds += Math.floor(diffMs / 1000);
      }
    }
  }

  // 3. Format total active seconds as hh:mm:ss
  const secs = totalSeconds % 60;
  const mins = Math.floor(totalSeconds / 60) % 60;
  const hrs = Math.floor(totalSeconds / 3600);
  const activeDuration = [
    String(hrs).padStart(2, "0"),
    String(mins).padStart(2, "0"),
    String(secs).padStart(2, "0")
  ].join(":");

  // 3.5 Check for active geofence breach warning threshold (10 minutes)
  const [activeBreaches] = await pool.query(
    `SELECT * FROM geofence_breach_alerts
     WHERE employee_id = ?
     AND resolved_at IS NULL`,
    [employeeId]
  );
  
  let hasBreachAlert = false;
  if (activeBreaches.length > 0) {
    const breachStart = new Date(activeBreaches[0].breach_start);
    const now = new Date();
    const elapsedSeconds = Math.floor((now - breachStart) / 1000);
    if (elapsedSeconds >= 600) { // 10 minutes threshold
      hasBreachAlert = true;
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
      earlyDepartureDays: stats.earlyDepartureDays || 0,
      hasBreachAlert
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
      SELECT COUNT(DISTINCT attendance_date) AS lateDays
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
      SELECT COUNT(DISTINCT attendance_date) AS lateDays
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
exports.updateAttendance = async (req, res) => {
  try {
    const {
      attendanceId,
      punchIn,
      punchOut,
      status,
      remarks
    } = req.body;

    if (!attendanceId) {
      return res.status(400).json({
        success: false,
        message: "attendanceId is required"
      });
    }

    const updateFields = [];
    const values = [];

    if (punchIn !== undefined) {
      updateFields.push("punch_in = ?");
      values.push(punchIn);
    }

    if (punchOut !== undefined) {
      updateFields.push("punch_out = ?");
      values.push(punchOut);
    }

    if (status !== undefined) {
      updateFields.push("status = ?");
      values.push(status);
    }

    if (remarks !== undefined) {
      updateFields.push("remarks = ?");
      values.push(remarks);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update"
      });
    }

    values.push(attendanceId);

    const [result] = await pool.query(
      `
      UPDATE attendance
      SET ${updateFields.join(", ")}
      WHERE id = ?
      `,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully"
    });

  } catch (error) {
    console.error("Update Attendance Error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getBreaches = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, e.name AS employee_name
       FROM geofence_breach_alerts b
       JOIN employees e ON e.employee_id = b.employee_id
       WHERE b.resolved_at IS NULL
         AND TIMESTAMPDIFF(SECOND, b.breach_start, NOW()) >= 600`
    );
    res.json({
      success: true,
      breaches: rows
    });
  } catch (error) {
    console.error("Get Breaches Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
