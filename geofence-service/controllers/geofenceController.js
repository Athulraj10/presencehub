exports.validateGeofence = (req, res) => {
    res.status(200).json({
        message: "Not implemented yet"
    });
};

exports.healthCheck = (req, res) => {
    res.status(200).json({
        service: "geofence-service",
        status: "UP",
        database: global.dbStatus || "DISCONNECTED",
        rabbitmq: global.rabbitmqStatus || "DISCONNECTED"
    });
};