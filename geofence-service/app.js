require("dotenv").config();

const express =
require("express");

require("./config/db");

const connectRabbitMQ =
require("./config/rabbitmq");

const geofenceRoutes =
require("./routes/geofenceRoutes");

const errorHandler =
require("./middleware/errorHandler");

const logger =
require("./middleware/logger");

const app = express();

app.use(express.json());

app.use(logger);

app.use("/", geofenceRoutes);

connectRabbitMQ();

app.use(errorHandler);

const PORT =
process.env.PORT || 3002;

app.listen(PORT, () => {

console.log(
    `Server running on port ${PORT}`
);

});
