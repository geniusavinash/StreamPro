"use strict";
/**
 * Error classes for the Camera Streaming Platform SDK.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkError = exports.RateLimitError = exports.ValidationError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.CameraStreamingError = void 0;
class CameraStreamingError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = 'CameraStreamingError';
        this.statusCode = statusCode;
    }
}
exports.CameraStreamingError = CameraStreamingError;
class AuthenticationError extends CameraStreamingError {
    constructor(message = 'Authentication failed') {
        super(message, 401);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends CameraStreamingError {
    constructor(message = 'Access denied') {
        super(message, 403);
        this.name = 'AuthorizationError';
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends CameraStreamingError {
    constructor(message = 'Resource not found') {
        super(message, 404);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class ValidationError extends CameraStreamingError {
    constructor(message = 'Validation failed') {
        super(message, 400);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class RateLimitError extends CameraStreamingError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 429);
        this.name = 'RateLimitError';
    }
}
exports.RateLimitError = RateLimitError;
class NetworkError extends CameraStreamingError {
    constructor(message = 'Network error') {
        super(message);
        this.name = 'NetworkError';
    }
}
exports.NetworkError = NetworkError;
