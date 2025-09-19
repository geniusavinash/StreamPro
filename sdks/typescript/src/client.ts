import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  ClientConfig,
  LoginRequest,
  LoginResponse,
  User,
  Camera,
  CreateCameraRequest,
  UpdateCameraRequest,
  CameraFilters,
  Recording,
  RecordingFilters,
  ApiToken,
  CreateApiTokenRequest,
  DashboardStats,
  SystemHealth,
  AnalyticsOverview,
  ApiResponse,
  PaginatedResponse,
} from './types';
import { CameraStreamingError, AuthenticationError, NotFoundError, ValidationError } from './errors';

export class CameraStreamingClient {
  private client: AxiosInstance;
  private accessToken?: string;
  private refreshToken?: string;

  constructor(private config: ClientConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      } else if (this.config.apiKey) {
        config.headers['X-API-Key'] = this.config.apiKey;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && this.refreshToken) {
          try {
            await this.refreshAccessToken();
            return this.client.request(error.config);
          } catch (refreshError) {
            throw new AuthenticationError('Session expired. Please login again.');
          }
        }
        
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;
        
        switch (status) {
          case 400:
            throw new ValidationError(message);
          case 401:
            throw new AuthenticationError(message);
          case 404:
            throw new NotFoundError(message);
          default:
            throw new CameraStreamingError(message, status);
        }
      }
    );
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/auth/login', credentials);
    
    if (response.data.success) {
      this.accessToken = response.data.data.accessToken;
      this.refreshToken = response.data.data.refreshToken;
    }
    
    return response.data;
  }

  async logout(): Promise<void> {
    if (this.refreshToken) {
      await this.client.post('/auth/logout', { refreshToken: this.refreshToken });
    }
    
    this.accessToken = undefined;
    this.refreshToken = undefined;
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new AuthenticationError('No refresh token available');
    }

    const response = await this.client.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', {
      refreshToken: this.refreshToken,
    });

    if (response.data.success && response.data.data) {
      this.accessToken = response.data.data.accessToken;
    } else {
      throw new AuthenticationError('Failed to refresh token');
    }
  }

  async getProfile(): Promise<User> {
    const response = await this.client.get<ApiResponse<{ user: User }>>('/auth/profile');
    
    if (!response.data.success || !response.data.data) {
      throw new CameraStreamingError('Failed to get user profile');
    }
    
    return response.data.data.user;
  }

  // Camera management methods
  async getCameras(filters?: CameraFilters): Promise<PaginatedResponse<Camera>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const response = await this.client.get<PaginatedResponse<Camera>>(`/cameras?${params}`);
    return response.data;
  }

  async getCamera(id: string): Promise<Camera> {
    const response = await this.client.get<ApiResponse<{ camera: Camera }>>(`/cameras/${id}`);
    
    if (!response.data.success || !response.data.data) {
      throw new NotFoundError(`Camera with ID ${id} not found`);
    }
    
    return response.data.data.camera;
  }

  async createCamera(camera: CreateCameraRequest): Promise<Camera> {
    const response = await this.client.post<ApiResponse<{ camera: Camera }>>('/cameras', camera);
    
    if (!response.data.success || !response.data.data) {
      throw new CameraStreamingError('Failed to create camera');
    }
    
    return response.data.data.camera;
  }

  async updateCamera(id: string, updates: UpdateCameraRequest): Promise<Camera> {
    const response = await this.client.put<ApiResponse<{ camera: Camera }>>(`/cameras/${id}`, updates);
    
    if (!response.data.success || !response.data.data) {
      throw new CameraStreamingError('Failed to update camera');
    }
    
    return response.data.data.camera;
  }

  async deleteCamera(id: string): Promise<void> {
    const response = await this.client.delete<ApiResponse>(`/cameras/${id}`);
    
    if (!response.data.success) {
      throw new CameraStreamingError('Failed to delete camera');
    }
  }

  async activateCamera(id: string): Promise<void> {
    const response = await this.client.post<ApiResponse>(`/cameras/${id}/activate`);
    
    if (!response.data.success) {
      throw new CameraStreamingError('Failed to activate camera');
    }
  }

  async deactivateCamera(id: string): Promise<void> {
    const response = await this.client.post<ApiResponse>(`/cameras/${id}/deactivate`);
    
    if (!response.data.success) {
      throw new CameraStreamingError('Failed to deactivate camera');
    }
  }

  async toggleRecording(id: string): Promise<{ isRecording: boolean }> {
    const response = await this.client.post<ApiResponse<{ isRecording: boolean }>>(`/cameras/${id}/toggle-recording`);
    
    if (!response.data.success || !response.data.data) {
      throw new CameraStreamingError('Failed to toggle recording');
    }
    
    return response.data.data;
  }

  // Recording management methods
  async getRecordings(filters?: RecordingFilters): Promise<PaginatedResponse<Recording>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const response = await this.client.get<PaginatedResponse<Recording>>(`/recordings?${params}`);
    return response.data;
  }

  async getRecording(id: string): Promise<Recording> {
    const response = await this.client.get<ApiResponse<{ recording: Recording }>>(`/recordings/${id}`);
    
    if (!response.data.success || !response.data.data) {
      throw new NotFoundError(`Recording with ID ${id} not found`);
    }
    
    return response.data.data.recording;
  }

  async getRecordingDownloadUrl(id: string): Promise<string> {
    const response = await this.client.get<ApiResponse<{ downloadUrl: string }>>(`/recordings/${id}/download`);
    
    if (!response.data.success || !response.data.data) {
      throw new CameraStreamingError('Failed to get download URL');
    }
    
    return response.data.data.downloadUrl;
  }

  async deleteRecording(id: string): Promise<void> {
    const response = await this.client.delete<ApiResponse>(`/recordings/${id}`);
    
    if (!response.data.success) {
      throw new CameraStreamingError('Failed to delete recording');
    }
  }

  // API Token management methods
  async getApiTokens(): Promise<ApiToken[]> {
    const response = await this.client.get<ApiResponse<{ tokens: ApiToken[] }>>('/auth/api-tokens');
    
    if (!response.data.success || !response.data.data) {
      throw new CameraStreamingError('Failed to get API tokens');
    }
    
    return response.data.data.tokens;
  }

  async createApiToken(token: CreateApiTokenRequest): Promise<{ token: ApiToken; apiKey: string }> {
    const response = await this.client.post<ApiResponse<{ token: ApiToken; apiKey: string }>>('/auth/api-tokens', token);
    
    if (!response.data.success || !response.data.data) {
      throw new CameraStreamingError('Failed to create API token');
    }
    
    return response.data.data;
  }

  async deleteApiToken(id: string): Promise<void> {
    const response = await this.client.delete<ApiResponse>(`/auth/api-tokens/${id}`);
    
    if (!response.data.success) {
      throw new CameraStreamingError('Failed to delete API token');
    }
  }

  // Dashboard and analytics methods
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.client.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    
    if (!response.data.success || !response.data.data) {
      throw new CameraStreamingError('Failed to get dashboard stats');
    }
    
    return response.data.data;
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const response = await this.client.get<ApiResponse<SystemHealth>>('/dashboard/health');
    
    if (!response.data.success || !response.data.data) {
      throw new CameraStreamingError('Failed to get system health');
    }
    
    return response.data.data;
  }

  async getAnalyticsOverview(timeRange: string = '24h'): Promise<AnalyticsOverview> {
    const response = await this.client.get<ApiResponse<AnalyticsOverview>>(`/analytics/overview?timeRange=${timeRange}`);
    
    if (!response.data.success || !response.data.data) {
      throw new CameraStreamingError('Failed to get analytics overview');
    }
    
    return response.data.data;
  }

  // Streaming methods
  async getStreamUrl(cameraId: string, quality?: string): Promise<string> {
    const params = quality ? `?quality=${quality}` : '';
    const response = await this.client.get<ApiResponse<{ streamUrl: string }>>(`/streaming/hls/${cameraId}${params}`);
    
    if (!response.data.success || !response.data.data) {
      throw new CameraStreamingError('Failed to get stream URL');
    }
    
    return response.data.data.streamUrl;
  }

  async getWebRTCOffer(cameraId: string): Promise<RTCSessionDescriptionInit> {
    const response = await this.client.post<ApiResponse<RTCSessionDescriptionInit>>(`/streaming/webrtc/${cameraId}/offer`);
    
    if (!response.data.success || !response.data.data) {
      throw new CameraStreamingError('Failed to get WebRTC offer');
    }
    
    return response.data.data;
  }

  async sendWebRTCAnswer(cameraId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const response = await this.client.post<ApiResponse>(`/streaming/webrtc/${cameraId}/answer`, answer);
    
    if (!response.data.success) {
      throw new CameraStreamingError('Failed to send WebRTC answer');
    }
  }

  // Utility methods
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken || !!this.config.apiKey;
  }
}