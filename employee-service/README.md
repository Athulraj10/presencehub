# Employee Service

## Overview

The Employee Service is a core microservice within the PresenceHub HRMS ecosystem responsible for employee lifecycle management, authentication, authorization, and HR administration.

The service provides secure employee management capabilities through JWT-based authentication, Role-Based Access Control (RBAC), MySQL persistence, and RabbitMQ event publishing for inter-service communication.

---

## Key Responsibilities

- Employee Registration and Management
- Authentication and Authorization
- HR Management
- Role-Based Access Control (RBAC)
- Employee Data Validation
- RabbitMQ Event Publishing
- MySQL Database Operations

---

## Features

### Employee Management

- Register Employee
- Retrieve Employee Details
- Retrieve All Employees
- Update Employee Information
- Delete Employee Records

### HR Management

- Create HR Accounts
- Retrieve HR Details
- Retrieve All HR Records
- Update HR Information
- Delete HR Records

### Authentication & Security

- JWT-Based Authentication
- Password Hashing using bcrypt
- Protected API Endpoints
- Role-Based Authorization
- Employee Self-Profile Access Restriction

### Validation

- Employee ID Validation
- Email Format Validation
- Department Validation
- Password Strength Validation
- Duplicate Employee Prevention
- Duplicate Email Prevention

### Event-Driven Communication

The service publishes RabbitMQ events for employee lifecycle operations:

- `employee.created`
- `employee.updated`
- `employee.deleted`

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

Authentication is enforced using JWT-based authorization middleware, while role validation is handled through dedicated RBAC middleware to restrict access to sensitive operations.


---

## Technology Stack

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime Environment |
| Express.js | REST API Framework |
| MySQL | Relational Database |
| RabbitMQ | Message Broker |
| JWT | Authentication |
| bcrypt | Password Hashing |
| dotenv | Environment Configuration |

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
│   ├── routes