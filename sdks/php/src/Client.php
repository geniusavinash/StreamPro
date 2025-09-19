<?php

declare(strict_types=1);

namespace CameraStreaming;

use CameraStreaming\Exceptions\AuthenticationException;
use CameraStreaming\Exceptions\AuthorizationException;
use CameraStreaming\Exceptions\CameraStreamingException;
use CameraStreaming\Exceptions\NetworkException;
use CameraStreaming\Exceptions\NotFoundException;
use CameraStreaming\Exceptions\RateLimitException;
use CameraStreaming\Exceptions\ValidationException;
use CameraStreaming\Models\AnalyticsOverview;
use CameraStreaming\Models\ApiToken;
use CameraStreaming\Models\Camera;
use CameraStreaming\Models\DashboardStats;
use CameraStreaming\Models\Recording;
use CameraStreaming\Models\SystemHealth;
use CameraStreaming\Models\User;
use GuzzleHttp\Client as HttpClient;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\Exception\ServerException;
use Psr\Http\Message\ResponseInterface;
use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;

/**
 * Main client for interacting with the Camera Streaming Platform API.
 *
 * @example
 * ```php
 * $client = new Client('https://api.camera-streaming.example.com');
 * $user = $client->login('username', 'password');
 * $cameras = $client->getCameras();
 * ```
 */
class Client
{
    private HttpClient $httpClient;
    private string $baseUrl;
    private ?string $apiKey;
    private ?string $accessToken = null;
    private ?string $refreshToken = null;
    private LoggerInterface $logger;
    private int $retries;
    private float $retryDelay;

