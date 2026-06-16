Here’s a **clean, developer-friendly README context** based on your project structure. It explains *what this system is*, *how it is built*, and *how another developer can recreate it from scratch*.

---

# 📌 PresenceHub – HRMS Microservices API Gateway

## 🧠 Overview

PresenceHub is a **microservices-based HRMS (Human Resource Management System) backend architecture** built using **Node.js and Express**, designed around an **API Gateway pattern**.

Instead of a single monolithic backend, the system is split into multiple services (employee, attendance, geofence, etc.), all coordinated through a central **API Gateway**.

The goal of this project is to ensure:

* Scalability (services can grow independently)
* Maintainability (modular structure)
* Separation of concerns (each service handles a specific domain)
* Extensibility (easy to plug in new microservices)

---

## 🏗️ System Architecture

```
Client (Frontend / Mobile App)
            │
            ▼
     API Gateway (Express)
            │
 ┌──────────┼──────────┐
 ▼          ▼          ▼
Employee  Attendance  Geofence
Service    Service     Service
            │
            ▼
   RabbitMQ (Async Communication)
```

### Key Idea:

* The **API Gateway is the single entry point**
* It routes requests to appropriate microservices
* Uses **shared utilities** for logging, authentication, and messaging

---

## 📁 Project Structure

```
presencehub/
│
├── api-gateway/
│   ├── src/
│   │   ├── index.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── requestId.js
│   │   │   ├── requestLogger.js
│   │   │   ├── responseTimer.js
│   │   │
│   │   ├── routes/
│   │   │   ├── employeeRoutes.js
│   │   │   ├── attendanceRoutes.js
│   │   │   ├── geofenceRoutes.js
│   │   │
│   │   ├── services/
│   │   │   ├── healthService.js
│   │   │
│   │   ├── utils/
│   │   │   ├── proxyHandler.js
│   │
│   ├── Dockerfile
│   ├── .env
│   ├── package.json
│
├── shared/
│   ├── constants/
│   │   ├── ports.js
│   │   ├── roles.js
│   │   ├── queues.js
│   │   ├── attendance.js
│   │
│   ├── logger/
│   │   ├── index.js
│   │
│   ├── rabbitmq/
│   │   ├── connection.js
│   │   ├── consumer.js
│   │   ├── publisher.js
│
└── package.json
```

---

## ⚙️ Core Components

### 1. API Gateway

The gateway is responsible for:

* Routing requests to microservices
* Handling authentication middleware
* Logging requests
* Tracking request IDs
* Measuring response time
* Acting as a reverse proxy

---

### 2. Middleware Layer

#### 🔐 `auth.js`

* Validates JWT tokens
* Protects secure routes
* Attaches user data to request

#### 🧾 `requestId.js`

* Generates a unique ID for every request
* Helps in tracing logs across services

#### 🪵 `requestLogger.js`

* Logs incoming requests (method, URL, status, etc.)
* Helps in debugging and monitoring

#### ⏱ `responseTimer.js`

* Measures request execution time
* Useful for performance monitoring

---

### 3. Routes Layer

Each domain has its own route file:

* `employeeRoutes.js` → Employee management APIs
* `attendanceRoutes.js` → Attendance marking & tracking
* `geofenceRoutes.js` → Location-based attendance validation

Each route is forwarded to its respective microservice using a **proxy handler**.

---

### 4. Proxy Handler (`utils/proxyHandler.js`)

This is the **core routing mechanism**.

It:

* Forwards requests from API Gateway → Microservice
* Preserves headers, body, and params
* Handles service communication transparently

---

### 5. Shared Package (`shared/`)

This folder is designed for **code reuse across microservices**.

#### 📌 Constants

* `ports.js` → Service port mapping
* `roles.js` → User roles (admin, employee, etc.)
* `queues.js` → RabbitMQ queue names
* `attendance.js` → Attendance rules/constants

#### 📌 Logger

* Centralized logging utility used across services

#### 📌 RabbitMQ Layer

* `connection.js` → Establishes broker connection
* `publisher.js` → Sends messages to queues
* `consumer.js` → Listens to queues

Used for:

* Async communication between services
* Event-driven architecture (e.g., attendance marked event)

---

## 🔄 Request Flow Example

### Employee Fetch Request:

1. Client calls:

```
GET /api/employees
```

2. API Gateway:

* Authenticates request
* Assigns request ID
* Logs request
* Measures execution time

3. Gateway → Proxy Handler:

* Forwards request to Employee Service

4. Employee Service:

* Processes request
* Returns response

5. Gateway:

* Sends final response back to client

---

## 🧪 Key Design Patterns Used

* **API Gateway Pattern**
* **Microservices Architecture**
* **Middleware Pipeline Pattern**
* **Proxy Pattern**
* **Publisher–Subscriber (RabbitMQ)**

---

## 🚀 How to Build This From Scratch

### Step 1: Initialize project

```bash
mkdir presencehub
cd presencehub
npm init -y
```

---

### Step 2: Create API Gateway

```bash
mkdir api-gateway
cd api-gateway
npm install express http-proxy-middleware dotenv jsonwebtoken
```

---

### Step 3: Add structure

* src/index.js (entry point)
* middleware/
* routes/
* services/
* utils/

---

### Step 4: Create shared module

```bash
mkdir shared
```

Add:

* constants
* logger
* rabbitmq setup

---

### Step 5: Setup Microservices

Create separate services:

```
employee-service
attendance-service
geofence-service
```

Each runs independently on its own port.

---

### Step 6: Add API Gateway Proxy Layer

* Route requests based on URL
* Forward to correct service

---

### Step 7: Add RabbitMQ (optional but recommended)

* Install RabbitMQ server
* Configure producer/consumer
* Enable event-driven updates

---

## 📌 Environment Setup

Each service uses `.env`:

```
PORT=3000
JWT_SECRET=your_secret
RABBITMQ_URL=amqp://localhost
```

---

## 🧩 Why This Architecture Works Well

* Easy to scale individual services
* Debugging via request IDs
* Clean separation of responsibilities
* Real-world production-style structure
* Supports async processing via RabbitMQ

---

## 🧭 Future Improvements

* Add Docker Compose for full orchestration
* Add Kubernetes deployment
* Add centralized API documentation (Swagger)
* Add Redis caching layer
* Add rate limiting at gateway level

