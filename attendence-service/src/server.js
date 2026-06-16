require("dotenv").config();

const app = require("./app");

const {
  connectRabbitMQ
} = require("./config/rabbitmq");

const startEmployeeConsumer =
  require("./consumers/employeeConsumer");

const PORT =
  process.env.PORT || 3002;

async function startServices() {

  await connectRabbitMQ();

  startEmployeeConsumer();

  app.listen(PORT, () => {
    console.log(
      `Server running on port ${PORT}`
    );
  });
}

startServices();






