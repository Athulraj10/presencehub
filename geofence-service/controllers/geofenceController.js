const healthStatus = require("../config/healthStatus");

const {
    validateLocation
} = require("../services/geofenceService");

const {
    publishGeofenceEvent
} = require("../services/rabbitmqPublisher");

exports.healthCheck = (req, res) => {

    res.status(200).json({
        service: "geofence-service",
        status: "UP",
        database: healthStatus.database,
        rabbitmq: healthStatus.rabbitmq
    });

};

exports.validateGeofence = async (
    req,
    res,
    next
) => {

    try {

        const {
            employeeId,
            latitude,
            longitude
        } = req.body;

        const result =
            await validateLocation(
                latitude,
                longitude
            );

        await publishGeofenceEvent({
            employeeId,
            officeName:
                result.officeName,

            distance:
                result.distance,

            radius:
                result.radius,

            insideGeofence:
                result.insideGeofence,

            timestamp:
                new Date()
        });

        res.status(200).json({
            employeeId,
            ...result
        });

    } catch (error) {

        console.error(error);

        next(error);

    }

};