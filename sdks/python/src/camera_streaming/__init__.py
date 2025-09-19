"""
Camera Streaming Platform Python SDK

Official Python SDK for the Camera Streaming Platform API.
"""

from .client import CameraStreamingClient
from .websocket_client import WebSocketClient
from .models import (
    Camera,
    Recording,
    User,
    ApiToken,
    DashboardStats,
    SystemHealth,
    AnalyticsOverview,
    StreamStatus,
    UserRole,
    StorageTier,
)
from .exceptions import (
    CameraStreamingError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ValidationError,
    RateLimitError,
    NetworkError,
)

__version__ = "1.0.0"
__author__ = "Camera Streaming Platform"
__email__ = "support@camera-streaming.example.com"

__all__ = [
    "CameraStreamingClient",
    "WebSocketClient",
    "Camera",
    "Recording",
    "User",
    "ApiToken",
    "DashboardStats",
    "SystemHealth",
    "AnalyticsOverview",
    "StreamStatus",
    "UserRole",
    "StorageTier",
    "CameraStreamingError",
    "AuthenticationError",
    "AuthorizationError",
    "NotFoundError",
    "ValidationError",
    "RateLimitError",
    "NetworkError",
]