# API Gateway – HRMS Attendance Management System

## Overview

This project serves as the central API Gateway for the HRMS Attendance Management System. It acts as a single entry point for all client requests and routes them to the appropriate microservices.

The gateway provides:

- Request routing
- Service health monitoring
- JWT-based access control
- Reverse proxy functionality
- MySQL connectivity validation
- RabbitMQ connectivity validation
- Centralized health reporting

---

## Architecture

```text
                    +----------------+
                    |   Frontend     |
                    +--------+-------+
                             |
                             |
                             v
                    +----------------+
                    |   API Gateway  |
                    |   Port: 3000   |
                    +--------+-------+
                             |
      -------------------------------------------------
      |                       |                       |
      v                       v                       v

+--------------+     +--------------+     +--------------+
| Employee     |     | Attendance   |     | Geofence     |
| Service      |     | Service      |     | Service      |
| Port: 3001   |     | Port: 3002   |     | Port: 3003   |
+--------------+     +--------------+     +--------------+

                             |
                             v

                    +----------------+
                    |  RabbitMQ      |
                    +----------------+

                             |
                             v

                    +----------------+
                    |  MySQL DB      |
                    +----------------+
```

---

## Features

### 1. Reverse Proxy Routing

Routes incoming requests to the correct microservice.

| Gateway Route | Target Service |
|--------------|---------------|
| `/employees/*` | Employee Service |
| `/attendance/*` | Attendance Service |
| `/geofence/*` | Geofence Service |

Implemented using:

```bash
express-http-proxy
```

---

### 2. Service Health Monitoring

The gateway continuously checks whether downstream services are alive.

Health checks run every:

```text
10 seconds
```

Tracked services:

- employee-service
- attendance-service
- geofence-service

If a service becomes unavailable:

- Requests are blocked immediately
- Users receive a `503 Service Unavailable`

---

### 3. JWT Security Middleware

Before forwarding requests, the gateway:

1. Checks if the target service is online.
2. Verifies the presence of an Authorization token.

Expected format:

```http
Authorization: Bearer <token>
```

Protected routes:

```text
/employees/*
/attendance/*
```

---

### 4. Infrastructure Validation

At startup the gateway verifies:

#### MySQL Connection

Using:

```javascript
mysql2/promise
```

Validates:

- Host
- Port
- User
- Password
- Database

#### RabbitMQ Connection

Using:

```javascript
amqplib
```

Validates:

- CloudAMQP connectivity
- Channel creation

If any infrastructure service fails:

```text
Gateway startup is aborted.
```

---

## Project Structure

```text
api-gateway/
│
├── src/
│   ├── index.js
│   │
│   └── routes/
│       ├── employeeRoutes.js
│       ├── attendanceRoutes.js
│       └── geofenceRoutes.js
│
├── .env
├── package.json
├── package-lock.json
├── Dockerfile
└── README.md
```

---

## Technologies Used

### Backend

- Node.js
- Express.js

### Messaging

- RabbitMQ
- CloudAMQP

### Database

- MySQL
- Railway MySQL

### Proxy

- express-http-proxy

### Configuration

- dotenv

---

## Environment Variables

Create a `.env` file:

```env
PORT=3000

DB_HOST=your-db-host
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=database_name

RABBITMQ_URL=amqps://username:password@host/vhost

EMPLOYEE_SERVICE_URL=http://localhost:3001
ATTENDANCE_SERVICE_URL=http://localhost:3002
GEOFENCE_SERVICE_URL=http://localhost:3003
```

---

## Installation

### Clone Repository

```bash
git clone <repository-url>
cd api-gateway
```

### Install Dependencies

```bash
npm install
```

---

## Running the Project

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The gateway will start on:

```text
http://localhost:3000
```

---

## API Endpoints

### Gateway Health

```http
GET /health
```

Response:

```json
{
  "service": "api-gateway",
  "status": "UP"
}
```

---

### System Health Dashboard

```http
GET /health/all
```

Response:

```json
{
  "status": "GATEWAY_ACTIVE",
  "liveRegistry": {
    "employee-service": true,
    "attendance-service": true,
    "geofence-service": false
  }
}
```

---

## Request Flow

Example:

```http
GET /employees/profile
```

Flow:

```text
Client
   |
   v
API Gateway
   |
   |-- Service Health Check
   |
   |-- JWT Validation
   |
   v
Employee Service
```

---

## Error Responses

### Service Offline

```json
{
  "error": "Service Unavailable",
  "message": "The requested feature is currently offline. Please try again later."
}
```

Status Code:

```http
503
```

---

### Missing Token

```json
{
  "error": "Access Denied",
  "message": "Missing security token."
}
```

Status Code:

```http
401
```

---

### Invalid Token

```json
{
  "error": "Forbidden",
  "message": "Invalid or expired security token."
}
```

Status Code:

```http
403
```

---

### Geofence Service Not Available

```json
{
  "error": "Service Pending Integration",
  "message": "The Geofence module is currently under advanced development."
}
```

Status Code:

```http
501
```

---

## Dependencies

```json
{
  "express": "^4.22.2",
  "axios": "^1.17.0",
  "amqplib": "^0.10.9",
  "mysql2": "^3.22.5",
  "dotenv": "^16.6.1",
  "express-http-proxy": "^2.1.2"
}
```

---

## Future Enhancements

- Real JWT signature verification
- Rate limiting
- API key management
- Service discovery
- Distributed tracing
- Circuit breaker pattern
- Load balancing
- Monitoring with Prometheus & Grafana

---

## Author

HRMS Attendance Management System – API Gateway Module

Built using Node.js, Express, MySQL, RabbitMQ, and Microservice Architecture.