"""
Exception classes for the Camera Streaming Platform SDK.
"""


class CameraStreamingError(Exception):
    """Base exception for Camera Streaming SDK."""
    
    def __init__(self, message: str, status_code: int = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class AuthenticationError(CameraStreamingError):
    """Raised when authentication fails."""
    pass


class AuthorizationError(CameraStreamingError):
    """Raised when authorization fails."""
    pass


class NotFoundError(CameraStreamingError):
    """Raised when a resource is not found."""
    pass


class ValidationError(CameraStreamingError):
    """Raised when request validation fails."""
    pass


class RateLimitError(CameraStreamingError):
    """Raised when rate limit is exceeded."""
    pass


class NetworkError(CameraStreamingError):
    """Raised when network-related errors occur."""
    pass


class WebSocketError(CameraStreamingError):
    """Raised when WebSocket-related errors occur."""
    pass