# Camera Streaming Platform - Python SDK

Official Python SDK for the Camera Streaming Platform API.

## Installation

```bash
pip install camera-streaming-sdk
```

For development with WebSocket support:

```bash
pip install camera-streaming-sdk[websocket]
```

## Quick Start

### Basic Usage

```python
import asyncio
from camera_streaming import CameraStreamingClient

async def main():
    async with CameraStreamingClient("https://api.camera-streaming.example.com") as client:
        # Login with username/password
        user = await client.login("your-username", "your-password")
        print(f"Logged in as: {user.username}")

        # Get all cameras
        cameras = await client.get_cameras()
        print(f"Total cameras: {len(cameras)}")

        # Create a new camera
        from camera_streaming.models import CreateCameraRequest
        
        new_camera_data = CreateCameraRequest(
            name="Front Door Camera",
            company="Hikvision",
            model="DS-2CD2043G0-I",
            serial_number="HK001234567890",
            location="Building A - Main Entrance",
            place="Mounted on wall, facing parking lot",
            is_recording=True,
        )
        
        new_camera = await client.create_camera(new_camera_data)
        print(f"Created camera: {new_camera.name}")

asyncio.run(main())
```

### Using API Keys

```python
import asyncio
from camera_streaming import CameraStreamingClient

async def main():
    async with CameraStreamingClient(
        "https://api.camera-streaming.example.com",
        api_key="your-api-key-here"
    ) as client:
        # No need to login when using API keys
        cameras = await client.get_cameras()
        print(f"Found {len(cameras)} cameras")

asyncio.run(main())
```

### Real-time Updates with WebSocket

```python
import asyncio
from camera_streaming import CameraStreamingClient, WebSocketClient

async def main():
    # First, authenticate and get a token
    async with CameraStreamingClient("https://api.camera-streaming.example.com") as client:
        user = await client.login("username", "password")
        token = client._access_token  # Get the access token
        
        # Create WebSocket client
        async with WebSocketClient("wss://api.camera-streaming.example.com/ws", token) as ws_client:
            # Subscribe to camera status updates
            await ws_client.subscribe_to_camera_updates()
            
            # Listen for camera status changes
            def on_camera_update(update):
                print(f"Camera {update.camera_id} is now {update.status}")
            
            ws_client.on("cameraStatusUpdate", on_camera_update)
            
            # Subscribe to dashboard updates
            await ws_client.subscribe_to_dashboard()
            
            def on_dashboard_update(update):
                print(f"Dashboard stats updated: {update.stats.total_cameras} cameras")
            
            ws_client.on("dashboardUpdate", on_dashboard_update)
            
            # Listen for alerts
            await ws_client.subscribe_to_alerts()
            
            def on_alert(alert):
                print(f"{alert.severity.upper()} Alert: {alert.message}")
            
            ws_client.on("alert", on_alert)
            
            # Keep the connection alive
            await asyncio.sleep(60)  # Listen for 1 minute

asyncio.run(main())
```

## API Reference

### CameraStreamingClient

#### Constructor

```python
CameraStreamingClient(
    base_url: str,
    api_key: Optional[str] = None,
    timeout: float = 30.0,
    retries: int = 3,
    retry_delay: float = 1.0,
)
```

**Parameters:**
- `base_url`: Base URL of the API
- `api_key`: API key for authentication (optional)
- `timeout`: Request timeout in seconds (default: 30.0)
- `retries`: Number of retry attempts (default: 3)
- `retry_delay`: Delay between retries in seconds (default: 1.0)

#### Authentication Methods

```python
# Login with username/password
user = await client.login("username", "password")

# Logout
await client.logout()

# Get current user profile
user = await client.get_profile()

# Check if authenticated
is_auth = client.is_authenticated()
```

#### Camera Management

```python
from camera_streaming.models import CameraFilters, CreateCameraRequest, UpdateCameraRequest

# Get all cameras with optional filters
filters = CameraFilters(
    search="front door",
    company="Hikvision",
    is_active=True,
    limit=10,
    offset=0,
)
cameras = await client.get_cameras(filters)

# Get specific camera
camera = await client.get_camera("camera-id")

# Create new camera
camera_data = CreateCameraRequest(
    name="Camera Name",
    company="Company",
    model="Model",
    serial_number="Serial123",
    location="Location",
    place="Placement details",
    is_recording=True,
)
new_camera = await client.create_camera(camera_data)

# Update camera
updates = UpdateCameraRequest(
    name="New Name",
    location="New Location",
)
updated_camera = await client.update_camera("camera-id", updates)

# Delete camera
await client.delete_camera("camera-id")

# Activate/deactivate camera
await client.activate_camera("camera-id")
await client.deactivate_camera("camera-id")

# Toggle recording
is_recording = await client.toggle_recording("camera-id")
print(f"Recording: {is_recording}")
```

#### Recording Management

