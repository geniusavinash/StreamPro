import { EventEmitter } from 'events';
import { WebSocketConfig, WebSocketMessage, CameraStatusUpdate, DashboardUpdate, AlertNotification } from './types';
import { CameraStreamingError } from './errors';

export class WebSocketClient extends EventEmitter {
  private ws?: WebSocket;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimer?: NodeJS.Timeout;
  private subscriptions = new Set<string>();

  constructor(config: WebSocketConfig) {
    super();
    this.config = {
      reconnect: true,
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      ...config,
    };
  }

  async connect(): Promise<void> {
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
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            this.emit('error', new CameraStreamingError('Failed to parse message'));
          }
        };

        this.ws.onclose = (event) => {
          this.emit('disconnected', { code: event.code, reason: event.reason });
          
          if (this.config.reconnect && this.reconnectAttempts < this.config.maxReconnectAttempts!) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          this.emit('error', new CameraStreamingError('WebSocket error'));
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
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    this.emit('reconnecting', this.reconnectAttempts);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {
        // Reconnection failed, will try again if under limit
      });
    }, this.config.reconnectInterval);
  }

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'cameraStatusUpdate':
        this.emit('cameraStatusUpdate', message.data as CameraStatusUpdate);
        break;
      case 'dashboardUpdate':
        this.emit('dashboardUpdate', message.data as DashboardUpdate);
        break;
      case 'alert':
        this.emit('alert', message.data as AlertNotification);
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

  private send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  // Subscription methods
  subscribeToCameraUpdates(): void {
    this.subscribe('camera_updates');
  }

  subscribeToCamera(cameraId: string): void {
    this.subscribe(`camera_${cameraId}`);
  }

  subscribeToDashboard(): void {
    this.subscribe('dashboard');
  }

  subscribeToAlerts(): void {
    this.subscribe('alerts');
  }

  unsubscribeFromCamera(cameraId: string): void {
    this.unsubscribe(`camera_${cameraId}`);
  }

  unsubscribeFromAll(): void {
    this.subscriptions.forEach(topic => this.unsubscribe(topic));
  }

  private subscribe(topic: string): void {
    this.subscriptions.add(topic);
    this.send({
      type: 'subscribe',
      data: { topic },
      timestamp: new Date().toISOString(),
    });
  }

  private unsubscribe(topic: string): void {
    this.subscriptions.delete(topic);
    this.send({
      type: 'unsubscribe',
      data: { topic },
      timestamp: new Date().toISOString(),
    });
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}