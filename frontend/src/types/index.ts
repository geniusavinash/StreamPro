// Shared type definitions for the Camera Streaming Platform

export interface Camera {
  id: string;
  name: string;
  company?: string;
  model?: string;
  serialNumber?: string;
  location: string;
  place?: string;
  rtmpUrl: string;
  isActive: boolean;
  isRecording: boolean;
  streamStatus: 'online' | 'offline' | 'connecting' | 'error';
  status: 'online' | 'offline';
  viewers?: number;
  resolution?: string;
  fps?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  username?: string;
  email: string;
  name: string;
  role: 'admin' | 'operator' | 'viewer';
  permissions: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Recording {
  id: string;
  cameraId: string;
  camera?: Camera;
  filename: string;
  duration: number;
  size: number;
  fileSize?: number;
  storageTier?: string;
  startTime: string;
  endTime?: string;
  status: 'recording' | 'completed' | 'failed';
  createdAt: string;
}

export interface DashboardStats {
  cameras: {
    total: number;
    online: number;
    offline: number;
    recording: number;
  };
  recordings: {
    totalCount: number;
    totalSize: number;
    activeSessions: number;
  };
  system: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu?: {
      usage: number;
    };
    storage?: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  expiresIn: number;
}

export interface CreateCameraRequest {
  name: string;
  location: string;
  rtmpUrl: string;
  company?: string;
  model?: string;
  serialNumber?: string;
}

export interface UpdateCameraRequest extends Partial<CreateCameraRequest> {
  isActive?: boolean;
}

// Utility types
export type CameraStatus = Camera['status'];
export type UserRole = User['role'];
export type RecordingStatus = Recording['status'];