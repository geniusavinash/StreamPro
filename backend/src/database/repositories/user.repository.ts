import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return this.repository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.repository.findOne({ where: { username } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async save(user: User): Promise<User> {
    return this.repository.save(user);
  }

  async findAll(filters?: {
    role?: UserRole;
    isActive?: boolean;
  }): Promise<User[]> {
    const where: FindOptionsWhere<User> = {};
    
    if (filters?.role) where.role = filters.role;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    return this.repository.find({ where });
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    await this.repository.update(id, updates);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected || 0) > 0;
  }

  async softDelete(id: string): Promise<boolean> {
    return this.update(id, { isActive: false }).then(user => !!user);
  }

  async countByRole(): Promise<Record<UserRole, number>> {
    const counts = await this.repository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .where('user.isActive = :isActive', { isActive: true })
      .groupBy('user.role')
      .getRawMany();

    const result = {
      [UserRole.ADMIN]: 0,
      [UserRole.OPERATOR]: 0,
      [UserRole.VIEWER]: 0,
      [UserRole.API_ONLY]: 0,
    };

    counts.forEach(({ role, count }) => {
      result[role] = parseInt(count, 10);
    });

    return result;
  }
}