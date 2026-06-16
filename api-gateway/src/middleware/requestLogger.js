module.exports = function requestLogger(req, res, next) {
  console.log(`[${req.requestId}] ${req.method} ${req.url}`);
  next();
};