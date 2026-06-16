const { getChannel } =
require("../config/rabbitmq");

async function startEmployeeConsumer() {

  const channel =
    getChannel();

  if (!channel) {
    console.log(
      "RabbitMQ channel not available"
    );
    return;
  }

  const queue =
    "employee.created";

  await channel.assertQueue(queue);

  console.log(
    `Listening to ${queue}`
  );

  channel.consume(
    queue,
    (message) => {

      if (message) {

        const data =
          JSON.parse(
            message.content.toString()
          );

        console.log(
          "Employee Created Event Received"
        );

        console.log(data);

        channel.ack(message);
      }
    }
  );
}

module.exports =
  startEmployeeConsumer;





  