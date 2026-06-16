# Employee Service

## Overview

The Employee Service is responsible for managing employee records, authentication, authorization, and HR management within the PresenceHub system.

It provides employee CRUD operations, JWT-based authentication, role-based access control, and RabbitMQ event publishing for employee lifecycle events.

---

## Features Implemented

### Employee Management

* Create Employee
* Get Employee By ID
* Get All Employees
* Update Employee
* Delete Employee

### Authentication

* Employee Login
* JWT Token Generation
* JWT Verification Middleware
* Protected Routes

### Authorization

* Role-Based Access Control (RBAC)
* Admin Access Control
* HR Access Control
* Employee Access Control

### HR Management

* Create HR
* Get All HR
* Get HR By ID
* Update HR
* Delete HR

### RabbitMQ Integration

Published Events:

* employee.created
* employee.updated
* employee.deleted

### Database Integration

* MySQL Database Connectivity
* Employee Data Persistence
* Password Hashing using bcrypt

---

## Technologies Used

* Node.js
* Express.js
* MySQL
* RabbitMQ
* JWT
* bcrypt
* dotenv

---

## Project Structure

```text
employee-service/
│
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── rabbitmq.js
│   │
│   ├── controllers/
│   │   ├── employeeController.js
│   │   └── hrController.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   │
│   ├── routes/
│   │   ├── employeeRoutes.js
│   │   └── hrRoutes.js
│   │
│   ├── app.js
│   └── server.js
│
├── .env
├── package.json
└── README.md
```

---

## Authentication Flow

```text
Login Request
      ↓
Validate Credentials
      ↓
Generate JWT Token
      ↓
Return Token
      ↓
Protected API Access
```

---

## Available APIs

### Employee APIs

#### Register Employee

```http
POST /employees/register
```

#### Login Employee

```http
POST /employees/login
```

#### Get All Employees

```http
GET /employees
```

#### Get Employee By ID

```http
GET /employees/:employeeId
```

#### Update Employee

```http
PUT /employees/:employeeId
```

#### Delete Employee

```http
DELETE /employees/:employeeId
```

---

### HR APIs

#### Create HR

```http
POST /hr
```

#### Get All HR

```http
GET /hr
```

#### Get HR By ID

```http
GET /hr/:employeeId
```

#### Update HR

```http
PUT /hr/:employeeId
```

#### Delete HR

```
```
