const express = require('express');
const proxy = require('express-http-proxy');
const router = express.Router();

const EMPLOYEE_URL = process.env.EMPLOYEE_SERVICE_URL || 'http://localhost:3001';

console.log("EMPLOYEE_URL =", EMPLOYEE_URL);

module.exports = (validateJwtOnlyIfServiceIsApproved) => {
    
router.use(
    '/exists',
    proxy(EMPLOYEE_URL, {
        proxyReqPathResolver: (req) =>
            `/employees/exists${req.url}`
    })
);
    router.use(
        '/',
        validateJwtOnlyIfServiceIsApproved('employee-service'),
        proxy(EMPLOYEE_URL, {
            proxyReqPathResolver: (req) => `/employees${req.url}`
        })
    );

    return router;
};









