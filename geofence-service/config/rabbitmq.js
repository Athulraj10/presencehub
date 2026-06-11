require("dotenv").config();

const amqp = require("amqplib");

global.rabbitmqStatus = "DISCONNECTED";

async function connectRabbitMQ() {

    try {

        const connection = await amqp.connect(
            process.env.RABBITMQ_URL
        );

        const channel =
        await connection.createChannel();

        await channel.assertQueue(
            "attendance.punchin"
        );

        await channel.assertQueue(
            "attendance.punchout"
        );

        global.rabbitmqStatus = "CONNECTED";

        console.log(
            "RabbitMQ Connected Successfully"
        );

        return channel;

    } catch (error) {

        global.rabbitmqStatus =
        "DISCONNECTED";

        console.log(
            "RabbitMQ Connection Failed"
        );
    }
}

module.exports = connectRabbitMQ;