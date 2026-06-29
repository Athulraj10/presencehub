const express = require('express');
const proxy = require('express-http-proxy');
const router = express.Router();

const GEOFENCE_URL = process.env.GEOFENCE_SERVICE_URL || 'http://localhost:3002';

module.exports = () => {
    // Mounts to /geofence/ via index.js
    router.use('/', proxy(GEOFENCE_URL, {
        proxyReqPathResolver: (req) => `/geofence${req.url}`,
        proxyErrorHandler: function (err, res, next) {
    return res.status(503).json({
        error: "Geofence Service Unavailable",
        message: err.code || err.message
    });
}
    }));

    return router;
};  