import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { CameraRepository } from '../../database/repositories/camera.repository';
// import { AuditLogRepository } from '../../database/repositories/audit-log.repository'; // Disabled
import { CreateCameraDto } from './dto/create-camera.dto';
import { UpdateCameraDto } from './dto/update-camera.dto';
import { CameraFiltersDto } from './dto/camera-filters.dto';
import { Camera } from '../../database/entities/camera.entity';
import { User } from '../../database/entities/user.entity';
import { StreamStatus } from '../../common/enums/stream-status.enum';

@Injectable()
export class CamerasService {
  constructor(
    private readonly cameraRepository: CameraRepository,
    // private readonly auditLogRepository: AuditLogRepository, // Disabled
    private readonly configService: ConfigService,
  ) {}

  async createCamera(
    createCameraDto: CreateCameraDto,
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Camera> {
    // Check if serial number already exists
    const existingCamera = await this.cameraRepository.findBySerialNumber(
      createCameraDto.serialNumber,
    );

    if (existingCamera) {
      throw new BadRequestException(
        `Camera with serial number ${createCameraDto.serialNumber} already exists`,
      );
    }

    // Generate RTMP URL and key
    const rtmpKey = this.generateRtmpKey(createCameraDto.serialNumber);
    const rtmpBaseUrl = this.configService.get<string>('app.rtmpBaseUrl');
    const rtmpUrl = `${rtmpBaseUrl}/${rtmpKey}`;

    // Create camera
    const cameraData = {
      ...createCameraDto,
      rtmpUrl,
      rtmpKey,
      streamStatus: StreamStatus.OFFLINE,
      isRecording: createCameraDto.isRecording || false,
    };

    const camera = await this.cameraRepository.create(cameraData);

    // Log camera creation
    // await this.auditLogRepository.logUserAction(
    //   user.id,
    //   'CAMERA_CREATED',
    //   'camera',
    //   camera.id,
    //   undefined,
    //   {
    //     name: camera.name,
    //     serialNumber: camera.serialNumber,
    //     location: camera.location,
    //   },
    //   ipAddress,
    //   userAgent,
    // ); // Disabled

    return camera;
  }

  async findAllCameras(filters?: CameraFiltersDto): Promise<Camera[]> {
    return this.cameraRepository.findAll(filters);
  }

  async findCameraById(id: string): Promise<Camera> {
    const camera = await this.cameraRepository.findById(id);
    if (!camera) {
      throw new NotFoundException('Camera not found');
    }
    return camera;
  }

  async findCameraBySerialNumber(serialNumber: string): Promise<Camera> {
    const camera = await this.cameraRepository.findBySerialNumber(serialNumber);
    if (!camera) {
      throw new NotFoundException('Camera not found');
    }
    return camera;
  }

  async getCameraById(id: string): Promise<Camera> {
    const camera = await this.findCameraById(id);
    if (!camera) {
      throw new NotFoundException('Camera not found');
    }
    return camera;
  }

  async updateCamera(
    id: string,
    updateCameraDto: UpdateCameraDto,
    user?: User,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Camera> {
    const existingCamera = await this.findCameraById(id);
    const oldValues = { ...existingCamera };

    // Note: Serial number updates are not allowed to maintain RTMP URL consistency

    const updatedCamera = await this.cameraRepository.update(id, updateCameraDto as any);

    if (!updatedCamera) {
      throw new NotFoundException('Camera not found after update');
    }

    // Log camera update
    // await this.auditLogRepository.logUserAction(...); // Disabled

    return updatedCamera;
  }

  async deleteCamera(
    id: string,
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const camera = await this.findCameraById(id);

    await this.cameraRepository.delete(id);

    // Log camera deletion
    // await this.auditLogRepository.logUserAction(...); // Disabled
  }

  async activateCamera(
    id: string,
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Camera> {
    const camera = await this.findCameraById(id);
    
    if (camera.isActive) {
      throw new BadRequestException('Camera is already active');
    }

    const updatedCamera = await this.cameraRepository.update(id, { isActive: true });

    if (!updatedCamera) {
      throw new NotFoundException('Camera not found after activation');
    }

    // Log camera activation
    // await this.auditLogRepository.logUserAction(...); // Disabled

    return updatedCamera;
  }

  async deactivateCamera(
    id: string,
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Camera> {
    const camera = await this.findCameraById(id);
    
    if (!camera.isActive) {
      throw new BadRequestException('Camera is already inactive');
    }

    const updatedCamera = await this.cameraRepository.update(id, { 
      isActive: false,
      streamStatus: StreamStatus.OFFLINE,
    });

    if (!updatedCamera) {
      throw new NotFoundException('Camera not found after deactivation');
    }

    // Log camera deactivation
    // await this.auditLogRepository.logUserAction(...); // Disabled

    return updatedCamera;
  }

  async toggleRecording(
    id: string,
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Camera> {
    const camera = await this.findCameraById(id);
    const newRecordingStatus = !camera.isRecording;

    const updatedCamera = await this.cameraRepository.update(id, { 
      isRecording: newRecordingStatus,
    });

    if (!updatedCamera) {
      throw new NotFoundException('Camera not found after recording toggle');
    }

    // Log recording toggle
    // await this.auditLogRepository.logUserAction(...); // Disabled

    return updatedCamera;
  }

  async updateStreamStatus(id: string, status: StreamStatus): Promise<void> {
    await this.cameraRepository.updateStreamStatus(id, status);

    // Log stream status change
    // await this.auditLogRepository.logSystemAction(...); // Disabled
  }

  async getDashboardStats(): Promise<{
    total: number;
    online: number;
    offline: number;
    recording: number;
  }> {
    return this.cameraRepository.getDashboardStats();
  }

  async getOnlineCameras(): Promise<Camera[]> {
    return this.cameraRepository.findByStreamStatus(StreamStatus.ONLINE);
  }

  async getOfflineCameras(): Promise<Camera[]> {
    return this.cameraRepository.findByStreamStatus(StreamStatus.OFFLINE);
  }

  async getRecordingCameras(): Promise<Camera[]> {
    return this.cameraRepository.findRecordingCameras();
  }

  async getCameraStreamUrl(id: string): Promise<{
    rtmpUrl: string;
    hlsUrl: string;
    webrtcUrl?: string;
  }> {
    const camera = await this.findCameraById(id);
    
    if (!camera.isActive) {
      throw new BadRequestException('Camera is not active');
    }

    const hlsBaseUrl = this.configService.get<string>('app.hlsBaseUrl');
    const hlsUrl = `${hlsBaseUrl}/${camera.rtmpKey}.m3u8`;

    return {
      rtmpUrl: camera.rtmpUrl,
      hlsUrl,
      // WebRTC URL will be implemented later
      webrtcUrl: undefined,
    };
  }

  async validateRtmpKey(rtmpKey: string): Promise<Camera | null> {
    const cameras = await this.cameraRepository.findAll({ isActive: true });
    return cameras.find(camera => camera.rtmpKey === rtmpKey) || null;
  }

  private generateRtmpKey(serialNumber: string): string {
    // Create a unique RTMP key based on serial number and timestamp
    const timestamp = Date.now().toString();
    const hash = crypto
      .createHash('sha256')
      .update(`${serialNumber}_${timestamp}`)
      .digest('hex')
      .substring(0, 16);
    
    return `${serialNumber}_${hash}`;
  }
}