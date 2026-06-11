const amqp = require("amqplib");

let channel;

const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(
      process.env.RABBITMQ_URL
    );

    channel = await connection.createChannel();

    console.log("RabbitMQ Connected");
  } catch (error) {
    console.error("RabbitMQ Error:", error.message);
  }
};

const getChannel = () => channel;

module.exports = {
  connectRabbitMQ,
  getChannel
};