# Camera Streaming Platform - PHP SDK

Official PHP SDK for the Camera Streaming Platform API.

## Requirements

- PHP 8.0 or higher
- ext-json
- ext-curl
- Composer

## Installation

```bash
composer require camera-streaming/sdk
```

## Quick Start

### Basic Usage

```php
<?php

require_once 'vendor/autoload.php';

use CameraStreaming\Client;

$client = new Client('https://api.camera-streaming.example.com');

// Login with username/password
$user = $client->login('your-username', 'your-password');
echo "Logged in as: {$user->username}\n";

// Get all cameras
$cameras = $client->getCameras();
echo "Total cameras: " . count($cameras) . "\n";

// Create a new camera
$newCamera = $client->createCamera([
    'name' => 'Front Door Camera',
    'company' => 'Hikvision',
    'model' => 'DS-2CD2043G0-I',
    'serialNumber' => 'HK001234567890',
    'location' => 'Building A - Main Entrance',
    'place' => 'Mounted on wall, facing parking lot',
    'isRecording' => true,
]);

echo "Created camera: {$newCamera->name}\n";
```

### Using API Keys

```php
<?php

require_once 'vendor/autoload.php';

use CameraStreaming\Client;

$client = new Client(
    'https://api.camera-streaming.example.com',
    'your-api-key-here'
);

// No need to login when using API keys
$cameras = $client->getCameras();
echo "Found " . count($cameras) . " cameras\n";
```

## API Reference

### Client

#### Constructor

```php
new Client(
    string $baseUrl,
    ?string $apiKey = null,
    array $options = []
)
```

**Parameters:**
- `$baseUrl`: Base URL of the API
- `$apiKey`: API key for authentication (optional)
- `$options`: Additional options
  - `timeout`: Request timeout in seconds (default: 30.0)
  - `retries`: Number of retry attempts (default: 3)
  - `retry_delay`: Delay between retries in seconds (default: 1.0)
  - `logger`: PSR-3 logger instance

#### Authentication Methods

```php
// Login with username/password
$user = $client->login('username', 'password');

// Logout
$client->logout();

// Get current user profile
$user = $client->getProfile();

// Check if authenticated
$isAuth = $client->isAuthenticated();
```

#### Camera Management

```php
// Get all cameras with optional filters
$cameras = $client->getCameras([
    'search' => 'front door',
    'company' => 'Hikvision',
    'isActive' => true,
    'limit' => 10,
    'offset' => 0,
]);

// Get specific camera
$camera = $client->getCamera('camera-id');

// Create new camera
$newCamera = $client->createCamera([
    'name' => 'Camera Name',
    'company' => 'Company',
    'model' => 'Model',
    'serialNumber' => 'Serial123',
    'location' => 'Location',
    'place' => 'Placement details',
    'isRecording' => true,
]);

// Update camera
$updatedCamera = $client->updateCamera('camera-id', [
    'name' => 'New Name',
    'location' => 'New Location',
]);

// Delete camera
$client->deleteCamera('camera-id');

// Activate/deactivate camera
$client->activateCamera('camera-id');
$client->deactivateCamera('camera-id');

// Toggle recording
$isRecording = $client->toggleRecording('camera-id');
echo "Recording: " . ($isRecording ? 'ON' : 'OFF') . "\n";
```

#### Recording Management

```php
// Get recordings with filters
$recordings = $client->getRecordings([
    'cameraId' => 'camera-id',
    'startDate' => '2023-01-01',
    'endDate' => '2023-01-31',
    'limit' => 50,
]);

// Get specific recording
$recording = $client->getRecording('recording-id');

// Get download URL for recording
$downloadUrl = $client->getRecordingDownloadUrl('recording-id');

// Delete recording
$client->deleteRecording('recording-id');
```

#### Streaming

```php
// Get HLS stream URL
$streamUrl = $client->getStreamUrl('camera-id', '720p');

// WebRTC streaming
$offer = $client->getWebRtcOffer('camera-id');
// ... handle WebRTC negotiation
$client->sendWebRtcAnswer('camera-id', $answer);
```

#### Dashboard & Analytics

```php
// Get dashboard statistics
$stats = $client->getDashboardStats();

// Get system health
$health = $client->getSystemHealth();

// Get analytics overview
$analytics = $client->getAnalyticsOverview('24h');
```

#### API Token Management

```php
// Get all API tokens
$tokens = $client->getApiTokens();

// Create new API token
$result = $client->createApiToken([
    'name' => 'My API Token',
    'permissions' => ['camera:read', 'stream:view'],
    'expiresIn' => '30d',
    'rateLimit' => 1000,
]);

$token = $result['token'];
$apiKey = $result['apiKey'];

// Delete API token
$client->deleteApiToken('token-id');
```

