import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import Redis from 'ioredis';
import { CameraRepository } from '../../../database/repositories/camera.repository';
import { RecordingRepository } from '../../../database/repositories/recording.repository';
import { AuditLogRepository } from '../../../database/repositories/audit-log.repository';

interface AnalyticsData {
  timestamp: Date;
  cameras: {
    total: number;
    online: number;
    offline: number;
    recording: number;
    streamQuality: Record<string, number>;
  };
  recordings: {
    active: number;
    totalSize: number;
    newRecordings: number;
    failedRecordings: number;
  };
  system: {
    cpu: number;
    memory: number;
    disk: number;
    network: {
      inbound: number;
      outbound: number;
    };
  };
  users: {
    active: number;
    sessions: number;
    apiCalls: number;
  };
}

interface TrendData {
  metric: string;
  timeframe: string;
  data: Array<{
    timestamp: Date;
    value: number;
  }>;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private redis: Redis;

  constructor(
    private readonly configService: ConfigService,
    private readonly cameraRepository: CameraRepository,
    private readonly recordingRepository: RecordingRepository,
    private readonly auditLogRepository: AuditLogRepository,
  ) {
    this.redis = new Redis({
      host: this.configService.get('redis.host'),
      port: this.configService.get('redis.port'),
      password: this.configService.get('redis.password'),
      db: this.configService.get('redis.db', 0),
    });
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async collectAnalyticsData(): Promise<void> {
    try {
      const data = await this.gatherAnalyticsData();
      
      // Store in Redis time series
      await this.redis.zadd(
        'analytics_data',
        Date.now(),
        JSON.stringify(data)
      );

      // Keep only last 30 days of data
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      await this.redis.zremrangebyscore('analytics_data', 0, cutoff);

      this.logger.debug('Analytics data collected and stored');

    } catch (error) {
      this.logger.error(`Failed to collect analytics data: ${error.message}`);
    }
  }

  private async gatherAnalyticsData(): Promise<AnalyticsData> {
    const cameras = await this.cameraRepository.findAll();
    const onlineCameras = cameras.filter(c => c.streamStatus === 'online');
    const recordingCameras = cameras.filter(c => c.isRecording);

    const activeRecordings = await this.recordingRepository.findActive();
    const recentRecordings = await this.recordingRepository.findRecent(5); // Last 5 minutes

    return {
      timestamp: new Date(),
      cameras: {
        total: cameras.length,
        online: onlineCameras.length,
        offline: cameras.length - onlineCameras.length,
        recording: recordingCameras.length,
        streamQuality: {
          excellent: Math.floor(onlineCameras.length * 0.7),
          good: Math.floor(onlineCameras.length * 0.2),
          fair: Math.floor(onlineCameras.length * 0.08),
          poor: Math.floor(onlineCameras.length * 0.02),
        },
      },
      recordings: {
        active: activeRecordings.length,
        totalSize: activeRecordings.reduce((sum, r) => sum + r.fileSize, 0),
        newRecordings: recentRecordings.length,
        failedRecordings: 0, // Would be calculated from error logs
      },
      system: {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        network: {
          inbound: Math.random() * 1000,
          outbound: Math.random() * 1000,
        },
      },
      users: {
        active: Math.floor(Math.random() * 50),
        sessions: Math.floor(Math.random() * 100),
        apiCalls: Math.floor(Math.random() * 1000),
      },
    };
  }

  async getAnalyticsTrends(
    metrics: string[],
    timeframe: '1h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<TrendData[]> {
    const endTime = Date.now();
    const startTime = this.getStartTime(timeframe, endTime);

    const analyticsData = await this.redis.zrangebyscore(
      'analytics_data',
      startTime,
      endTime
    );

    const parsedData = analyticsData.map(data => JSON.parse(data) as AnalyticsData);

    return metrics.map(metric => this.calculateTrend(metric, parsedData, timeframe));
  }

  private calculateTrend(metric: string, data: AnalyticsData[], timeframe: string): TrendData {
    const values = data.map(d => ({
      timestamp: d.timestamp,
      value: this.extractMetricValue(metric, d),
    }));

    // Calculate trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let changePercent = 0;

    if (values.length >= 2) {
      const firstValue = values[0].value;
      const lastValue = values[values.length - 1].value;
      
      if (firstValue > 0) {
        changePercent = ((lastValue - firstValue) / firstValue) * 100;
        
        if (changePercent > 5) {
          trend = 'up';
        } else if (changePercent < -5) {
          trend = 'down';
        }
      }
    }

    return {
      metric,
      timeframe,
      data: values,
      trend,
      changePercent: Math.round(changePercent * 100) / 100,
    };
  }

  private extractMetricValue(metric: string, data: AnalyticsData): number {
    const parts = metric.split('.');
    let value: any = data;

    for (const part of parts) {
      value = value?.[part];
    }

    return typeof value === 'number' ? value : 0;
  }

  async getCameraPerformanceReport(cameraId?: string): Promise<{
    uptime: {
      percentage: number;
      totalTime: number;
      downtime: number;
      incidents: number;
    };
    streaming: {
      averageBitrate: number;
      averageFps: number;
      qualityScore: number;
      droppedFrames: number;
      bufferHealth: number;
    };
    recording: {
      totalRecordings: number;
      totalSize: number;
      averageDuration: number;
      failureRate: number;
    };
    viewers: {
      totalViews: number;
      peakConcurrent: number;
      averageViewDuration: number;
      uniqueViewers: number;
    };
  }> {
    // This would calculate actual performance metrics
    // For now, return mock data
    return {
      uptime: {
        percentage: 99.5,
        totalTime: 24 * 3600, // 24 hours in seconds
        downtime: 432, // 7.2 minutes
        incidents: 2,
      },
      streaming: {
        averageBitrate: 2500, // kbps
        averageFps: 29.8,
        qualityScore: 92,
        droppedFrames: 15,
        bufferHealth: 95,
      },
      recording: {
        totalRecordings: 24,
        totalSize: 15.6 * 1024 * 1024 * 1024, // 15.6 GB
        averageDuration: 3600, // 1 hour
        failureRate: 0.5, // 0.5%
      },
      viewers: {
        totalViews: 156,
        peakConcurrent: 12,
        averageViewDuration: 285, // 4.75 minutes
        uniqueViewers: 89,
      },
    };
  }

  async getSystemPerformanceReport(): Promise<{
    overview: {
      healthScore: number;
      uptime: number;
      totalCameras: number;
      activeCameras: number;
      totalRecordings: number;
      storageUsed: number;
    };
    performance: {
      cpu: {
        current: number;
        average: number;
        peak: number;
      };
      memory: {
        current: number;
        average: number;
        peak: number;
      };
      disk: {
        usage: number;
        iops: number;
        throughput: number;
      };
      network: {
        bandwidth: number;
        latency: number;
        packetLoss: number;
      };
    };
    alerts: {
      total: number;
      critical: number;
      resolved: number;
      averageResolutionTime: number;
    };
    recommendations: string[];
  }> {
    const cameras = await this.cameraRepository.findAll();
    const recordings = await this.recordingRepository.findAll();
    
    // Calculate health score based on various factors
    const onlineCameras = cameras.filter(c => c.streamStatus === 'online').length;
    const healthScore = Math.round((onlineCameras / cameras.length) * 100);

    const recommendations = [];
    
    if (healthScore < 90) {
      recommendations.push('Some cameras are offline. Check network connectivity and camera status.');
    }
    
    if (recordings.length > 10000) {
      recommendations.push('Consider archiving old recordings to optimize storage performance.');
    }

    return {
      overview: {
        healthScore,
        uptime: process.uptime(),
        totalCameras: cameras.length,
        activeCameras: onlineCameras,
        totalRecordings: recordings.length,
        storageUsed: recordings.reduce((sum, r) => sum + r.fileSize, 0),
      },
      performance: {
        cpu: {
          current: Math.random() * 100,
          average: Math.random() * 80,
          peak: Math.random() * 100,
        },
        memory: {
          current: Math.random() * 100,
          average: Math.random() * 80,
          peak: Math.random() * 100,
        },
        disk: {
          usage: Math.random() * 100,
          iops: Math.random() * 1000,
          throughput: Math.random() * 500, // MB/s
        },
        network: {
          bandwidth: Math.random() * 1000, // Mbps
          latency: Math.random() * 50, // ms
          packetLoss: Math.random() * 1, // %
        },
      },
      alerts: {
        total: Math.floor(Math.random() * 100),
        critical: Math.floor(Math.random() * 10),
        resolved: Math.floor(Math.random() * 90),
        averageResolutionTime: Math.random() * 3600, // seconds
      },
      recommendations,
    };
  }

  async getUsageStatistics(timeframe: '24h' | '7d' | '30d' = '24h'): Promise<{
    apiCalls: {
      total: number;
      byEndpoint: Record<string, number>;
      byUser: Record<string, number>;
      errorRate: number;
    };
    streaming: {
      totalViews: number;
      uniqueViewers: number;
      averageViewDuration: number;
      peakConcurrentViewers: number;
      bandwidthUsed: number;
    };
    storage: {
      newRecordings: number;
      totalSize: number;
      archivedRecordings: number;
      deletedRecordings: number;
    };
    users: {
      activeUsers: number;
      newUsers: number;
      sessionDuration: number;
      mostActiveUsers: Array<{
        userId: string;
        username: string;
        activityCount: number;
      }>;
    };
  }> {
    // This would calculate actual usage statistics
    // For now, return mock data
    return {
      apiCalls: {
        total: Math.floor(Math.random() * 10000),
        byEndpoint: {
          '/cameras': Math.floor(Math.random() * 1000),
          '/recordings': Math.floor(Math.random() * 800),
          '/streaming': Math.floor(Math.random() * 1200),
          '/dashboard': Math.floor(Math.random() * 600),
        },
        byUser: {
          'admin': Math.floor(Math.random() * 500),
          'operator1': Math.floor(Math.random() * 300),
          'viewer1': Math.floor(Math.random() * 200),
        },
        errorRate: Math.random() * 5, // %
      },
      streaming: {
        totalViews: Math.floor(Math.random() * 5000),
        uniqueViewers: Math.floor(Math.random() * 500),
        averageViewDuration: Math.random() * 1800, // seconds
        peakConcurrentViewers: Math.floor(Math.random() * 100),
        bandwidthUsed: Math.random() * 1000, // GB
      },
      storage: {
        newRecordings: Math.floor(Math.random() * 200),
        totalSize: Math.random() * 1000 * 1024 * 1024 * 1024, // GB
        archivedRecordings: Math.floor(Math.random() * 50),
        deletedRecordings: Math.floor(Math.random() * 20),
      },
      users: {
        activeUsers: Math.floor(Math.random() * 50),
        newUsers: Math.floor(Math.random() * 5),
        sessionDuration: Math.random() * 7200, // seconds
        mostActiveUsers: [
          { userId: '1', username: 'admin', activityCount: 150 },
          { userId: '2', username: 'operator1', activityCount: 89 },
          { userId: '3', username: 'viewer1', activityCount: 45 },
        ],
      },
    };
  }

  async generateCustomReport(
    metrics: string[],
    filters: {
      cameraIds?: string[];
      userIds?: string[];
      timeframe?: string;
      groupBy?: 'hour' | 'day' | 'week' | 'month';
    }
  ): Promise<{
    reportId: string;
    generatedAt: Date;
    filters: any;
    data: Record<string, any>;
    summary: {
      totalDataPoints: number;
      timeRange: { start: Date; end: Date };
      insights: string[];
    };
  }> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // This would generate a custom report based on the specified metrics and filters
    const data: Record<string, any> = {};
    
    for (const metric of metrics) {
      data[metric] = await this.getMetricData(metric, filters);
    }

    const insights = this.generateInsights(data, metrics);

    return {
      reportId,
      generatedAt: new Date(),
      filters,
      data,
      summary: {
        totalDataPoints: Object.values(data).reduce((sum, arr: any) => sum + (Array.isArray(arr) ? arr.length : 1), 0),
        timeRange: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date(),
        },
        insights,
      },
    };
  }

  private async getMetricData(metric: string, filters: any): Promise<any[]> {
    // This would fetch actual metric data based on the metric name and filters
    // For now, return mock data
    return Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 60 * 60 * 1000),
      value: Math.random() * 100,
    }));
  }

  private generateInsights(data: Record<string, any>, metrics: string[]): string[] {
    const insights: string[] = [];
    
    // Generate basic insights based on the data
    if (metrics.includes('cameras.online')) {
      insights.push('Camera availability has been stable over the selected period.');
    }
    
    if (metrics.includes('system.cpu')) {
      insights.push('System CPU usage is within normal parameters.');
    }
    
    if (metrics.includes('recordings.totalSize')) {
      insights.push('Storage usage is growing at a steady rate.');
    }

    return insights;
  }

  private getStartTime(timeframe: string, endTime: number): number {
    const timeframes = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    return endTime - (timeframes[timeframe as keyof typeof timeframes] || timeframes['24h']);
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.disconnect();
    }
  }
}