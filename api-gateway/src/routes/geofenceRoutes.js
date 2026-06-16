const express = require('express');
const proxy = require('express-http-proxy');
const router = express.Router();

const GEOFENCE_URL = process.env.GEOFENCE_SERVICE_URL || 'http://localhost:3003';

module.exports = () => {
    // Mounts to /geofence/ via index.js
    router.use('/', proxy(GEOFENCE_URL, {
        proxyReqPathResolver: (req) => `/geofence${req.url}`,
        proxyErrorHandler: function (err, res, next) {
            return res.status(501).json({ 
                error: "Service Pending Integration", 
                message: "The Geofence module is currently under advanced development." 
            });
        }
    }));

    return router;
};