## Error Handling

The SDK provides specific exception types for different scenarios:

```php
use CameraStreaming\Exceptions\{
    CameraStreamingException,
    AuthenticationException,
    AuthorizationException,
    NotFoundException,
    ValidationException,
    RateLimitException,
    NetworkException
};

try {
    $camera = $client->getCamera('invalid-id');
} catch (NotFoundException $e) {
    echo "Camera not found\n";
} catch (AuthenticationException $e) {
    echo "Please login first\n";
} catch (RateLimitException $e) {
    echo "Rate limit exceeded, please wait\n";
} catch (CameraStreamingException $e) {
    echo "API error: {$e->getMessage()}\n";
}
```

## Models

The SDK provides typed models for all API responses:

```php
use CameraStreaming\Models\{Camera, Recording, User, ApiToken};

$camera = $client->getCamera('camera-id');
echo "Camera: {$camera->name}\n";
echo "Status: {$camera->streamStatus}\n";
echo "Recording: " . ($camera->isRecording ? 'YES' : 'NO') . "\n";
```

## Examples

### Complete Camera Management Example

```php
<?php

require_once 'vendor/autoload.php';

use CameraStreaming\Client;
use CameraStreaming\Exceptions\CameraStreamingException;

function manageCameras(): void
{
    $client = new Client('https://api.camera-streaming.example.com');

    try {
        // Login
        $user = $client->login('admin', 'password');
        echo "Logged in as: {$user->username}\n";

        // Get all cameras
        $cameras = $client->getCameras();
        echo "Found " . count($cameras) . " cameras\n";

        // Create a new camera
        $newCamera = $client->createCamera([
            'name' => 'Parking Lot Camera',
            'company' => 'Dahua',
            'model' => 'IPC-HFW4431R-Z',
            'serialNumber' => 'DH987654321',
            'location' => 'Parking Lot',
            'place' => 'Pole mounted, overlooking entrance',
            'isRecording' => true,
        ]);

        echo "Created camera: {$newCamera->name} ({$newCamera->id})\n";

        // Start recording if not already
        if (!$newCamera->isRecording) {
            $isRecording = $client->toggleRecording($newCamera->id);
            echo "Recording started: " . ($isRecording ? 'YES' : 'NO') . "\n";
        }

        // Get stream URL
        $streamUrl = $client->getStreamUrl($newCamera->id, '720p');
        echo "Stream URL: {$streamUrl}\n";

    } catch (CameraStreamingException $e) {
        echo "Error: {$e->getMessage()}\n";
    }
}

manageCameras();
```

### Recording Playback Example

```php
<?php

require_once 'vendor/autoload.php';

use CameraStreaming\Client;
use CameraStreaming\Exceptions\CameraStreamingException;

function playbackRecordings(): void
{
    $client = new Client(
        'https://api.camera-streaming.example.com',
        'your-api-key'
    );

    try {
        // Get recordings from last 24 hours
        $yesterday = (new DateTime())->sub(new DateInterval('P1D'));
        
        $recordings = $client->getRecordings([
            'startDate' => $yesterday->format('c'),
            'endDate' => (new DateTime())->format('c'),
            'limit' => 10,
        ]);

        echo "Found " . count($recordings) . " recordings\n";

        foreach ($recordings as $recording) {
            echo "Recording: {$recording->filename}\n";
            echo "Duration: {$recording->duration} seconds\n";
            echo "Size: " . round($recording->fileSize / 1024 / 1024, 2) . " MB\n";
            
            // Get download URL
            $downloadUrl = $client->getRecordingDownloadUrl($recording->id);
            echo "Download: {$downloadUrl}\n";
            echo "---\n";
        }

    } catch (CameraStreamingException $e) {
        echo "Error: {$e->getMessage()}\n";
    }
}

playbackRecordings();
```

### Batch Camera Operations