```python
from camera_streaming.models import RecordingFilters

# Get recordings with filters
filters = RecordingFilters(
    camera_id="camera-id",
    start_date="2023-01-01",
    end_date="2023-01-31",
    limit=50,
)
recordings = await client.get_recordings(filters)

# Get specific recording
recording = await client.get_recording("recording-id")

# Get download URL for recording
download_url = await client.get_recording_download_url("recording-id")

# Delete recording
await client.delete_recording("recording-id")
```

#### Streaming

```python
# Get HLS stream URL
stream_url = await client.get_stream_url("camera-id", quality="720p")

# WebRTC streaming
offer = await client.get_webrtc_offer("camera-id")
# ... handle WebRTC negotiation
await client.send_webrtc_answer("camera-id", answer)
```

#### Dashboard & Analytics

```python
# Get dashboard statistics
stats = await client.get_dashboard_stats()

# Get system health
health = await client.get_system_health()

# Get analytics overview
analytics = await client.get_analytics_overview("24h")
```

#### API Token Management

```python
from camera_streaming.models import CreateApiTokenRequest

# Get all API tokens
tokens = await client.get_api_tokens()

# Create new API token
token_data = CreateApiTokenRequest(
    name="My API Token",
    permissions=["camera:read", "stream:view"],
    expires_in="30d",
    rate_limit=1000,
)
result = await client.create_api_token(token_data)
token = result["token"]
api_key = result["api_key"]

# Delete API token
await client.delete_api_token("token-id")
```

### WebSocketClient

#### Constructor

```python
WebSocketClient(
    url: str,
    token: str,
    reconnect: bool = True,
    reconnect_interval: float = 5.0,
    max_reconnect_attempts: int = 10,
)
```

**Parameters:**
- `url`: WebSocket URL
- `token`: JWT token for authentication
- `reconnect`: Auto-reconnect on disconnect (default: True)
- `reconnect_interval`: Reconnect interval in seconds (default: 5.0)
- `max_reconnect_attempts`: Max reconnect attempts (default: 10)

#### Connection Methods

```python
# Connect to WebSocket
await ws_client.connect()

# Disconnect
await ws_client.disconnect()

# Check connection status
is_connected = ws_client.is_connected()
```

#### Subscription Methods

```python
# Subscribe to all camera updates
await ws_client.subscribe_to_camera_updates()

# Subscribe to specific camera
await ws_client.subscribe_to_camera("camera-id")

# Subscribe to dashboard updates
await ws_client.subscribe_to_dashboard()

# Subscribe to alerts
await ws_client.subscribe_to_alerts()

# Unsubscribe from specific camera
await ws_client.unsubscribe_from_camera("camera-id")

# Unsubscribe from all
await ws_client.unsubscribe_from_all()
```

#### Event Listeners

```python
# Connection events
ws_client.on("connected", lambda: print("Connected"))
ws_client.on("disconnected", lambda data: print(f"Disconnected: {data}"))
ws_client.on("reconnecting", lambda attempt: print(f"Reconnecting... ({attempt})"))

# Data events
def on_camera_update(update):
    print(f"Camera {update.camera_id}: {update.status}")

ws_client.on("cameraStatusUpdate", on_camera_update)

def on_dashboard_update(update):
    print(f"Dashboard updated: {update.stats}")

ws_client.on("dashboardUpdate", on_dashboard_update)

def on_alert(alert):
    print(f"Alert: {alert.message}")

ws_client.on("alert", on_alert)

def on_stream_quality(data):
    print(f"Stream quality: {data}")

ws_client.on("streamQualityUpdate", on_stream_quality)

def on_recording_event(event):
    print(f"Recording event: {event}")

ws_client.on("recordingEvent", on_recording_event)

# Error handling
def on_error(error):
    print(f"WebSocket error: {error['message']}")

ws_client.on("error", on_error)
```

## Error Handling

The SDK provides specific exception types for different scenarios:

```python
from camera_streaming.exceptions import (
    CameraStreamingError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ValidationError,
    RateLimitError,
    NetworkError,
)

try:
    camera = await client.get_camera("invalid-id")
except NotFoundError:
    print("Camera not found")
except AuthenticationError:
    print("Please login first")
except RateLimitError:
    print("Rate limit exceeded, please wait")
except CameraStreamingError as e:
    print(f"API error: {e.message}")
```

## Type Hints

The SDK is fully typed and provides comprehensive type hints:

```python
from camera_streaming.models import Camera, StreamStatus, UserRole

camera: Camera = await client.get_camera("camera-id")

if camera.stream_status == StreamStatus.ONLINE:
    print("Camera is online")
```

## Examples

### Complete Camera Management Example

