require("dotenv").config();

const app = require("./app");

const {
  connectRabbitMQ
} = require("./config/rabbitmq");

const PORT = process.env.PORT || 3001;

connectRabbitMQ();

app.listen(PORT, () => {
  console.log(`Employee Service running on port ${PORT}`);
});