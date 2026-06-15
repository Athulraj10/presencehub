const { getChannel } =
require("../config/rabbitmq");

async function publishEvent(
  queue,
  data
) {

  const channel =
    getChannel();

  if (!channel) {
    console.log(
      "RabbitMQ channel not available"
    );
    return;
  }

  await channel.assertQueue(queue);

  channel.sendToQueue(
    queue,
    Buffer.from(
      JSON.stringify(data)
    )
  );

  console.log(
    `Event published to ${queue}`
  );
}

module.exports = publishEvent;











