module.exports = function responseTimer(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.requestId}] Response time: ${duration}ms`);
  });

  next();
};