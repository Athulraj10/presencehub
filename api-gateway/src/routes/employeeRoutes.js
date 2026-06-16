const express = require('express');
const proxy = require('express-http-proxy');
const router = express.Router();

const EMPLOYEE_URL = process.env.EMPLOYEE_SERVICE_URL || 'http://localhost:3001';

module.exports = (validateJwtOnlyIfServiceIsApproved) => {
    // Mounts to /employees/ via index.js
    router.use('/', validateJwtOnlyIfServiceIsApproved('employee-service'), proxy(EMPLOYEE_URL, {
        proxyReqPathResolver: (req) => `/employees${req.url}`
    }));

    return router;
<<<<<<< HEAD
};
=======
};











>>>>>>> 6a69965f91e1e636c5845440f8f30890e3968d1d
