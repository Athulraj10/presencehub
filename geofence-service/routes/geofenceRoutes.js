const express = require("express");
const router = express.Router();

const {
    validateGeofence,
    healthCheck
} = require("../controllers/geofenceController");

router.get("/health", healthCheck);

router.post(
    "/geofence/validate",
    validateGeofence
);

module.exports = router;