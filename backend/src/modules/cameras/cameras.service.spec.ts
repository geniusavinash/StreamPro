import { Test, TestingModule } from '@nestjs/testing';
import { CamerasService } from './cameras.service';
import { CameraRepository } from '../../database/repositories/camera.repository';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
import { StreamStatus } from '../../common/enums/stream-status.enum';
import Redis from 'ioredis';

jest.mock('ioredis');

describe('CamerasService', () => {
  let service: CamerasService;
  let cameraRepository: jest.Mocked<CameraRepository>;
  let auditService: jest.Mocked<AuditService>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let mockRedis: jest.Mocked<Redis>;

  const mockCamera = {
    id: '1',
    name: 'Test Camera',
    company: 'Test Company',
    model: 'Test Model',
    serialNumber: 'TEST123',
    location: 'Test Location',
    place: 'Test Place',
    rtmpUrl: 'rtmp://localhost/live/TEST123',
    isActive: true,
    isRecording: false,
    streamStatus: StreamStatus.OFFLINE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRedisInstance = {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      hget: jest.fn(),
      hset: jest.fn(),
      hdel: jest.fn(),
      exists: jest.fn(),
      expire: jest.fn(),
    };

    (Redis as jest.MockedClass<typeof Redis>).mockImplementation(() => mockRedisInstance as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CamerasService,
        {
          provide: CameraRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            findBySerialNumber: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            findWithFilters: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            logDataAccess: jest.fn(),
            logDataModification: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            sendCameraAlert: jest.fn(),
            broadcastCameraUpdate: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const config = {
                'rtmp.baseUrl': 'rtmp://localhost/live',
                'rtmp.port': 1935,
                'redis.host': 'localhost',
                'redis.port': 6379,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CamerasService>(CamerasService);
    cameraRepository = module.get(CameraRepository);
    auditService = module.get(AuditService);
    notificationsService = module.get(NotificationsService);
    mockRedis = (service as any).redis;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all cameras with stream status', async () => {
      cameraRepository.findAll.mockResolvedValue([mockCamera]);
      mockRedis.hget.mockResolvedValue('online');

      const result = await service.findAll();

      expect(result.success).toBe(true);
      expect(result.data.cameras).toHaveLength(1);
      expect(result.data.cameras[0].streamStatus).toBe('online');
    });

    it('should handle empty camera list', async () => {
      cameraRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result.success).toBe(true);
      expect(result.data.cameras).toHaveLength(0);
      expect(result.data.total).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return camera when found', async () => {
      cameraRepository.findById.mockResolvedValue(mockCamera);
      mockRedis.hget.mockResolvedValue('online');

      const result = await service.findById('1');

      expect(result.success).toBe(true);
      expect(result.data.camera.id).toBe('1');
      expect(result.data.camera.streamStatus).toBe('online');
    });

    it('should return error when camera not found', async () => {
      cameraRepository.findById.mockResolvedValue(null);

      const result = await service.findById('999');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Camera not found');
    });
  });

  describe('create', () => {
    const createCameraDto = {
      name: 'New Camera',
      company: 'New Company',
      model: 'New Model',
      serialNumber: 'NEW123',
      location: 'New Location',
      place: 'New Place',
      isRecording: false,
    };

    const userContext = {
      userId: 'user1',
      username: 'testuser',
      userRole: 'admin',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    };

    it('should create camera successfully', async () => {
      cameraRepository.findBySerialNumber.mockResolvedValue(null);
      cameraRepository.create.mockReturnValue({ ...createCameraDto, id: '2' } as any);
      cameraRepository.save.mockResolvedValue({ ...createCameraDto, id: '2' } as any);

      const result = await service.create(createCameraDto, userContext);

      expect(result.success).toBe(true);
      expect(result.data.camera.name).toBe(createCameraDto.name);
      expect(auditService.logDataModification).toHaveBeenCalled();
    });

    it('should fail when serial number already exists', async () => {
      cameraRepository.findBySerialNumber.mockResolvedValue(mockCamera);

      const result = await service.create(createCameraDto, userContext);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Camera with this serial number already exists');
    });

    it('should generate correct RTMP URL', async () => {
      cameraRepository.findBySerialNumber.mockResolvedValue(null);
      const createdCamera = { ...createCameraDto, id: '2', rtmpUrl: 'rtmp://localhost/live/NEW123' };
      cameraRepository.create.mockReturnValue(createdCamera as any);
      cameraRepository.save.mockResolvedValue(createdCamera as any);

      const result = await service.create(createCameraDto, userContext);

      expect(result.success).toBe(true);
      expect(result.data.camera.rtmpUrl).toBe('rtmp://localhost/live/NEW123');
    });
  });

  describe('update', () => {
    const updateCameraDto = {
      name: 'Updated Camera',
      location: 'Updated Location',
    };

    const userContext = {
      userId: 'user1',
      username: 'testuser',
      userRole: 'admin',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    };

    it('should update camera successfully', async () => {
      cameraRepository.findById.mockResolvedValue(mockCamera);
      const updatedCamera = { ...mockCamera, ...updateCameraDto };
      cameraRepository.save.mockResolvedValue(updatedCamera);

      const result = await service.update('1', updateCameraDto, userContext);

      expect(result.success).toBe(true);
      expect(result.data.camera.name).toBe(updateCameraDto.name);
      expect(auditService.logDataModification).toHaveBeenCalled();
    });

    it('should fail when camera not found', async () => {
      cameraRepository.findById.mockResolvedValue(null);

      const result = await service.update('999', updateCameraDto, userContext);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Camera not found');
    });
  });

  describe('delete', () => {
    const userContext = {
      userId: 'user1',
      username: 'testuser',
      userRole: 'admin',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    };

    it('should delete camera successfully', async () => {
      cameraRepository.findById.mockResolvedValue(mockCamera);
      cameraRepository.delete.mockResolvedValue(undefined);

      const result = await service.delete('1', userContext);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Camera deleted successfully');
      expect(auditService.logDataModification).toHaveBeenCalled();
    });

    it('should fail when camera not found', async () => {
      cameraRepository.findById.mockResolvedValue(null);

      const result = await service.delete('999', userContext);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Camera not found');
    });
  });

  describe('activate', () => {
    const userContext = {
      userId: 'user1',
      username: 'testuser',
      userRole: 'admin',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    };

    it('should activate camera successfully', async () => {
      const inactiveCamera = { ...mockCamera, isActive: false };
      cameraRepository.findById.mockResolvedValue(inactiveCamera);
      const activatedCamera = { ...inactiveCamera, isActive: true };
      cameraRepository.save.mockResolvedValue(activatedCamera);

      const result = await service.activate('1', userContext);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Camera activated successfully');
      expect(notificationsService.broadcastCameraUpdate).toHaveBeenCalled();
    });

    it('should fail when camera is already active', async () => {
      cameraRepository.findById.mockResolvedValue(mockCamera);

      const result = await service.activate('1', userContext);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Camera is already active');
    });
  });

  describe('deactivate', () => {
    const userContext = {
      userId: 'user1',
      username: 'testuser',
      userRole: 'admin',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    };

    it('should deactivate camera successfully', async () => {
      cameraRepository.findById.mockResolvedValue(mockCamera);
      const deactivatedCamera = { ...mockCamera, isActive: false };
      cameraRepository.save.mockResolvedValue(deactivatedCamera);

      const result = await service.deactivate('1', userContext);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Camera deactivated successfully');
      expect(notificationsService.broadcastCameraUpdate).toHaveBeenCalled();
    });

    it('should fail when camera is already inactive', async () => {
      const inactiveCamera = { ...mockCamera, isActive: false };
      cameraRepository.findById.mockResolvedValue(inactiveCamera);

      const result = await service.deactivate('1', userContext);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Camera is already inactive');
    });
  });

  describe('updateStreamStatus', () => {
    it('should update stream status successfully', async () => {
      cameraRepository.findById.mockResolvedValue(mockCamera);
      mockRedis.hset.mockResolvedValue(1);

      const result = await service.updateStreamStatus('1', StreamStatus.ONLINE);

      expect(result.success).toBe(true);
      expect(mockRedis.hset).toHaveBeenCalledWith('camera_status', '1', StreamStatus.ONLINE);
    });

    it('should send alert when camera goes offline', async () => {
      cameraRepository.findById.mockResolvedValue(mockCamera);
      mockRedis.hset.mockResolvedValue(1);

      await service.updateStreamStatus('1', StreamStatus.OFFLINE);

      expect(notificationsService.sendCameraAlert).toHaveBeenCalledWith({
        cameraId: '1',
        cameraName: mockCamera.name,
        alertType: 'camera_offline',
        message: expect.stringContaining('went offline'),
      });
    });
  });

  describe('getStreamStatus', () => {
    it('should return stream status from Redis', async () => {
      mockRedis.hget.mockResolvedValue('online');

      const result = await service.getStreamStatus('1');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('online');
    });

    it('should return offline when no status in Redis', async () => {
      mockRedis.hget.mockResolvedValue(null);

      const result = await service.getStreamStatus('1');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe(StreamStatus.OFFLINE);
    });
  });

  describe('toggleRecording', () => {
    const userContext = {
      userId: 'user1',
      username: 'testuser',
      userRole: 'admin',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    };

    it('should start recording when currently not recording', async () => {
      cameraRepository.findById.mockResolvedValue(mockCamera);
      const recordingCamera = { ...mockCamera, isRecording: true };
      cameraRepository.save.mockResolvedValue(recordingCamera);

      const result = await service.toggleRecording('1', userContext);

      expect(result.success).toBe(true);
      expect(result.data.isRecording).toBe(true);
      expect(result.message).toBe('Recording started');
    });

    it('should stop recording when currently recording', async () => {
      const recordingCamera = { ...mockCamera, isRecording: true };
      cameraRepository.findById.mockResolvedValue(recordingCamera);
      const stoppedCamera = { ...recordingCamera, isRecording: false };
      cameraRepository.save.mockResolvedValue(stoppedCamera);

      const result = await service.toggleRecording('1', userContext);

      expect(result.success).toBe(true);
      expect(result.data.isRecording).toBe(false);
      expect(result.message).toBe('Recording stopped');
    });
  });
});