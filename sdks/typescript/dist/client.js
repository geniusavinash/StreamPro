"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CameraStreamingClient = void 0;
const axios_1 = __importDefault(require("axios"));
const errors_1 = require("./errors");
class CameraStreamingClient {
    constructor(config) {
        this.config = config;
        this.client = axios_1.default.create({
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
            }
            else if (this.config.apiKey) {
                config.headers['X-API-Key'] = this.config.apiKey;
            }
            return config;
        });
        // Add response interceptor for error handling
        this.client.interceptors.response.use((response) => response, async (error) => {
            if (error.response?.status === 401 && this.refreshToken) {
                try {
                    await this.refreshAccessToken();
                    return this.client.request(error.config);
                }
                catch (refreshError) {
                    throw new errors_1.AuthenticationError('Session expired. Please login again.');
                }
            }
            const status = error.response?.status;
            const message = error.response?.data?.message || error.message;
            switch (status) {
                case 400:
                    throw new errors_1.ValidationError(message);
                case 401:
                    throw new errors_1.AuthenticationError(message);
                case 404:
                    throw new errors_1.NotFoundError(message);
                default:
                    throw new errors_1.CameraStreamingError(message, status);
            }
        });
    }
    // Authentication methods
    async login(credentials) {
        const response = await this.client.post('/auth/login', credentials);
        if (response.data.success) {
            this.accessToken = response.data.data.accessToken;
            this.refreshToken = response.data.data.refreshToken;
        }
        return response.data;
    }
    async logout() {
        if (this.refreshToken) {
            await this.client.post('/auth/logout', { refreshToken: this.refreshToken });
        }
        this.accessToken = undefined;
        this.refreshToken = undefined;
    }
    async refreshAccessToken() {
        if (!this.refreshToken) {
            throw new errors_1.AuthenticationError('No refresh token available');
        }
        const response = await this.client.post('/auth/refresh', {
            refreshToken: this.refreshToken,
        });
        if (response.data.success && response.data.data) {
            this.accessToken = response.data.data.accessToken;
        }
        else {
            throw new errors_1.AuthenticationError('Failed to refresh token');
        }
    }
    async getProfile() {
        const response = await this.client.get('/auth/profile');
        if (!response.data.success || !response.data.data) {
            throw new errors_1.CameraStreamingError('Failed to get user profile');
        }
        return response.data.data.user;
    }
    // Camera management methods
    async getCameras(filters) {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined) {
                    params.append(key, String(value));
                }
            });
        }
        const response = await this.client.get(`/cameras?${params}`);
        return response.data;
    }
    async getCamera(id) {
        const response = await this.client.get(`/cameras/${id}`);
        if (!response.data.success || !response.data.data) {
            throw new errors_1.NotFoundError(`Camera with ID ${id} not found`);
        }
        return response.data.data.camera;
    }
    async createCamera(camera) {
        const response = await this.client.post('/cameras', camera);
        if (!response.data.success || !response.data.data) {
            throw new errors_1.CameraStreamingError('Failed to create camera');
        }
        return response.data.data.camera;
    }
    async updateCamera(id, updates) {
        const response = await this.client.put(`/cameras/${id}`, updates);
        if (!response.data.success || !response.data.data) {
            throw new errors_1.CameraStreamingError('Failed to update camera');
        }
        return response.data.data.camera;
    }
    async deleteCamera(id) {
        const response = await this.client.delete(`/cameras/${id}`);
        if (!response.data.success) {
            throw new errors_1.CameraStreamingError('Failed to delete camera');
        }
    }
    async activateCamera(id) {
        const response = await this.client.post(`/cameras/${id}/activate`);
        if (!response.data.success) {
            throw new errors_1.CameraStreamingError('Failed to activate camera');
        }
    }
    async deactivateCamera(id) {
        const response = await this.client.post(`/cameras/${id}/deactivate`);
        if (!response.data.success) {
            throw new errors_1.CameraStreamingError('Failed to deactivate camera');
        }
    }
    async toggleRecording(id) {
        const response = await this.client.post(`/cameras/${id}/toggle-recording`);
        if (!response.data.success || !response.data.data) {
            throw new errors_1.CameraStreamingError('Failed to toggle recording');
        }
        return response.data.data;
    }
    // Recording management methods
    async getRecordings(filters) {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined) {
                    params.append(key, String(value));
                }
            });
        }
        const response = await this.client.get(`/recordings?${params}`);
        return response.data;
    }
    async getRecording(id) {
        const response = await this.client.get(`/recordings/${id}`);
        if (!response.data.success || !response.data.data) {
            throw new errors_1.NotFoundError(`Recording with ID ${id} not found`);
        }
        return response.data.data.recording;
    }
    async getRecordingDownloadUrl(id) {
        const response = await this.client.get(`/recordings/${id}/download`);
        if (!response.data.success || !response.data.data) {
            throw new errors_1.CameraStreamingError('Failed to get download URL');
        }
        return response.data.data.downloadUrl;
    }
    async deleteRecording(id) {
        const response = await this.client.delete(`/recordings/${id}`);
        if (!response.data.success) {
            throw new errors_1.CameraStreamingError('Failed to delete recording');
        }
    }
    // API Token management methods
    async getApiTokens() {
        const response = await this.client.get('/auth/api-tokens');
        if (!response.data.success || !response.data.data) {
            throw new errors_1.CameraStreamingError('Failed to get API tokens');
        }
        return response.data.data.tokens;
    }
    async createApiToken(token) {
        const response = await this.client.post('/auth/api-tokens', token);
        if (!response.data.success || !response.data.data) {
            throw new errors_1.CameraStreamingError('Failed to create API token');
        }
        return response.data.data;
    }
    async deleteApiToken(id) {
        const response = await this.client.delete(`/auth/api-tokens/${id}`);
        if (!response.data.success) {
            throw new errors_1.CameraStreamingError('Failed to delete API token');
        }
    }
    // Dashboard and analytics methods
    async getDashboardStats() {
        const response = await this.client.get('/dashboard/stats');
        if (!response.data.success || !response.data.data) {
            throw new errors_1.CameraStreamingError('Failed to get dashboard stats');
        }
        return response.data.data;
    }
    async getSystemHealth() {
        const response = await this.client.get('/dashboard/health');
        if (!response.data.success || !response.data.data) {
            throw new errors_1.CameraStreamingError('Failed to get system health');
        }
        return response.data.data;
    }
    async getAnalyticsOverview(timeRange = '24h') {
        const response = await this.client.get(`/analytics/overview?timeRange=${timeRange}`);
        if (!response.data.success || !response.data.data) {
            throw new errors_1.CameraStreamingError('Failed to get analytics overview');
        }
        return response.data.data;
    }
    // Streaming methods
    async getStreamUrl(cameraId, quality) {
        const params = quality ? `?quality=${quality}` : '';
        const response = await this.client.get(`/streaming/hls/${cameraId}${params}`);
        if (!response.data.success || !response.data.data) {
            throw new errors_1.CameraStreamingError('Failed to get stream URL');
        }
        return response.data.data.streamUrl;
    }
    async getWebRTCOffer(cameraId) {
        const response = await this.client.post(`/streaming/webrtc/${cameraId}/offer`);
        if (!response.data.success || !response.data.data) {
            throw new errors_1.CameraStreamingError('Failed to get WebRTC offer');
        }
        return response.data.data;
    }
    async sendWebRTCAnswer(cameraId, answer) {
        const response = await this.client.post(`/streaming/webrtc/${cameraId}/answer`, answer);
        if (!response.data.success) {
            throw new errors_1.CameraStreamingError('Failed to send WebRTC answer');
        }
    }
    // Utility methods
    setAccessToken(token) {
        this.accessToken = token;
    }
    setApiKey(apiKey) {
        this.config.apiKey = apiKey;
    }
    isAuthenticated() {
        return !!this.accessToken || !!this.config.apiKey;
    }
}
exports.CameraStreamingClient = CameraStreamingClient;
