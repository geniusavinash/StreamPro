import axios, { AxiosInstance } from 'axios';
import { 
  Camera, 
  User, 
  Recording, 
  DashboardStats, 
  LoginResponse, 
  CreateCameraRequest, 
  UpdateCameraRequest
} from '../types';
// No mock data - all API calls go to real backend

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.getfairplay.org/api/v1';
// Always use real API - no mock data

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors and token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await this.api.post('/auth/refresh', {
                refreshToken,
              });

              const { accessToken, refreshToken: newRefreshToken } = response.data;
              localStorage.setItem('authToken', accessToken);
              localStorage.setItem('refreshToken', newRefreshToken);

              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }
        }

        // Handle network errors
        if (!error.response) {
          console.error('Network Error:', error.message);
          throw new Error('Network error. Please check your connection.');
        }

        // Handle server errors
        if (error.response?.status >= 500) {
          console.error('Server Error:', error.response.data);
          throw new Error('Server error. Please try again later.');
        }

        // Handle client errors
        if (error.response?.status >= 400) {
          const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
          throw new Error(message);
        }

        return Promise.reject(error);
      }
    );
  }

  // Set auth token method
  setAuthToken(token: string | null) {
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.api.defaults.headers.common['Authorization'];
    }
  }

  // Authentication methods
  auth = {
    login: async (credentials: { username: string; password: string }): Promise<LoginResponse> => {
      const response = await this.api.post<LoginResponse>('/auth/login', credentials);
      return response.data;
    }
  };

  async login(credentials: { username: string; password: string }): Promise<LoginResponse> {
    const response = await this.api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  }

  async logout() {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  async getProfile(): Promise<User> {
    const response = await this.api.get<User>('/auth/profile');
    return response.data;
  }

  async getPermissions() {
    const response = await this.api.get('/auth/permissions');
    return response.data;
  }

  // Cameras
  async getCameras(filters?: any): Promise<Camera[]> {
    const response = await this.api.get<any>('/cameras', { params: filters });
    // Handle both array and object responses
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.cameras)) {
      return response.data.cameras;
    }
    return [];
  }

  async getCamera(id: string): Promise<Camera> {
    const response = await this.api.get<Camera>(`/cameras/${id}`);
    return response.data;
  }

  async createCamera(data: CreateCameraRequest): Promise<Camera> {
    const response = await this.api.post<Camera>('/cameras', data);
    return response.data;
  }

  async updateCamera(id: string, data: UpdateCameraRequest): Promise<Camera> {
    const response = await this.api.put<Camera>(`/cameras/${id}`, data);
    return response.data;
  }

  async deleteCamera(id: string) {
    const response = await this.api.delete(`/cameras/${id}`);
    return response.data;
  }

  async activateCamera(id: string) {
    const response = await this.api.post(`/cameras/${id}/activate`);
    return response.data;
  }

  async deactivateCamera(id: string) {
    const response = await this.api.post(`/cameras/${id}/deactivate`);
    return response.data;
  }

  async toggleRecording(id: string) {
    const response = await this.api.post(`/cameras/${id}/toggle-recording`);
    return response.data;
  }

  async getCameraStreamUrls(id: string, signed?: boolean) {
    const response = await this.api.get(`/streaming/camera/${id}/urls`, {
      params: { signed },
    });
    return response.data;
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.api.get<DashboardStats>('/dashboard/stats');
    return response.data;
  }

  async getCameraAnalytics(timeRange?: string) {
    const response = await this.api.get('/analytics/cameras', {
      params: { timeRange },
    });
    return response.data;
  }

  async getRecordingAnalytics(timeRange?: string) {
    const response = await this.api.get('/analytics/recordings', {
      params: { timeRange },
    });
    return response.data;
  }

  async getSystemMetrics() {
    const response = await this.api.get('/dashboard/system/metrics');
    return response.data;
  }

  async getActivityFeed(limit?: number) {
    const response = await this.api.get('/dashboard/activity', {
      params: { limit },
    });
    return response.data;
  }

  // Recordings
  async getRecordings(filters?: any): Promise<Recording[]> {
    const response = await this.api.get<Recording[]>('/recordings', { params: filters });
    return response.data;
  }

  async getRecording(id: string): Promise<Recording> {
    const response = await this.api.get<Recording>(`/recordings/${id}`);
    return response.data;
  }

  async deleteRecording(id: string) {
    const response = await this.api.delete(`/recordings/${id}`);
    return response.data;
  }

  async generateRecordingSignedUrl(id: string, expiresIn?: number) {
    const response = await this.api.get(`/recordings/${id}/signed-url`, {
      params: { expiresIn },
    });
    return response.data;
  }

  async getRecordingDownloadUrl(id: string) {
    const response = await this.api.get(`/recordings/${id}/download`);
    return response.data;
  }

  // API Tokens
  async getApiTokens() {
    const response = await this.api.get('/api-tokens');
    return response.data;
  }

  async createApiToken(data: any) {
    const response = await this.api.post('/api-tokens', data);
    return response.data;
  }

  async updateApiToken(id: string, data: any) {
    const response = await this.api.put(`/api-tokens/${id}`, data);
    return response.data;
  }

  async revokeApiToken(id: string) {
    const response = await this.api.post(`/api-tokens/${id}/revoke`);
    return response.data;
  }

  async deleteApiToken(id: string) {
    const response = await this.api.delete(`/api-tokens/${id}`);
    return response.data;
  }

  // Settings
  async getSettings() {
    const response = await this.api.get('/settings');
    return response.data;
  }

  async updateSettings(data: any) {
    const response = await this.api.put('/settings', data);
    return response.data;
  }

  // Analytics
  async getStreamingAnalytics(timeRange?: string) {
    const response = await this.api.get('/analytics/streaming', {
      params: { timeRange },
    });
    return response.data;
  }

  async getStorageAnalytics(timeRange?: string) {
    const response = await this.api.get('/analytics/storage', {
      params: { timeRange },
    });
    return response.data;
  }

  async getSystemAnalytics(timeRange?: string) {
    const response = await this.api.get('/analytics/system', {
      params: { timeRange },
    });
    return response.data;
  }

  async getAlerts() {
    const response = await this.api.get('/analytics/alerts');
    return response.data;
  }

  // Test endpoints
  async testConnection() {
    const response = await this.api.get('/health');
    return response.data;
  }

  async getConfig() {
    const response = await this.api.get('/settings');
    return response.data;
  }

  // Streaming methods
  async generateRtmpUrl(cameraId: string): Promise<{
    rtmpUrl: string;
    streamKey: string;
    hlsUrl: string;
    dashUrl: string;
  }> {
    const response = await this.api.post(`/cameras/${cameraId}/rtmp/generate`);
    return response.data;
  }

  async getStreamStatus(cameraId: string): Promise<{
    status: string;
    streamKey: string;
    assignedNode: string;
    lastSeen: string;
  }> {
    const response = await this.api.get(`/cameras/${cameraId}/stream/status`);
    return response.data;
  }

  async startStream(cameraId: string): Promise<{ message: string }> {
    const response = await this.api.post(`/cameras/${cameraId}/stream/start`);
    return response.data;
  }

  async stopStream(cameraId: string): Promise<{ message: string }> {
    const response = await this.api.post(`/cameras/${cameraId}/stream/stop`);
    return response.data;
  }
}

export const apiService = new ApiService();
export const api = apiService;
export default apiService;