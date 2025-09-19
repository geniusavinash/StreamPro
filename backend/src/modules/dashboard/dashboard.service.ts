import { Injectable } from '@nestjs/common';
import { CameraRepository } from '../../database/repositories/camera.repository';
import { RecordingRepository } from '../../database/repositories/recording.repository';
import { ApiTokenRepository } from '../../database/repositories/api-token.repository';
import { UserRepository } from '../../database/repositories/user.repository';

@Injectable()
export class DashboardService {
  constructor(
    private readonly cameraRepository: CameraRepository,
    private readonly recordingRepository: RecordingRepository,
    private readonly apiTokenRepository: ApiTokenRepository,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(): Promise<{
    cameras: {
      total: number;
      online: number;
      offline: number;
      recording: number;
      byStatus: Record<string, number>;
    };
    recordings: {
      totalCount: number;
      totalSize: number;
      activeSessions: number;
      recentCount: number;
      byTier: Record<string, { size: number; count: number }>;
    };
    users: {
      totalCount: number;
      activeCount: number;
      byRole: Record<string, number>;
      connectedCount: number;
    };
    apiTokens: {
      total: number;
      active: number;
      expired: number;
      recentlyUsed: number;
    };
    system: {
      uptime: number;
      memory: NodeJS.MemoryUsage;
      streamMetrics: {
        totalStreams: number;
        healthyStreams: number;
        warningStreams: number;
        criticalStreams: number;
        averageMetrics: {
          fps: number;
          bitrate: number;
          droppedFrames: number;
        };
      };
      notifications: {
        connectedUsers: number;
        usersByRole: Record<string, number>;
        configStatus: {
          websocket: boolean;
          email: boolean;
          sms: boolean;
          webhook: boolean;
        };
      };
    };
    alerts: {
      recent: any[];
      byType: Record<string, number>;
      bySeverity: Record<string, number>;
    };
  }> {
    // Get camera statistics
    const cameraStats = await this.cameraRepository.getDashboardStats();
    
    // Get recording statistics
    const recordingStats = await this.recordingRepository.getStorageStats();
    
    // Get user statistics
    const userRoleStats = await this.userRepository.countByRole();
    const totalUsers = Object.values(userRoleStats).reduce((sum, count) => sum + count, 0);
    
    // Get API token statistics
    const tokenStats = await this.apiTokenRepository.getUsageStats();
    
    // Mock system health (monitoring service disabled)
    const systemHealth = {
      systemUptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
    
    // Mock stream metrics (monitoring service disabled)
    const streamMetrics = {
      totalStreams: 0,
      healthyStreams: 0,
      warningStreams: 0,
      criticalStreams: 0,
      averageMetrics: {
        fps: 0,
        bitrate: 0,
        droppedFrames: 0,
      },
    };
    
    // Mock notification statistics (notifications service disabled)
    const notificationStats = {
      connectedUsers: 0,
      usersByRole: {},
      configStatus: {
        websocket: false,
        email: false,
        sms: false,
        webhook: false,
      },
    };

    return {
      cameras: {
        total: cameraStats.total,
        online: cameraStats.online,
        offline: cameraStats.offline,
        recording: cameraStats.recording,
        byStatus: {
          online: cameraStats.online,
          offline: cameraStats.offline,
          connecting: 0, // Would be calculated from actual data
          error: 0, // Would be calculated from actual data
        },
      },
      recordings: {
        totalCount: recordingStats.totalCount,
        totalSize: recordingStats.totalSize,
        activeSessions: 0, // Would be from recording service
        recentCount: 0, // Would be calculated for last 24 hours
        byTier: recordingStats.byTier,
      },
      users: {
        totalCount: totalUsers,
        activeCount: totalUsers, // All users are considered active for now
        byRole: userRoleStats,
        connectedCount: notificationStats.connectedUsers,
      },
      apiTokens: {
        total: tokenStats.total,
        active: tokenStats.active,
        expired: tokenStats.expired,
        recentlyUsed: tokenStats.recentlyUsed,
      },
      system: {
        uptime: systemHealth.systemUptime,
        memory: systemHealth.memoryUsage,
        streamMetrics,
        notifications: notificationStats,
      },
      alerts: {
        recent: [], // Would be from audit logs
        byType: {}, // Would be calculated from recent alerts
        bySeverity: {}, // Would be calculated from recent alerts
      },
    };
  }

  /**
   * Get camera analytics
   */
  async getCameraAnalytics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
    uptimeStats: Array<{
      cameraId: string;
      cameraName: string;
      uptime: number;
      totalTime: number;
      uptimePercentage: number;
    }>;
    streamQuality: Array<{
      cameraId: string;
      cameraName: string;
      averageFps: number;
      averageBitrate: number;
      droppedFrames: number;
      qualityScore: number;
    }>;
    viewerStats: Array<{
      cameraId: string;
      cameraName: string;
      totalViews: number;
      peakViewers: number;
      averageViewDuration: number;
    }>;
  }> {
    // Placeholder implementation - would calculate from actual metrics
    const cameras = await this.cameraRepository.findAll({ isActive: true });
    
    const uptimeStats = cameras.map(camera => ({
      cameraId: camera.id,
      cameraName: camera.name,
      uptime: Math.random() * 24 * 3600, // Placeholder
      totalTime: 24 * 3600,
      uptimePercentage: Math.random() * 100,
    }));

    const streamQuality = cameras.map(camera => {
      // Mock metrics (monitoring service disabled)
      return {
        cameraId: camera.id,
        cameraName: camera.name,
        averageFps: 30,
        averageBitrate: 2000,
        droppedFrames: 0,
        qualityScore: 95, // Mock quality score
      };
    });

    const viewerStats = cameras.map(camera => ({
      cameraId: camera.id,
      cameraName: camera.name,
      totalViews: Math.floor(Math.random() * 1000),
      peakViewers: Math.floor(Math.random() * 50),
      averageViewDuration: Math.random() * 3600,
    }));

    return {
      uptimeStats,
      streamQuality,
      viewerStats,
    };
  }

  /**
   * Get recording analytics
   */
  async getRecordingAnalytics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
    storageGrowth: Array<{
      date: string;
      totalSize: number;
      newRecordings: number;
    }>;
    recordingsByCamera: Array<{
      cameraId: string;
      cameraName: string;
      recordingCount: number;
      totalSize: number;
      averageDuration: number;
    }>;
    storageDistribution: {
      hot: { size: number; percentage: number };
      warm: { size: number; percentage: number };
      cold: { size: number; percentage: number };
      archived: { size: number; percentage: number };
    };
  }> {
    const storageStats = await this.recordingRepository.getStorageStats();
    const cameras = await this.cameraRepository.findAll({ isActive: true });

    // Placeholder data - would be calculated from actual recordings
    const storageGrowth = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalSize: Math.random() * 1000000000, // Random size in bytes
      newRecordings: Math.floor(Math.random() * 100),
    })).reverse();

    const recordingsByCamera = cameras.map(camera => ({
      cameraId: camera.id,
      cameraName: camera.name,
      recordingCount: Math.floor(Math.random() * 100),
      totalSize: Math.random() * 100000000,
      averageDuration: Math.random() * 3600,
    }));

    const totalSize = storageStats.totalSize;
    const storageDistribution = {
      hot: {
        size: storageStats.byTier.hot.size,
        percentage: totalSize > 0 ? (storageStats.byTier.hot.size / totalSize) * 100 : 0,
      },
      warm: {
        size: storageStats.byTier.warm.size,
        percentage: totalSize > 0 ? (storageStats.byTier.warm.size / totalSize) * 100 : 0,
      },
      cold: {
        size: storageStats.byTier.cold.size,
        percentage: totalSize > 0 ? (storageStats.byTier.cold.size / totalSize) * 100 : 0,
      },
      archived: {
        size: storageStats.byTier.archived.size,
        percentage: totalSize > 0 ? (storageStats.byTier.archived.size / totalSize) * 100 : 0,
      },
    };

    return {
      storageGrowth,
      recordingsByCamera,
      storageDistribution,
    };
  }

  /**
   * Get system performance metrics
   */
  async getSystemMetrics(): Promise<{
    cpu: {
      usage: number;
      loadAverage: number[];
    };
    memory: {
      used: number;
      total: number;
      percentage: number;
      heapUsed: number;
      heapTotal: number;
    };
    network: {
      inbound: number;
      outbound: number;
      connections: number;
    };
    storage: {
      used: number;
      total: number;
      percentage: number;
    };
    processes: {
      active: number;
      total: number;
    };
  }> {
    const memoryUsage = process.memoryUsage();
    
    return {
      cpu: {
        usage: Math.random() * 100, // Would use actual CPU monitoring
        loadAverage: [Math.random(), Math.random(), Math.random()],
      },
      memory: {
        used: memoryUsage.rss,
        total: memoryUsage.rss * 2, // Placeholder
        percentage: (memoryUsage.rss / (memoryUsage.rss * 2)) * 100,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
      },
      network: {
        inbound: Math.random() * 1000000, // Bytes per second
        outbound: Math.random() * 1000000,
        connections: Math.floor(Math.random() * 100),
      },
      storage: {
        used: Math.random() * 1000000000000, // 1TB
        total: 1000000000000,
        percentage: Math.random() * 100,
      },
      processes: {
        active: Math.floor(Math.random() * 50),
        total: Math.floor(Math.random() * 100),
      },
    };
  }

  /**
   * Get recent activity feed
   */
  async getActivityFeed(limit: number = 50): Promise<Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: Date;
    severity?: string;
    cameraId?: string;
    userId?: string;
    data?: any;
  }>> {
    // This would fetch from audit logs in a real implementation
    // For now, return placeholder data
    return Array.from({ length: limit }, (_, i) => ({
      id: `activity_${i}`,
      type: ['camera_online', 'recording_started', 'user_login', 'alert_triggered'][Math.floor(Math.random() * 4)],
      title: 'Sample Activity',
      description: `Sample activity description ${i}`,
      timestamp: new Date(Date.now() - i * 60000), // i minutes ago
      severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    }));
  }
}