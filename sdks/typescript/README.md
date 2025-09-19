# Camera Streaming Platform - TypeScript/JavaScript SDK

Official TypeScript/JavaScript SDK for the Camera Streaming Platform API.

## Installation

```bash
npm install @camera-streaming/sdk
```

## Quick Start

### Basic Usage

```typescript
import { CameraStreamingClient } from '@camera-streaming/sdk';

const client = new CameraStreamingClient({
  baseUrl: 'https://api.camera-streaming.example.com',
});

// Login with username/password
const loginResponse = await client.login({
  username: 'your-username',
  password: 'your-password',
});

console.log('Logged in as:', loginResponse.data.user.username);

// Get all cameras
const cameras = await client.getCameras();
console.log('Total cameras:', cameras.data.total);

// Create a new camera
const newCamera = await client.createCamera({
  name: 'Front Door Camera',
  company: 'Hikvision',
  model: 'DS-2CD2043G0-I',
  serialNumber: 'HK001234567890',
  location: 'Building A - Main Entrance',
  place: 'Mounted on wall, facing parking lot',
  isRecording: true,
});

console.log('Created camera:', newCamera.name);
```

### Using API Keys

```typescript
import { CameraStreamingClient } from '@camera-streaming/sdk';

const client = new CameraStreamingClient({
  baseUrl: 'https://api.camera-streaming.example.com',
  apiKey: 'your-api-key-here',
});

// No need to login when using API keys
const cameras = await client.getCameras();
```

### Real-time Updates with WebSocket

```typescript
import { WebSocketClient } from '@camera-streaming/sdk';

const wsClient = new WebSocketClient({
  url: 'wss://api.camera-streaming.example.com/ws',
  token: 'your-jwt-token',
});

// Connect to WebSocket
await wsClient.connect();

// Subscribe to camera status updates
wsClient.subscribeToCameraUpdates();

// Listen for camera status changes
wsClient.on('cameraStatusUpdate', (update) => {
  console.log(`Camera ${update.cameraId} is now ${update.status}`);
});

// Subscribe to dashboard updates
wsClient.subscribeToDashboard();

wsClient.on('dashboardUpdate', (update) => {
  console.log('Dashboard stats updated:', update.stats);
});

// Listen for alerts
wsClient.subscribeToAlerts();

wsClient.on('alert', (alert) => {
  console.log(`${alert.severity.toUpperCase()} Alert: ${alert.message}`);
});
```

## API Reference

### CameraStreamingClient

#### Constructor

```typescript
new CameraStreamingClient(config: ClientConfig)
```

**ClientConfig:**
- `baseUrl: string` - Base URL of the API
- `apiKey?: string` - API key for authentication (optional)
- `timeout?: number` - Request timeout in milliseconds (default: 30000)
- `retries?: number` - Number of retry attempts (default: 3)
- `retryDelay?: number` - Delay between retries in milliseconds (default: 1000)

#### Authentication Methods

```typescript
// Login with username/password
await client.login({ username: 'user', password: 'pass' });

// Logout
await client.logout();

// Get current user profile
const user = await client.getProfile();

// Check if authenticated
const isAuth = client.isAuthenticated();
```

#### Camera Management

```typescript
// Get all cameras with optional filters
const cameras = await client.getCameras({
  search: 'front door',
  company: 'Hikvision',
  isActive: true,
  limit: 10,
  offset: 0,
});

// Get specific camera
const camera = await client.getCamera('camera-id');

// Create new camera
const newCamera = await client.createCamera({
  name: 'Camera Name',
  company: 'Company',
  model: 'Model',
  serialNumber: 'Serial123',
  location: 'Location',
  place: 'Placement details',
  isRecording: true,
});

// Update camera
const updatedCamera = await client.updateCamera('camera-id', {
  name: 'New Name',
  location: 'New Location',
});

// Delete camera
await client.deleteCamera('camera-id');

// Activate/deactivate camera
await client.activateCamera('camera-id');
await client.deactivateCamera('camera-id');

// Toggle recording
const result = await client.toggleRecording('camera-id');
console.log('Recording:', result.isRecording);
```

#### Recording Management

```typescript
// Get recordings with filters
const recordings = await client.getRecordings({
  cameraId: 'camera-id',
  startDate: '2023-01-01',
  endDate: '2023-01-31',
  limit: 50,
});

// Get specific recording
const recording = await client.getRecording('recording-id');

// Get download URL for recording
const downloadUrl = await client.getRecordingDownloadUrl('recording-id');

// Delete recording
await client.deleteRecording('recording-id');
```

#### Streaming

```typescript
// Get HLS stream URL
const streamUrl = await client.getStreamUrl('camera-id', '720p');

// WebRTC streaming
const offer = await client.getWebRTCOffer('camera-id');
// ... handle WebRTC negotiation
await client.sendWebRTCAnswer('camera-id', answer);
```

#### Dashboard & Analytics

```typescript
// Get dashboard statistics
const stats = await client.getDashboardStats();

// Get system health
const health = await client.getSystemHealth();

// Get analytics overview
const analytics = await client.getAnalyticsOverview('24h');
```

#### API Token Management

```typescript
// Get all API tokens
const tokens = await client.getApiTokens();

// Create new API token
const { token, apiKey } = await client.createApiToken({
  name: 'My API Token',
  permissions: ['camera:read', 'stream:view'],
  expiresIn: '30d',
  rateLimit: 1000,
});

// Delete API token
await client.deleteApiToken('token-id');
```

### WebSocketClient

#### Constructor

```typescript
new WebSocketClient(config: WebSocketConfig)
```

