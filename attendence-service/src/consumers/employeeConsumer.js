const { getChannel } = require("../config/rabbitmq");
const pool = require("../config/db");

async function startEmployeeConsumer() {
  const channel = getChannel();

  if (!channel) {
    console.log("RabbitMQ channel not available");
    return;
  }

  const queue = "employee.created";
  await channel.assertQueue(queue);
  console.log(`Listening to ${queue}`);

  channel.consume(queue, async (message) => {
    if (message) {
      try {
        const data = JSON.parse(message.content.toString());
        console.log("Employee Created Event Received:", data);

        // Cache employee ID so attendance service knows they exist
        await pool.query(
          `INSERT IGNORE INTO known_employees (employee_id) VALUES (?)`,
          [data.employeeId]
        );

        channel.ack(message);
      } catch (err) {
        console.error("Error processing employee.created:", err.message);
        channel.nack(message, false, false);
      }
    }
  });
}

module.exports = startEmployeeConsumer;