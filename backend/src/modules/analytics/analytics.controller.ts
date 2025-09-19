import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../../common/enums/permission.enum';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('cameras')
  @RequirePermissions(Permission.VIEW_ANALYTICS)
  @ApiOperation({ summary: 'Get camera analytics' })
  @ApiResponse({ status: 200, description: 'Camera analytics retrieved successfully' })
  async getCameraAnalytics(
    @Query('timeRange') timeRange?: string,
    @Query('cameraId') cameraId?: string,
  ) {
    return this.analyticsService.getCameraAnalytics(timeRange, cameraId);
  }

  @Get('recordings')
  @RequirePermissions(Permission.VIEW_ANALYTICS)
  @ApiOperation({ summary: 'Get recording analytics' })
  @ApiResponse({ status: 200, description: 'Recording analytics retrieved successfully' })
  async getRecordingAnalytics(
    @Query('timeRange') timeRange?: string,
    @Query('cameraId') cameraId?: string,
  ) {
    return this.analyticsService.getRecordingAnalytics(timeRange, cameraId);
  }

  @Get('streaming')
  @RequirePermissions(Permission.VIEW_ANALYTICS)
  @ApiOperation({ summary: 'Get streaming analytics' })
  @ApiResponse({ status: 200, description: 'Streaming analytics retrieved successfully' })
  async getStreamingAnalytics(
    @Query('timeRange') timeRange?: string,
    @Query('cameraId') cameraId?: string,
  ) {
    return this.analyticsService.getStreamingAnalytics(timeRange, cameraId);
  }

  @Get('storage')
  @RequirePermissions(Permission.VIEW_ANALYTICS)
  @ApiOperation({ summary: 'Get storage analytics' })
  @ApiResponse({ status: 200, description: 'Storage analytics retrieved successfully' })
  async getStorageAnalytics(@Query('timeRange') timeRange?: string) {
    return this.analyticsService.getStorageAnalytics(timeRange);
  }

  @Get('system')
  @RequirePermissions(Permission.VIEW_ANALYTICS)
  @ApiOperation({ summary: 'Get system performance analytics' })
  @ApiResponse({ status: 200, description: 'System analytics retrieved successfully' })
  async getSystemAnalytics(@Query('timeRange') timeRange?: string) {
    return this.analyticsService.getSystemAnalytics(timeRange);
  }

  @Get('alerts')
  @RequirePermissions(Permission.VIEW_ANALYTICS)
  @ApiOperation({ summary: 'Get alert analytics' })
  @ApiResponse({ status: 200, description: 'Alert analytics retrieved successfully' })
  async getAlertAnalytics(@Query('timeRange') timeRange?: string) {
    return this.analyticsService.getAlertAnalytics(timeRange);
  }
}