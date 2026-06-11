require("dotenv").config();

const express = require("express");

// Database Connection
require("./config/db");

// RabbitMQ Connection
const connectRabbitMQ = require("./config/rabbitmq");

const app = express();

app.use(express.json());

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

// Home Route
app.get("/", (req, res) => {
    res.send("Geofence Service Running");
});

// Enhanced Health Endpoint
app.get("/health", (req, res) => {

    res.status(200).json({

        service: "geofence-service",

        status: "UP",

        database:
            global.dbStatus || "DISCONNECTED",

        rabbitmq:
            global.rabbitmqStatus || "DISCONNECTED"

    });

});

// Placeholder Geofence Validation API
app.post("/geofence/validate", (req, res) => {
    res.status(200).json({
        message: "Not implemented yet"
    });
});

/*
|--------------------------------------------------------------------------
| RabbitMQ Connection
|--------------------------------------------------------------------------
*/

(async () => {
    await connectRabbitMQ();
})();

/*
|--------------------------------------------------------------------------
| Server
|--------------------------------------------------------------------------
*/

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});