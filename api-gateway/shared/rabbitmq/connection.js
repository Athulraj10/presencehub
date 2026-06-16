const amqp = require('amqplib');

let connection;
let channel;

async function connectRabbitMQ(url) {
    if (channel) {
        return channel;
    }

    connection = await amqp.connect(url);

    channel = await connection.createChannel();

    return channel;
}

module.exports = connectRabbitMQ;