    /**
     * Initialize the Camera Streaming client.
     *
     * @param string $baseUrl Base URL of the API
     * @param string|null $apiKey API key for authentication (optional)
     * @param array $options Additional options
     */
    public function __construct(
        string $baseUrl,
        ?string $apiKey = null,
        array $options = []
    ) {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->apiKey = $apiKey;
        $this->logger = $options['logger'] ?? new NullLogger();
        $this->retries = $options['retries'] ?? 3;
        $this->retryDelay = $options['retry_delay'] ?? 1.0;

        $this->httpClient = new HttpClient([
            'base_uri' => $this->baseUrl,
            'timeout' => $options['timeout'] ?? 30.0,
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'User-Agent' => 'CameraStreaming-PHP-SDK/1.0.0',
            ],
        ]);
    }

    /**
     * Get headers for API requests.
     */
    private function getHeaders(): array
    {
        $headers = [];

        if ($this->accessToken) {
            $headers['Authorization'] = 'Bearer ' . $this->accessToken;
        } elseif ($this->apiKey) {
            $headers['X-API-Key'] = $this->apiKey;
        }

        return $headers;
    }

    /**
     * Make an HTTP request with retry logic.
     *
     * @throws CameraStreamingException
     */
    private function makeRequest(
        string $method,
        string $endpoint,
        array $data = null,
        array $params = null
    ): ResponseInterface {
        $url = $endpoint;
        $options = [
            'headers' => $this->getHeaders(),
        ];

        if ($data !== null) {
            $options['json'] = $data;
        }

        if ($params !== null) {
            $options['query'] = $params;
        }

        $lastException = null;

        for ($attempt = 0; $attempt <= $this->retries; $attempt++) {
            try {
                $response = $this->httpClient->request($method, $url, $options);

                // Handle authentication errors with token refresh
                if ($response->getStatusCode() === 401 && $this->refreshToken) {
                    try {
                        $this->refreshAccessToken();
                        $options['headers'] = $this->getHeaders();
                        $response = $this->httpClient->request($method, $url, $options);
                    } catch (\Exception $e) {
                        throw new AuthenticationException('Session expired. Please login again.');
                    }
                }

                return $response;
            } catch (ClientException $e) {
                $this->handleClientException($e);
            } catch (ServerException $e) {
                $statusCode = $e->getResponse()->getStatusCode();
                $message = $this->getErrorMessage($e->getResponse());
                throw new CameraStreamingException($message, $statusCode);
            } catch (ConnectException $e) {
                $lastException = new NetworkException('Network error: ' . $e->getMessage());
                
                if ($attempt === $this->retries) {
                    throw $lastException;
                }

                // Wait before retry
                usleep((int)($this->retryDelay * 1000000 * (2 ** $attempt)));
            } catch (RequestException $e) {
                $lastException = new NetworkException('Request error: ' . $e->getMessage());
                
                if ($attempt === $this->retries) {
                    throw $lastException;
                }

                usleep((int)($this->retryDelay * 1000000 * (2 ** $attempt)));
            }
        }

        throw $lastException ?? new NetworkException('Max retries exceeded');
    }

    /**
     * Handle client exceptions (4xx status codes).
     */
    private function handleClientException(ClientException $e): void
    {
        $statusCode = $e->getResponse()->getStatusCode();
        $message = $this->getErrorMessage($e->getResponse());

        switch ($statusCode) {
            case 400:
                throw new ValidationException($message);
            case 401:
                throw new AuthenticationException($message);
            case 403:
                throw new AuthorizationException($message);
            case 404:
                throw new NotFoundException($message);
            case 429:
                throw new RateLimitException($message);
            default:
                throw new CameraStreamingException($message, $statusCode);
        }
    }

    /**
     * Extract error message from response.
     */
    private function getErrorMessage(ResponseInterface $response): string
    {
        try {
            $body = json_decode($response->getBody()->getContents(), true);
            return $body['message'] ?? $body['error'] ?? 'Unknown error';
        } catch (\Exception $e) {
            return 'HTTP ' . $response->getStatusCode();
        }
    }

    /**
     * Refresh the access token using the refresh token.
     */
    private function refreshAccessToken(): void
    {
        if (!$this->refreshToken) {
            throw new AuthenticationException('No refresh token available');
        }

        $response = $this->httpClient->post('/auth/refresh', [
            'json' => ['refreshToken' => $this->refreshToken],
        ]);

        if ($response->getStatusCode() === 200) {
            $data = json_decode($response->getBody()->getContents(), true);
            if ($data['success'] && isset($data['data']['accessToken'])) {
                $this->accessToken = $data['data']['accessToken'];
            } else {
                throw new AuthenticationException('Failed to refresh token');
            }
        } else {
            throw new AuthenticationException('Failed to refresh token');
        }
    }

    // Authentication methods

    /**
     * Login with username and password.
     *
     * @throws AuthenticationException
     */
    public function login(string $username, string $password): User
    {
        $response = $this->makeRequest('POST', '/auth/login', [
            'username' => $username,
            'password' => $password,
        ]);

        $data = json_decode($response->getBody()->getContents(), true);

        if ($data['success'] && isset($data['data'])) {
            $this->accessToken = $data['data']['accessToken'];
            $this->refreshToken = $data['data']['refreshToken'];
            return User::fromArray($data['data']['user']);
        }

        throw new AuthenticationException($data['error'] ?? 'Login failed');
    }

    /**
     * Logout and invalidate tokens.
     */
    public function logout(): void
    {
        if ($this->refreshToken) {
            try {
                $this->makeRequest('POST', '/auth/logout', [
                    'refreshToken' => $this->refreshToken,
                ]);
            } catch (\Exception $e) {
                // Ignore errors during logout
            }
        }

        $this->accessToken = null;
        $this->refreshToken = null;
    }

    /**
     * Get current user profile.
     *
     * @throws AuthenticationException
     */
    public function getProfile(): User
    {
        $response = $this->makeRequest('GET', '/auth/profile');
        $data = json_decode($response->getBody()->getContents(), true);

        if ($data['success'] && isset($data['data']['user'])) {
            return User::fromArray($data['data']['user']);
        }

        throw new CameraStreamingException($data['error'] ?? 'Failed to get profile');
    }

    /**
     * Check if the client is authenticated.
     */
    public function isAuthenticated(): bool
    {
        return $this->accessToken !== null || $this->apiKey !== null;
    }

    // Camera management methods

    /**
     * Get list of cameras with optional filters.
     *
     * @return Camera[]
     */
    public function getCameras(array $filters = []): array
    {
        $response = $this->makeRequest('GET', '/cameras', null, $filters);
        $data = json_decode($response->getBody()->getContents(), true);

        if ($data['success'] && isset($data['data']['items'])) {
            return array_map([Camera::class, 'fromArray'], $data['data']['items']);
        }

        throw new CameraStreamingException($data['error'] ?? 'Failed to get cameras');
    }

    /**
     * Get a specific camera by ID.
     *
     * @throws NotFoundException
     */
    public function getCamera(string $cameraId): Camera
    {
        $response = $this->makeRequest('GET', "/cameras/{$cameraId}");
        $data = json_decode($response->getBody()->getContents(), true);

        if ($data['success'] && isset($data['data']['camera'])) {
            return Camera::fromArray($data['data']['camera']);
        }

        throw new NotFoundException("Camera with ID {$cameraId} not found");
    }

    /**
     * Create a new camera.
     */
    public function createCamera(array $cameraData): Camera
    {
        $response = $this->makeRequest('POST', '/cameras', $cameraData);
        $data = json_decode($response->getBody()->getContents(), true);

        if ($data['success'] && isset($data['data']['camera'])) {
            return Camera::fromArray($data['data']['camera']);
        }

        throw new CameraStreamingException($data['error'] ?? 'Failed to create camera');
    }

    /**
     * Update an existing camera.
     */
    public function updateCamera(string $cameraId, array $updates): Camera
    {
        $response = $this->makeRequest('PUT', "/cameras/{$cameraId}", $updates);
        $data = json_decode($response->getBody()->getContents(), true);

        if ($data['success'] && isset($data['data']['camera'])) {
            return Camera::fromArray($data['data']['camera']);
        }

        throw new CameraStreamingException($data['error'] ?? 'Failed to update camera');
    }

    /**
     * Delete a camera.
     */
    public function deleteCamera(string $cameraId): void
    {
        $response = $this->makeRequest('DELETE', "/cameras/{$cameraId}");
        $data = json_decode($response->getBody()->getContents(), true);

        if (!$data['success']) {
            throw new CameraStreamingException($data['error'] ?? 'Failed to delete camera');
        }
    }

    /**
     * Activate a camera.
     */
    public function activateCamera(string $cameraId): void
    {
        $response = $this->makeRequest('POST', "/cameras/{$cameraId}/activate");
        $data = json_decode($response->getBody()->getContents(), true);

        if (!$data['success']) {
            throw new CameraStreamingException($data['error'] ?? 'Failed to activate camera');
        }
    }

    /**
     * Deactivate a camera.
     */
    public function deactivateCamera(string $cameraId): void
    {
        $response = $this->makeRequest('POST', "/cameras/{$cameraId}/deactivate");
        $data = json_decode($response->getBody()->getContents(), true);

        if (!$data['success']) {
            throw new CameraStreamingException($data['error'] ?? 'Failed to deactivate camera');
        }
    }

    /**
     * Toggle recording for a camera.
     */
    public function toggleRecording(string $cameraId): bool
    {
        $response = $this->makeRequest('POST', "/cameras/{$cameraId}/toggle-recording");
        $data = json_decode($response->getBody()->getContents(), true);

        if ($data['success'] && isset($data['data']['isRecording'])) {
            return $data['data']['isRecording'];
        }

        throw new CameraStreamingException($data['error'] ?? 'Failed to toggle recording');
    }

    // Recording management methods

    /**
     * Get list of recordings with optional filters.
     *
     * @return Recording[]
     */
    public function getRecordings(array $filters = []): array
    {
        $response = $this->makeRequest('GET', '/recordings', null, $filters);
        $data = json_decode($response->getBody()->getContents(), true);

        if ($data['success'] && isset($data['data']['items'])) {
            return array_map([Recording::class, 'fromArray'], $data['data']['items']);
        }

        throw new CameraStreamingException($data['error'] ?? 'Failed to get recordings');
    }

    /**
     * Get a specific recording by ID.
     */
    public function getRecording(string $recordingId): Recording
    {
        $response = $this->makeRequest('GET', "/recordings/{$recordingId}");
        $data = json_decode($response->getBody()->getContents(), true);

        if ($data['success'] && isset($data['data']['recording'])) {
            return Recording::fromArray($data['data']['recording']);
        }

        throw new NotFoundException("Recording with ID {$recordingId} not found");
    }

    /**
     * Get download URL for a recording.
     */
    public function getRecordingDownloadUrl(string $recordingId): string
    {
        $response = $this->makeRequest('GET', "/recordings/{$recordingId}/download");
        $data = json_decode($response->getBody()->getContents(), true);

        if ($data['success'] && isset($data['data']['downloadUrl'])) {
            return $data['data']['downloadUrl'];
        }

        throw new CameraStreamingException($data['error'] ?? 'Failed to get download URL');
    }

    /**
     * Delete a recording.
     */
    public function deleteRecording(string $recordingId): void
    {
        $response = $this->makeRequest('DELETE', "/recordings/{$recordingId}");
        $data = json_decode($response->getBody()->getContents(), true);

        if (!$data['success']) {
            throw new CameraStreamingException($data['error'] ?? 'Failed to delete recording');
        }
    }

    // API Token management methods

    /**
     * Get list of API tokens.
     *
     * @return ApiToken[]
     */
    public function getApiTokens(): array
    {
        $response = $this->makeRequest('GET', '/auth/api-tokens');
        $data = json_decode($response->getBody()->getContents(), true);

        if ($data['success'] && isset($data['data']['tokens'])) {
            return array_map([ApiToken::class, 'fromArray'], $data['data']['tokens']);
        }

        throw new CameraStreamingException($data['error'] ?? 'Failed to get API tokens');
    }

    /**
     * Create a new API token.
     */
    public function createApiToken(array $tokenData): array
    {
        $response = $this->makeRequest('POST', '/auth/api-tokens', $tokenData);
        $data = json_decode($response->getBody()->getContents(), true);

        if ($data['success'] && isset($data['data'])) {
            return [
                'token' => ApiToken::fromArray($data['data']['token']),
                'apiKey' => $data['data']['apiKey'],
            ];
        }

        throw new CameraStreamingException($data['error'] ?? 'Failed to create API token');
    }

    /**
     * Delete an API token.
     */
    public function deleteApiToken(string $tokenId): void
    {
        $response = $this->makeRequest('DELETE', "/auth/api-tokens/{$tokenId}");
        $data = json_decode($response->getBody()->getContents(), true);

        if (!$data['success']) {
            throw new CameraStreamingException($data['error'] ?? 'Failed to delete API token');
        }
    }

    // Dashboard and analytics methods

    /**
     * Get dashboard statistics.
     */
    public function getDashboardStats(): DashboardStats
    {
        $response = $this->makeRequest('GET', '/dashboard/stats');
        $data = json_decode($response->getBody()->getContents(), true);

        if ($data['success'] && isset($data['data'])) {
            return DashboardStats::fromArray($data['data']);
        }

        throw new CameraStreamingException($data['error'] ?? 'Failed to get dashboard stats');
    }

    /**
     * Get system health information.
     */
    public function getSystemHealth(): SystemHealth
    {
        $response = $this->makeRequest('GET', '/dashboard/health');
        $data = json_decode($response->getBody()->getContents(), true);

        if ($data['success'] && isset($data['data'])) {
            return SystemHealth::fromArray($data['data']);
        }

        throw new CameraStreamingException($data['error'] ?? 'Failed to get system health');
    }

    /**
     * Get analytics overview.
     */
    public function getAnalyticsOverview(string $timeRange = '24h'): AnalyticsOverview
    {
        $response = $this->makeRequest('GET', "/analytics/overview?timeRange={$timeRange}");
        $data = json_decode($response->getBody()->getContents(), true);

        if ($data['success'] && isset($data['data'])) {
            return AnalyticsOverview::fromArray($data['data']);
        }

        throw new CameraStreamingException($data['error'] ?? 'Failed to get analytics overview');
    }

    // Streaming methods

    /**
     * Get HLS stream URL for a camera.
     */
    public function getStreamUrl(string $cameraId, ?string $quality = null): string
    {
        $params = $quality ? ['quality' => $quality] : [];
        $response = $this->makeRequest('GET', "/streaming/hls/{$cameraId}", null, $params);
        $data = json_decode($response->getBody()->getContents(), true);

        if ($data['success'] && isset($data['data']['streamUrl'])) {
            return $data['data']['streamUrl'];
        }

        throw new CameraStreamingException($data['error'] ?? 'Failed to get stream URL');
    }

    /**
     * Get WebRTC offer for a camera.
     */
    public function getWebRtcOffer(string $cameraId): array
    {
        $response = $this->makeRequest('POST', "/streaming/webrtc/{$cameraId}/offer");
        $data = json_decode($response->getBody()->getContents(), true);

        if ($data['success'] && isset($data['data'])) {
            return $data['data'];
        }

        throw new CameraStreamingException($data['error'] ?? 'Failed to get WebRTC offer');
    }

    /**
     * Send WebRTC answer for a camera.
     */
    public function sendWebRtcAnswer(string $cameraId, array $answer): void
    {
        $response = $this->makeRequest('POST', "/streaming/webrtc/{$cameraId}/answer", $answer);
        $data = json_decode($response->getBody()->getContents(), true);

        if (!$data['success']) {
            throw new CameraStreamingException($data['error'] ?? 'Failed to send WebRTC answer');
        }
    }

    // Utility methods

    /**
     * Set the access token manually.
     */
    public function setAccessToken(string $token): void
    {
        $this->accessToken = $token;
    }

    /**
     * Set the API key manually.
     */
    public function setApiKey(string $apiKey): void
    {
        $this->apiKey = $apiKey;
    }

    /**
     * Get the current access token.
     */
    public function getAccessToken(): ?string
    {
        return $this->accessToken;
    }
}