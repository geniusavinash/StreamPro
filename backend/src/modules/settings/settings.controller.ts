import { Controller, Get, Put, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../../common/enums/permission.enum';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @ApiOperation({ summary: 'Get all system settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async getSettings() {
    return this.settingsService.getAllSettings();
  }

  @Get('category/:category')
  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @ApiOperation({ summary: 'Get settings by category' })
  @ApiResponse({ status: 200, description: 'Category settings retrieved successfully' })
  async getSettingsByCategory(@Param('category') category: string) {
    return this.settingsService.getSettingsByCategory(category);
  }

  @Put()
  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @ApiOperation({ summary: 'Update system settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updateSettings(@Body() updateSettingsDto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(updateSettingsDto);
  }

  @Get('streaming')
  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @ApiOperation({ summary: 'Get streaming configuration' })
  @ApiResponse({ status: 200, description: 'Streaming settings retrieved successfully' })
  async getStreamingSettings() {
    return this.settingsService.getStreamingSettings();
  }

  @Put('streaming')
  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @ApiOperation({ summary: 'Update streaming configuration' })
  @ApiResponse({ status: 200, description: 'Streaming settings updated successfully' })
  async updateStreamingSettings(@Body() streamingSettings: any) {
    return this.settingsService.updateStreamingSettings(streamingSettings);
  }

  @Get('recording')
  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @ApiOperation({ summary: 'Get recording configuration' })
  @ApiResponse({ status: 200, description: 'Recording settings retrieved successfully' })
  async getRecordingSettings() {
    return this.settingsService.getRecordingSettings();
  }

  @Put('recording')
  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @ApiOperation({ summary: 'Update recording configuration' })
  @ApiResponse({ status: 200, description: 'Recording settings updated successfully' })
  async updateRecordingSettings(@Body() recordingSettings: any) {
    return this.settingsService.updateRecordingSettings(recordingSettings);
  }

  @Get('storage')
  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @ApiOperation({ summary: 'Get storage configuration' })
  @ApiResponse({ status: 200, description: 'Storage settings retrieved successfully' })
  async getStorageSettings() {
    return this.settingsService.getStorageSettings();
  }

  @Put('storage')
  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @ApiOperation({ summary: 'Update storage configuration' })
  @ApiResponse({ status: 200, description: 'Storage settings updated successfully' })
  async updateStorageSettings(@Body() storageSettings: any) {
    return this.settingsService.updateStorageSettings(storageSettings);
  }

  @Get('notifications')
  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @ApiOperation({ summary: 'Get notification configuration' })
  @ApiResponse({ status: 200, description: 'Notification settings retrieved successfully' })
  async getNotificationSettings() {
    return this.settingsService.getNotificationSettings();
  }

  @Put('notifications')
  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @ApiOperation({ summary: 'Update notification configuration' })
  @ApiResponse({ status: 200, description: 'Notification settings updated successfully' })
  async updateNotificationSettings(@Body() notificationSettings: any) {
    return this.settingsService.updateNotificationSettings(notificationSettings);
  }
}