const { getChannel } = require("../config/rabbitmq");
const pool = require("../config/db");

function getLocalDateString(date = new Date()) {
  return date.toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
}

function getLocalTimestamp(date = new Date()) {
  return date.toLocaleString("sv-SE", {
    timeZone: "Asia/Kolkata",
  });
}

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
          // IST date
          const eventDate = new Date(timestamp);
          const date = getLocalDateString(eventDate);

          const [existing] = await pool.query(
            `SELECT * FROM attendance 
             WHERE employee_id = ? 
             AND attendance_date = ?`,
            [employeeId, date]
          );

          if (existing.length === 0) {
            // IST timestamp
            const ts = getLocalTimestamp(eventDate);

            // Office start time in IST
            const officeStart = new Date(`${date}T09:00:00+05:30`);

            const isLate = eventDate > officeStart;

            await pool.query(
              `INSERT INTO attendance
               (
                 employee_id,
                 punch_in,
                 attendance_date,
                 is_late
               )
               VALUES (?, ?, ?, ?)`,
              [
                employeeId,
                ts,
                date,
                isLate
              ]
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