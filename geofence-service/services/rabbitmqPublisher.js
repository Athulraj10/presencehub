const connectRabbitMQ =
    require("../config/rabbitmq");

const publishGeofenceEvent =
    async (message) => {

        const channel =
            await connectRabbitMQ();

        const queue =
            "geofence-events";

        await channel.assertQueue(
            queue
        );

        channel.sendToQueue(
            queue,
            Buffer.from(
                JSON.stringify(message)
            )
        );

        console.log(
            "Geofence Event Published"
        );
    };

module.exports = {
    publishGeofenceEvent
};