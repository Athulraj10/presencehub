# Attendance Services

## Project Overview

Attendance Service is a Node.js microservice responsible for managing employee attendance records.

The service provides APIs for:

* Punch In
* Punch Out
* Attendance History
* Attendance By Date
* Monthly Attendance
* Attendance Summary
* Working Hours Calculation

The service uses:

* Express.js
* MySQL (Railway)
* RabbitMQ (CloudAMQP)

---

## Features

### Attendance Management

* Employee Punch In
* Employee Punch Out
* Attendance History
* Attendance By Date
* Monthly Attendance
* Attendance Summary

### Validations

* Duplicate Punch-In Prevention
* Punch-Out Validation
* Double Punch-Out Prevention
* Timestamp Validation
* Future Date Validation

### RabbitMQ Integration

* Publisher
* Consumer
* Event-Based Communication

### Reporting

* Attendance History
* Date-Based Reports
* Monthly Reports
* Working Hours Summary

---

## Tech Stack

* Node.js
* Express.js
* MySQL
* Railway
* RabbitMQ
* CloudAMQP

---

## Project Structure

```text
attendance-service
│
├── src
│   ├── config
│   │   ├── db.js
│   │   └── rabbitmq.js
│   │
│   ├── controllers
│   │   └── attendanceController.js
│   │
│   ├── routes
│   │   └── attendanceRoutes.js
│   │
│   ├── consumers
│   │   └── employeeConsumer.js
│   │
│   ├── utils
│   │   └── publisher.js
│   │
│   ├── app.js
│   └── server.js
│
├── .env
├── package.json
└── README.md
```

---

## Installation

### Clone Repository

```bash
git clone <repository-url>
```

### Install Dependencies

```bash
npm install
```

### Run Application

```bash
npm run dev
```

Server runs on:

```text
http://localhost:3002
```

---

## Environment Variables

Create a `.env` file:

```env
PORT=3002

DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

RABBITMQ_URL=
```

---

## Database Schema

### Attendance Table

```sql
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    punch_in DATETIME,
    punch_out DATETIME,
    attendance_date DATE,
    working_hours DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## RabbitMQ Events

### Published Events

#### attendance.punchin

```json
{
  "employeeId": "EMP001",
  "timestamp": "2026-06-12 09:00:00"
}
```

#### attendance.punchout

```json
{
  "employeeId": "EMP001",
  "timestamp": "2026-06-12 18:30:00",
  "workingHours": "9.50"
}
```

### Consumed Events

#### employee.created

```json
{
  "employeeId": "EMP001",
  "name": "John"
}
```

---

## API Endpoints

### Health Check

#### Request

```http
GET /health
```

#### Response

```json
{
  "status": "UP"
}
```

---

### Punch In

#### Request

```http
POST /attendance/punch-in
```

#### Body

```json
{
  "employeeId": "EMP001",
  "timestamp": "2026-06-12 09:00:00"
}
```

#### Response

```json
{
  "success": true,
  "message": "Punch In Successful"
}
```

---

### Punch Out

#### Request

```http
POST /attendance/punch-out
```

#### Body

```json
{
  "employeeId": "EMP001",
  "timestamp": "2026-06-12 18:30:00"
}
```

#### Response

```json
{
  "success": true,
  "message": "Punch Out Successful",
  "workingHours": "9.50"
}
```

---

### Attendance History

#### Request

```http
GET /attendance/EMP001
```

#### Response

```json
{
  "success": true,
  "data": []
}
```

---

### Attendance By Date

#### Request

```http
GET /attendance/date/2026-06-12
```

#### Response

```json
{
  "success": true,
  "data": []
}
```

---

### Monthly Attendance

#### Request

```http
GET /attendance/month/EMP001
```

#### Response

```json
{
  "success": true,
  "data": []
}
```

---

### Attendance Summary

#### Request

```http
GET /attendance/summary/EMP001
```

#### Response

```json
{
  "success": true,
  "data": {
    "employeeId": "EMP001",
    "totalDays": 20,
    "totalHours": 180.50
  }
}
```

---

## Business Rules

### Duplicate Punch-In Prevention

An employee cannot punch in more than once on the same day.

### Punch-Out Validation

An employee cannot punch out without first punching in.

### Double Punch-Out Prevention

An employee cannot punch out more than once.

### Timestamp Validation

Invalid timestamp formats are rejected.

### Future Date Validation

Future attendance records are not allowed.

### Working Hours Calculation

Working hours are calculated as:

```text
Punch Out Time - Punch In Time
```

Example:

```text
09:00 → 18:30 = 9.50 Hours
```


---


## Author

PresenceHub Development Team



