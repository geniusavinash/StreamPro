export enum AlertType {
  CAMERA_OFFLINE = 'camera_offline',
  RECORDING_FAILED = 'recording_failed',
  STORAGE_FULL = 'storage_full',
  API_RATE_LIMIT = 'api_rate_limit',
  STREAM_QUALITY_DEGRADED = 'stream_quality_degraded',
  AUTHENTICATION_FAILED = 'authentication_failed',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}