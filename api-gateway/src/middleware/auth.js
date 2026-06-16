// api-gateway/src/middleware/auth.js
const jwt = require('jsonwebtoken');

const protectRoute = (serviceName, isServiceUp) => {
  return (req, res, next) => {
    
    // 1. Check service availability
    if (typeof isServiceUp === 'function' && !isServiceUp(serviceName)) {
      return res.status(503).json({
        success: false,
        message: `Service Unavailable: The ${serviceName} is currently down.`
      });
    }

    // 2. Extract Authorization Header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: "Access Denied: No token provided." 
      });
    }

    // 3. Extract and Verify the Token
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; 
      next(); 
    } catch (err) {
      return res.status(403).json({ 
        success: false, 
        message: "Access Denied: Invalid or expired token." 
      });
    }
  };
};

module.exports = protectRoute;