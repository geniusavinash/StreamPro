import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between } from 'typeorm';
import { ApiToken } from '../entities/api-token.entity';

@Injectable()
export class ApiTokenRepository {
  constructor(
    @InjectRepository(ApiToken)
    private readonly repository: Repository<ApiToken>,
  ) {}

  async create(tokenData: Partial<ApiToken>): Promise<ApiToken> {
    const token = this.repository.create(tokenData);
    return this.repository.save(token);
  }

  async findById(id: string): Promise<ApiToken | null> {
    return this.repository.findOne({ 
      where: { id },
      relations: ['user'],
    });
  }

  async findByTokenHash(tokenHash: string): Promise<ApiToken | null> {
    return this.repository.findOne({ 
      where: { tokenHash: tokenHash, isActive: true },
      relations: ['user'],
    });
  }

  async findByHashedKey(hashedKey: string): Promise<ApiToken | null> {
    return this.findByTokenHash(hashedKey);
  }

  async findByUserId(userId: string): Promise<ApiToken[]> {
    return this.repository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(filters?: {
    userId?: string;
    isActive?: boolean;
  }): Promise<ApiToken[]> {
    const where: any = {};
    
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    return this.repository.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updates: Partial<ApiToken>): Promise<ApiToken | null> {
    await this.repository.update(id, updates);
    return this.findById(id);
  }

  async updateLastUsed(id: string): Promise<void> {
    await this.repository.update(id, { lastUsedAt: new Date() });
  }

  async revoke(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { isActive: false });
    return (result.affected || 0) > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected || 0) > 0;
  }

  async findExpiredTokens(): Promise<ApiToken[]> {
    const now = new Date();
    return this.repository.find({
      where: {
        expiresAt: LessThan(now),
        isActive: true,
      },
    });
  }

  async cleanupExpiredTokens(): Promise<number> {
    const expiredTokens = await this.findExpiredTokens();
    
    if (expiredTokens.length > 0) {
      const ids = expiredTokens.map(token => token.id);
      await this.repository.update(ids, { isActive: false });
    }
    
    return expiredTokens.length;
  }

  async getUsageStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    recentlyUsed: number;
  }> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [total, active, expired, recentlyUsed] = await Promise.all([
      this.repository.count(),
      this.repository.count({ where: { isActive: true } }),
      this.repository.count({ 
        where: { 
          expiresAt: LessThan(now),
          isActive: true,
        } 
      }),
      this.repository.count({ 
        where: { 
          lastUsedAt: Between(oneDayAgo, now),
          isActive: true,
        } 
      }),
    ]);

    return { total, active, expired, recentlyUsed };
  }

  async save(token: ApiToken): Promise<ApiToken> {
    return this.repository.save(token);
  }

  async findByUser(userId: string): Promise<ApiToken[]> {
    return this.findByUserId(userId);
  }
}