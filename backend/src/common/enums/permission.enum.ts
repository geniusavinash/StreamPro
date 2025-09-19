import { UserRole } from './user-role.enum';

export enum Permission {
  // Camera permissions
  CAMERA_CREATE = 'camera:create',
  CAMERA_READ = 'camera:read',
  CAMERA_UPDATE = 'camera:update',
  CAMERA_DELETE = 'camera:delete',
  CAMERA_ACTIVATE = 'camera:activate',
  CAMERA_DEACTIVATE = 'camera:deactivate',
  CAMERA_STREAM = 'camera:stream',
  CAMERA_VIEW = 'camera:view',

  // Stream permissions
  STREAM_VIEW = 'stream:view',
  STREAM_CONTROL = 'stream:control',
  STREAM_RESTART = 'stream:restart',

  // Recording permissions
  RECORDING_VIEW = 'recording:view',
  RECORDING_DOWNLOAD = 'recording:download',
  RECORDING_DELETE = 'recording:delete',
  RECORDING_CONTROL = 'recording:control',

  // User management permissions
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_ROLE_CHANGE = 'user:role_change',

  // API token permissions
  TOKEN_CREATE = 'token:create',
  TOKEN_READ = 'token:read',
  TOKEN_UPDATE = 'token:update',
  TOKEN_DELETE = 'token:delete',
  TOKEN_REVOKE = 'token:revoke',

  // Dashboard permissions
  DASHBOARD_VIEW = 'dashboard:view',
  DASHBOARD_ANALYTICS = 'dashboard:analytics',

  // System permissions
  SYSTEM_SETTINGS = 'system:settings',
  SYSTEM_LOGS = 'system:logs',
  SYSTEM_MONITORING = 'system:monitoring',

  // Audit permissions
  VIEW_AUDIT_LOGS = 'audit:view_logs',
  VIEW_SECURITY_EVENTS = 'audit:view_security_events',
  MANAGE_SECURITY_EVENTS = 'audit:manage_security_events',
  VIEW_AUDIT_REPORTS = 'audit:view_reports',
  EXPORT_AUDIT_LOGS = 'audit:export_logs',
  VIEW_AUDIT_DASHBOARD = 'audit:view_dashboard',

  // Additional missing permissions
  MANAGE_SECURITY = 'security:manage',
  MANAGE_SETTINGS = 'settings:manage',
  VIEW_ANALYTICS = 'analytics:view',
  MANAGE_RECORDING = 'recording:manage',
  VIEW_STREAMING = 'streaming:view',
  MANAGE_STREAMING = 'streaming:manage',
  
  // Alert permissions
  VIEW_ALERTS = 'alerts:view',
  MANAGE_ALERTS = 'alerts:manage',
  
  // Recording specific permissions
  VIEW_RECORDING = 'recording:view_specific',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Full access to everything
    Permission.CAMERA_CREATE,
    Permission.CAMERA_READ,
    Permission.CAMERA_UPDATE,
    Permission.CAMERA_DELETE,
    Permission.CAMERA_ACTIVATE,
    Permission.CAMERA_DEACTIVATE,
    Permission.STREAM_VIEW,
    Permission.STREAM_CONTROL,
    Permission.STREAM_RESTART,
    Permission.RECORDING_VIEW,
    Permission.RECORDING_DOWNLOAD,
    Permission.RECORDING_DELETE,
    Permission.RECORDING_CONTROL,
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_ROLE_CHANGE,
    Permission.TOKEN_CREATE,
    Permission.TOKEN_READ,
    Permission.TOKEN_UPDATE,
    Permission.TOKEN_DELETE,
    Permission.TOKEN_REVOKE,
    Permission.DASHBOARD_VIEW,
    Permission.DASHBOARD_ANALYTICS,
    Permission.SYSTEM_SETTINGS,
    Permission.SYSTEM_LOGS,
    Permission.SYSTEM_MONITORING,
    Permission.VIEW_AUDIT_LOGS,
    Permission.VIEW_SECURITY_EVENTS,
    Permission.MANAGE_SECURITY_EVENTS,
    Permission.VIEW_AUDIT_REPORTS,
    Permission.EXPORT_AUDIT_LOGS,
    Permission.VIEW_AUDIT_DASHBOARD,
    Permission.MANAGE_SECURITY,
    Permission.MANAGE_SETTINGS,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_RECORDING,
    Permission.VIEW_STREAMING,
    Permission.MANAGE_STREAMING,
    Permission.VIEW_ALERTS,
    Permission.MANAGE_ALERTS,
    Permission.VIEW_RECORDING,
  ],
  [UserRole.OPERATOR]: [
    // Camera and stream management, limited user access
    Permission.CAMERA_READ,
    Permission.CAMERA_UPDATE,
    Permission.CAMERA_ACTIVATE,
    Permission.CAMERA_DEACTIVATE,
    Permission.STREAM_VIEW,
    Permission.STREAM_CONTROL,
    Permission.STREAM_RESTART,
    Permission.RECORDING_VIEW,
    Permission.RECORDING_DOWNLOAD,
    Permission.RECORDING_CONTROL,
    Permission.USER_READ,
    Permission.TOKEN_READ,
    Permission.DASHBOARD_VIEW,
    Permission.DASHBOARD_ANALYTICS,
    Permission.SYSTEM_MONITORING,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_RECORDING,
    Permission.VIEW_STREAMING,
    Permission.VIEW_ALERTS,
    Permission.VIEW_RECORDING,
  ],
  [UserRole.VIEWER]: [
    // Read-only access to cameras and streams
    Permission.CAMERA_READ,
    Permission.STREAM_VIEW,
    Permission.RECORDING_VIEW,
    Permission.RECORDING_DOWNLOAD,
    Permission.DASHBOARD_VIEW,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_STREAMING,
    Permission.VIEW_ALERTS,
    Permission.VIEW_RECORDING,
  ],
  [UserRole.API_ONLY]: [
    // Limited API access based on token permissions
    Permission.CAMERA_READ,
    Permission.STREAM_VIEW,
    Permission.RECORDING_VIEW,
    Permission.VIEW_STREAMING,
  ],
};