module.exports = function requestLogger(req, res, next) {
  const bodyPreview = req.rawBody
    ? ` body=${req.rawBody.slice(0, 200)}`
    : '';
  console.log(`[${req.requestId}] ${req.method} ${req.url}${bodyPreview}`);
  next();
};