const { randomUUID } = require('crypto');

module.exports = function requestId(req, res, next) {
  req.requestId = randomUUID();
  next();
};