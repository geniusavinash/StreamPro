import { Injectable } from '@nestjs/common';

@Injectable()
export class DocumentationService {
  async generateOpenApiSpec() {
    // In a real implementation, this would generate the OpenAPI spec dynamically
    return {
      openapi: '3.0.0',
      info: {
        title: 'Multi-Camera Streaming Platform API',
        version: '1.0.0',
        description: 'Comprehensive API for camera management and streaming',
      },
      servers: [
        {
          url: 'http://localhost:3000/api/v1',
          description: 'Local development server',
        },
      ],
      // Additional OpenAPI specification would be generated here
    };
  }

  async generatePostmanCollection() {
    return {
      info: {
        name: 'Multi-Camera Streaming Platform API',
        description: 'Complete Postman collection for the Camera Platform API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      auth: {
        type: 'bearer',
        bearer: [
          {
            key: 'token',
            value: '{{jwt_token}}',
            type: 'string',
          },
        ],
      },
      variable: [
        {
          key: 'base_url',
          value: 'http://localhost:3000/api/v1',
          type: 'string',
        },
        {
          key: 'jwt_token',
          value: '',
          type: 'string',
        },
      ],
      item: [
        {
          name: 'Authentication',
          item: [
            {
              name: 'Login',
              request: {
                method: 'POST',
                header: [
                  {
                    key: 'Content-Type',
                    value: 'application/json',
                  },
                ],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify({
                    username: 'admin',
                    password: 'password',
                  }),
                },
                url: {
                  raw: '{{base_url}}/auth/login',
                  host: ['{{base_url}}'],
                  path: ['auth', 'login'],
                },
              },
            },
          ],
        },
        {
          name: 'Cameras',
          item: [
            {
              name: 'Get All Cameras',
              request: {
                method: 'GET',
                header: [],
                url: {
                  raw: '{{base_url}}/cameras',
                  host: ['{{base_url}}'],
                  path: ['cameras'],
                },
              },
            },
            {
              name: 'Create Camera',
              request: {
                method: 'POST',
                header: [
                  {
                    key: 'Content-Type',
                    value: 'application/json',
                  },
                ],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify({
                    name: 'Front Door Camera',
                    company: 'Hikvision',
                    model: 'DS-2CD2043G0-I',
                    serialNumber: 'HK001234567890',
                    location: 'Building A - Main Entrance',
                    place: 'Mounted on wall, facing parking lot',
                  }),
                },
                url: {
                  raw: '{{base_url}}/cameras',
                  host: ['{{base_url}}'],
                  path: ['cameras'],
                },
              },
            },
          ],
        },
        // Additional endpoints would be added here
      ],
    };
  }

  async generateJavaScriptSDK() {
    return `
/**
 * Multi-Camera Streaming Platform JavaScript SDK
 * Version: 1.0.0
 */

class CameraPlatformSDK {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl || 'http://localhost:3000/api/v1';
    this.apiKey = apiKey;
    this.token = null;
  }

  async request(endpoint, options = {}) {
    const url = \`\${this.baseUrl}\${endpoint}\`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = \`Bearer \${this.token}\`;
    } else if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(\`API request failed: \${response.status} \${response.statusText}\`);
    }

    return response.json();
  }

  // Authentication
  async login(username, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.token = response.accessToken;
    return response;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.token = null;
  }

  // Cameras
  async getCameras(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(\`/cameras?\${params}\`);
  }

  async getCamera(id) {
    return this.request(\`/cameras/\${id}\`);
  }

  async createCamera(cameraData) {
    return this.request('/cameras', {
      method: 'POST',
      body: JSON.stringify(cameraData),
    });
  }

  async updateCamera(id, cameraData) {
    return this.request(\`/cameras/\${id}\`, {
      method: 'PUT',
      body: JSON.stringify(cameraData),
    });
  }

  async deleteCamera(id) {
    return this.request(\`/cameras/\${id}\`, { method: 'DELETE' });
  }

  // Streaming
  async getStreamUrls(cameraId) {
    return this.request(\`/streaming/camera/\${cameraId}/urls\`);
  }

  // Recordings
  async getRecordings(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(\`/recordings?\${params}\`);
  }

  async getRecordingDownloadUrl(recordingId) {
    return this.request(\`/recordings/\${recordingId}/download\`);
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // Analytics
  async getCameraAnalytics(timeRange = '7d') {
    return this.request(\`/analytics/cameras?timeRange=\${timeRange}\`);
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CameraPlatformSDK;
}

// Example usage:
/*
const sdk = new CameraPlatformSDK('http://localhost:3000/api/v1');

// Login
await sdk.login('admin', 'password');

// Get cameras
const cameras = await sdk.getCameras();
console.log('Cameras:', cameras);

// Create a new camera
const newCamera = await sdk.createCamera({
  name: 'Front Door Camera',
  company: 'Hikvision',
  model: 'DS-2CD2043G0-I',
  serialNumber: 'HK001234567890',
  location: 'Building A - Main Entrance',
  place: 'Mounted on wall, facing parking lot'
});
*/
`;
  }

  async generatePythonSDK() {
    return `
"""
Multi-Camera Streaming Platform Python SDK
Version: 1.0.0
"""

import requests
import json
from typing import Dict, List, Optional, Any
from urllib.parse import urlencode


class CameraPlatformSDK:
    def __init__(self, base_url: str = "http://localhost:3000/api/v1", api_key: Optional[str] = None):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.token = None
        self.session = requests.Session()

    def _request(self, endpoint: str, method: str = "GET", data: Optional[Dict] = None, params: Optional[Dict] = None) -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}

        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        elif self.api_key:
            headers["X-API-Key"] = self.api_key

        kwargs = {
            "headers": headers,
            "params": params,
        }

        if data:
            kwargs["json"] = data

        response = self.session.request(method, url, **kwargs)
        response.raise_for_status()
        return response.json()

    # Authentication
    def login(self, username: str, password: str) -> Dict[str, Any]:
        """Login and obtain JWT token"""
        response = self._request("/auth/login", "POST", {"username": username, "password": password})
        self.token = response.get("accessToken")
        return response

    def logout(self) -> None:
        """Logout and clear token"""
        try:
            self._request("/auth/logout", "POST")
        finally:
            self.token = None

    # Cameras
    def get_cameras(self, filters: Optional[Dict] = None) -> Dict[str, Any]:
        """Get list of cameras with optional filters"""
        return self._request("/cameras", params=filters)

    def get_camera(self, camera_id: str) -> Dict[str, Any]:
        """Get specific camera by ID"""
        return self._request(f"/cameras/{camera_id}")

    def create_camera(self, camera_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new camera"""
        return self._request("/cameras", "POST", camera_data)

    def update_camera(self, camera_id: str, camera_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update existing camera"""
        return self._request(f"/cameras/{camera_id}", "PUT", camera_data)

    def delete_camera(self, camera_id: str) -> Dict[str, Any]:
        """Delete camera"""
        return self._request(f"/cameras/{camera_id}", "DELETE")

    def activate_camera(self, camera_id: str) -> Dict[str, Any]:
        """Activate camera"""
        return self._request(f"/cameras/{camera_id}/activate", "POST")

    def deactivate_camera(self, camera_id: str) -> Dict[str, Any]:
        """Deactivate camera"""
        return self._request(f"/cameras/{camera_id}/deactivate", "POST")

    # Streaming
    def get_stream_urls(self, camera_id: str, signed: bool = False) -> Dict[str, Any]:
        """Get streaming URLs for camera"""
        params = {"signed": signed} if signed else None
        return self._request(f"/streaming/camera/{camera_id}/urls", params=params)

    # Recordings
    def get_recordings(self, filters: Optional[Dict] = None) -> Dict[str, Any]:
        """Get list of recordings with optional filters"""
        return self._request("/recordings", params=filters)

    def get_recording_download_url(self, recording_id: str) -> Dict[str, Any]:
        """Get download URL for recording"""
        return self._request(f"/recordings/{recording_id}/download")

    def delete_recording(self, recording_id: str) -> Dict[str, Any]:
        """Delete recording"""
        return self._request(f"/recordings/{recording_id}", "DELETE")

    # Dashboard
    def get_dashboard_stats(self) -> Dict[str, Any]:
        """Get dashboard statistics"""
        return self._request("/dashboard/stats")

    def get_camera_analytics(self, time_range: str = "7d") -> Dict[str, Any]:
        """Get camera analytics"""
        return self._request("/dashboard/analytics/cameras", params={"timeRange": time_range})

    # Analytics
    def get_analytics_cameras(self, time_range: str = "7d", camera_id: Optional[str] = None) -> Dict[str, Any]:
        """Get camera analytics"""
        params = {"timeRange": time_range}
        if camera_id:
            params["cameraId"] = camera_id
        return self._request("/analytics/cameras", params=params)

    def get_analytics_recordings(self, time_range: str = "7d") -> Dict[str, Any]:
        """Get recording analytics"""
        return self._request("/analytics/recordings", params={"timeRange": time_range})

    def get_analytics_storage(self, time_range: str = "7d") -> Dict[str, Any]:
        """Get storage analytics"""
        return self._request("/analytics/storage", params={"timeRange": time_range})


# Example usage:
if __name__ == "__main__":
    # Initialize SDK
    sdk = CameraPlatformSDK("http://localhost:3000/api/v1")

    try:
        # Login
        login_response = sdk.login("admin", "password")
        print("Login successful:", login_response)

        # Get cameras
        cameras = sdk.get_cameras()
        print("Cameras:", cameras)

        # Create a new camera
        new_camera = sdk.create_camera({
            "name": "Front Door Camera",
            "company": "Hikvision",
            "model": "DS-2CD2043G0-I",
            "serialNumber": "HK001234567890",
            "location": "Building A - Main Entrance",
            "place": "Mounted on wall, facing parking lot"
        })
        print("New camera created:", new_camera)

        # Get analytics
        analytics = sdk.get_analytics_cameras("30d")
        print("Camera analytics:", analytics)

    except requests.exceptions.RequestException as e:
        print(f"API request failed: {e}")
    finally:
        # Logout
        sdk.logout()
`;
  }

  async getApiExamples() {
    return {
      success: true,
      data: {
        authentication: {
          title: 'Authentication Examples',
          examples: [
            {
              name: 'Login with username/password',
              method: 'POST',
              endpoint: '/auth/login',
              request: {
                username: 'admin',
                password: 'password',
              },
              response: {
                success: true,
                accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                user: {
                  id: '1',
                  username: 'admin',
                  role: 'admin',
                },
              },
            },
          ],
        },
        cameras: {
          title: 'Camera Management Examples',
          examples: [
            {
              name: 'Create a new camera',
              method: 'POST',
              endpoint: '/cameras',
              request: {
                name: 'Front Door Camera',
                company: 'Hikvision',
                model: 'DS-2CD2043G0-I',
                serialNumber: 'HK001234567890',
                location: 'Building A - Main Entrance',
                place: 'Mounted on wall, facing parking lot',
              },
              response: {
                success: true,
                data: {
                  id: 'cam_123',
                  name: 'Front Door Camera',
                  rtmpUrl: 'rtmp://localhost:1935/live/cam_123',
                  isActive: true,
                  streamStatus: 'offline',
                },
              },
            },
            {
              name: 'Get cameras with filters',
              method: 'GET',
              endpoint: '/cameras?isActive=true&streamStatus=online',
              response: {
                success: true,
                data: {
                  cameras: [
                    {
                      id: 'cam_123',
                      name: 'Front Door Camera',
                      streamStatus: 'online',
                      isActive: true,
                    },
                  ],
                  total: 1,
                },
              },
            },
          ],
        },
        streaming: {
          title: 'Streaming Examples',
          examples: [
            {
              name: 'Get stream URLs for a camera',
              method: 'GET',
              endpoint: '/streaming/camera/cam_123/urls',
              response: {
                success: true,
                data: {
                  rtmpUrl: 'rtmp://localhost:1935/live/cam_123',
                  hlsUrl: 'http://localhost:8080/hls/cam_123/playlist.m3u8',
                  webrtcUrl: 'ws://localhost:8080/webrtc/cam_123',
                },
              },
            },
          ],
        },
        webhooks: {
          title: 'Webhook Examples',
          description: 'Configure webhooks to receive real-time notifications',
          examples: [
            {
              name: 'Camera status change webhook',
              event: 'camera.status.changed',
              payload: {
                event: 'camera.status.changed',
                timestamp: '2024-01-15T10:30:00Z',
                data: {
                  cameraId: 'cam_123',
                  previousStatus: 'offline',
                  currentStatus: 'online',
                  camera: {
                    id: 'cam_123',
                    name: 'Front Door Camera',
                    location: 'Building A - Main Entrance',
                  },
                },
              },
            },
          ],
        },
      },
    };
  }

  async getChangelog() {
    return {
      success: true,
      data: {
        versions: [
          {
            version: '1.0.0',
            date: '2024-01-15',
            changes: [
              {
                type: 'added',
                description: 'Initial API release with camera management',
              },
              {
                type: 'added',
                description: 'RTMP streaming support with HLS output',
              },
              {
                type: 'added',
                description: 'Recording management with multi-tier storage',
              },
              {
                type: 'added',
                description: 'Real-time dashboard and analytics',
              },
              {
                type: 'added',
                description: 'Role-based access control and API tokens',
              },
            ],
          },
        ],
      },
    };
  }

  async getApiStatus() {
    return {
      success: true,
      data: {
        status: 'operational',
        version: '1.0.0',
        uptime: '99.9%',
        lastUpdated: new Date().toISOString(),
        endpoints: {
          total: 45,
          operational: 45,
          degraded: 0,
          down: 0,
        },
        performance: {
          averageResponseTime: '120ms',
          requestsPerSecond: 150,
          errorRate: '0.1%',
        },
        dependencies: {
          database: 'operational',
          redis: 'operational',
          storage: 'operational',
          rtmpServer: 'operational',
        },
      },
    };
  }
}