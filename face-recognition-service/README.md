# PresenceHub - Face Recognition Service

A standalone microservice built using Python (Flask) and the `face_recognition` library to handle face enrollment and verification for the PresenceHub Attendance Management System.

This service is fully decoupled and exposes two REST endpoints for integration with the existing Node.js/Go backend services.

---

## Folder Structure

```text
face-recognition-service/
├── app/
│   ├── __init__.py      # App initialization and middleware (CORS, global handlers)
│   ├── routes.py        # Enrollment and Verification endpoints
│   └── utils.py         # Base64 decoding, face detection, embedding & matching logic
├── run.py               # Application entry point
├── requirements.txt     # Python dependencies
└── README.md            # API Documentation & Setup guide
```

---

## Prerequisites (Windows Setup)

The `face_recognition` library depends on `dlib`, which compiles C++ code. On Windows, you need to ensure the appropriate build tools are installed.

1. **Visual Studio Build Tools**:
   Install Visual Studio Community or Build Tools and select the **Desktop development with C++** workload.
2. **CMake**:
   Make sure CMake is installed and added to your system `PATH`. You can install it via pip:
   ```bash
   pip install cmake
   ```

---

## Installation & Setup

1. **Create and Activate Virtual Environment**:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On Windows (CMD):
   .\venv\Scripts\activate.bat
   # On macOS/Linux:
   source venv/bin/activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install --upgrade pip
   pip install cmake
   pip install -r requirements.txt
   ```

3. **Running the Service**:
   ```bash
   python run.py
   ```
   By default, the server runs on `http://localhost:5001`.

### Environment Variables
You can configure the service using the following environment variables:
* `PORT`: The port on which the Flask app runs (default: `5001`).
* `HOST`: The host to bind to (default: `0.0.0.0`).
* `DEBUG`: Set to `True` to enable hot reloading (default: `False`).
* `FACE_VERIFICATION_TOLERANCE`: The tolerance value for comparing faces (default: `0.6`). Lower values are stricter.

---

## API Documentation

### 1. Face Enrollment (`POST /generate-embedding`)

Generates a 128-dimensional face embedding from an uploaded image file containing exactly one face.

* **URL**: `/generate-embedding`
* **Method**: `POST`
* **Headers**: `Content-Type: multipart/form-data`
* **Request Params**:
  * `image` (file): Uploaded photo file (`.jpg`, `.jpeg`, `.png`)

#### Success Response
* **Status Code**: `200 OK`
* **Body**:
  ```json
  {
    "success": true,
    "embedding": "-0.11928,0.06323,0.02111,...,0.08912"
  }
  ```

#### Error Responses
* **Status Code**: `400 Bad Request` (Missing parameters/file formats)
  ```json
  {
    "success": false,
    "error": "Missing 'image' file in multipart/form-data request"
  }
  ```
* **Status Code**: `400 Bad Request` (No face detected)
  ```json
  {
    "success": false,
    "error": "No face detected"
  }
  ```
* **Status Code**: `400 Bad Request` (More than one face)
  ```json
  {
    "success": false,
    "error": "Multiple faces detected"
  }
  ```
* **Status Code**: `400 Bad Request` (Corrupt Image)
  ```json
  {
    "success": false,
    "error": "Invalid or corrupted image: <error details>"
  }
  ```

---

### 2. Face Verification (`POST /verify-face`)

Verifies a live face image against a stored embedding string.

* **URL**: `/verify-face`
* **Method**: `POST`
* **Headers**: `Content-Type: multipart/form-data`
* **Request Params**:
  * `image` (file): Uploaded selfie photo file (`.jpg`, `.jpeg`, `.png`)
  * `storedEmbedding` (text field): Comma-separated 128 values stored in database

#### Success Response (Match Found)
* **Status Code**: `200 OK`
* **Body**:
  ```json
  {
    "success": true,
    "matched": true
  }
  ```

#### Success Response (Match Not Found)
* **Status Code**: `200 OK`
* **Body**:
  ```json
  {
    "success": true,
    "matched": false
  }
  ```

#### Error Responses
* **Status Code**: `400 Bad Request`
  ```json
  {
    "success": false,
    "error": "Expected 128-dimensional embedding, but got <N> values"
  }
  ```
* **Status Code**: `400 Bad Request` (Image issues / No face)
  ```json
  {
    "success": false,
    "error": "No face detected"
  }
  ```

