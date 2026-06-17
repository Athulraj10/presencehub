# PresenceHub – Geofence Service

## Overview

The Geofence Service is a microservice within the PresenceHub HRMS platform responsible for validating employee attendance eligibility based on geographical location.

The service receives employee GPS coordinates, calculates the distance from the configured office location, determines whether the employee is inside the allowed geofence radius, and publishes attendance-related events through RabbitMQ for further processing by other services.

---

# Project Objectives

* Validate employee location using GPS coordinates
* Calculate distance between employee and office
* Support dynamic geofence configuration from MySQL
* Publish attendance events using RabbitMQ
* Provide REST APIs for geofence validation
* Support scalable event-driven architecture

---

# Features Implemented

## Day 1 – Project Setup & Infrastructure

### Completed Tasks

* Express.js Server Setup
* Project Structure Creation
* Route Configuration
* Controller Layer Setup
* Middleware Configuration
* MySQL Database Integration
* RabbitMQ Integration
* Environment Configuration
* Health Check API
* Error Handling Middleware
* Health Status Monitoring

---

## Day 2 – Geofence Validation Logic

### Completed Tasks

* Service Layer Implementation
* Geolib Integration
* Distance Calculation Logic
* Geofence Validation API
* Request Validation Middleware
* Controller-Service Integration
* Route-Middleware Integration
* API Testing using Thunder Client

---

## Day 3 – Database Driven Geofence Configuration

### Completed Tasks

* Geofence Database Table Creation
* Office Location Storage in MySQL
* Dynamic Geofence Configuration
* Database Driven Validation
* Dynamic Radius Configuration
* Dynamic Office Name Configuration
* MySQL Query Integration
* Removal of Hardcoded Coordinates

---

## Day 4 – RabbitMQ Event Integration

### Completed Tasks

* RabbitMQ Event Publisher
* RabbitMQ Consumer
* Queue Management
* Event Payload Creation
* Event Driven Communication
* Geofence Event Processing
* Producer Testing
* Consumer Testing
* End-to-End Event Verification

---

## Day 5 – Production Readiness & Testing

### Completed Tasks

* Request Logging Middleware
* Centralized Error Handling
* Try-Catch Controller Handling
* Standardized API Error Responses
* Invalid Request Testing
* Invalid Geofence Testing
* RabbitMQ Verification
* Final API Testing
* Documentation Updates
* Production Readiness Validation

---

# Project Structure

```text
presencehub/
│
└── geofence-service/
    │
    ├── config/
    │   ├── db.js
    │   ├── rabbitmq.js
    │   └── healthStatus.js
    │
    ├── controllers/
    │   └── geofenceController.js
    │
    ├── middleware/
    │   ├── logger.js
    │   ├── errorHandler.js
    │   └── validateGeofenceRequest.js
    │
    ├── routes/
    │   └── geofenceRoutes.js
    │
    ├── services/
    │   ├── geofenceService.js
    │   └── rabbitmqPublisher.js
    │
    ├── tests/
    │   ├── test-db.js
    │   ├── test-rabbit.js
    │   └── test-consumer.js
    │
    ├── database/
    │   └── geofence.sql
    │
    ├── logs/
    │
    ├── .env
    ├── .gitignore
    ├── package.json
    ├── package-lock.json
    ├── README.md
    └── app.js
```

---

# Technologies Used

### Backend

* Node.js
* Express.js

### Database

* MySQL

### Messaging

* RabbitMQ

### Libraries

* Geolib
* Dotenv

### Testing

* Thunder Client

---

# Available APIs

## Health Check API

### Request

```http
GET /health
```

### Response

```json
{
  "service": "geofence-service",
  "status": "UP",
  "database": "CONNECTED",
  "rabbitmq": "CONNECTED"
}
```

---

## Geofence Validation API

### Request

```http
POST /geofence/validate
```

### Request Body

```json
{
  "employeeId": 101,
  "latitude": 8.560370308647784,
  "longitude": 76.88028618296313
}
```

### Success Response

```json
{
  "employeeId": 101,
  "officeName": "GNX Digital Solutions",
  "distance": 0,
  "radius": 100,
  "insideGeofence": true
}
```

---

# System Workflow

## Geofence Validation Flow

```text
Request
   ↓
Validation Middleware
   ↓
Controller
   ↓
Service Layer
   ↓
Fetch Geofence Configuration
   ↓
Distance Calculation
   ↓
RabbitMQ Event Publishing
   ↓
Response
```

---

## Event Driven Flow

```text
Employee Request
        ↓
Geofence Validation
        ↓
RabbitMQ Publisher
        ↓
geofence-events Queue
        ↓
RabbitMQ Consumer
        ↓
Event Processed
```

---

# Testing Performed

### API Testing

* Health Check API Testing
* Geofence Validation Testing
* Invalid Request Testing
* Invalid Location Testing

### Database Testing

* MySQL Connectivity Testing
* Geofence Data Retrieval Testing

### RabbitMQ Testing

* Producer Testing
* Consumer Testing
* Queue Verification

---

# Final Deliverables

* Health Check API
* Geofence Validation API
* Dynamic Geofence Management
* MySQL Integration
* RabbitMQ Integration
* Event Driven Architecture
* Logging Middleware
* Error Handling Middleware
* API Documentation

---

# Project Status

### Day 1

Completed ✅

### Day 2

Completed ✅

### Day 3

Completed ✅

### Day 4

Completed ✅

### Day 5

Completed ✅

---

# Overall Completion

### Geofence Service Backend

100% Complete ✅

---

## Author

Adhil Shaji
