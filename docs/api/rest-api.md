# REST API Reference

Complete reference for the Camera Streaming Platform REST API.

## Table of Contents

- [Base URL and Versioning](#base-url-and-versioning)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Authentication Endpoints](#authentication-endpoints)
- [Camera Management](#camera-management)
- [Recording Management](#recording-management)
- [Streaming Endpoints](#streaming-endpoints)
- [Dashboard and Analytics](#dashboard-and-analytics)
- [User Management](#user-management)
- [API Token Management](#api-token-management)
- [System Administration](#system-administration)

## Base URL and Versioning

**Base URL:** `https://api.yourdomain.com`
**API Version:** `v1`
**Full Base URL:** `https://api.yourdomain.com/api`

All API endpoints are prefixed with `/api` and are versioned. The current version is `v1`.

## Authentication

The API supports two authentication methods:

### 1. JWT Bearer Token
```http
Authorization: Bearer <jwt_token>
```

### 2. API Key
```http
X-API-Key: <api_key>
```

## Rate Limiting

Rate limits are applied per authentication token:

- **Default**: 1000 requests per 15 minutes
- **Burst**: Up to 100 requests per minute
- **Headers**: Rate limit information is included in response headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    // Additional error details
  }
}
```

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request parameters |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

### Error Codes

| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Invalid username or password |
| `TOKEN_EXPIRED` | JWT token has expired |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `VALIDATION_ERROR` | Request validation failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `CAMERA_OFFLINE` | Camera is not online |
| `RECORDING_NOT_AVAILABLE` | Recording file not accessible |

## Authentication Endpoints

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_123",
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "isActive": true,
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    }
  }
}
```

### Refresh Token
```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Logout
```http
POST /api/auth/logout
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Profile
```http
GET /api/auth/profile
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "isActive": true,
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    }
  }
}
```

## Camera Management

### List Cameras
```http
GET /api/cameras
```

**Query Parameters:**
- `search` (string): Search by name, location, or serial number
- `company` (string): Filter by camera company
- `model` (string): Filter by camera model
- `location` (string): Filter by location
- `isActive` (boolean): Filter by active status
- `isRecording` (boolean): Filter by recording status
- `streamStatus` (string): Filter by stream status (`online`, `offline`, `connecting`, `error`)
- `limit` (number): Number of results per page (default: 50, max: 100)
- `offset` (number): Number of results to skip (default: 0)

**Example:**
```http
GET /api/cameras?search=front&isActive=true&limit=10&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "camera_123",
        "name": "Front Door Camera",
        "company": "Hikvision",
        "model": "DS-2CD2043G0-I",
        "serialNumber": "HK001234567890",
        "location": "Building A - Main Entrance",
        "place": "Mounted on wall, facing parking lot",
        "rtmpUrl": "rtmp://stream.yourdomain.com:1935/live/camera_123",
        "isActive": true,
        "isRecording": true,
        "streamStatus": "online",
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2023-01-01T00:00:00Z"
      }
    ],
    "total": 1,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

### Get Camera
```http
GET /api/cameras/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "camera": {
      "id": "camera_123",
      "name": "Front Door Camera",
      "company": "Hikvision",
      "model": "DS-2CD2043G0-I",
      "serialNumber": "HK001234567890",
      "location": "Building A - Main Entrance",
      "place": "Mounted on wall, facing parking lot",
      "rtmpUrl": "rtmp://stream.yourdomain.com:1935/live/camera_123",
      "isActive": true,
      "isRecording": true,
      "streamStatus": "online",
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    }
  }
}
```

### Create Camera
```http
POST /api/cameras
```

**Request Body:**
```json
{
  "name": "Front Door Camera",
  "company": "Hikvision",
  "model": "DS-2CD2043G0-I",
  "serialNumber": "HK001234567890",
  "location": "Building A - Main Entrance",
  "place": "Mounted on wall, facing parking lot",
  "isRecording": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "camera": {
      "id": "camera_123",
      "name": "Front Door Camera",
      "company": "Hikvision",
      "model": "DS-2CD2043G0-I",
      "serialNumber": "HK001234567890",
      "location": "Building A - Main Entrance",
      "place": "Mounted on wall, facing parking lot",
      "rtmpUrl": "rtmp://stream.yourdomain.com:1935/live/camera_123",
      "isActive": true,
      "isRecording": true,
      "streamStatus": "offline",
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    }
  }
}
```

### Update Camera
```http
PUT /api/cameras/{id}
```

**Request Body:**
```json
{
  "name": "Updated Camera Name",
  "location": "New Location",
  "isRecording": false
}
```

### Delete Camera
```http
DELETE /api/cameras/{id}
```

**Response:**
```json
{
  "success": true,
  "message": "Camera deleted successfully"
}
```

### Activate Camera
```http
POST /api/cameras/{id}/activate
```

### Deactivate Camera
```http
POST /api/cameras/{id}/deactivate
```

### Toggle Recording
```http
POST /api/cameras/{id}/toggle-recording
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isRecording": true
  }
}
```

## Recording Management

### List Recordings
```http
GET /api/recordings
```

**Query Parameters:**
- `cameraId` (string): Filter by camera ID
- `startDate` (string): Filter recordings after this date (ISO 8601)
- `endDate` (string): Filter recordings before this date (ISO 8601)
- `storageTier` (string): Filter by storage tier (`hot`, `warm`, `cold`)
- `limit` (number): Number of results per page (default: 50)
- `offset` (number): Number of results to skip (default: 0)

**Example:**
```http
GET /api/recordings?cameraId=camera_123&startDate=2023-01-01T00:00:00Z&endDate=2023-01-31T23:59:59Z
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "recording_456",
        "camera": {
          "id": "camera_123",
          "name": "Front Door Camera"
        },
        "filename": "camera_123_20230101_120000.mp4",
        "filePath": "/recordings/2023/01/01/camera_123_20230101_120000.mp4",
        "fileSize": 1048576000,
        "duration": 3600,
        "startTime": "2023-01-01T12:00:00Z",
        "endTime": "2023-01-01T13:00:00Z",
        "storageTier": "hot",
        "isEncrypted": true,
        "createdAt": "2023-01-01T12:00:00Z",
        "updatedAt": "2023-01-01T12:00:00Z"
      }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### Get Recording
