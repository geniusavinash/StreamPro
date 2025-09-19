"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketClient = void 0;
const events_1 = require("events");
const errors_1 = require("./errors");
class WebSocketClient extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.reconnectAttempts = 0;
        this.subscriptions = new Set();
        this.config = {
            reconnect: true,
            reconnectInterval: 5000,
            maxReconnectAttempts: 10,
            ...config,
        };
    }
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.config.url);
                this.ws.onopen = () => {
                    this.reconnectAttempts = 0;
                    this.emit('connected');
                    resolve();
                };
                this.ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        this.handleMessage(message);
                    }
                    catch (error) {
                        this.emit('error', new errors_1.CameraStreamingError('Failed to parse message'));
                    }
                };
                this.ws.onclose = (event) => {
                    this.emit('disconnected', { code: event.code, reason: event.reason });
                    if (this.config.reconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
                        this.scheduleReconnect();
                    }
                };
                this.ws.onerror = (error) => {
                    this.emit('error', new errors_1.CameraStreamingError('WebSocket error'));
                    reject(error);
                };
                // Set authentication header
                if (this.config.token) {
                    this.ws.addEventListener('open', () => {
                        this.send({
                            type: 'auth',
                            data: { token: this.config.token },
                            timestamp: new Date().toISOString(),
                        });
                    });
                }
            }
            catch (error) {
                reject(error);
            }
        });
    }
    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        if (this.ws) {
            this.ws.close();
            this.ws = undefined;
        }
    }
    scheduleReconnect() {
        this.reconnectAttempts++;
        this.emit('reconnecting', this.reconnectAttempts);
        this.reconnectTimer = setTimeout(() => {
            this.connect().catch(() => {
                // Reconnection failed, will try again if under limit
            });
        }, this.config.reconnectInterval);
    }
    handleMessage(message) {
        switch (message.type) {
            case 'cameraStatusUpdate':
                this.emit('cameraStatusUpdate', message.data);
                break;
            case 'dashboardUpdate':
                this.emit('dashboardUpdate', message.data);
                break;
            case 'alert':
                this.emit('alert', message.data);
                break;
            case 'streamQualityUpdate':
                this.emit('streamQualityUpdate', message.data);
                break;
            case 'recordingEvent':
                this.emit('recordingEvent', message.data);
                break;
            default:
                this.emit('message', message);
        }
    }
    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }
    // Subscription methods
    subscribeToCameraUpdates() {
        this.subscribe('camera_updates');
    }
    subscribeToCamera(cameraId) {
        this.subscribe(`camera_${cameraId}`);
    }
    subscribeToDashboard() {
        this.subscribe('dashboard');
    }
    subscribeToAlerts() {
        this.subscribe('alerts');
    }
    unsubscribeFromCamera(cameraId) {
        this.unsubscribe(`camera_${cameraId}`);
    }
    unsubscribeFromAll() {
        this.subscriptions.forEach(topic => this.unsubscribe(topic));
    }
    subscribe(topic) {
        this.subscriptions.add(topic);
        this.send({
            type: 'subscribe',
            data: { topic },
            timestamp: new Date().toISOString(),
        });
    }
    unsubscribe(topic) {
        this.subscriptions.delete(topic);
        this.send({
            type: 'unsubscribe',
            data: { topic },
            timestamp: new Date().toISOString(),
        });
    }
    isConnected() {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}
exports.WebSocketClient = WebSocketClient;
