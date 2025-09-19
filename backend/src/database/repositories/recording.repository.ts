import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { Recording } from '../entities/recording.entity';
import { StorageTier } from '../../common/enums/storage-tier.enum';

@Injectable()
export class RecordingRepository {
  constructor(
    @InjectRepository(Recording)
    private readonly repository: Repository<Recording>,
  ) {}

  async create(recordingData: Partial<Recording>): Promise<Recording> {
    const recording = this.repository.create(recordingData);
    return this.repository.save(recording);
  }

  async findById(id: string): Promise<Recording | null> {
    return this.repository.findOne({ 
      where: { id },
      relations: ['camera'],
    });
  }

  async findByCameraId(
    cameraId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      storageTier?: StorageTier;
    }
  ): Promise<Recording[]> {
    const where: any = { cameraId };

    if (filters?.startDate && filters?.endDate) {
      where.startTime = Between(filters.startDate, filters.endDate);
    }

    if (filters?.storageTier) {
      where.storageTier = filters.storageTier;
    }

    return this.repository.find({
      where,
      relations: ['camera'],
      order: { startTime: 'DESC' },
    });
  }

  async findAll(filters?: {
    cameraId?: string;
    startDate?: Date;
    endDate?: Date;
    storageTier?: StorageTier;
    isArchived?: boolean;
  }): Promise<Recording[]> {
    const where: any = {};

    if (filters?.cameraId) where.cameraId = filters.cameraId;
    if (filters?.isArchived !== undefined) where.isArchived = filters.isArchived;
    if (filters?.storageTier) where.storageTier = filters.storageTier;

    if (filters?.startDate && filters?.endDate) {
      where.startTime = Between(filters.startDate, filters.endDate);
    }

    return this.repository.find({
      where,
      relations: ['camera'],
      order: { startTime: 'DESC' },
    });
  }

  async update(id: string, updates: Partial<Recording>): Promise<Recording | null> {
    await this.repository.update(id, updates);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected || 0) > 0;
  }

  async getStorageStats(): Promise<{
    totalSize: number;
    totalCount: number;
    byTier: Record<StorageTier, { size: number; count: number }>;
  }> {
    const stats = await this.repository
      .createQueryBuilder('recording')
      .select('recording.storageTier', 'tier')
      .addSelect('SUM(recording.fileSize)', 'totalSize')
      .addSelect('COUNT(*)', 'count')
      .groupBy('recording.storageTier')
      .getRawMany();

    const byTier = {
      [StorageTier.HOT]: { size: 0, count: 0 },
      [StorageTier.WARM]: { size: 0, count: 0 },
      [StorageTier.COLD]: { size: 0, count: 0 },
      [StorageTier.ARCHIVED]: { size: 0, count: 0 },
    };

    let totalSize = 0;
    let totalCount = 0;

    stats.forEach(({ tier, totalSize: size, count }) => {
      const sizeNum = parseInt(size, 10) || 0;
      const countNum = parseInt(count, 10) || 0;
      
      byTier[tier] = { size: sizeNum, count: countNum };
      totalSize += sizeNum;
      totalCount += countNum;
    });

    return { totalSize, totalCount, byTier };
  }

  async findExpiredRecordings(retentionDays: number): Promise<Recording[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    return this.repository.find({
      where: {
        createdAt: LessThan(cutoffDate),
        storageTier: StorageTier.HOT,
      },
    });
  }

  async moveToTier(recordingIds: string[], tier: StorageTier): Promise<void> {
    await this.repository.update(recordingIds, { storageTier: tier });
  }

  async markAsArchived(recordingIds: string[], cloudUrl?: string): Promise<void> {
    const updates: Partial<Recording> = { 
      isArchived: true,
      storageTier: StorageTier.ARCHIVED,
    };
    
    if (cloudUrl) updates.cloudUrl = cloudUrl;
    
    await this.repository.update(recordingIds, updates);
  }

  async findByTimeRange(
    cameraId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Recording[]> {
    return this.repository.find({
      where: {
        cameraId,
        startTime: LessThan(endTime),
        endTime: Between(startTime, endTime),
      },
      order: { startTime: 'ASC' },
    });
  }

  async getLatestSegmentNumber(cameraId: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('recording')
      .select('MAX(recording.segmentNumber)', 'maxSegment')
      .where('recording.cameraId = :cameraId', { cameraId })
      .getRawOne();

    return result?.maxSegment || 0;
  }

  async save(recording: Recording): Promise<Recording> {
    return this.repository.save(recording);
  }

  async findByCamera(cameraId: string): Promise<Recording[]> {
    return this.findByCameraId(cameraId);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Recording[]> {
    return this.repository.find({
      where: {
        startTime: Between(startDate, endDate),
      },
      relations: ['camera'],
      order: { startTime: 'DESC' },
    });
  }

  async findByStorageTier(tier: StorageTier): Promise<Recording[]> {
    return this.repository.find({
      where: { storageTier: tier },
      relations: ['camera'],
      order: { startTime: 'DESC' },
    });
  }

  // Missing methods that are being used in services
  async findActive(): Promise<Recording[]> {
    // Return recordings that are currently being written to
    return this.repository.find({
      where: { 
        // Assuming we have an isActive field or check recent recordings
        endTime: null, // Active recordings don't have end time yet
      },
      relations: ['camera'],
      order: { startTime: 'DESC' },
    });
  }

  async findRecent(hours: number = 24): Promise<Recording[]> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    return this.repository.find({
      where: {
        startTime: Between(cutoffDate, new Date()),
      },
      relations: ['camera'],
      order: { startTime: 'DESC' },
    });
  }

  async findOlderThan(cutoffDate: Date, tier?: StorageTier): Promise<Recording[]> {
    const where: any = {
      createdAt: LessThan(cutoffDate),
    };

    if (tier) {
      where.storageTier = tier;
    }

    return this.repository.find({
      where,
      relations: ['camera'],
      order: { createdAt: 'ASC' },
    });
  }
}