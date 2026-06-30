require("dotenv").config();

const app = require("./app");

const {
  connectRabbitMQ
} = require("./config/rabbitmq");

const startEmployeeConsumer =
  require("./consumers/employeeConsumer");

const PORT =
  process.env.PORT || 3001;

async function startServices() {

  await connectRabbitMQ();

  startEmployeeConsumer();


  require("./jobs/breachNotifier");

  app.listen(PORT, () => {
    console.log(
      `Server running on port ${PORT}`
    );
  });
}

startServices();