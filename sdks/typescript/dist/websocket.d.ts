import { EventEmitter } from 'events';
import { WebSocketConfig } from './types';
export declare class WebSocketClient extends EventEmitter {
    private ws?;
    private config;
    private reconnectAttempts;
    private reconnectTimer?;
    private subscriptions;
    constructor(config: WebSocketConfig);
    connect(): Promise<void>;
    disconnect(): void;
    private scheduleReconnect;
    private handleMessage;
    private send;
    subscribeToCameraUpdates(): void;
    subscribeToCamera(cameraId: string): void;
    subscribeToDashboard(): void;
    subscribeToAlerts(): void;
    unsubscribeFromCamera(cameraId: string): void;
    unsubscribeFromAll(): void;
    private subscribe;
    private unsubscribe;
    isConnected(): boolean;
}
