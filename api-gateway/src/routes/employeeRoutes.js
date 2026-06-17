const express = require('express');
const proxy = require('express-http-proxy');
const router = express.Router();

const EMPLOYEE_URL = process.env.EMPLOYEE_SERVICE_URL || 'http://localhost:3001';

module.exports = (validateJwtOnlyIfServiceIsApproved) => {
    // Mounts to /employees/ via index.js
    router.use(
        '/',
        validateJwtOnlyIfServiceIsApproved('employee-service'),
        proxy(EMPLOYEE_URL, {
            proxyReqPathResolver: (req) => `/employees${req.url}`
        })
    );

    return router;
};