```http
GET /api/recordings/{id}
```

### Get Recording Download URL
```http
GET /api/recordings/{id}/download
```

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://recordings.yourdomain.com/signed-url-here",
    "expiresAt": "2023-01-01T13:00:00Z"
  }
}
```

### Delete Recording
```http
DELETE /api/recordings/{id}
```

## Streaming Endpoints

### Get HLS Stream URL
```http
GET /api/streaming/hls/{cameraId}
```

**Query Parameters:**
- `quality` (string): Stream quality (`240p`, `480p`, `720p`, `1080p`)

**Response:**
```json
{
  "success": true,
  "data": {
    "streamUrl": "https://stream.yourdomain.com/hls/camera_123/playlist.m3u8",
    "qualities": ["240p", "480p", "720p", "1080p"]
  }
}
```

### Get WebRTC Offer
```http
POST /api/streaming/webrtc/{cameraId}/offer
```

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "offer",
    "sdp": "v=0\r\no=- 123456789 123456789 IN IP4 0.0.0.0\r\n..."
  }
}
```

### Send WebRTC Answer
```http
POST /api/streaming/webrtc/{cameraId}/answer
```

**Request Body:**
```json
{
  "type": "answer",
  "sdp": "v=0\r\no=- 123456789 123456789 IN IP4 0.0.0.0\r\n..."
}
```

### Get Stream Statistics
```http
GET /api/streaming/stats/{cameraId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cameraId": "camera_123",
    "status": "online",
    "viewers": 5,
    "bitrate": 2048,
    "fps": 30,
    "resolution": "1920x1080",
    "uptime": 3600,
    "lastSeen": "2023-01-01T12:00:00Z"
  }
}
```

