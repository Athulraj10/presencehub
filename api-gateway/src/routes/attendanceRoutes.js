const express = require('express');
const proxy = require('express-http-proxy');
const router = express.Router();

const ATTENDANCE_URL = process.env.ATTENDANCE_SERVICE_URL || 'http://localhost:3002';

module.exports = (validateJwtOnlyIfServiceIsApproved) => {
    // Mounts to /attendance/ via index.js
    router.use('/', validateJwtOnlyIfServiceIsApproved('attendance-service'), proxy(ATTENDANCE_URL, {
        proxyReqPathResolver: (req) => `/attendance${req.url}`
    }));

    return router;
};