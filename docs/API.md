# StreamPro API Documentation

## Overview

StreamPro provides a comprehensive RESTful API for managing cameras, recordings, and user authentication. The API is built with NestJS and follows OpenAPI 3.0 specifications.

## Base URL

```
Development: http://localhost:3000/api/v1
Production: https://your-domain.com/api/v1
```

## Authentication

StreamPro uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### POST /auth/login
Login with username and password.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "username": "admin",
      "role": "admin",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

#### GET /auth/profile
Get current user profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "username": "admin",
    "email": "admin@streampro.com",
    "role": "admin",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-20T18:00:00Z"
  }
}
```

#### POST /auth/logout
Logout current user.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Cameras

#### GET /cameras
Get all cameras with optional filtering.

**Query Parameters:**
- `isActive` (boolean): Filter by active status
- `status` (string): Filter by status (online, offline)
- `location` (string): Filter by location

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Front Door",
      "location": "Main Entrance",
      "rtmpUrl": "rtmp://localhost:1935/live/camera1",
      "isActive": true,
      "isRecording": true,
      "status": "online",
      "viewers": 12,
      "resolution": "1080p",
      "fps": 30,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:45:00Z"
    }
  ]
}
```

#### GET /cameras/:id
Get a specific camera by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "Front Door",
    "location": "Main Entrance",
    "rtmpUrl": "rtmp://localhost:1935/live/camera1",
    "isActive": true,
    "isRecording": true,
    "status": "online",
    "viewers": 12,
    "resolution": "1080p",
    "fps": 30
  }
}
```

#### POST /cameras
Create a new camera.

**Request Body:**
```json
{
  "name": "New Camera",
  "location": "Office",
  "rtmpUrl": "rtmp://localhost:1935/live/camera_new",
  "company": "Hikvision",
  "model": "DS-2CD2085FWD-I",
  "serialNumber": "HK001234567"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "7",
    "name": "New Camera",
    "location": "Office",
    "rtmpUrl": "rtmp://localhost:1935/live/camera_new",
    "isActive": true,
    "isRecording": false,
    "status": "offline",
    "createdAt": "2024-01-20T18:00:00Z"
  }
}
```

#### PUT /cameras/:id
Update an existing camera.

**Request Body:**
```json
{
  "name": "Updated Camera Name",
  "location": "New Location",
  "isActive": false
}
```

#### DELETE /cameras/:id
Delete a camera.

**Response:**
```json
{
  "success": true,
  "message": "Camera deleted successfully"
}
```

#### POST /cameras/:id/toggle-recording
Start or stop recording for a camera.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "isRecording": true,
    "message": "Recording started"
  }
}
```

### Dashboard

#### GET /dashboard/stats
Get dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "cameras": {
      "total": 6,
      "online": 5,
      "offline": 1,
      "recording": 3
    },
    "recordings": {
      "totalCount": 247,
      "totalSize": 49116860416,
      "activeSessions": 3
    },
    "system": {
      "uptime": 2592000,
      "memory": {
        "used": 6871947673,
        "total": 17179869184,
        "percentage": 40
      },
      "cpu": {
        "usage": 23
      },
      "storage": {
        "used": 719407616000,
        "total": 1099511627776,
        "percentage": 67
      }
    }
  }
}
```

### Recordings

#### GET /recordings
Get all recordings with pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `cameraId` (string): Filter by camera ID
- `status` (string): Filter by status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "cameraId": "1",
      "filename": "front_door_20240120_140000.mp4",
      "duration": 3600,
      "size": 524288000,
      "startTime": "2024-01-20T14:00:00Z",
      "endTime": "2024-01-20T15:00:00Z",
      "status": "completed",
      "createdAt": "2024-01-20T14:00:00Z"
    }
  ]
}
```

#### GET /recordings/:id
Get a specific recording by ID.

#### DELETE /recordings/:id
Delete a recording.

#### GET /recordings/:id/download
Get download URL for a recording.

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://your-domain.com/recordings/download/signed-url",
    "expiresAt": "2024-01-20T19:00:00Z"
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400,
  "timestamp": "2024-01-20T18:00:00Z",
  "path": "/api/v1/cameras"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API requests are limited to:
- **100 requests per minute** for authenticated users
- **20 requests per minute** for unauthenticated requests

## WebSocket Events

StreamPro supports real-time updates via WebSocket connections:

### Connection
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events
- `camera:status` - Camera status changes
- `recording:started` - Recording started
- `recording:stopped` - Recording stopped
- `system:stats` - System statistics updates

## SDK Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  }
});

// Get all cameras
const cameras = await api.get('/cameras');
console.log(cameras.data);
```

### Python
```python
import requests

headers = {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
}

response = requests.get(
    'http://localhost:3000/api/v1/cameras',
    headers=headers
)

cameras = response.json()
print(cameras)
```

### cURL
```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get cameras
curl -X GET http://localhost:3000/api/v1/cameras \
  -H "Authorization: Bearer your-jwt-token"
```

## Interactive Documentation

Visit the interactive API documentation at:
- **Development**: http://localhost:3000/api
- **Swagger UI**: Full interactive documentation with try-it-out functionality

---

For more information, visit the [StreamPro GitHub repository](https://github.com/geniusavinash/StreamPro).