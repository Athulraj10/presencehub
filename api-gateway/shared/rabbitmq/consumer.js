const connectRabbitMQ = require('./connection');

async function consume(queue, callback) {
    const channel = await connectRabbitMQ(
        process.env.RABBITMQ_URL
    );

    await channel.assertQueue(queue, {
        durable: true
    });

    channel.consume(
        queue,
        async (message) => {
            if (message !== null) {
                try {
                    const data = JSON.parse(
                        message.content.toString()
                    );

                    await callback(data);

                    channel.ack(message);
                } catch (error) {
                    console.error(
                        `Error consuming message from ${queue}:`,
                        error
                    );

                    channel.nack(
                        message,
                        false,
                        false
                    );
                }
            }
        }
    );

    console.log(
        `Listening for messages on queue: ${queue}`
    );
}

module.exports = consume;