<<<<<<< HEAD
// api-gateway/src/services/healthService.js
const axios = require('axios');

// 1. In-memory status registry of your microservices
=======

const axios = require('axios');


>>>>>>> 6a69965f91e1e636c5845440f8f30890e3968d1d
const serviceRegistry = {
  'employee-service': { url: process.env.EMPLOYEE_SERVICE_URL, status: 'UP' },
  'attendance-service': { url: process.env.ATTENDANCE_SERVICE_URL, status: 'UP' },
  'geofence-service': { url: process.env.GEOFENCE_SERVICE_URL, status: 'UP' }
};

<<<<<<< HEAD
/**
 * Checker function used directly by auth.js middleware
 */
=======

>>>>>>> 6a69965f91e1e636c5845440f8f30890e3968d1d
const isServiceUp = (serviceName) => {
  return serviceRegistry[serviceName]?.status === 'UP';
};

<<<<<<< HEAD
/**
 * Background loop that pings services every 10 seconds to update status
 */
=======

 
>>>>>>> 6a69965f91e1e636c5845440f8f30890e3968d1d
const startHealthMonitor = () => {
  setInterval(async () => {
    for (const [serviceName, serviceConfig] of Object.entries(serviceRegistry)) {
      try {
<<<<<<< HEAD
        // Every microservice should expose a lightweight GET /health endpoint
=======
       
>>>>>>> 6a69965f91e1e636c5845440f8f30890e3968d1d
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
<<<<<<< HEAD
  }, 10000); // Runs every 10 seconds
=======
  }, 10000); 
>>>>>>> 6a69965f91e1e636c5845440f8f30890e3968d1d
};

module.exports = { isServiceUp, startHealthMonitor };