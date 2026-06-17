# PresenceHub

# Geofence Service

## Overview

The Geofence Service is responsible for validating whether an employee is inside or outside a predefined office geofence area.

The service uses employee latitude and longitude coordinates to calculate the distance from the office location and determine geofence eligibility.

---

## Day 1 Completed

### Features Implemented

* Express Server Setup
* Route Structure
* Controller Structure
* Middleware Setup
* MySQL Configuration
* RabbitMQ Configuration
* Health Check API
* Environment Configuration
* Git Ignore Setup
* Error Handling Middleware
* Health Status Management

---

## Day 2 Completed

### Features Implemented

* Service Layer Implementation
* Geolib Integration
* Distance Calculation Logic
* Geofence Validation API
* Office Geofence Configuration
* Request Validation Middleware
* Controller and Service Integration
* Route and Middleware Integration
* Thunder Client Testing
* Valid and Invalid Request Testing

---

## Day 3 Completed

### Features Implemented

* Geofence Database Table Creation
* Office Coordinates Stored in MySQL
* Dynamic Geofence Configuration
* Database Driven Geofence Validation
* Fetch Geofence Data from MySQL
* Removed Hardcoded Office Coordinates
* Dynamic Radius Configuration
* Dynamic Office Name Configuration
* MySQL Query Integration in Service Layer
* Database Validation Testing

---

## Day 4 Completed

### Features Implemented

* RabbitMQ Event Publishing
* RabbitMQ Consumer Implementation
* Queue Creation and Management
* Event Driven Communication
* Geofence Event Processing
* Event Payload Generation
* RabbitMQ Producer Integration
* RabbitMQ Consumer Testing
* End-to-End Event Verification
* Queue Based Communication Testing

---

## Day 5 Completed

### Features Implemented

* Request Logging Middleware
* Controller Try-Catch Error Handling
* Centralized Error Handling Improvements
* API Error Response Standardization
* Invalid Request Testing
* Invalid Geofence Testing
* RabbitMQ Event Verification
* Final API Testing
* Production Readiness Validation
* Documentation Updates

---

## Project Structure

```text
geofence-service/
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
├── test-consumer.js
│
├── .env
├── .gitignore
├── app.js
├── package.json
└── README.md
```

---

## Technologies Used

* Node.js
* Express.js
* MySQL
* RabbitMQ
* Geolib
* Thunder Client

---

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
Fetch Geofence From MySQL
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

## Current Progress

### Day 1 Status

Completed ✅

### Day 2 Status

Completed ✅

### Day 3 Status

Completed ✅

### Day 4 Status

Completed ✅

### Day 5 Status

Completed ✅

---

## Overall Progress

### Geofence Service Backend

100% Complete ✅

### Successfully Implemented

* Dynamic Geofence Validation
* MySQL Integration
* RabbitMQ Integration
* Event Driven Architecture
* Request Validation
* Error Handling
* Logging
* API Testing
* Consumer Testing
* Production Ready Backend

---

## Final Deliverables

* Health Check API
* Geofence Validation API
* Database Driven Geofence Management
* RabbitMQ Event Publishing
* RabbitMQ Consumer
* Logging Middleware
* Error Handling Middleware
* Documentation

---

## Author

Adhil Shaji
