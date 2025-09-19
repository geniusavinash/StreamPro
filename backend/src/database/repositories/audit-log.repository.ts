import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogRepository {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repository: Repository<AuditLog>,
  ) {}

  async create(logData: Partial<AuditLog>): Promise<AuditLog> {
    const log = this.repository.create(logData);
    return this.repository.save(log);
  }

  async findById(id: string): Promise<AuditLog | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(filters?: {
    userId?: string;
    action?: string;
    resource?: string;
    ipAddress?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const queryBuilder = this.repository.createQueryBuilder('log');

    if (filters?.userId) {
      queryBuilder.andWhere('log.userId = :userId', { userId: filters.userId });
    }

    if (filters?.action) {
      queryBuilder.andWhere('log.action ILIKE :action', { 
        action: `%${filters.action}%` 
      });
    }

    if (filters?.resource) {
      queryBuilder.andWhere('log.resource = :resource', { 
        resource: filters.resource 
      });
    }

    if (filters?.ipAddress) {
      queryBuilder.andWhere('log.ipAddress = :ipAddress', { 
        ipAddress: filters.ipAddress 
      });
    }

    if (filters?.startDate && filters?.endDate) {
      queryBuilder.andWhere('log.timestamp BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    queryBuilder.orderBy('log.timestamp', 'DESC');

    const total = await queryBuilder.getCount();

    if (filters?.limit) {
      queryBuilder.limit(filters.limit);
    }

    if (filters?.offset) {
      queryBuilder.offset(filters.offset);
    }

    const logs = await queryBuilder.getMany();

    return { logs, total };
  }

  async logUserAction(
    userId: string,
    action: string,
    resource?: string,
    resourceId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog> {
    return this.create({
      userId,
      action,
      resource,
      resourceId,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
    } as any);
  }

  async logSystemAction(
    action: string,
    resource?: string,
    resourceId?: string,
    details?: Record<string, any>,
  ): Promise<AuditLog> {
    return this.create({
      action,
      resource,
      resourceId,
      newValues: details,
    } as any);
  }

  async getActionStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<Record<string, number>> {
    const queryBuilder = this.repository
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.action');

    if (startDate && endDate) {
      queryBuilder.where('log.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const results = await queryBuilder.getRawMany();
    
    const stats: Record<string, number> = {};
    results.forEach(({ action, count }) => {
      stats[action] = parseInt(count, 10);
    });

    return stats;
  }

  async getUserActivityStats(
    userId: string,
    days: number = 30
  ): Promise<{
    totalActions: number;
    actionsByDay: Record<string, number>;
    topActions: Array<{ action: string; count: number }>;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const totalActions = await this.repository.count({
      where: {
        userId,
        timestamp: Between(startDate, endDate),
      },
    } as any);

    // Actions by day
    const dailyStats = await this.repository
      .createQueryBuilder('log')
      .select('DATE(log.timestamp)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('log.userId = :userId', { userId })
      .andWhere('log.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('DATE(log.timestamp)')
      .orderBy('date', 'ASC')
      .getRawMany();

    const actionsByDay: Record<string, number> = {};
    dailyStats.forEach(({ date, count }) => {
      actionsByDay[date] = parseInt(count, 10);
    });

    // Top actions
    const topActions = await this.repository
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('log.userId = :userId', { userId })
      .andWhere('log.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('log.action')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const formattedTopActions = topActions.map(({ action, count }) => ({
      action,
      count: parseInt(count, 10),
    }));

    return {
      totalActions,
      actionsByDay,
      topActions: formattedTopActions,
    };
  }

  async cleanupOldLogs(retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.repository.delete({
      timestamp: LessThan(cutoffDate),
    });

    return result.affected || 0;
  }

  async findByUser(userId: string): Promise<AuditLog[]> {
    return this.repository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]> {
    return this.repository.find({
      where: {
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: 'DESC' },
    });
  }

  async findByAction(action: string): Promise<AuditLog[]> {
    return this.repository.find({
      where: { action },
      order: { timestamp: 'DESC' },
    });
  }
}