```php
<?php

require_once 'vendor/autoload.php';

use CameraStreaming\Client;
use CameraStreaming\Exceptions\CameraStreamingException;

function batchOperations(): void
{
    $client = new Client('https://api.camera-streaming.example.com');

    try {
        $client->login('admin', 'password');

        // Create multiple cameras
        $cameraConfigs = [
            [
                'name' => 'Camera 1',
                'company' => 'Hikvision',
                'model' => 'DS-2CD2043G0-I',
                'serialNumber' => 'HK0000000001',
                'location' => 'Location 1',
                'place' => 'Position 1',
                'isRecording' => true,
            ],
            [
                'name' => 'Camera 2',
                'company' => 'Hikvision',
                'model' => 'DS-2CD2043G0-I',
                'serialNumber' => 'HK0000000002',
                'location' => 'Location 2',
                'place' => 'Position 2',
                'isRecording' => true,
            ],
            // Add more cameras...
        ];

        $cameras = [];
        foreach ($cameraConfigs as $config) {
            $camera = $client->createCamera($config);
            $cameras[] = $camera;
            echo "Created camera: {$camera->name}\n";
        }

        // Get all Hikvision cameras
        $hikvisionCameras = $client->getCameras(['company' => 'Hikvision']);
        echo "Found " . count($hikvisionCameras) . " Hikvision cameras\n";

        // Activate all cameras
        foreach ($cameras as $camera) {
            $client->activateCamera($camera->id);
            echo "Activated camera: {$camera->name}\n";
        }

        echo "All cameras activated\n";

    } catch (CameraStreamingException $e) {
        echo "Error: {$e->getMessage()}\n";
    }
}

batchOperations();
```

### Dashboard Monitoring

```php
<?php

require_once 'vendor/autoload.php';

use CameraStreaming\Client;
use CameraStreaming\Exceptions\CameraStreamingException;

function monitorDashboard(): void
{
    $client = new Client(
        'https://api.camera-streaming.example.com',
        'your-api-key'
    );

    try {
        // Get dashboard statistics
        $stats = $client->getDashboardStats();
        
        echo "=== Dashboard Statistics ===\n";
        echo "Total Cameras: {$stats->totalCameras}\n";
        echo "Online Cameras: {$stats->onlineCameras}\n";
        echo "Offline Cameras: {$stats->offlineCameras}\n";
        echo "Recording Cameras: {$stats->recordingCameras}\n";
        echo "Total Recordings: {$stats->totalRecordings}\n";
        echo "Total Storage: " . round($stats->totalStorage / 1024 / 1024 / 1024, 2) . " GB\n";
        echo "Active Streams: {$stats->activeStreams}\n";
        echo "System Health: {$stats->systemHealth}\n\n";

        // Get system health
        $health = $client->getSystemHealth();
        
        echo "=== System Health ===\n";
        echo "Status: {$health->status}\n";
        echo "Uptime: " . round($health->uptime / 3600, 2) . " hours\n";
        echo "Version: {$health->version}\n";
        
        echo "Services:\n";
        foreach ($health->services as $service => $status) {
            echo "  {$service}: {$status['status']} ({$status['responseTime']}ms)\n";
        }
        echo "\n";

        // Get analytics overview
        $analytics = $client->getAnalyticsOverview('24h');
        
        echo "=== Analytics (24h) ===\n";
        echo "Total Requests: {$analytics->metrics['totalRequests']}\n";
        echo "Avg Response Time: {$analytics->metrics['averageResponseTime']}ms\n";
        echo "Error Rate: " . round($analytics->metrics['errorRate'] * 100, 2) . "%\n";
        echo "Camera Uptime: " . round($analytics->metrics['cameraUptime'] * 100, 2) . "%\n";
        echo "Stream Quality: " . round($analytics->metrics['streamQuality'] * 100, 2) . "%\n";

    } catch (CameraStreamingException $e) {
        echo "Error: {$e->getMessage()}\n";
    }
}

monitorDashboard();
```

## Development

### Setting up Development Environment

```bash
# Clone the repository
git clone https://github.com/camera-streaming/php-sdk.git
cd php-sdk

# Install dependencies
composer install

# Install development dependencies
composer install --dev
```

### Running Tests

```bash
# Run all tests
composer test

# Run tests with coverage
composer test-coverage

# Run PHPStan analysis
composer phpstan

# Check code style
composer cs-check

# Fix code style
composer cs-fix

# Run all quality checks
composer quality
```

### Code Standards

This project follows PSR-12 coding standards and uses:

- **PHPUnit** for testing
- **PHPStan** for static analysis
- **PHP CS Fixer** for code formatting
- **PHP_CodeSniffer** for code style checking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Ensure all tests pass and code follows standards
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Documentation: https://docs.camera-streaming.example.com/php-sdk
- API Reference: https://api.camera-streaming.example.com/docs
- Issues: https://github.com/camera-streaming/php-sdk/issues
- Email: support@camera-streaming.example.com

## Changelog

### v1.0.0

- Initial release
- Full API coverage for Camera Streaming Platform
- Comprehensive error handling
- Type-safe models
- PSR-12 compliant code
- Retry logic for HTTP requests
- Extensive documentation and examples