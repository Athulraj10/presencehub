const pool = require("../config/db");
const publishEvent = require("../utils/publisher");

const BREACH_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

async function checkBreachesAndNotify() {
  try {
    const now = new Date();

    // Find unresolved breaches older than 10 min that haven't been notified yet
    const [breaches] = await pool.query(
      `SELECT b.*, e.name AS employee_name
       FROM geofence_breach_alerts b
       JOIN employees e ON e.employee_id = b.employee_id
       WHERE b.resolved_at IS NULL
         AND b.notified_at IS NULL
         AND TIMESTAMPDIFF(SECOND, b.breach_start, NOW()) >= ?`,
      [BREACH_THRESHOLD_MS / 1000]
    );

    for (const breach of breaches) {
      const minutesOutside = Math.floor(
        (now - new Date(breach.breach_start)) / 60000
      );

      // Publish to a queue your notification service (or HR email service) consumes
      await publishEvent("hr.geofence.alert", {
        employeeId: breach.employee_id,
        employeeName: breach.employee_name,
        breachStart: breach.breach_start,
        minutesOutside,
        message: `${breach.employee_name} has been outside the geofence for ${minutesOutside} minutes without punching out.`
      });

      // Mark as notified so it doesn't fire again
      await pool.query(
        `UPDATE geofence_breach_alerts SET notified_at = ? WHERE id = ?`,
        [now, breach.id]
      );

      console.log(
        `[BREACH ALERT] Notified HR for employee ${breach.employee_id} — ${minutesOutside} min outside`
      );
    }
  } catch (err) {
    console.error("[breachNotifier] Error:", err.message);
  }
}

// Run every 2 minutes
setInterval(checkBreachesAndNotify, 2 * 60 * 1000);

module.exports = { checkBreachesAndNotify };