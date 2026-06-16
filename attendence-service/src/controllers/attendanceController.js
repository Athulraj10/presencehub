const publishEvent =
  require("../utils/publisher");

const pool =
  require("../config/db");

exports.punchIn = async (req, res) => {
  try {

    const {
      employeeId,
      timestamp
    } = req.body;

    if (!employeeId || !timestamp) {
      return res.status(400).json({
        success: false,
        message:
          "employeeId and timestamp required"
      });
    }

    // Validate timestamp format
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

    // Prevent future timestamps
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

    const attendanceDate =
      timestamp.split(" ")[0];

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
        attendance_date
      )
      VALUES (?, ?, ?)
      `,
      [
        employeeId,
        timestamp,
        attendanceDate
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

exports.punchOut = async (req, res) => {
  try {

    const {
      employeeId,
      timestamp
    } = req.body;

    if (!employeeId || !timestamp) {
      return res.status(400).json({
        success: false,
        message:
          "employeeId and timestamp required"
      });
    }

    // Validate timestamp format
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

    // Prevent future timestamps
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

    const attendanceDate =
      timestamp.split(" ")[0];

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

    if (punchOutTime < punchInTime) {
      return res.status(400).json({
        success: false,
        message: "Punch out time cannot be earlier than punch in time"
      });
    }

    const workingHours =
      (
        (punchOutTime - punchInTime)
        / (1000 * 60 * 60)
      ).toFixed(2);

    await pool.query(
      `
      UPDATE attendance
      SET punch_out = ?,
          working_hours = ?
      WHERE employee_id = ?
      AND attendance_date = ?
      `,
      [
        timestamp,
        workingHours,
        employeeId,
        attendanceDate
      ]
    );

    await publishEvent(
      "attendance.punchout",
      {
        employeeId,
        timestamp,
        workingHours
      }
    );

    res.json({
      success: true,
      message:
        "Punch Out Successful",
      workingHours
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

      const [rows] =
        await pool.query(
          `
          SELECT *
          FROM attendance
          WHERE employee_id = ?
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
          ORDER BY attendance_date DESC
          LIMIT 30
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
            COUNT(*) AS totalDays,
            COALESCE(
              SUM(working_hours),
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








