import { Injectable } from '@nestjs/common';
import { CameraRepository } from '../../database/repositories/camera.repository';
import { RecordingRepository } from '../../database/repositories/recording.repository';
import { AuditLogRepository } from '../../database/repositories/audit-log.repository';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly cameraRepository: CameraRepository,
    private readonly recordingRepository: RecordingRepository,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async getCameraAnalytics(timeRange?: string, cameraId?: string) {
    const endDate = new Date();
    const startDate = this.getStartDate(timeRange, endDate);

    const cameras = cameraId
      ? [await this.cameraRepository.findById(cameraId)].filter(Boolean) as any
      : await this.cameraRepository.findAll();

    const analytics = {
      totalCameras: cameras.length,
      onlineCameras: cameras.filter(c => c.streamStatus === 'online').length,
      offlineCameras: cameras.filter(c => c.streamStatus === 'offline').length,
      recordingCameras: cameras.filter(c => c.isRecording).length,
      camerasByStatus: {
        online: cameras.filter(c => c.streamStatus === 'online').length,
        offline: cameras.filter(c => c.streamStatus === 'offline').length,
        connecting: cameras.filter(c => c.streamStatus === 'connecting').length,
        error: cameras.filter(c => c.streamStatus === 'error').length,
      },
      camerasByLocation: this.groupCamerasByLocation(cameras),
      uptimeStats: await this.calculateUptimeStats(cameras, startDate, endDate),
    };

    return {
      success: true,
      data: analytics,
      timeRange: { startDate, endDate },
    };
  }

  async getRecordingAnalytics(timeRange?: string, cameraId?: string) {
    const endDate = new Date();
    const startDate = this.getStartDate(timeRange, endDate);

    const recordings = await this.recordingRepository.findByDateRange(
      startDate,
      endDate,
    );

    // Filter by camera if specified
    const filteredRecordings = cameraId 
      ? recordings.filter(r => r.cameraId === cameraId)
      : recordings;

    const totalSize = filteredRecordings.reduce((sum, r) => sum + r.fileSize, 0);
    const totalDuration = filteredRecordings.reduce((sum, r) => sum + r.duration, 0);

    const analytics = {
      totalRecordings: recordings.length,
      totalSize: totalSize,
      totalDuration: totalDuration,
      averageFileSize: recordings.length > 0 ? totalSize / recordings.length : 0,
      averageDuration: recordings.length > 0 ? totalDuration / recordings.length : 0,
      recordingsByCamera: this.groupRecordingsByCamera(recordings),
      recordingsByStorageTier: this.groupRecordingsByStorageTier(recordings),
      dailyRecordingStats: this.calculateDailyRecordingStats(recordings, startDate, endDate),
    };

    return {
      success: true,
      data: analytics,
      timeRange: { startDate, endDate },
    };
  }

  async getStreamingAnalytics(timeRange?: string, cameraId?: string) {
    const endDate = new Date();
    const startDate = this.getStartDate(timeRange, endDate);

    // This would typically come from streaming metrics stored in Redis or a time-series database
    // For now, we'll return mock data structure
    const analytics = {
      totalStreamingSessions: 0,
      activeStreams: 0,
      averageBitrate: 0,
      averageViewerCount: 0,
      streamQualityMetrics: {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
      },
      bandwidthUsage: {
        total: 0,
        peak: 0,
        average: 0,
      },
      streamingErrors: 0,
      connectionDrops: 0,
    };

    return {
      success: true,
      data: analytics,
      timeRange: { startDate, endDate },
    };
  }

  async getStorageAnalytics(timeRange?: string) {
    const endDate = new Date();
    const startDate = this.getStartDate(timeRange, endDate);

    const recordings = await this.recordingRepository.findByDateRange(startDate, endDate);
    
    const storageByTier = recordings.reduce((acc, recording) => {
      const tier = recording.storageTier;
      if (!acc[tier]) {
        acc[tier] = { count: 0, size: 0 };
      }
      acc[tier].count++;
      acc[tier].size += recording.fileSize;
      return acc;
    }, {} as Record<string, { count: number; size: number }>);

    const totalSize = recordings.reduce((sum, r) => sum + r.fileSize, 0);

    const analytics = {
      totalStorageUsed: totalSize,
      storageByTier,
      storageGrowthRate: await this.calculateStorageGrowthRate(startDate, endDate),
      retentionPolicyStats: await this.calculateRetentionStats(),
      costAnalysis: this.calculateStorageCosts(storageByTier),
    };

    return {
      success: true,
      data: analytics,
      timeRange: { startDate, endDate },
    };
  }

  async getSystemAnalytics(timeRange?: string) {
    const endDate = new Date();
    const startDate = this.getStartDate(timeRange, endDate);

    // This would typically come from system monitoring tools
    const analytics = {
      systemUptime: '99.9%',
      cpuUsage: {
        current: 45,
        average: 42,
        peak: 78,
      },
      memoryUsage: {
        current: 68,
        average: 65,
        peak: 85,
      },
      diskUsage: {
        current: 72,
        available: 28,
      },
      networkThroughput: {
        incoming: 125.5, // Mbps
        outgoing: 89.2,
      },
      apiRequestStats: await this.getApiRequestStats(startDate, endDate),
      errorRates: await this.getErrorRates(startDate, endDate),
    };

    return {
      success: true,
      data: analytics,
      timeRange: { startDate, endDate },
    };
  }

  async getAlertAnalytics(timeRange?: string) {
    const endDate = new Date();
    const startDate = this.getStartDate(timeRange, endDate);

    // This would come from an alerts/notifications system
    const analytics = {
      totalAlerts: 0,
      alertsByType: {
        cameraOffline: 0,
        recordingFailure: 0,
        storageLimit: 0,
        systemError: 0,
      },
      alertsByPriority: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      resolvedAlerts: 0,
      averageResolutionTime: 0,
      alertTrends: [],
    };

    return {
      success: true,
      data: analytics,
      timeRange: { startDate, endDate },
    };
  }

  private getStartDate(timeRange: string, endDate: Date): Date {
    const start = new Date(endDate);
    
    switch (timeRange) {
      case '1h':
        start.setHours(start.getHours() - 1);
        break;
      case '24h':
        start.setDate(start.getDate() - 1);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      default:
        start.setDate(start.getDate() - 7); // Default to 7 days
    }
    
    return start;
  }

  private groupCamerasByLocation(cameras: any[]): Record<string, number> {
    return cameras.reduce((acc, camera) => {
      const location = camera.location || 'Unknown';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {});
  }

  private groupRecordingsByCamera(recordings: any[]): Record<string, { count: number; size: number }> {
    return recordings.reduce((acc, recording) => {
      const cameraName = recording.camera?.name || 'Unknown';
      if (!acc[cameraName]) {
        acc[cameraName] = { count: 0, size: 0 };
      }
      acc[cameraName].count++;
      acc[cameraName].size += recording.fileSize;
      return acc;
    }, {});
  }

  private groupRecordingsByStorageTier(recordings: any[]): Record<string, { count: number; size: number }> {
    return recordings.reduce((acc, recording) => {
      const tier = recording.storageTier;
      if (!acc[tier]) {
        acc[tier] = { count: 0, size: 0 };
      }
      acc[tier].count++;
      acc[tier].size += recording.fileSize;
      return acc;
    }, {});
  }

  private calculateDailyRecordingStats(recordings: any[], startDate: Date, endDate: Date) {
    const dailyStats = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayStart = new Date(current);
      const dayEnd = new Date(current);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      const dayRecordings = recordings.filter(r => {
        const recordingDate = new Date(r.startTime);
        return recordingDate >= dayStart && recordingDate < dayEnd;
      });
      
      dailyStats.push({
        date: dayStart.toISOString().split('T')[0],
        count: dayRecordings.length,
        size: dayRecordings.reduce((sum, r) => sum + r.fileSize, 0),
        duration: dayRecordings.reduce((sum, r) => sum + r.duration, 0),
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return dailyStats;
  }

  private async calculateUptimeStats(cameras: any[], startDate: Date, endDate: Date) {
    // This would typically query historical status data
    // For now, return mock data
    return cameras.map(camera => ({
      cameraId: camera.id,
      cameraName: camera.name,
      uptime: Math.random() * 100, // Mock uptime percentage
      totalDowntime: Math.random() * 3600, // Mock downtime in seconds
      incidents: Math.floor(Math.random() * 5), // Mock incident count
    }));
  }

  private async calculateStorageGrowthRate(startDate: Date, endDate: Date): Promise<number> {
    // This would calculate the rate of storage growth over time
    // For now, return a mock growth rate
    return 2.5; // 2.5% growth rate
  }

  private async calculateRetentionStats() {
    // This would analyze retention policy effectiveness
    return {
      hotStorageRetention: 30, // days
      warmStorageRetention: 90, // days
      coldStorageRetention: 365, // days
      autoArchivedRecordings: 0,
      deletedRecordings: 0,
    };
  }

  private calculateStorageCosts(storageByTier: Record<string, { count: number; size: number }>) {
    // Mock cost calculation based on storage tiers
    const costs = {
      hot: 0.023, // per GB per month
      warm: 0.0125, // per GB per month
      cold: 0.004, // per GB per month
    };

    const totalCost = Object.entries(storageByTier).reduce((total, [tier, data]) => {
      const sizeInGB = data.size / (1024 * 1024 * 1024);
      const tierCost = costs[tier as keyof typeof costs] || 0;
      return total + (sizeInGB * tierCost);
    }, 0);

    return {
      totalMonthlyCost: totalCost,
      costByTier: Object.entries(storageByTier).reduce((acc, [tier, data]) => {
        const sizeInGB = data.size / (1024 * 1024 * 1024);
        const tierCost = costs[tier as keyof typeof costs] || 0;
        acc[tier] = sizeInGB * tierCost;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  private async getApiRequestStats(startDate: Date, endDate: Date) {
    // This would query API request logs
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      requestsByEndpoint: {},
    };
  }

  private async getErrorRates(startDate: Date, endDate: Date) {
    // This would query error logs
    return {
      totalErrors: 0,
      errorRate: 0,
      errorsByType: {},
      criticalErrors: 0,
    };
  }
}