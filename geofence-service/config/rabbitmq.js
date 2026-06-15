require("dotenv").config();

const amqp = require("amqplib");
const healthStatus = require("./healthStatus");

async function connectRabbitMQ() {

    try {

        const connection = await amqp.connect(
            process.env.RABBITMQ_URL
        );

        const channel = await connection.createChannel();

        healthStatus.rabbitmq = "CONNECTED";

        console.log(
            "✅ RabbitMQ Connected Successfully"
        );

        return channel;

    } catch (error) {

        healthStatus.rabbitmq = "DISCONNECTED";

        console.log(
            "❌ RabbitMQ Connection Failed"
        );

        console.log(error.message);
    }
}

module.exports = connectRabbitMQ;
    