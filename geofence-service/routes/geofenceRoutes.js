const express =
    require("express");

const router =
    express.Router();

const {
    healthCheck,
    validateGeofence
} = require(
    "../controllers/geofenceController"
);

const validateGeofenceRequest =
    require("../middleware/validateGeofenceRequest");

router.get(
    "/health",
    healthCheck
);

router.post(
    "/geofence/validate",
    validateGeofenceRequest,
    validateGeofence
);

module.exports =
    router;