const path = require('path');


require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
require('dotenv').config({ path: path.resolve(process.cwd(), 'api-gateway/.env') });


const express = require('express');
const cors = require('cors');
const axios = require('axios');
const amqp = require('amqplib');
const mysql = require('mysql2/promise'); 
const requestId = require('./middleware/requestId');
const requestLogger = require('./middleware/requestLogger');
const responseTimer = require('./middleware/responseTimer');
const protectRoute = require('./middleware/auth');
const proxyRequest = require('./utils/proxyHandler');
const { isServiceUp, startHealthMonitor } = require('./services/healthService');


const employeeRouter = require('./routes/employeeRoutes');
const attendanceRouter = require('./routes/attendanceRoutes'); 
const geofenceRouter = require('./routes/geofenceRoutes');

const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(requestId);
app.use(requestLogger);
app.use(responseTimer);

// Capture raw request body for debugging (keeps parsing behavior)
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    try {
      req.rawBody = buf.toString(encoding || 'utf8');
    } catch (e) {
      req.rawBody = '';
    }
  }
}));
app.get('/', (req, res) => {
  res.json({
    message: 'HRMS API Gateway running',
    endpoints: [
      '/health',
      '/employees',
      '/attendance',
      '/geofence'
    ]
  });
});
const PORT = process.env.PORT || 3003;

const EMPLOYEE_URL = process.env.EMPLOYEE_SERVICE_URL || 'http://localhost:3001';
const ATTENDANCE_URL = process.env.ATTENDANCE_SERVICE_URL || 'http://localhost:3002';
console.log('EMPLOYEE_SERVICE_URL env =', process.env.EMPLOYEE_SERVICE_URL);
console.log('ATTENDANCE_SERVICE_URL env =', process.env.ATTENDANCE_SERVICE_URL);

console.log('EMPLOYEE_URL =', EMPLOYEE_URL);
console.log('ATTENDANCE_URL =', ATTENDANCE_URL);
const GEOFENCE_URL = process.env.GEOFENCE_SERVICE_URL || 'http://localhost:3003';




let activeServiceRegistry = {
  'employee-service': false,
  'attendance-service': false,
  'geofence-service': false
};

async function trackSystemHealth() {
  const targets = [
    { name: 'employee-service', url: `${EMPLOYEE_URL}/health` },
    { name: 'attendance-service', url: `${ATTENDANCE_URL}/health` },
    { name: 'geofence-service', url: `${GEOFENCE_URL}/health` }
  ];

  for (const srv of targets) {
    try {
      await axios.get(srv.url, { timeout: 800 });
      activeServiceRegistry[srv.name] = true;
    } catch (err) {
      
      activeServiceRegistry[srv.name] = false;
    }
  }

  
  setTimeout(trackSystemHealth, 10000);
}

const validateJwtOnlyIfServiceIsApproved = (serviceName) => {
  return protectRoute(
    serviceName,
    (service) => activeServiceRegistry[service]
  );
};

app.use('/employees', employeeRouter(validateJwtOnlyIfServiceIsApproved));
app.use('/attendance', attendanceRouter(validateJwtOnlyIfServiceIsApproved));
app.use('/geofence', geofenceRouter());

app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'api-gateway',
    status: 'UP',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

app.get('/health/all', (req, res) => {
  res.status(200).json({
    status: 'GATEWAY_ACTIVE',
    liveRegistry: activeServiceRegistry
  });
});

app.use((err, req, res, next) => {
  console.error(
    `[${req.requestId}]`,
    err.stack
  );

  res.status(500).json({
    error: 'Internal Server Error',
    requestId: req.requestId
  });
});

async function startGateway() {
  try {
    console.log("📂 Visual Studio working directory location:", process.cwd());

    // Try connecting to DB but don't fail startup if it's not reachable
    console.log('Connecting to Railway MySQL Database...');
    let dbConnected = false;
    try {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      });
      await connection.ping();
      await connection.end();
      dbConnected = true;
      console.log('✅ Gateway successfully connected to Railway MySQL!');
    } catch (dbErr) {
      console.warn('⚠️ Could not connect to MySQL:', dbErr.message);
    }

    // Try connecting to RabbitMQ but continue if it's unavailable
    console.log('Connecting to CloudAMQP RabbitMQ broker...');
    const rabbitUrl = process.env.RABBITMQ_URL;
    let rabbitConnected = false;
    if (!rabbitUrl) {
      console.warn('⚠️ Missing RABBITMQ_URL configuration in your .env file.');
    } else {
      try {
        const conn = await amqp.connect(rabbitUrl);
        await conn.createChannel();
        rabbitConnected = true;
        console.log('✅ Gateway successfully connected to Cloud RabbitMQ!');
      } catch (rmqErr) {
        console.warn('⚠️ Could not connect to RabbitMQ:', rmqErr.message);
      }
    }

    // Start health tracking even if external systems are unavailable.
    trackSystemHealth();

    app.listen(PORT, () => {
      console.log(`🚀 Secure API Gateway operating on http://localhost:${PORT}`);
      if (!dbConnected || !rabbitConnected) {
        console.log('⚠️ Gateway started in degraded mode. External dependencies are not fully available.');
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error while starting API Gateway:', error.message);
    // Do not exit the process — attempt to start server in degraded mode.
    try {
      trackSystemHealth();
      app.listen(PORT, () => {
        console.log(`🚀 Secure API Gateway operating on http://localhost:${PORT}`);
        console.log('⚠️ Gateway started after unexpected error; some features may be limited.');
      });
    } catch (e) {
      console.error('❌ Failed to start HTTP server after error:', e.message);
      process.exit(1);
    }
  }
}

startGateway();