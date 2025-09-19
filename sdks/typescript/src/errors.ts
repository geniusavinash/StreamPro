/**
 * Error classes for the Camera Streaming Platform SDK.
 */

export class CameraStreamingError extends Error {
  public statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'CameraStreamingError';
    this.statusCode = statusCode;
  }
}

export class AuthenticationError extends CameraStreamingError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends CameraStreamingError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends CameraStreamingError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends CameraStreamingError {
  constructor(message: string = 'Validation failed') {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends CameraStreamingError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends CameraStreamingError {
  constructor(message: string = 'Network error') {
    super(message);
    this.name = 'NetworkError';
  }
}