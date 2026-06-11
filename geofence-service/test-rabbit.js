require("dotenv").config();

const amqp = require("amqplib");

(async () => {
    try {
        console.log("STARTED");
        console.log("RabbitMQ URL:", process.env.RABBITMQ_URL);

        const connection = await amqp.connect(
            process.env.RABBITMQ_URL
        );

        console.log("RabbitMQ Connected Successfully!");

        await connection.close();

    } catch (error) {
        console.log("RabbitMQ Connection Failed");
        console.log(error);
    }
})();