**WebSocketConfig:**
- `url: string` - WebSocket URL
- `token: string` - JWT token for authentication
- `reconnect?: boolean` - Auto-reconnect on disconnect (default: true)
- `reconnectInterval?: number` - Reconnect interval in ms (default: 5000)
- `maxReconnectAttempts?: number` - Max reconnect attempts (default: 10)

#### Connection Methods

```typescript
// Connect to WebSocket
await wsClient.connect();

// Disconnect
wsClient.disconnect();

// Check connection status
const isConnected = wsClient.isConnected();
```

#### Subscription Methods

```typescript
// Subscribe to all camera updates
wsClient.subscribeToCameraUpdates();

// Subscribe to specific camera
wsClient.subscribeToCamera('camera-id');

// Subscribe to dashboard updates
wsClient.subscribeToDashboard();

// Subscribe to alerts
wsClient.subscribeToAlerts();

// Unsubscribe from specific camera
wsClient.unsubscribeFromCamera('camera-id');

// Unsubscribe from all
wsClient.unsubscribeFromAll();
```

#### Event Listeners

```typescript
// Connection events
wsClient.on('connected', () => console.log('Connected'));
wsClient.on('disconnected', ({ code, reason }) => console.log('Disconnected'));
wsClient.on('reconnecting', (attempt) => console.log(`Reconnecting... (${attempt})`));

// Data events
wsClient.on('cameraStatusUpdate', (update) => {
  console.log(`Camera ${update.cameraId}: ${update.status}`);
});

wsClient.on('dashboardUpdate', (update) => {
  console.log('Dashboard updated:', update.stats);
});

wsClient.on('alert', (alert) => {
  console.log(`Alert: ${alert.message}`);
});

wsClient.on('streamQualityUpdate', (data) => {
  console.log('Stream quality:', data);
});

wsClient.on('recordingEvent', (event) => {
  console.log('Recording event:', event);
});

// Error handling
wsClient.on('error', (error) => {
  console.error('WebSocket error:', error.message);
});
```

## Error Handling

The SDK provides specific error types for different scenarios:

```typescript
import {
  CameraStreamingError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  NetworkError,
} from '@camera-streaming/sdk';

try {
  const camera = await client.getCamera('invalid-id');
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log('Camera not found');
  } else if (error instanceof AuthenticationError) {
    console.log('Please login first');
  } else if (error instanceof RateLimitError) {
    console.log('Rate limit exceeded, please wait');
  } else {
    console.log('Unexpected error:', error.message);
  }
}
```

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions:

```typescript
import { Camera, StreamStatus, UserRole } from '@camera-streaming/sdk';

const camera: Camera = await client.getCamera('camera-id');

if (camera.streamStatus === StreamStatus.ONLINE) {
  console.log('Camera is online');
}
```

## Examples

### Complete Camera Management Example

```typescript
import { CameraStreamingClient, WebSocketClient } from '@camera-streaming/sdk';

async function manageCameras() {
  const client = new CameraStreamingClient({
    baseUrl: 'https://api.camera-streaming.example.com',
  });

  // Login
  await client.login({
    username: 'admin',
    password: 'password',
  });

  // Create WebSocket client for real-time updates
  const wsClient = new WebSocketClient({
    url: 'wss://api.camera-streaming.example.com/ws',
    token: client.accessToken,
  });

  await wsClient.connect();
  wsClient.subscribeToCameraUpdates();

  // Listen for camera status changes
  wsClient.on('cameraStatusUpdate', (update) => {
    console.log(`Camera ${update.cameraId} is now ${update.status}`);
  });

  // Get all cameras
  const cameras = await client.getCameras();
  console.log(`Found ${cameras.data.total} cameras`);

  // Create a new camera
  const newCamera = await client.createCamera({
    name: 'Parking Lot Camera',
    company: 'Dahua',
    model: 'IPC-HFW4431R-Z',
    serialNumber: 'DH987654321',
    location: 'Parking Lot',
    place: 'Pole mounted, overlooking entrance',
    isRecording: true,
  });

  console.log(`Created camera: ${newCamera.name} (${newCamera.id})`);

  // Start recording if not already
  if (!newCamera.isRecording) {
    await client.toggleRecording(newCamera.id);
    console.log('Recording started');
  }

  // Get stream URL
  const streamUrl = await client.getStreamUrl(newCamera.id, '720p');
  console.log(`Stream URL: ${streamUrl}`);

  // Clean up
  setTimeout(() => {
    wsClient.disconnect();
  }, 60000); // Disconnect after 1 minute
}

manageCameras().catch(console.error);
```

### Recording Playback Example

```typescript
import { CameraStreamingClient } from '@camera-streaming/sdk';

async function playbackRecordings() {
  const client = new CameraStreamingClient({
    baseUrl: 'https://api.camera-streaming.example.com',
    apiKey: 'your-api-key',
  });

  // Get recordings from last 24 hours
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const recordings = await client.getRecordings({
    startDate: yesterday.toISOString(),
    endDate: new Date().toISOString(),
    limit: 10,
  });

  console.log(`Found ${recordings.data.total} recordings`);

  for (const recording of recordings.data.items) {
    console.log(`Recording: ${recording.filename}`);
    console.log(`Duration: ${recording.duration} seconds`);
    console.log(`Size: ${(recording.fileSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Get download URL
    const downloadUrl = await client.getRecordingDownloadUrl(recording.id);
    console.log(`Download: ${downloadUrl}`);
    console.log('---');
  }
}

playbackRecordings().catch(console.error);
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Documentation: https://docs.camera-streaming.example.com
- API Reference: https://api.camera-streaming.example.com/docs
- Issues: https://github.com/camera-streaming/platform/issues
- Email: support@camera-streaming.example.com