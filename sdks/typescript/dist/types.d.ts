export interface LoginRequest {
    username: string;
    password: string;
}
export interface LoginResponse {
    success: boolean;
    data: {
        accessToken: string;
        refreshToken: string;
        user: User;
    };
}
export interface User {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export declare enum UserRole {
    ADMIN = "admin",
    OPERATOR = "operator",
    VIEWER = "viewer",
    API_ONLY = "api_only"
}
export interface Camera {
    id: string;
    name: string;
    company: string;
    model: string;
    serialNumber: string;
    location: string;
    place: string;
    rtmpUrl: string;
    isActive: boolean;
    isRecording: boolean;
    streamStatus: StreamStatus;
    createdAt: string;
    updatedAt: string;
}
export declare enum StreamStatus {
    ONLINE = "online",
    OFFLINE = "offline",
    CONNECTING = "connecting",
    ERROR = "error"
}
export interface CreateCameraRequest {
    name: string;
    company: string;
    model: string;
    serialNumber: string;
    location: string;
    place: string;
    isRecording?: boolean;
}
export interface UpdateCameraRequest {
    name?: string;
    company?: string;
    model?: string;
    location?: string;
    place?: string;
    isRecording?: boolean;
}
export interface CameraFilters {
    search?: string;
    company?: string;
    model?: string;
    location?: string;
    isActive?: boolean;
    isRecording?: boolean;
    streamStatus?: StreamStatus;
    limit?: number;
    offset?: number;
}
export interface Recording {
    id: string;
    camera: Camera;
    filename: string;
    filePath: string;
    fileSize: number;
    duration: number;
    startTime: string;
    endTime: string;
    storageTier: StorageTier;
    isEncrypted: boolean;
    createdAt: string;
    updatedAt: string;
}
export declare enum StorageTier {
    HOT = "hot",
    WARM = "warm",
    COLD = "cold"
}
export interface RecordingFilters {
    cameraId?: string;
    startDate?: string;
    endDate?: string;
    storageTier?: StorageTier;
    limit?: number;
    offset?: number;
}
export interface ApiToken {
    id: string;
    name: string;
    permissions: string[];
    isActive: boolean;
    expiresAt: string | null;
    lastUsedAt: string | null;
    ipWhitelist: string[];
    rateLimit: number;
    createdAt: string;
    updatedAt: string;
}
export interface CreateApiTokenRequest {
    name: string;
    permissions: string[];
    expiresIn?: string;
    ipWhitelist?: string[];
    rateLimit?: number;
}
export interface DashboardStats {
    totalCameras: number;
    onlineCameras: number;
    offlineCameras: number;
    recordingCameras: number;
    totalRecordings: number;
    totalStorage: number;
    activeStreams: number;
    systemHealth: 'healthy' | 'degraded' | 'unhealthy';
}
export interface SystemHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    version: string;
    services: {
        database: ServiceStatus;
        redis: ServiceStatus;
        rtmp: ServiceStatus;
        storage: ServiceStatus;
    };
}
export interface ServiceStatus {
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    lastCheck: string;
    details?: any;
}
export interface AnalyticsOverview {
    timeRange: string;
    metrics: {
        totalRequests: number;
        averageResponseTime: number;
        errorRate: number;
        cameraUptime: number;
        streamQuality: number;
        storageUsage: number;
    };
    trends: {
        requests: DataPoint[];
        responseTime: DataPoint[];
        errors: DataPoint[];
        cameraStatus: DataPoint[];
    };
}
export interface DataPoint {
    timestamp: string;
    value: number;
}
export interface WebSocketMessage {
    type: string;
    data: any;
    timestamp: string;
}
export interface CameraStatusUpdate {
    cameraId: string;
    status: StreamStatus;
    timestamp: string;
}
export interface DashboardUpdate {
    stats: DashboardStats;
    timestamp: string;
}
export interface AlertNotification {
    id: string;
    type: 'camera_offline' | 'recording_failed' | 'system_error' | 'security_alert';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    details: any;
    timestamp: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface PaginatedResponse<T = any> {
    success: boolean;
    data: {
        items: T[];
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}
export interface ClientConfig {
    baseUrl: string;
    apiKey?: string;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}
export interface WebSocketConfig {
    url: string;
    token: string;
    reconnect?: boolean;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
}
