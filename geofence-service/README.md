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
│   ├── errorHandler.js
│   └── validateGeofenceRequest.js
│
├── routes/
│   └── geofenceRoutes.js
│
├── services/
│   └── geofenceService.js
│
├── .env
├── .gitignore
├── app.js
├── package.json
└── README.md
```

---

## Installation

```bash
npm install
```

---

## Run Application

Development Mode:

```bash
npm run dev
```

Production Mode:

```bash
node app.js
```

---

## Available APIs

### Health Check API

#### Request

```http
GET /health
```

#### Response

```json
{
  "service": "geofence-service",
  "status": "UP",
  "database": "CONNECTED",
  "rabbitmq": "CONNECTED"
}
```

---

### Geofence Validation API

#### Request

```http
POST /geofence/validate
```

#### Request Body

```json
{
  "employeeId": 101,
  "latitude": 8.560370308647784,
  "longitude": 76.88028618296313
}
```

#### Success Response

```json
{
  "employeeId": 101,
  "officeName": "GNX Digital Solutions",
  "distance": 0,
  "radius": 100,
  "insideGeofence": true
}
```

#### Validation Error Response

```json
{
  "message": "employeeId, latitude and longitude are required"
}
```

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
Geolib Distance Calculation
   ↓
Response
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

## Current Progress

### Day 1 Status

Completed ✅

### Day 2 Status

Completed ✅

### Day 3 Status

Completed ✅

### Overall Progress

Approximately 90% Complete

---

## Upcoming Tasks

### Day 4

* RabbitMQ Event Publishing
* Attendance Event Processing
* Queue Management
* Event Driven Communication

### Day 5

* Logging
* Advanced Error Handling
* Final Testing
* Documentation Updates
* Production Readiness

---

## Author

Adhil Shaji
