const connectRabbitMQ = require('./connection');
const publish = require('./publisher');
const consume = require('./consumer');

module.exports = {
    connectRabbitMQ,
    publish,
    consume
};