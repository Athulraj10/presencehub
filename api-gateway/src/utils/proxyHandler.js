// api-gateway/src/utils/proxyHandler.js
const axios = require('axios');

const proxyRequest = (targetUrlBase) => {
  return async (req, res) => {
    const targetUrl = `${targetUrlBase}${req.originalUrl}`;
    
    try {
      const response = await axios({
        method: req.method,
        url: targetUrl,
        data: req.body,
        headers: {
          ...req.headers,
          'x-user-id': req.user?.id || '',
          'x-user-role': req.user?.role || '',
          host: new URL(targetUrlBase).host 
        },
        timeout: 5000 
      });

      return res.status(response.status).json(response.data);
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return res.status(503).json({
          success: false,
          message: "Target service is temporarily unreachable. Gateway timeout."
        });
      }
      
      return res.status(error.response?.status || 500).json(
        error.response?.data || { success: false, message: "Internal Gateway Error" }
      );
    }
  };
};

module.exports = proxyRequest;