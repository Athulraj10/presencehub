const { getChannel } = require("../config/rabbitmq");
const pool = require("../config/db");

async function startGeofenceConsumer() {
  const channel = getChannel();

  if (!channel) {
    console.log("RabbitMQ channel not available for geofence consumer");
    return;
  }

  const queue = "geofence-events";
  await channel.assertQueue(queue);
  console.log(`Listening to ${queue}`);

  channel.consume(queue, async (message) => {
    if (message) {
      try {
        const data = JSON.parse(message.content.toString());
        const { employeeId, insideGeofence, timestamp } = data;

        console.log("Geofence Event Received:", data);

        if (insideGeofence) {
          // Employee entered office — auto punch-in if not already done
          const date = new Date(timestamp).toISOString().split("T")[0];
          const [existing] = await pool.query(
            `SELECT * FROM attendance WHERE employee_id = ? AND attendance_date = ?`,
            [employeeId, date]
          );

          if (existing.length === 0) {
            const ts = new Date(timestamp).toISOString().slice(0, 19).replace("T", " ");
            const officeStart = new Date(date + " 09:00:00");
            const isLate = new Date(ts) > officeStart;

            await pool.query(
              `INSERT INTO attendance (employee_id, punch_in, attendance_date, is_late) VALUES (?, ?, ?, ?)`,
              [employeeId, ts, date, isLate]
            );
            console.log(`Auto punch-in for ${employeeId}`);
          }
        }

        channel.ack(message);
      } catch (err) {
        console.error("Error processing geofence event:", err.message);
        channel.nack(message, false, false);
      }
    }
  });
}

module.exports = startGeofenceConsumer;