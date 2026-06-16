// api-gateway/src/services/healthService.js
const axios = require('axios');

// 1. In-memory status registry of your microservices
const serviceRegistry = {
  'employee-service': { url: process.env.EMPLOYEE_SERVICE_URL, status: 'UP' },
  'attendance-service': { url: process.env.ATTENDANCE_SERVICE_URL, status: 'UP' },
  'geofence-service': { url: process.env.GEOFENCE_SERVICE_URL, status: 'UP' }
};

/**
 * Checker function used directly by auth.js middleware
 */
const isServiceUp = (serviceName) => {
  return serviceRegistry[serviceName]?.status === 'UP';
};

/**
 * Background loop that pings services every 10 seconds to update status
 */
const startHealthMonitor = () => {
  setInterval(async () => {
    for (const [serviceName, serviceConfig] of Object.entries(serviceRegistry)) {
      try {
        // Every microservice should expose a lightweight GET /health endpoint
        await axios.get(`${serviceConfig.url}/health`, { timeout: 2000 });
        
        if (serviceConfig.status === 'DOWN') {
          console.log(`📡 [HEALTH] ${serviceName} is back UP.`);
          serviceConfig.status = 'UP';
        }
      } catch (error) {
        if (serviceConfig.status === 'UP') {
          console.error(`🚨 [HEALTH] ${serviceName} just went DOWN! Error: ${error.message}`);
          serviceConfig.status = 'DOWN';
        }
      }
    }
  }, 10000); // Runs every 10 seconds
};

module.exports = { isServiceUp, startHealthMonitor };