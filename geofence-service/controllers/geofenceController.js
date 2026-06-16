const healthStatus = require("../config/healthStatus");

const {
    validateLocation
} = require("../services/geofenceService");

exports.healthCheck = (req, res) => {

    res.status(200).json({
        service: "geofence-service",
        status: "UP",
        database: healthStatus.database,
        rabbitmq: healthStatus.rabbitmq
    });
};

exports.validateGeofence = async (req, res) => {

    const {
        employeeId,
        latitude,
        longitude
    } = req.body;

    const result = await validateLocation(
        latitude,
        longitude
    );

    res.status(200).json({
        employeeId,
        ...result
    });
};