```python
import asyncio
from camera_streaming import CameraStreamingClient, WebSocketClient
from camera_streaming.models import CreateCameraRequest

async def manage_cameras():
    async with CameraStreamingClient("https://api.camera-streaming.example.com") as client:
        # Login
        user = await client.login("admin", "password")
        print(f"Logged in as: {user.username}")

        # Create WebSocket client for real-time updates
        token = client._access_token
        async with WebSocketClient("wss://api.camera-streaming.example.com/ws", token) as ws_client:
            await ws_client.subscribe_to_camera_updates()

            # Listen for camera status changes
            def on_camera_update(update):
                print(f"Camera {update.camera_id} is now {update.status}")

            ws_client.on("cameraStatusUpdate", on_camera_update)

            # Get all cameras
            cameras = await client.get_cameras()
            print(f"Found {len(cameras)} cameras")

            # Create a new camera
            camera_data = CreateCameraRequest(
                name="Parking Lot Camera",
                company="Dahua",
                model="IPC-HFW4431R-Z",
                serial_number="DH987654321",
                location="Parking Lot",
                place="Pole mounted, overlooking entrance",
                is_recording=True,
            )

            new_camera = await client.create_camera(camera_data)
            print(f"Created camera: {new_camera.name} ({new_camera.id})")

            # Start recording if not already
            if not new_camera.is_recording:
                is_recording = await client.toggle_recording(new_camera.id)
                print(f"Recording started: {is_recording}")

            # Get stream URL
            stream_url = await client.get_stream_url(new_camera.id, "720p")
            print(f"Stream URL: {stream_url}")

            # Keep connection alive for 1 minute
            await asyncio.sleep(60)

asyncio.run(manage_cameras())
```

### Recording Playback Example

```python
import asyncio
from datetime import datetime, timedelta
from camera_streaming import CameraStreamingClient
from camera_streaming.models import RecordingFilters

async def playback_recordings():
    async with CameraStreamingClient(
        "https://api.camera-streaming.example.com",
        api_key="your-api-key"
    ) as client:
        # Get recordings from last 24 hours
        yesterday = datetime.now() - timedelta(days=1)
        
        filters = RecordingFilters(
            start_date=yesterday.isoformat(),
            end_date=datetime.now().isoformat(),
            limit=10,
        )
        
        recordings = await client.get_recordings(filters)
        print(f"Found {len(recordings)} recordings")

        for recording in recordings:
            print(f"Recording: {recording.filename}")
            print(f"Duration: {recording.duration} seconds")
            print(f"Size: {recording.file_size / 1024 / 1024:.2f} MB")
            
            # Get download URL
            download_url = await client.get_recording_download_url(recording.id)
            print(f"Download: {download_url}")
            print("---")

asyncio.run(playback_recordings())
```

### Batch Camera Operations

```python
import asyncio
from camera_streaming import CameraStreamingClient
from camera_streaming.models import CreateCameraRequest, CameraFilters

async def batch_operations():
    async with CameraStreamingClient("https://api.camera-streaming.example.com") as client:
        await client.login("admin", "password")

        # Create multiple cameras
        camera_configs = [
            {
                "name": f"Camera {i}",
                "company": "Hikvision",
                "model": "DS-2CD2043G0-I",
                "serial_number": f"HK{i:010d}",
                "location": f"Location {i}",
                "place": f"Position {i}",
                "is_recording": True,
            }
            for i in range(1, 6)
        ]

        # Create cameras concurrently
        tasks = [
            client.create_camera(CreateCameraRequest(**config))
            for config in camera_configs
        ]
        
        cameras = await asyncio.gather(*tasks)
        print(f"Created {len(cameras)} cameras")

        # Get all Hikvision cameras
        filters = CameraFilters(company="Hikvision")
        hikvision_cameras = await client.get_cameras(filters)
        print(f"Found {len(hikvision_cameras)} Hikvision cameras")

        # Activate all cameras concurrently
        activation_tasks = [
            client.activate_camera(camera.id)
            for camera in cameras
        ]
        
        await asyncio.gather(*activation_tasks)
        print("All cameras activated")

asyncio.run(batch_operations())
```

## Development

### Setting up Development Environment

```bash
# Clone the repository
git clone https://github.com/camera-streaming/python-sdk.git
cd python-sdk

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install development dependencies
pip install -e .[dev,websocket]

# Install pre-commit hooks
pre-commit install
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=camera_streaming --cov-report=html

# Run specific test file
pytest tests/test_client.py

# Run with verbose output
pytest -v
```

### Code Formatting

```bash
# Format code with black
black src/ tests/

# Sort imports with isort
isort src/ tests/

# Lint with flake8
flake8 src/ tests/

# Type checking with mypy
mypy src/
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Ensure all tests pass and code is formatted
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Documentation: https://docs.camera-streaming.example.com/python-sdk
- API Reference: https://api.camera-streaming.example.com/docs
- Issues: https://github.com/camera-streaming/python-sdk/issues
- Email: support@camera-streaming.example.com

## Changelog

### v1.0.0

- Initial release
- Full API coverage for Camera Streaming Platform
- WebSocket support for real-time updates
- Comprehensive error handling
- Type hints and documentation
- Async/await support
- Automatic reconnection for WebSocket
- Retry logic for HTTP requests