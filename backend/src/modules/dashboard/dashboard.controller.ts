import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../../common/enums/permission.enum';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @RequirePermissions(Permission.DASHBOARD_VIEW)
  @ApiOperation({ summary: 'Get comprehensive dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
  })
  async getDashboardStats() {
    return this.dashboardService.getDashboardStats();
  }

  @Get('analytics/cameras')
  @RequirePermissions(Permission.DASHBOARD_ANALYTICS)
  @ApiOperation({ summary: 'Get camera analytics' })
  @ApiQuery({ 
    name: 'timeRange', 
    required: false, 
    enum: ['1h', '24h', '7d', '30d'],
    description: 'Time range for analytics (default: 24h)'
  })
  @ApiResponse({
    status: 200,
    description: 'Camera analytics retrieved successfully',
  })
  async getCameraAnalytics(
    @Query('timeRange') timeRange: '1h' | '24h' | '7d' | '30d' = '24h',
  ) {
    return this.dashboardService.getCameraAnalytics(timeRange);
  }

  @Get('analytics/recordings')
  @RequirePermissions(Permission.DASHBOARD_ANALYTICS)
  @ApiOperation({ summary: 'Get recording analytics' })
  @ApiQuery({ 
    name: 'timeRange', 
    required: false, 
    enum: ['1h', '24h', '7d', '30d'],
    description: 'Time range for analytics (default: 24h)'
  })
  @ApiResponse({
    status: 200,
    description: 'Recording analytics retrieved successfully',
  })
  async getRecordingAnalytics(
    @Query('timeRange') timeRange: '1h' | '24h' | '7d' | '30d' = '24h',
  ) {
    return this.dashboardService.getRecordingAnalytics(timeRange);
  }

  @Get('system/metrics')
  @RequirePermissions(Permission.SYSTEM_MONITORING)
  @ApiOperation({ summary: 'Get system performance metrics' })
  @ApiResponse({
    status: 200,
    description: 'System metrics retrieved successfully',
  })
  async getSystemMetrics() {
    return this.dashboardService.getSystemMetrics();
  }

  @Get('activity')
  @RequirePermissions(Permission.DASHBOARD_VIEW)
  @ApiOperation({ summary: 'Get recent activity feed' })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Number of activities to retrieve (default: 50, max: 100)'
  })
  @ApiResponse({
    status: 200,
    description: 'Activity feed retrieved successfully',
  })
  async getActivityFeed(
    @Query('limit') limit: number = 50,
  ) {
    const maxLimit = Math.min(limit, 100);
    const activities = await this.dashboardService.getActivityFeed(maxLimit);
    
    return {
      activities,
      total: activities.length,
      limit: maxLimit,
    };
  }

  @Get('health')
  @RequirePermissions(Permission.SYSTEM_MONITORING)
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({
    status: 200,
    description: 'System health status',
  })
  async getSystemHealth() {
    // This would integrate with the monitoring service
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: true,
        redis: true,
        streaming: true,
        recording: true,
        notifications: true,
      },
      uptime: process.uptime(),
      version: '1.0.0',
    };
  }
}