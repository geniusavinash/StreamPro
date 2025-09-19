"""
Main client for the Camera Streaming Platform SDK.
"""

import time
from typing import Any, Dict, List, Optional, Union
from urllib.parse import urlencode

import httpx
from pydantic import ValidationError as PydanticValidationError

from .exceptions import (
    AuthenticationError,
    AuthorizationError,
    CameraStreamingError,
    NetworkError,
    NotFoundError,
    RateLimitError,
    ValidationError,
)
from .models import (
    AnalyticsOverview,
    ApiResponse,
    ApiToken,
    Camera,
    CameraFilters,
    CreateApiTokenRequest,
    CreateCameraRequest,
    DashboardStats,
    LoginRequest,
    LoginResponse,
    PaginatedResponse,
    Recording,
    RecordingFilters,
    SystemHealth,
    UpdateCameraRequest,
    User,
)


class CameraStreamingClient:
    """
    Main client for interacting with the Camera Streaming Platform API.
    
    Example:
        >>> client = CameraStreamingClient("https://api.camera-streaming.example.com")
        >>> await client.login("username", "password")
        >>> cameras = await client.get_cameras()
    """

    def __init__(
        self,
        base_url: str,
        api_key: Optional[str] = None,
        timeout: float = 30.0,
        retries: int = 3,
        retry_delay: float = 1.0,
    ):
        """
        Initialize the Camera Streaming client.
        
        Args:
            base_url: Base URL of the API
            api_key: API key for authentication (optional)
            timeout: Request timeout in seconds
            retries: Number of retry attempts
            retry_delay: Delay between retries in seconds
        """
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout
        self.retries = retries
        self.retry_delay = retry_delay
        
        self._access_token: Optional[str] = None
        self._refresh_token: Optional[str] = None
        
        # Create HTTP client
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout,
            headers={"Content-Type": "application/json"},
        )

    async def __aenter__(self):
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()

    async def close(self):
        """Close the HTTP client."""
        await self._client.aclose()

    def _get_headers(self) -> Dict[str, str]:
        """Get headers for API requests."""
        headers = {}
        
        if self._access_token:
            headers["Authorization"] = f"Bearer {self._access_token}"
        elif self.api_key:
            headers["X-API-Key"] = self.api_key
            
        return headers

    async def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> httpx.Response:
        """
        Make an HTTP request with retry logic.
        
        Args:
            method: HTTP method
            endpoint: API endpoint
            data: Request body data
            params: Query parameters
            
        Returns:
            HTTP response
            
        Raises:
            CameraStreamingError: On API errors
        """
        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers()
        
        for attempt in range(self.retries + 1):
            try:
                response = await self._client.request(
                    method=method,
                    url=url,
                    json=data,
                    params=params,
                    headers=headers,
                )
                
                # Handle authentication errors with token refresh
                if response.status_code == 401 and self._refresh_token:
                    try:
                        await self._refresh_access_token()
                        headers = self._get_headers()
                        response = await self._client.request(
                            method=method,
                            url=url,
                            json=data,
                            params=params,
                            headers=headers,
                        )
                    except Exception:
                        raise AuthenticationError("Session expired. Please login again.")
                
                # Handle different status codes
                if response.status_code == 400:
                    error_data = response.json() if response.content else {}
                    raise ValidationError(error_data.get("message", "Validation error"))
                elif response.status_code == 401:
                    error_data = response.json() if response.content else {}
                    raise AuthenticationError(error_data.get("message", "Authentication failed"))
                elif response.status_code == 403:
                    error_data = response.json() if response.content else {}
                    raise AuthorizationError(error_data.get("message", "Access denied"))
                elif response.status_code == 404:
                    error_data = response.json() if response.content else {}
                    raise NotFoundError(error_data.get("message", "Resource not found"))
                elif response.status_code == 429:
                    error_data = response.json() if response.content else {}
                    raise RateLimitError(error_data.get("message", "Rate limit exceeded"))
                elif response.status_code >= 400:
                    error_data = response.json() if response.content else {}
                    raise CameraStreamingError(
                        error_data.get("message", f"HTTP {response.status_code}"),
                        response.status_code
                    )
                
                return response
                
            except httpx.RequestError as e:
                if attempt == self.retries:
                    raise NetworkError(f"Network error: {str(e)}")
                
                # Wait before retry
                time.sleep(self.retry_delay * (2 ** attempt))
        
        raise NetworkError("Max retries exceeded")

    async def _refresh_access_token(self) -> None:
        """Refresh the access token using the refresh token."""
        if not self._refresh_token:
            raise AuthenticationError("No refresh token available")

        response = await self._client.post(
            f"{self.base_url}/auth/refresh",
            json={"refreshToken": self._refresh_token},
        )

        if response.status_code == 200:
            data = response.json()
            if data.get("success") and data.get("data"):
                self._access_token = data["data"]["accessToken"]
            else:
                raise AuthenticationError("Failed to refresh token")
        else:
            raise AuthenticationError("Failed to refresh token")

    # Authentication methods
    async def login(self, username: str, password: str) -> User:
        """
        Login with username and password.
        
        Args:
            username: Username
            password: Password
            
        Returns:
            User object
            
        Raises:
            AuthenticationError: On login failure
        """
        request = LoginRequest(username=username, password=password)
        response = await self._make_request("POST", "/auth/login", request.dict())
        
        login_response = LoginResponse(**response.json())
        
        if login_response.success and login_response.data:
            self._access_token = login_response.access_token
            self._refresh_token = login_response.refresh_token
            return login_response.user
        else:
            raise AuthenticationError(login_response.error or "Login failed")

    async def logout(self) -> None:
        """Logout and invalidate tokens."""
        if self._refresh_token:
            try:
                await self._make_request("POST", "/auth/logout", {"refreshToken": self._refresh_token})
            except Exception:
                pass  # Ignore errors during logout
        
        self._access_token = None
        self._refresh_token = None

    async def get_profile(self) -> User:
        """
        Get current user profile.
        
        Returns:
            User object
            
        Raises:
            AuthenticationError: If not authenticated
        """
        response = await self._make_request("GET", "/auth/profile")
        api_response = ApiResponse(**response.json())
        
        if api_response.success and api_response.data:
            return User(**api_response.data["user"])
        else:
            raise CameraStreamingError(api_response.error or "Failed to get profile")

    def is_authenticated(self) -> bool:
        """Check if the client is authenticated."""
        return bool(self._access_token or self.api_key)

    # Camera management methods
    async def get_cameras(self, filters: Optional[CameraFilters] = None) -> List[Camera]:
        """
        Get list of cameras with optional filters.
        
        Args:
            filters: Optional filters to apply
            
        Returns:
            List of Camera objects
        """
        params = {}
        if filters:
            params = {k: v for k, v in filters.dict().items() if v is not None}
        
        response = await self._make_request("GET", "/cameras", params=params)
        paginated_response = PaginatedResponse(**response.json())
        
        if paginated_response.success:
            return [Camera(**item) for item in paginated_response.items]
        else:
            raise CameraStreamingError(paginated_response.error or "Failed to get cameras")

    async def get_camera(self, camera_id: str) -> Camera:
        """
        Get a specific camera by ID.
        
        Args:
            camera_id: Camera ID
            
        Returns:
            Camera object
            
        Raises:
            NotFoundError: If camera not found
        """
        response = await self._make_request("GET", f"/cameras/{camera_id}")
        api_response = ApiResponse(**response.json())
        
        if api_response.success and api_response.data:
            return Camera(**api_response.data["camera"])
        else:
            raise NotFoundError(f"Camera with ID {camera_id} not found")

    async def create_camera(self, camera_data: CreateCameraRequest) -> Camera:
        """
        Create a new camera.
        
        Args:
            camera_data: Camera creation data
            
        Returns:
            Created Camera object
        """
        response = await self._make_request("POST", "/cameras", camera_data.dict())
        api_response = ApiResponse(**response.json())
        
        if api_response.success and api_response.data:
            return Camera(**api_response.data["camera"])
        else:
            raise CameraStreamingError(api_response.error or "Failed to create camera")

    async def update_camera(self, camera_id: str, updates: UpdateCameraRequest) -> Camera:
        """
        Update an existing camera.
        
        Args:
            camera_id: Camera ID
            updates: Camera update data
            
        Returns:
            Updated Camera object
        """
        response = await self._make_request("PUT", f"/cameras/{camera_id}", updates.dict(exclude_unset=True))
        api_response = ApiResponse(**response.json())
        
        if api_response.success and api_response.data:
            return Camera(**api_response.data["camera"])
        else:
            raise CameraStreamingError(api_response.error or "Failed to update camera")

    async def delete_camera(self, camera_id: str) -> None:
        """
        Delete a camera.
        
        Args:
            camera_id: Camera ID
        """
        response = await self._make_request("DELETE", f"/cameras/{camera_id}")
        api_response = ApiResponse(**response.json())
        
        if not api_response.success:
            raise CameraStreamingError(api_response.error or "Failed to delete camera")

    async def activate_camera(self, camera_id: str) -> None:
        """
        Activate a camera.
        
        Args:
            camera_id: Camera ID
        """
        response = await self._make_request("POST", f"/cameras/{camera_id}/activate")
        api_response = ApiResponse(**response.json())
        
        if not api_response.success:
            raise CameraStreamingError(api_response.error or "Failed to activate camera")

    async def deactivate_camera(self, camera_id: str) -> None:
        """
        Deactivate a camera.
        
        Args:
            camera_id: Camera ID
        """
        response = await self._make_request("POST", f"/cameras/{camera_id}/deactivate")
        api_response = ApiResponse(**response.json())
        
        if not api_response.success:
            raise CameraStreamingError(api_response.error or "Failed to deactivate camera")

    async def toggle_recording(self, camera_id: str) -> bool:
        """
        Toggle recording for a camera.
        
        Args:
            camera_id: Camera ID
            
        Returns:
            New recording status
        """
        response = await self._make_request("POST", f"/cameras/{camera_id}/toggle-recording")
        api_response = ApiResponse(**response.json())
        
        if api_response.success and api_response.data:
            return api_response.data["isRecording"]
        else:
            raise CameraStreamingError(api_response.error or "Failed to toggle recording")

    # Recording management methods
    async def get_recordings(self, filters: Optional[RecordingFilters] = None) -> List[Recording]:
        """
        Get list of recordings with optional filters.
        
        Args:
            filters: Optional filters to apply
            
        Returns:
            List of Recording objects
        """
        params = {}
        if filters:
            params = {k: v for k, v in filters.dict().items() if v is not None}
        
        response = await self._make_request("GET", "/recordings", params=params)
        paginated_response = PaginatedResponse(**response.json())
        
        if paginated_response.success:
            return [Recording(**item) for item in paginated_response.items]
        else:
            raise CameraStreamingError(paginated_response.error or "Failed to get recordings")

    async def get_recording(self, recording_id: str) -> Recording:
        """
        Get a specific recording by ID.
        
        Args:
            recording_id: Recording ID
            
        Returns:
            Recording object
        """
        response = await self._make_request("GET", f"/recordings/{recording_id}")
        api_response = ApiResponse(**response.json())
        
        if api_response.success and api_response.data:
            return Recording(**api_response.data["recording"])
        else:
            raise NotFoundError(f"Recording with ID {recording_id} not found")

    async def get_recording_download_url(self, recording_id: str) -> str:
        """
        Get download URL for a recording.
        
        Args:
            recording_id: Recording ID
            
        Returns:
            Download URL
        """
        response = await self._make_request("GET", f"/recordings/{recording_id}/download")
        api_response = ApiResponse(**response.json())
        
        if api_response.success and api_response.data:
            return api_response.data["downloadUrl"]
        else:
            raise CameraStreamingError(api_response.error or "Failed to get download URL")

    async def delete_recording(self, recording_id: str) -> None:
        """
        Delete a recording.
        
        Args:
            recording_id: Recording ID
        """
        response = await self._make_request("DELETE", f"/recordings/{recording_id}")
        api_response = ApiResponse(**response.json())
        
        if not api_response.success:
            raise CameraStreamingError(api_response.error or "Failed to delete recording")

    # API Token management methods
    async def get_api_tokens(self) -> List[ApiToken]:
        """
        Get list of API tokens.
        
        Returns:
            List of ApiToken objects
        """
        response = await self._make_request("GET", "/auth/api-tokens")
        api_response = ApiResponse(**response.json())
        
        if api_response.success and api_response.data:
            return [ApiToken(**token) for token in api_response.data["tokens"]]
        else:
            raise CameraStreamingError(api_response.error or "Failed to get API tokens")

    async def create_api_token(self, token_data: CreateApiTokenRequest) -> Dict[str, Any]:
        """
        Create a new API token.
        
        Args:
            token_data: Token creation data
            
        Returns:
            Dictionary with token info and API key
        """
        response = await self._make_request("POST", "/auth/api-tokens", token_data.dict())
        api_response = ApiResponse(**response.json())
        
        if api_response.success and api_response.data:
            return {
                "token": ApiToken(**api_response.data["token"]),
                "api_key": api_response.data["apiKey"]
            }
        else:
            raise CameraStreamingError(api_response.error or "Failed to create API token")

    async def delete_api_token(self, token_id: str) -> None:
        """
        Delete an API token.
        
        Args:
            token_id: Token ID
        """
        response = await self._make_request("DELETE", f"/auth/api-tokens/{token_id}")
        api_response = ApiResponse(**response.json())
        
        if not api_response.success:
            raise CameraStreamingError(api_response.error or "Failed to delete API token")

    # Dashboard and analytics methods
    async def get_dashboard_stats(self) -> DashboardStats:
        """
        Get dashboard statistics.
        
        Returns:
            DashboardStats object
        """
        response = await self._make_request("GET", "/dashboard/stats")
        api_response = ApiResponse(**response.json())
        
        if api_response.success and api_response.data:
            return DashboardStats(**api_response.data)
        else:
            raise CameraStreamingError(api_response.error or "Failed to get dashboard stats")

    async def get_system_health(self) -> SystemHealth:
        """
        Get system health information.
        
        Returns:
            SystemHealth object
        """
        response = await self._make_request("GET", "/dashboard/health")
        api_response = ApiResponse(**response.json())
        
        if api_response.success and api_response.data:
            return SystemHealth(**api_response.data)
        else:
            raise CameraStreamingError(api_response.error or "Failed to get system health")

    async def get_analytics_overview(self, time_range: str = "24h") -> AnalyticsOverview:
        """
        Get analytics overview.
        
        Args:
            time_range: Time range for analytics (e.g., "24h", "7d", "30d")
            
        Returns:
            AnalyticsOverview object
        """
        response = await self._make_request("GET", f"/analytics/overview?timeRange={time_range}")
        api_response = ApiResponse(**response.json())
        
        if api_response.success and api_response.data:
            return AnalyticsOverview(**api_response.data)
        else:
            raise CameraStreamingError(api_response.error or "Failed to get analytics overview")

    # Streaming methods
    async def get_stream_url(self, camera_id: str, quality: Optional[str] = None) -> str:
        """
        Get HLS stream URL for a camera.
        
        Args:
            camera_id: Camera ID
            quality: Stream quality (optional)
            
        Returns:
            Stream URL
        """
        params = {"quality": quality} if quality else {}
        response = await self._make_request("GET", f"/streaming/hls/{camera_id}", params=params)
        api_response = ApiResponse(**response.json())
        
        if api_response.success and api_response.data:
            return api_response.data["streamUrl"]
        else:
            raise CameraStreamingError(api_response.error or "Failed to get stream URL")

    async def get_webrtc_offer(self, camera_id: str) -> Dict[str, Any]:
        """
        Get WebRTC offer for a camera.
        
        Args:
            camera_id: Camera ID
            
        Returns:
            WebRTC offer
        """
        response = await self._make_request("POST", f"/streaming/webrtc/{camera_id}/offer")
        api_response = ApiResponse(**response.json())
        
        if api_response.success and api_response.data:
            return api_response.data
        else:
            raise CameraStreamingError(api_response.error or "Failed to get WebRTC offer")

    async def send_webrtc_answer(self, camera_id: str, answer: Dict[str, Any]) -> None:
        """
        Send WebRTC answer for a camera.
        
        Args:
            camera_id: Camera ID
            answer: WebRTC answer
        """
        response = await self._make_request("POST", f"/streaming/webrtc/{camera_id}/answer", answer)
        api_response = ApiResponse(**response.json())
        
        if not api_response.success:
            raise CameraStreamingError(api_response.error or "Failed to send WebRTC answer")

    # Utility methods
    def set_access_token(self, token: str) -> None:
        """Set the access token manually."""
        self._access_token = token

    def set_api_key(self, api_key: str) -> None:
        """Set the API key manually."""
        self.api_key = api_key