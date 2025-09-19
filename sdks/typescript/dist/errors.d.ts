/**
 * Error classes for the Camera Streaming Platform SDK.
 */
export declare class CameraStreamingError extends Error {
    statusCode?: number;
    constructor(message: string, statusCode?: number);
}
export declare class AuthenticationError extends CameraStreamingError {
    constructor(message?: string);
}
export declare class AuthorizationError extends CameraStreamingError {
    constructor(message?: string);
}
export declare class NotFoundError extends CameraStreamingError {
    constructor(message?: string);
}
export declare class ValidationError extends CameraStreamingError {
    constructor(message?: string);
}
export declare class RateLimitError extends CameraStreamingError {
    constructor(message?: string);
}
export declare class NetworkError extends CameraStreamingError {
    constructor(message?: string);
}
