import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Camera } from '../entities/camera.entity';
import { StreamStatus } from '../../common/enums/stream-status.enum';

@Injectable()
export class CameraRepository {
  constructor(
    @InjectRepository(Camera)
    private readonly repository: Repository<Camera>,
  ) {}

  async create(cameraData: Partial<Camera>): Promise<Camera> {
    const camera = this.repository.create(cameraData);
    return this.repository.save(camera);
  }

  async findById(id: string): Promise<Camera | null> {
    return this.repository.findOne({ 
      where: { id },
      relations: ['recordings'],
    });
  }

  async findOne(options: { where: any }): Promise<Camera | null> {
    return this.repository.findOne(options);
  }

  async findBySerialNumber(serialNumber: string): Promise<Camera | null> {
    return this.repository.findOne({ where: { serialNumber } });
  }

  async findAll(filters?: {
    isActive?: boolean;
    streamStatus?: StreamStatus;
    isRecording?: boolean;
  }): Promise<Camera[]> {
    const where: FindOptionsWhere<Camera> = {};
    
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.streamStatus) where.streamStatus = filters.streamStatus;
    if (filters?.isRecording !== undefined) where.isRecording = filters.isRecording;

    return this.repository.find({ 
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updates: Partial<Camera>): Promise<Camera | null> {
    await this.repository.update(id, updates);
    return this.findById(id);
  }

  async updateStreamStatus(id: string, status: StreamStatus): Promise<void> {
    await this.repository.update(id, { streamStatus: status });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected || 0) > 0;
  }

  async softDelete(id: string): Promise<boolean> {
    return this.update(id, { isActive: false }).then(camera => !!camera);
  }

  async getDashboardStats(): Promise<{
    total: number;
    online: number;
    offline: number;
    recording: number;
  }> {
    const [total, online, offline, recording] = await Promise.all([
      this.repository.count({ where: { isActive: true } }),
      this.repository.count({ 
        where: { isActive: true, streamStatus: StreamStatus.ONLINE } 
      }),
      this.repository.count({ 
        where: { isActive: true, streamStatus: StreamStatus.OFFLINE } 
      }),
      this.repository.count({ 
        where: { isActive: true, isRecording: true } 
      }),
    ]);

    return { total, online, offline, recording };
  }

  async findByStreamStatus(status: StreamStatus): Promise<Camera[]> {
    return this.repository.find({
      where: { streamStatus: status, isActive: true },
    });
  }

  async findRecordingCameras(): Promise<Camera[]> {
    return this.repository.find({
      where: { isRecording: true, isActive: true },
    });
  }

  async assignToNode(cameraId: string, nodeId: string): Promise<void> {
    await this.repository.update(cameraId, { assignedNode: nodeId });
  }

  async findByNode(nodeId: string): Promise<Camera[]> {
    return this.repository.find({
      where: { assignedNode: nodeId, isActive: true },
    });
  }

  async save(camera: Camera): Promise<Camera> {
    return this.repository.save(camera);
  }

  async findWithFilters(filters: {
    isActive?: boolean;
    isRecording?: boolean;
    company?: string;
    streamStatus?: StreamStatus;
  }): Promise<Camera[]> {
    const where: FindOptionsWhere<Camera> = {};
    
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.isRecording !== undefined) where.isRecording = filters.isRecording;
    if (filters.company) where.company = filters.company;
    if (filters.streamStatus) where.streamStatus = filters.streamStatus;

    return this.repository.find({ where });
  }
}