## Dashboard and Analytics

### Get Dashboard Statistics
```http
GET /api/dashboard/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCameras": 150,
    "onlineCameras": 145,
    "offlineCameras": 5,
    "recordingCameras": 140,
    "totalRecordings": 50000,
    "totalStorage": 5497558138880,
    "activeStreams": 25,
    "systemHealth": "healthy"
  }
}
```

### Get System Health
```http
GET /api/dashboard/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 86400,
    "version": "1.0.0",
    "services": {
      "database": {
        "status": "healthy",
        "responseTime": 5,
        "lastCheck": "2023-01-01T12:00:00Z"
      },
      "redis": {
        "status": "healthy",
        "responseTime": 2,
        "lastCheck": "2023-01-01T12:00:00Z"
      },
      "rtmp": {
        "status": "healthy",
        "responseTime": 10,
        "lastCheck": "2023-01-01T12:00:00Z"
      },
      "storage": {
        "status": "healthy",
        "responseTime": 15,
        "lastCheck": "2023-01-01T12:00:00Z"
      }
    }
  }
}
```

### Get Analytics Overview
```http
GET /api/analytics/overview
```

**Query Parameters:**
- `timeRange` (string): Time range for analytics (`1h`, `24h`, `7d`, `30d`)

**Response:**
```json
{
  "success": true,
  "data": {
    "timeRange": "24h",
    "metrics": {
      "totalRequests": 10000,
      "averageResponseTime": 150,
      "errorRate": 0.01,
      "cameraUptime": 0.99,
      "streamQuality": 0.95,
      "storageUsage": 5497558138880
    },
    "trends": {
      "requests": [
        {"timestamp": "2023-01-01T00:00:00Z", "value": 100},
        {"timestamp": "2023-01-01T01:00:00Z", "value": 120}
      ],
      "responseTime": [
        {"timestamp": "2023-01-01T00:00:00Z", "value": 145},
        {"timestamp": "2023-01-01T01:00:00Z", "value": 155}
      ],
      "errors": [
        {"timestamp": "2023-01-01T00:00:00Z", "value": 1},
        {"timestamp": "2023-01-01T01:00:00Z", "value": 0}
      ],
      "cameraStatus": [
        {"timestamp": "2023-01-01T00:00:00Z", "value": 145},
        {"timestamp": "2023-01-01T01:00:00Z", "value": 147}
      ]
    }
  }
}
```

## User Management

### List Users
```http
GET /api/users
```

**Query Parameters:**
- `search` (string): Search by username or email
- `role` (string): Filter by role (`admin`, `operator`, `viewer`, `api_only`)
- `isActive` (boolean): Filter by active status
- `limit` (number): Number of results per page
- `offset` (number): Number of results to skip

### Get User
```http
GET /api/users/{id}
```

### Create User
```http
POST /api/users
```

**Request Body:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "securepassword",
  "role": "operator",
  "isActive": true
}
```

### Update User
```http
PUT /api/users/{id}
```

### Delete User
```http
DELETE /api/users/{id}
```

### Change Password
```http
POST /api/users/{id}/change-password
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

## API Token Management

### List API Tokens
```http
GET /api/auth/api-tokens
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tokens": [
      {
        "id": "token_789",
        "name": "Production API Token",
        "permissions": ["camera:read", "camera:write", "stream:view"],
        "isActive": true,
        "expiresAt": "2024-01-01T00:00:00Z",
        "lastUsedAt": "2023-01-01T12:00:00Z",
        "ipWhitelist": ["192.168.1.100", "10.0.0.0/8"],
        "rateLimit": 1000,
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2023-01-01T00:00:00Z"
      }
    ]
  }
}
```

### Create API Token
```http
POST /api/auth/api-tokens
```

