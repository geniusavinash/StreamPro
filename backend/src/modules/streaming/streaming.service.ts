import { Injectable, Logger } from '@nestjs/common';
import { Camera, StreamStatus } from '../../database/entities/camera.entity';
import { Recording } from '../../database/entities/recording.entity';
import { StorageTier } from '../../common/enums/storage-tier.enum';
import { CameraRepository } from '../../database/repositories/camera.repository';
import { RecordingRepository } from '../../database/repositories/recording.repository';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StreamingService {
  private readonly logger = new Logger(StreamingService.name);

  constructor(
    private cameraRepository: CameraRepository,
    private recordingRepository: RecordingRepository,
  ) {}

  /**
   * Generate RTMP stream URL for a camera
   */
  async generateRtmpUrl(cameraId: string, userId: string): Promise<{
    rtmpUrl: string;
    streamKey: string;
    hlsUrl: string;
    dashUrl: string;
  }> {
    try {
      const camera = await this.cameraRepository.findOne({
        where: { id: cameraId }
      });

      if (!camera) {
        throw new Error('Camera not found');
      }

      if (!camera.isActive) {
        throw new Error('Camera is not active');
      }

      // Generate unique stream key
      const streamKey = `${cameraId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get server configuration
      const rtmpHost = process.env.RTMP_HOST || 'localhost';
      const rtmpPort = process.env.RTMP_PORT || '1935';
      
      // Generate URLs
      const rtmpUrl = `rtmp://${rtmpHost}:${rtmpPort}/live/${streamKey}`;
      const hlsUrl = `https://${rtmpHost}/hls/${streamKey}/index.m3u8`;
      const dashUrl = `https://${rtmpHost}/dash/${streamKey}/index.mpd`;

      // Update camera with stream key
      await this.cameraRepository.update(cameraId, {
        streamKey: streamKey,
        streamStatus: StreamStatus.READY
      });

      this.logger.log(`Generated RTMP URL for camera ${cameraId}: ${rtmpUrl}`);

      return {
        rtmpUrl,
        streamKey,
        hlsUrl,
        dashUrl
      };
    } catch (error) {
      this.logger.error(`Error generating RTMP URL for camera ${cameraId}:`, error);
      throw error;
    }
  }

  /**
   * Handle RTMP publish authentication
   */
  async authenticatePublish(streamKey: string, ip: string): Promise<boolean> {
    try {
      this.logger.log(`Authenticating publish for stream key: ${streamKey} from IP: ${ip}`);
      
      // Find camera by stream key
      const camera = await this.cameraRepository.findOne({
        where: [
          { streamKey: streamKey },
          { id: streamKey },
          { serialNumber: streamKey }
        ]
      });

      if (!camera) {
        this.logger.warn(`Camera not found for stream key: ${streamKey}`);
        return false;
      }

      if (!camera.isActive) {
        this.logger.warn(`Camera ${camera.id} is not active`);
        return false;
      }

      // Update camera status to online
      await this.cameraRepository.update(camera.id, {
        streamStatus: StreamStatus.ONLINE,
        assignedNode: 'nginx-rtmp-1' // Default node
      });

      this.logger.log(`Camera ${camera.id} authenticated for streaming`);
      return true;
    } catch (error) {
      this.logger.error(`Error authenticating publish: ${error.message}`);
      return false;
    }
  }


  /**
   * Handle stream publish start
   */
  async onPublish(streamKey: string, ip: string): Promise<void> {
    try {
      this.logger.log(`Stream publish started for: ${streamKey} from IP: ${ip}`);
      
      const camera = await this.cameraRepository.findOne({
        where: [
          { id: streamKey },
          { serialNumber: streamKey }
        ]
      });

      if (camera) {
        await this.cameraRepository.update(camera.id, {
          streamStatus: StreamStatus.ONLINE,
          assignedNode: 'nginx-rtmp-1'
        });

        // Start recording if enabled
        if (camera.isRecording) {
          await this.startRecording(camera.id);
        }
      }
    } catch (error) {
      this.logger.error(`Error handling publish start: ${error.message}`);
    }
  }

  /**
   * Handle stream publish end
   */
  async onDone(streamKey: string, ip: string): Promise<void> {
    try {
      this.logger.log(`Stream publish ended for: ${streamKey} from IP: ${ip}`);
      
      const camera = await this.cameraRepository.findOne({
        where: [
          { id: streamKey },
          { serialNumber: streamKey }
        ]
      });

      if (camera) {
        await this.cameraRepository.update(camera.id, {
          streamStatus: StreamStatus.OFFLINE,
          assignedNode: null
        });

        // Stop recording if active
        if (camera.isRecording) {
          await this.stopRecording(camera.id);
        }
      }
    } catch (error) {
      this.logger.error(`Error handling publish end: ${error.message}`);
    }
  }

  /**
   * Handle recording completion
   */
  async onRecordDone(streamKey: string, filePath: string, fileSize: number): Promise<void> {
    try {
      this.logger.log(`Recording completed for: ${streamKey}, file: ${filePath}`);
      
      const camera = await this.cameraRepository.findOne({
        where: [
          { id: streamKey },
          { serialNumber: streamKey }
        ]
      });

      if (camera) {
        // Create recording record
        const recording = await this.recordingRepository.create({
          cameraId: camera.id,
          filename: path.basename(filePath),
          filePath: filePath,
          fileSize: fileSize,
          duration: 0, // Will be calculated later
          startTime: new Date(),
          endTime: new Date(),
          storageTier: StorageTier.HOT,
          isEncrypted: false,
          isArchived: false,
          segmentNumber: 1
        });

        this.logger.log(`Recording record created: ${recording.id}`);
      }
    } catch (error) {
      this.logger.error(`Error handling recording completion: ${error.message}`);
    }
  }

  /**
   * Start recording for a camera
   */
  async startRecording(cameraId: string): Promise<void> {
    try {
      this.logger.log(`Starting recording for camera: ${cameraId}`);
      
      // Update camera recording status
      await this.cameraRepository.update(cameraId, {
        isRecording: true
      });

      // Create recording directory if it doesn't exist
      const recordingDir = path.join(process.cwd(), 'recordings', cameraId);
      if (!fs.existsSync(recordingDir)) {
        fs.mkdirSync(recordingDir, { recursive: true });
      }

      this.logger.log(`Recording started for camera: ${cameraId}`);
    } catch (error) {
      this.logger.error(`Error starting recording: ${error.message}`);
    }
  }

  /**
   * Stop recording for a camera
   */
  async stopRecording(cameraId: string): Promise<void> {
    try {
      this.logger.log(`Stopping recording for camera: ${cameraId}`);
      
      // Update camera recording status
      await this.cameraRepository.update(cameraId, {
        isRecording: false
      });

      this.logger.log(`Recording stopped for camera: ${cameraId}`);
    } catch (error) {
      this.logger.error(`Error stopping recording: ${error.message}`);
    }
  }

  /**
   * Get stream URLs for a camera
   */
  async getStreamUrls(cameraId: string): Promise<{
    rtmpUrl: string;
    hlsUrl: string;
    dashUrl: string;
  }> {
    const camera = await this.cameraRepository.findOne({
      where: { id: cameraId }
    });

    if (!camera) {
      throw new Error('Camera not found');
    }

    return {
      rtmpUrl: `rtmp://localhost:1935/live/${camera.id}`,
      hlsUrl: `http://localhost:8080/hls/${camera.id}.m3u8`,
      dashUrl: `http://localhost:8080/dash/${camera.id}.mpd`
    };
  }

  /**
   * Get stream status for a camera
   */
  async getStreamStatus(cameraId: string): Promise<{
    status: string;
    isRecording: boolean;
    assignedNode: string;
    lastSeen: Date;
  }> {
    const camera = await this.cameraRepository.findOne({
      where: { id: cameraId }
    });

    if (!camera) {
      throw new Error('Camera not found');
    }

    return {
      status: camera.streamStatus,
      isRecording: camera.isRecording,
      assignedNode: camera.assignedNode,
      lastSeen: camera.updatedAt
    };
  }

  /**
   * Handle RTMP play authentication
   */
  async authenticatePlay(streamKey: string, ip: string): Promise<boolean> {
    try {
      this.logger.log(`Authenticating play for stream key: ${streamKey} from IP: ${ip}`);
      
      // Find camera by stream key
      const camera = await this.cameraRepository.findOne({
        where: [
          { streamKey: streamKey },
          { id: streamKey },
          { serialNumber: streamKey }
        ]
      });

      if (!camera) {
        this.logger.warn(`Camera not found for stream key: ${streamKey}`);
        return false;
      }

      if (!camera.isActive) {
        this.logger.warn(`Camera ${camera.id} is not active`);
        return false;
      }

      this.logger.log(`Camera ${camera.id} authenticated for play`);
      return true;
    } catch (error) {
      this.logger.error(`Error authenticating play: ${error.message}`);
      return false;
    }
  }

  /**
   * Handle RTMP publish done event
   */
  async handlePublishDone(streamKey: string): Promise<void> {
    try {
      this.logger.log(`Publish done for stream key: ${streamKey}`);
      
      const camera = await this.cameraRepository.findOne({
        where: [
          { streamKey: streamKey },
          { id: streamKey },
          { serialNumber: streamKey }
        ]
      });

      if (camera) {
        await this.cameraRepository.update(camera.id, {
          streamStatus: StreamStatus.OFFLINE
        });
        this.logger.log(`Camera ${camera.id} stream status updated to offline`);
      }
    } catch (error) {
      this.logger.error(`Error handling publish done: ${error.message}`);
    }
  }

  /**
   * Handle RTMP play done event
   */
  async handlePlayDone(streamKey: string): Promise<void> {
    try {
      this.logger.log(`Play done for stream key: ${streamKey}`);
      // Update viewer count or other play-related metrics
    } catch (error) {
      this.logger.error(`Error handling play done: ${error.message}`);
    }
  }

  /**
   * Handle RTMP connect event
   */
  async handleConnect(ip: string): Promise<void> {
    try {
      this.logger.log(`RTMP client connected from IP: ${ip}`);
      // Log connection for monitoring
    } catch (error) {
      this.logger.error(`Error handling connect: ${error.message}`);
    }
  }

  /**
   * Handle RTMP disconnect event
   */
  async handleDisconnect(ip: string): Promise<void> {
    try {
      this.logger.log(`RTMP client disconnected from IP: ${ip}`);
      // Log disconnection for monitoring
    } catch (error) {
      this.logger.error(`Error handling disconnect: ${error.message}`);
    }
  }

  /**
   * Handle RTMP record done event
   */
  async handleRecordDone(streamKey: string, filePath: string): Promise<void> {
    try {
      this.logger.log(`Record done for stream key: ${streamKey}, file: ${filePath}`);
      
      const camera = await this.cameraRepository.findOne({
        where: [
          { streamKey: streamKey },
          { id: streamKey },
          { serialNumber: streamKey }
        ]
      });

      if (camera) {
        // Create recording entry
        const savedRecording = await this.recordingRepository.create({
          cameraId: camera.id,
          filename: filePath.split('/').pop() || 'recording.mp4',
          filePath: filePath,
          fileSize: 0, // Will be updated when file is processed
          duration: 0, // Will be calculated from video metadata
          startTime: new Date(),
          endTime: new Date(),
          storageTier: 'standard' as any
        });
        this.logger.log(`Recording entry created for camera ${camera.id}`);
      }
    } catch (error) {
      this.logger.error(`Error handling record done: ${error.message}`);
    }
  }
}
