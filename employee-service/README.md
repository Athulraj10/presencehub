# Employee Service

## Description

Employee Service for the PresenceHub Attendance Management System.

## Features

* Employee Registration API
* Employee Data Validation
* MySQL Database Integration
* RabbitMQ Event Publishing
* Health Monitoring Endpoint

---

## Installation

Install dependencies:

```bash
npm install
```

---

## Run the Service

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

---

## Health Endpoint

### Request

```http
GET /health
```

### Response

```json
{
  "service": "employee-service",
  "status": "UP"
}
```

---

## Register Employee

### Request

```http
POST /employees/register
```

### Request Body

```json
{
  "employeeId": "EMP001",
  "name": "John Doe",
  "email": "john@example.com",
  "department": "Engineering"
}
```

### Response

```json
{
  "message": "Employee registered successfully"
}
```

---

## RabbitMQ Event

After successful employee registration, the service publishes:

```text
employee.created
```

Payload:

```json
{
  "employeeId": "EMP001"
}
```

---

## Environment Variables

Create a `.env` file:

```env
PORT=3002

DB_HOST=<database-host>
DB_PORT=<database-port>
DB_USER=<database-user>
DB_PASSWORD=<database-password>
DB_NAME=<database-name>

RABBITMQ_URL=<rabbitmq-url>
```

---

## Docker

Build image:

```bash
docker build -t employee-service .
```

Run container:

```bash
docker run -p 3002:3002 employee-service
```
