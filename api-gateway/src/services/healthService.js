const axios = require('axios');

const serviceRegistry = {
  'employee-service': {
    url: process.env.EMPLOYEE_SERVICE_URL,
    status: 'UP'
  },
  'attendance-service': {
    url: process.env.ATTENDANCE_SERVICE_URL,
    status: 'UP'
  },
  'geofence-service': {
    url: process.env.GEOFENCE_SERVICE_URL,
    status: 'UP'
  }
};

const isServiceUp = (serviceName) => {
  return serviceRegistry[serviceName]?.status === 'UP';
};

const startHealthMonitor = () => {
  setInterval(async () => {
    for (const [serviceName, serviceConfig] of Object.entries(serviceRegistry)) {
      try {
        await axios.get(`${serviceConfig.url}/health`, {
          timeout: 2000
        });

        if (serviceConfig.status === 'DOWN') {
          console.log(`📡 [HEALTH] ${serviceName} is back UP.`);
          serviceConfig.status = 'UP';
        }
      } catch (error) {
        if (serviceConfig.status === 'UP') {
          console.error(
            `🚨 [HEALTH] ${serviceName} just went DOWN! Error: ${error.message}`
          );
          serviceConfig.status = 'DOWN';
        }
      }
    }
  }, 10000);
};

module.exports = {
  isServiceUp,
  startHealthMonitor
};