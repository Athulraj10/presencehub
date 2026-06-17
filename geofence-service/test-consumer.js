require("dotenv").config();

const amqp = require("amqplib");

async function consume() {

    const connection =
        await amqp.connect(
            process.env.RABBITMQ_URL
        );

    const channel =
        await connection.createChannel();

    const queue =
        "geofence-events";

    await channel.assertQueue(
        queue
    );

    console.log(
        "Waiting for messages..."
    );

    channel.consume(
        queue,
        (message) => {

            console.log(
                JSON.parse(
                    message.content.toString()
                )
            );
        }
    );
}

consume();