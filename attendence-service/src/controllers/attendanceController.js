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

  // FIX #2 — resolve any open geofence breach when employee punches out
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
    WHERE employee_id = ?
    AND attendance_date = ?
    `,
    [
      timestamp,
      workingHours,
      overtimeHours,
      earlyDeparture,
      latitude,
      longitude,
      employeeId,
      attendanceDate
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

// ─── FIX #2 — Location ping endpoint ─────────────────────────────────────────
// Called by the frontend every 2 minutes while the employee is checked in.
// Records the ping, checks geofence, and manages breach tracking.
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

  // Only track pings for employees currently punched in (no punch_out yet today)
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

    // Employee is back inside — resolve any open breach
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
    "SELECT name FROM employees WHERE employee_id = ?",
    [employeeId]
  );
  const employeeName =
    employee.length > 0
      ? employee[0].name
      : "Employee";

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
  const totalDays = 22;
  const absentDays = Math.max(0, totalDays - presentDays);
  const totalHours = Number(stats.totalHours) || 0;
  const attendancePercentage =
    totalDays > 0
      ? Math.min(100, Math.round((presentDays / totalDays) * 100))
      : 0;

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

  const isCheckedIn =
    currentSession.length > 0 &&
    currentSession[0].punch_out === null;

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