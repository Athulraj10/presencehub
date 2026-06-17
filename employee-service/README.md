# Employee Service

## Overview

The Employee Service is a core microservice within the PresenceHub HRMS ecosystem responsible for employee lifecycle management, authentication, authorization, and HR administration.

The service provides secure employee management capabilities through JWT-based authentication, Role-Based Access Control (RBAC), MySQL persistence, and RabbitMQ-based event-driven communication.

---

## Architecture

The Employee Service follows a microservice architecture and serves as the central authority for employee identity and profile management within the PresenceHub ecosystem.

The service interacts with:

* MySQL for employee and HR data persistence.
* RabbitMQ for asynchronous event publishing and inter-service communication.
* JWT Authentication Middleware for secure API access.
* Role-Based Authorization Middleware for access control enforcement.

Employee lifecycle events are published to RabbitMQ, allowing other services to react to employee-related operations without direct dependency on the Employee Service.

---

## Core Capabilities

### Employee Management

* Register Employee
* Retrieve Employee Details
* Retrieve All Employees
* Update Employee Information
* Delete Employee Records

### HR Management

* Create HR Accounts
* Retrieve HR Details
* Retrieve All HR Records
* Update HR Information
* Delete HR Records

### Authentication & Security

* JWT-Based Authentication
* Password Hashing using bcrypt
* Protected API Endpoints
* Role-Based Authorization (RBAC)
* Employee Self-Profile Access Restriction

### Validation

* Employee ID Validation
* Name Validation
* Email Format Validation
* Department Validation
* Password Length Validation
* Duplicate Employee Prevention
* Duplicate Email Prevention

---

## Access Control

The Employee Service implements Role-Based Access Control (RBAC) to ensure secure access to resources and operations.

### Employee

* Authenticate using valid credentials.
* View personal profile information.
* Access only authorized employee resources.

### HR

* View employee records.
* Manage employee information.
* Access HR management endpoints.
* Perform employee update operations.

### Administrator

* Full access to employee and HR management functionalities.
* Create, update, and delete employee records.
* Create, update, and delete HR accounts.
* Access all protected administrative endpoints.

Authentication is enforced using JWT-based authorization middleware, while role validation is handled through dedicated RBAC middleware.

---

## Event-Driven Communication

The service publishes the following RabbitMQ events:

* `employee.created`
* `employee.updated`
* `employee.deleted`

These events enable seamless integration with other services within the PresenceHub ecosystem.

---

## Technology Stack

| Technology | Purpose                   |
| ---------- | ------------------------- |
| Node.js    | Runtime Environment       |
| Express.js | REST API Framework        |
| MySQL      | Relational Database       |
| RabbitMQ   | Message Broker            |
| JWT        | Authentication            |
| bcrypt     | Password Hashing          |
| dotenv     | Environment Configuration |

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

## API Endpoints

### Employee APIs

| Method | Endpoint                 | Description          |
| ------ | ------------------------ | -------------------- |
| POST   | `/employees/register`    | Register Employee    |
| POST   | `/employees/login`       | Employee Login       |
| GET    | `/employees`             | Get All Employees    |
| GET    | `/employees/:employeeId` | Get Employee Details |
| PUT    | `/employees/:employeeId` | Update Employee      |
| DELETE | `/employees/:employeeId` | Delete Employee      |

### HR APIs

| Method | Endpoint          | Description    |
| ------ | ----------------- | -------------- |
| POST   | `/hr`             | Create HR      |
| GET    | `/hr`             | Get All HR     |
| GET    | `/hr/:employeeId` | Get HR Details |
| PUT    | `/hr/:employeeId` | Update HR      |
| DELETE | `/hr/:employeeId` | Delete HR      |

---

## Authentication Flow

```text
Login Request
      ↓
Validate Credentials
      ↓
Verify Password
      ↓
Generate JWT Token
      ↓
Return Token
      ↓
Access Protected APIs
```

---

## Setup & Installation

### Clone Repository

```bash
git clone <repository-url>
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file and configure:

```env
PORT=3001

DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

JWT_SECRET=

RABBITMQ_URL=
```

### Start Development Server

```bash
npm run dev
```

### Start Production Server

```bash
npm start
```

---

## Future Enhancements

* Audit Logging
* Advanced Search and Filtering
* Employee Profile Update Requests
* Pagination Support
* Enhanced Monitoring and Metrics

---

## Contributors

PresenceHub Development Team

