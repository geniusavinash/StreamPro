import { ClientConfig, LoginRequest, LoginResponse, User, Camera, CreateCameraRequest, UpdateCameraRequest, CameraFilters, Recording, RecordingFilters, ApiToken, CreateApiTokenRequest, DashboardStats, SystemHealth, AnalyticsOverview, PaginatedResponse } from './types';
export declare class CameraStreamingClient {
    private config;
    private client;
    private accessToken?;
    private refreshToken?;
    constructor(config: ClientConfig);
    login(credentials: LoginRequest): Promise<LoginResponse>;
    logout(): Promise<void>;
    refreshAccessToken(): Promise<void>;
    getProfile(): Promise<User>;
    getCameras(filters?: CameraFilters): Promise<PaginatedResponse<Camera>>;
    getCamera(id: string): Promise<Camera>;
    createCamera(camera: CreateCameraRequest): Promise<Camera>;
    updateCamera(id: string, updates: UpdateCameraRequest): Promise<Camera>;
    deleteCamera(id: string): Promise<void>;
    activateCamera(id: string): Promise<void>;
    deactivateCamera(id: string): Promise<void>;
    toggleRecording(id: string): Promise<{
        isRecording: boolean;
    }>;
    getRecordings(filters?: RecordingFilters): Promise<PaginatedResponse<Recording>>;
    getRecording(id: string): Promise<Recording>;
    getRecordingDownloadUrl(id: string): Promise<string>;
    deleteRecording(id: string): Promise<void>;
    getApiTokens(): Promise<ApiToken[]>;
    createApiToken(token: CreateApiTokenRequest): Promise<{
        token: ApiToken;
        apiKey: string;
    }>;
    deleteApiToken(id: string): Promise<void>;
    getDashboardStats(): Promise<DashboardStats>;
    getSystemHealth(): Promise<SystemHealth>;
    getAnalyticsOverview(timeRange?: string): Promise<AnalyticsOverview>;
    getStreamUrl(cameraId: string, quality?: string): Promise<string>;
    getWebRTCOffer(cameraId: string): Promise<RTCSessionDescriptionInit>;
    sendWebRTCAnswer(cameraId: string, answer: RTCSessionDescriptionInit): Promise<void>;
    setAccessToken(token: string): void;
    setApiKey(apiKey: string): void;
    isAuthenticated(): boolean;
}
