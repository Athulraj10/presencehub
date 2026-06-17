const connectRabbitMQ = require('./connection');

async function publish(queue, payload) {
    const channel = await connectRabbitMQ(
        process.env.RABBITMQ_URL
    );

    await channel.assertQueue(queue, {
        durable: true
    });

    channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(payload))
    );

    return true;
}

module.exports = publish;