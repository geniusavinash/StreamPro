"""
Data models for the Camera Streaming Platform SDK.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field


class UserRole(str, Enum):
    """User role enumeration."""
    ADMIN = "admin"
    OPERATOR = "operator"
    VIEWER = "viewer"
    API_ONLY = "api_only"


class StreamStatus(str, Enum):
    """Stream status enumeration."""
    ONLINE = "online"
    OFFLINE = "offline"
    CONNECTING = "connecting"
    ERROR = "error"


class StorageTier(str, Enum):
    """Storage tier enumeration."""
    HOT = "hot"
    WARM = "warm"
    COLD = "cold"


class User(BaseModel):
    """User model."""
    id: str
    username: str
    email: str
    role: UserRole
    is_active: bool = Field(alias="isActive")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    class Config:
        allow_population_by_field_name = True


class Camera(BaseModel):
    """Camera model."""
    id: str
    name: str
    company: str
    model: str
    serial_number: str = Field(alias="serialNumber")
    location: str
    place: str
    rtmp_url: str = Field(alias="rtmpUrl")
    is_active: bool = Field(alias="isActive")
    is_recording: bool = Field(alias="isRecording")
    stream_status: StreamStatus = Field(alias="streamStatus")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    class Config:
        allow_population_by_field_name = True


class Recording(BaseModel):
    """Recording model."""
    id: str
    camera: Camera
    filename: str
    file_path: str = Field(alias="filePath")
    file_size: int = Field(alias="fileSize")
    duration: int
    start_time: datetime = Field(alias="startTime")
    end_time: datetime = Field(alias="endTime")
    storage_tier: StorageTier = Field(alias="storageTier")
    is_encrypted: bool = Field(alias="isEncrypted")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    class Config:
        allow_population_by_field_name = True


class ApiToken(BaseModel):
    """API Token model."""
    id: str
    name: str
    permissions: List[str]
    is_active: bool = Field(alias="isActive")
    expires_at: Optional[datetime] = Field(alias="expiresAt")
    last_used_at: Optional[datetime] = Field(alias="lastUsedAt")
    ip_whitelist: List[str] = Field(alias="ipWhitelist")
    rate_limit: int = Field(alias="rateLimit")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    class Config:
        allow_population_by_field_name = True


class ServiceStatus(BaseModel):
    """Service status model."""
    status: str
    response_time: float = Field(alias="responseTime")
    last_check: datetime = Field(alias="lastCheck")
    details: Optional[Dict[str, Any]] = None

    class Config:
        allow_population_by_field_name = True


class SystemHealth(BaseModel):
    """System health model."""
    status: str
    uptime: int
    version: str
    services: Dict[str, ServiceStatus]


class DashboardStats(BaseModel):
    """Dashboard statistics model."""
    total_cameras: int = Field(alias="totalCameras")
    online_cameras: int = Field(alias="onlineCameras")
    offline_cameras: int = Field(alias="offlineCameras")
    recording_cameras: int = Field(alias="recordingCameras")
    total_recordings: int = Field(alias="totalRecordings")
    total_storage: int = Field(alias="totalStorage")
    active_streams: int = Field(alias="activeStreams")
    system_health: str = Field(alias="systemHealth")

    class Config:
        allow_population_by_field_name = True


class DataPoint(BaseModel):
    """Data point for analytics."""
    timestamp: datetime
    value: float


class AnalyticsMetrics(BaseModel):
    """Analytics metrics model."""
    total_requests: int = Field(alias="totalRequests")
    average_response_time: float = Field(alias="averageResponseTime")
    error_rate: float = Field(alias="errorRate")
    camera_uptime: float = Field(alias="cameraUptime")
    stream_quality: float = Field(alias="streamQuality")
    storage_usage: int = Field(alias="storageUsage")

    class Config:
        allow_population_by_field_name = True


class AnalyticsTrends(BaseModel):
    """Analytics trends model."""
    requests: List[DataPoint]
    response_time: List[DataPoint] = Field(alias="responseTime")
    errors: List[DataPoint]
    camera_status: List[DataPoint] = Field(alias="cameraStatus")

    class Config:
        allow_population_by_field_name = True


class AnalyticsOverview(BaseModel):
    """Analytics overview model."""
    time_range: str = Field(alias="timeRange")
    metrics: AnalyticsMetrics
    trends: AnalyticsTrends

    class Config:
        allow_population_by_field_name = True


# Request models
class LoginRequest(BaseModel):
    """Login request model."""
    username: str
    password: str


class CreateCameraRequest(BaseModel):
    """Create camera request model."""
    name: str
    company: str
    model: str
    serial_number: str = Field(alias="serialNumber")
    location: str
    place: str
    is_recording: bool = Field(default=True, alias="isRecording")

    class Config:
        allow_population_by_field_name = True


class UpdateCameraRequest(BaseModel):
    """Update camera request model."""
    name: Optional[str] = None
    company: Optional[str] = None
    model: Optional[str] = None
    location: Optional[str] = None
    place: Optional[str] = None
    is_recording: Optional[bool] = Field(default=None, alias="isRecording")

    class Config:
        allow_population_by_field_name = True


class CreateApiTokenRequest(BaseModel):
    """Create API token request model."""
    name: str
    permissions: List[str]
    expires_in: Optional[str] = Field(default=None, alias="expiresIn")
    ip_whitelist: Optional[List[str]] = Field(default=None, alias="ipWhitelist")
    rate_limit: Optional[int] = Field(default=1000, alias="rateLimit")

    class Config:
        allow_population_by_field_name = True


# Filter models
class CameraFilters(BaseModel):
    """Camera filters model."""
    search: Optional[str] = None
    company: Optional[str] = None
    model: Optional[str] = None
    location: Optional[str] = None
    is_active: Optional[bool] = Field(default=None, alias="isActive")
    is_recording: Optional[bool] = Field(default=None, alias="isRecording")
    stream_status: Optional[StreamStatus] = Field(default=None, alias="streamStatus")
    limit: Optional[int] = 50
    offset: Optional[int] = 0

    class Config:
        allow_population_by_field_name = True


class RecordingFilters(BaseModel):
    """Recording filters model."""
    camera_id: Optional[str] = Field(default=None, alias="cameraId")
    start_date: Optional[str] = Field(default=None, alias="startDate")
    end_date: Optional[str] = Field(default=None, alias="endDate")
    storage_tier: Optional[StorageTier] = Field(default=None, alias="storageTier")
    limit: Optional[int] = 50
    offset: Optional[int] = 0

    class Config:
        allow_population_by_field_name = True


# Response models
class ApiResponse(BaseModel):
    """Generic API response model."""
    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None
    error: Optional[str] = None


class PaginatedResponse(BaseModel):
    """Paginated response model."""
    success: bool
    data: Dict[str, Any]
    message: Optional[str] = None
    error: Optional[str] = None

    @property
    def items(self) -> List[Any]:
        """Get items from paginated response."""
        return self.data.get("items", [])

    @property
    def total(self) -> int:
        """Get total count from paginated response."""
        return self.data.get("total", 0)

    @property
    def limit(self) -> int:
        """Get limit from paginated response."""
        return self.data.get("limit", 0)

    @property
    def offset(self) -> int:
        """Get offset from paginated response."""
        return self.data.get("offset", 0)

    @property
    def has_more(self) -> bool:
        """Check if there are more items."""
        return self.data.get("hasMore", False)


class LoginResponse(BaseModel):
    """Login response model."""
    success: bool
    data: Dict[str, Any]
    message: Optional[str] = None
    error: Optional[str] = None

    @property
    def access_token(self) -> Optional[str]:
        """Get access token from login response."""
        return self.data.get("accessToken")

    @property
    def refresh_token(self) -> Optional[str]:
        """Get refresh token from login response."""
        return self.data.get("refreshToken")

    @property
    def user(self) -> Optional[User]:
        """Get user from login response."""
        user_data = self.data.get("user")
        return User(**user_data) if user_data else None


# WebSocket models
class WebSocketMessage(BaseModel):
    """WebSocket message model."""
    type: str
    data: Any
    timestamp: datetime


class CameraStatusUpdate(BaseModel):
    """Camera status update model."""
    camera_id: str = Field(alias="cameraId")
    status: StreamStatus
    timestamp: datetime

    class Config:
        allow_population_by_field_name = True


class DashboardUpdate(BaseModel):
    """Dashboard update model."""
    stats: DashboardStats
    timestamp: datetime


class AlertNotification(BaseModel):
    """Alert notification model."""
    id: str
    type: str
    severity: str
    message: str
    details: Any
    timestamp: datetime