**Request Body:**
```json
{
  "name": "My API Token",
  "permissions": ["camera:read", "stream:view"],
  "expiresIn": "30d",
  "ipWhitelist": ["192.168.1.100"],
  "rateLimit": 500
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": {
      "id": "token_789",
      "name": "My API Token",
      "permissions": ["camera:read", "stream:view"],
      "isActive": true,
      "expiresAt": "2024-01-01T00:00:00Z",
      "lastUsedAt": null,
      "ipWhitelist": ["192.168.1.100"],
      "rateLimit": 500,
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    },
    "apiKey": "cs_1234567890abcdef1234567890abcdef"
  }
}
```

### Update API Token
```http
PUT /api/auth/api-tokens/{id}
```

### Delete API Token
```http
DELETE /api/auth/api-tokens/{id}
```

## System Administration

### Get System Settings
```http
GET /api/settings
```

### Update System Settings
```http
PUT /api/settings
```

**Request Body:**
```json
{
  "maxCameras": 1000,
  "recordingRetentionDays": 30,
  "streamQuality": "1080p",
  "enableNotifications": true,
  "maintenanceMode": false
}
```

### Get Audit Logs
```http
GET /api/audit
```

**Query Parameters:**
- `userId` (string): Filter by user ID
- `action` (string): Filter by action type
- `resource` (string): Filter by resource type
- `startDate` (string): Filter logs after this date
- `endDate` (string): Filter logs before this date
- `limit` (number): Number of results per page
- `offset` (number): Number of results to skip

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "audit_123",
        "userId": "user_123",
        "username": "admin",
        "action": "camera:create",
        "resource": "camera",
        "resourceId": "camera_123",
        "details": {
          "cameraName": "Front Door Camera",
          "ipAddress": "192.168.1.100"
        },
        "timestamp": "2023-01-01T12:00:00Z"
      }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### Export Data
```http
POST /api/export
```

**Request Body:**
```json
{
  "type": "cameras",
  "format": "csv",
  "filters": {
    "isActive": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "exportId": "export_456",
    "downloadUrl": "https://api.yourdomain.com/api/exports/export_456/download",
    "expiresAt": "2023-01-01T13:00:00Z"
  }
}
```

## Webhooks

### List Webhooks
```http
GET /api/webhooks
```

### Create Webhook
```http
POST /api/webhooks
```

**Request Body:**
```json
{
  "name": "Camera Status Webhook",
  "url": "https://your-app.com/webhooks/camera-status",
  "events": ["camera.online", "camera.offline", "recording.started"],
  "secret": "webhook_secret_key",
  "isActive": true
}
```

### Test Webhook
```http
POST /api/webhooks/{id}/test
```

---

## SDK Examples

### JavaScript/TypeScript
```javascript
import { CameraStreamingClient } from '@camera-streaming/sdk';

const client = new CameraStreamingClient('https://api.yourdomain.com');
await client.login('username', 'password');

const cameras = await client.getCameras({ isActive: true });
console.log(`Found ${cameras.length} active cameras`);
```

### Python
```python
import asyncio
from camera_streaming import CameraStreamingClient

async def main():
    async with CameraStreamingClient('https://api.yourdomain.com') as client:
        await client.login('username', 'password')
        cameras = await client.get_cameras({'isActive': True})
        print(f"Found {len(cameras)} active cameras")

asyncio.run(main())
```

### PHP
```php
use CameraStreaming\Client;

$client = new Client('https://api.yourdomain.com');
$client->login('username', 'password');

$cameras = $client->getCameras(['isActive' => true]);
echo "Found " . count($cameras) . " active cameras\n";
```

### cURL
```bash
# Login
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Get cameras
curl -H "Authorization: Bearer $TOKEN" \
  https://api.yourdomain.com/api/cameras?isActive=true
```

---

**Next Steps:**
- [Explore WebSocket API](./websocket.md) for real-time updates
- [Learn about authentication](./authentication.md) in detail
- [Check out SDK documentation](../sdks/javascript.md)
- [See integration examples](../sdks/examples.md)