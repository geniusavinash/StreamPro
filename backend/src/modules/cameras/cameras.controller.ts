import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CamerasService } from './cameras.service';
import { CreateCameraDto } from './dto/create-camera.dto';
import { UpdateCameraDto } from './dto/update-camera.dto';
import { CameraFiltersDto } from './dto/camera-filters.dto';
import { StreamingService } from '../streaming/streaming.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { User } from '../../database/entities/user.entity';
import { Permission } from '../../common/enums/permission.enum';

@ApiTags('Cameras')
@Controller('cameras')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class CamerasController {
  constructor(
    private readonly camerasService: CamerasService,
    private readonly streamingService: StreamingService,
  ) {}

  @Post()
  @RequirePermissions(Permission.CAMERA_CREATE)
  @ApiOperation({ summary: 'Create a new camera' })
  @ApiResponse({
    status: 201,
    description: 'Camera created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - duplicate serial number or validation error',
  })
  async createCamera(
    @Body() createCameraDto: CreateCameraDto,
    @CurrentUser() user: User,
    @Request() req: any,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const camera = await this.camerasService.createCamera(
      createCameraDto,
      user,
      ipAddress,
      userAgent,
    );

    return {
      message: 'Camera created successfully',
      camera: {
        id: camera.id,
        name: camera.name,
        company: camera.company,
        model: camera.model,
        serialNumber: camera.serialNumber,
        location: camera.location,
        place: camera.place,
        rtmpUrl: camera.rtmpUrl,
        isActive: camera.isActive,
        isRecording: camera.isRecording,
        streamStatus: camera.streamStatus,
        createdAt: camera.createdAt,
      },
    };
  }

  @Get()
  @RequirePermissions(Permission.CAMERA_READ)
  @ApiOperation({ summary: 'Get all cameras' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'isRecording', required: false, type: Boolean })
  @ApiQuery({ name: 'streamStatus', required: false, enum: ['online', 'offline', 'connecting', 'error'] })
  @ApiResponse({
    status: 200,
    description: 'List of cameras',
  })
  async getCameras(@Query() filters: CameraFiltersDto) {
    const cameras = await this.camerasService.findAllCameras(filters);
    
    return {
      cameras: cameras.map(camera => ({
        id: camera.id,
        name: camera.name,
        company: camera.company,
        model: camera.model,
        serialNumber: camera.serialNumber,
        location: camera.location,
        place: camera.place,
        rtmpUrl: camera.rtmpUrl,
        isActive: camera.isActive,
        isRecording: camera.isRecording,
        streamStatus: camera.streamStatus,
        assignedNode: camera.assignedNode,
        createdAt: camera.createdAt,
        updatedAt: camera.updatedAt,
      })),
      total: cameras.length,
    };
  }

  @Get('stats/dashboard')
  @RequirePermissions(Permission.DASHBOARD_VIEW)
  @ApiOperation({ summary: 'Get camera dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Camera dashboard statistics',
  })
  async getDashboardStats() {
    return this.camerasService.getDashboardStats();
  }

  @Get('online')
  @RequirePermissions(Permission.CAMERA_READ)
  @ApiOperation({ summary: 'Get all online cameras' })
  @ApiResponse({
    status: 200,
    description: 'List of online cameras',
  })
  async getOnlineCameras() {
    const cameras = await this.camerasService.getOnlineCameras();
    return { cameras, count: cameras.length };
  }

  @Get('offline')
  @RequirePermissions(Permission.CAMERA_READ)
  @ApiOperation({ summary: 'Get all offline cameras' })
  @ApiResponse({
    status: 200,
    description: 'List of offline cameras',
  })
  async getOfflineCameras() {
    const cameras = await this.camerasService.getOfflineCameras();
    return { cameras, count: cameras.length };
  }

  @Get('recording')
  @RequirePermissions(Permission.CAMERA_READ)
  @ApiOperation({ summary: 'Get all recording cameras' })
  @ApiResponse({
    status: 200,
    description: 'List of cameras with recording enabled',
  })
  async getRecordingCameras() {
    const cameras = await this.camerasService.getRecordingCameras();
    return { cameras, count: cameras.length };
  }

  @Get(':id')
  @RequirePermissions(Permission.CAMERA_READ)
  @ApiOperation({ summary: 'Get camera by ID' })
  @ApiParam({ name: 'id', description: 'Camera ID' })
  @ApiResponse({
    status: 200,
    description: 'Camera details',
  })
  @ApiResponse({
    status: 404,
    description: 'Camera not found',
  })
  async getCamera(@Param('id') id: string) {
    const camera = await this.camerasService.findCameraById(id);
    
    return {
      id: camera.id,
      name: camera.name,
      company: camera.company,
      model: camera.model,
      serialNumber: camera.serialNumber,
      location: camera.location,
      place: camera.place,
      rtmpUrl: camera.rtmpUrl,
      isActive: camera.isActive,
      isRecording: camera.isRecording,
      streamStatus: camera.streamStatus,
      assignedNode: camera.assignedNode,
      createdAt: camera.createdAt,
      updatedAt: camera.updatedAt,
    };
  }

  @Get(':id/stream-urls')
  @RequirePermissions(Permission.STREAM_VIEW)
  @ApiOperation({ summary: 'Get camera stream URLs' })
  @ApiParam({ name: 'id', description: 'Camera ID' })
  @ApiResponse({
    status: 200,
    description: 'Camera stream URLs',
  })
  async getCameraStreamUrls(@Param('id') id: string) {
    return this.streamingService.getStreamUrls(id);
  }

  @Get(':id/stream-status')
  @RequirePermissions(Permission.CAMERA_READ)
  @ApiOperation({ summary: 'Get stream status for a camera' })
  @ApiParam({ name: 'id', description: 'Camera ID' })
  @ApiResponse({
    status: 200,
    description: 'Stream status',
  })
  async getStreamStatus(@Param('id') id: string) {
    return this.streamingService.getStreamStatus(id);
  }

  @Put(':id')
  @RequirePermissions(Permission.CAMERA_UPDATE)
  @ApiOperation({ summary: 'Update camera' })
  @ApiParam({ name: 'id', description: 'Camera ID' })
  @ApiResponse({
    status: 200,
    description: 'Camera updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Camera not found',
  })
  async updateCamera(
    @Param('id') id: string,
    @Body() updateCameraDto: UpdateCameraDto,
    @CurrentUser() user: User,
    @Request() req: any,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const camera = await this.camerasService.updateCamera(
      id,
      updateCameraDto,
      user,
      ipAddress,
      userAgent,
    );

    return {
      message: 'Camera updated successfully',
      camera: {
        id: camera.id,
        name: camera.name,
        company: camera.company,
        model: camera.model,
        serialNumber: camera.serialNumber,
        location: camera.location,
        place: camera.place,
        isActive: camera.isActive,
        isRecording: camera.isRecording,
        streamStatus: camera.streamStatus,
        updatedAt: camera.updatedAt,
      },
    };
  }

  @Post(':id/activate')
  @RequirePermissions(Permission.CAMERA_ACTIVATE)
  @ApiOperation({ summary: 'Activate camera' })
  @ApiParam({ name: 'id', description: 'Camera ID' })
  @ApiResponse({
    status: 200,
    description: 'Camera activated successfully',
  })
  async activateCamera(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Request() req: any,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    await this.camerasService.activateCamera(id, user, ipAddress, userAgent);
    
    return { message: 'Camera activated successfully' };
  }

  @Post(':id/deactivate')
  @RequirePermissions(Permission.CAMERA_DEACTIVATE)
  @ApiOperation({ summary: 'Deactivate camera' })
  @ApiParam({ name: 'id', description: 'Camera ID' })
  @ApiResponse({
    status: 200,
    description: 'Camera deactivated successfully',
  })
  async deactivateCamera(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Request() req: any,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    await this.camerasService.deactivateCamera(id, user, ipAddress, userAgent);
    
    return { message: 'Camera deactivated successfully' };
  }

  @Post(':id/toggle-recording')
  @RequirePermissions(Permission.RECORDING_CONTROL)
  @ApiOperation({ summary: 'Toggle camera recording' })
  @ApiParam({ name: 'id', description: 'Camera ID' })
  @ApiResponse({
    status: 200,
    description: 'Camera recording toggled successfully',
  })
  async toggleRecording(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Request() req: any,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const camera = await this.camerasService.toggleRecording(id, user, ipAddress, userAgent);
    
    // Use streaming service to start/stop recording
    if (camera.isRecording) {
      await this.streamingService.startRecording(id);
    } else {
      await this.streamingService.stopRecording(id);
    }
    
    return {
      message: `Recording ${camera.isRecording ? 'enabled' : 'disabled'} successfully`,
      isRecording: camera.isRecording,
    };
  }

  @Delete(':id')
  @RequirePermissions(Permission.CAMERA_DELETE)
  @ApiOperation({ summary: 'Delete camera' })
  @ApiParam({ name: 'id', description: 'Camera ID' })
  @ApiResponse({
    status: 200,
    description: 'Camera deleted successfully',
  })
  async deleteCamera(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Request() req: any,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    await this.camerasService.deleteCamera(id, user, ipAddress, userAgent);
    
    return { message: 'Camera deleted successfully' };
  }

  @Post(':id/rtmp/generate')
  @RequirePermissions(Permission.CAMERA_STREAM)
  @ApiOperation({ summary: 'Generate RTMP stream URL for camera' })
  @ApiParam({ name: 'id', description: 'Camera ID' })
  @ApiResponse({
    status: 200,
    description: 'RTMP URL generated successfully',
    schema: {
      type: 'object',
      properties: {
        rtmpUrl: { type: 'string', example: 'rtmp://api.getfairplay.org:1935/live/camera_123_1640995200000_abc123' },
        streamKey: { type: 'string', example: 'camera_123_1640995200000_abc123' },
        hlsUrl: { type: 'string', example: 'https://api.getfairplay.org/hls/camera_123_1640995200000_abc123/index.m3u8' },
        dashUrl: { type: 'string', example: 'https://api.getfairplay.org/dash/camera_123_1640995200000_abc123/index.mpd' }
      }
    }
  })
  async generateRtmpUrl(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return await this.streamingService.generateRtmpUrl(id, user.id);
  }


  @Post(':id/stream/start')
  @RequirePermissions(Permission.CAMERA_STREAM)
  @ApiOperation({ summary: 'Start camera stream' })
  @ApiParam({ name: 'id', description: 'Camera ID' })
  @ApiResponse({
    status: 200,
    description: 'Stream started successfully'
  })
  async startStream(@Param('id') id: string) {
    await this.camerasService.updateCamera(id, { 
      streamStatus: 'READY' as any 
    }, undefined);
    return { message: 'Stream started successfully' };
  }

  @Post(':id/stream/stop')
  @RequirePermissions(Permission.CAMERA_STREAM)
  @ApiOperation({ summary: 'Stop camera stream' })
  @ApiParam({ name: 'id', description: 'Camera ID' })
  @ApiResponse({
    status: 200,
    description: 'Stream stopped successfully'
  })
  async stopStream(@Param('id') id: string) {
    await this.camerasService.updateCamera(id, { 
      streamStatus: 'OFFLINE' as any 
    }, undefined);
    return { message: 'Stream stopped successfully' };
  }
}