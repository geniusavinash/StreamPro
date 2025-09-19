import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { ApiTokenRepository } from '../../../database/repositories/api-token.repository';
import { AuditLogRepository } from '../../../database/repositories/audit-log.repository';
import { CreateApiTokenDto } from '../dto/create-api-token.dto';
import { UpdateApiTokenDto } from '../dto/update-api-token.dto';
import { ApiToken } from '../../../database/entities/api-token.entity';
import { User } from '../../../database/entities/user.entity';
import { Permission, ROLE_PERMISSIONS } from '../../../common/enums/permission.enum';

@Injectable()
export class ApiTokenService {
  constructor(
    private readonly apiTokenRepository: ApiTokenRepository,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly configService: ConfigService,
  ) {}

  async createToken(
    user: User,
    createTokenDto: CreateApiTokenDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ token: ApiToken; plainToken: string }> {
    // Validate permissions against user's role
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    const invalidPermissions = createTokenDto.permissions.filter(
      permission => !userPermissions.includes(permission)
    );

    if (invalidPermissions.length > 0) {
      throw new BadRequestException(
        `User does not have permissions: ${invalidPermissions.join(', ')}`
      );
    }

    // Generate token
    const plainToken = this.generateToken();
    const tokenHash = await bcrypt.hash(plainToken, 10);

    // Create token record
    const tokenData = {
      userId: user.id,
      tokenHash,
      name: createTokenDto.name,
      remark: createTokenDto.remark,
      permissions: { permissions: createTokenDto.permissions },
      rateLimit: createTokenDto.rateLimit || 1000,
      expiresAt: createTokenDto.expiresAt ? new Date(createTokenDto.expiresAt) : undefined,
      isActive: true,
    };

    const token = await this.apiTokenRepository.create(tokenData);

    // Log token creation
    await this.auditLogRepository.logUserAction(
      user.id,
      'API_TOKEN_CREATED',
      'api_token',
      token.id,
      undefined,
      {
        tokenName: token.name,
        permissions: createTokenDto.permissions,
        rateLimit: token.rateLimit,
      },
      ipAddress,
      userAgent,
    );

    return { token, plainToken };
  }

  async findAllTokens(userId?: string): Promise<ApiToken[]> {
    return this.apiTokenRepository.findAll({ userId });
  }

  async findTokenById(id: string): Promise<ApiToken> {
    const token = await this.apiTokenRepository.findById(id);
    if (!token) {
      throw new NotFoundException('API token not found');
    }
    return token;
  }

  async updateToken(
    id: string,
    updateTokenDto: UpdateApiTokenDto,
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ApiToken> {
    const token = await this.findTokenById(id);

    // Check if user owns the token or is admin
    if (token.userId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('You can only update your own tokens');
    }

    // Validate permissions if provided
    if (updateTokenDto.permissions) {
      const userPermissions = ROLE_PERMISSIONS[user.role] || [];
      const invalidPermissions = updateTokenDto.permissions.filter(
        permission => !userPermissions.includes(permission)
      );

      if (invalidPermissions.length > 0) {
        throw new BadRequestException(
          `User does not have permissions: ${invalidPermissions.join(', ')}`
        );
      }
    }

    const oldValues = { ...token };
    const updates: Partial<ApiToken> = {};

    if (updateTokenDto.name) updates.name = updateTokenDto.name;
    if (updateTokenDto.remark !== undefined) updates.remark = updateTokenDto.remark;
    if (updateTokenDto.permissions) {
      updates.permissions = { permissions: updateTokenDto.permissions };
    }
    if (updateTokenDto.rateLimit) updates.rateLimit = updateTokenDto.rateLimit;
    if (updateTokenDto.expiresAt) updates.expiresAt = new Date(updateTokenDto.expiresAt);
    if (updateTokenDto.isActive !== undefined) updates.isActive = updateTokenDto.isActive;

    const updatedToken = await this.apiTokenRepository.update(id, updates);

    // Log token update
    await this.auditLogRepository.logUserAction(
      user.id,
      'API_TOKEN_UPDATED',
      'api_token',
      id,
      oldValues,
      updates,
      ipAddress,
      userAgent,
    );

    if (!updatedToken) {
      throw new NotFoundException('Token not found after update');
    }
    return updatedToken;
  }

  async revokeToken(
    id: string,
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const token = await this.findTokenById(id);

    // Check if user owns the token or is admin
    if (token.userId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('You can only revoke your own tokens');
    }

    await this.apiTokenRepository.revoke(id);

    // Log token revocation
    await this.auditLogRepository.logUserAction(
      user.id,
      'API_TOKEN_REVOKED',
      'api_token',
      id,
      undefined,
      { tokenName: token.name },
      ipAddress,
      userAgent,
    );
  }

  async deleteToken(
    id: string,
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const token = await this.findTokenById(id);

    // Check if user owns the token or is admin
    if (token.userId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('You can only delete your own tokens');
    }

    await this.apiTokenRepository.delete(id);

    // Log token deletion
    await this.auditLogRepository.logUserAction(
      user.id,
      'API_TOKEN_DELETED',
      'api_token',
      id,
      undefined,
      { tokenName: token.name },
      ipAddress,
      userAgent,
    );
  }

  async validateToken(tokenString: string): Promise<ApiToken | null> {
    // Extract token from "Bearer token" format
    const token = tokenString.replace('Bearer ', '');
    
    // Find all active tokens and check against each hash
    const activeTokens = await this.apiTokenRepository.findAll({ isActive: true });
    
    for (const apiToken of activeTokens) {
      const isValid = await bcrypt.compare(token, apiToken.tokenHash);
      if (isValid) {
        // Check if token is expired
        if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
          await this.apiTokenRepository.revoke(apiToken.id);
          return null;
        }

        // Update last used timestamp
        await this.apiTokenRepository.updateLastUsed(apiToken.id);
        
        return apiToken;
      }
    }

    return null;
  }

  hasPermission(token: ApiToken, permission: Permission): boolean {
    const tokenPermissions = token.permissions?.permissions || [];
    return tokenPermissions.includes(permission);
  }

  async getTokenUsageStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    recentlyUsed: number;
  }> {
    return this.apiTokenRepository.getUsageStats();
  }

  async cleanupExpiredTokens(): Promise<number> {
    const cleanedCount = await this.apiTokenRepository.cleanupExpiredTokens();
    
    if (cleanedCount > 0) {
      await this.auditLogRepository.logSystemAction(
        'API_TOKENS_CLEANUP',
        'api_token',
        undefined,
        { cleanedCount }
      );
    }

    return cleanedCount;
  }

  private generateToken(): string {
    // Generate a secure random token
    const prefix = 'csp'; // Camera Streaming Platform
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `${prefix}_${randomBytes}`;
  }
}