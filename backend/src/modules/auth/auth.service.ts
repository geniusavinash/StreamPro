import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../../database/repositories/user.repository';
// import { AuditLogRepository } from '../../database/repositories/audit-log.repository'; // Disabled
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload, RefreshTokenPayload } from './interfaces/jwt-payload.interface';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    // private readonly auditLogRepository: AuditLogRepository, // Disabled
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponseDto> {
    const { username, password } = loginDto;

    // Find user by username
    const user = await this.userRepository.findByUsername(username);
    if (!user || !user.isActive) {
      // await this.auditLogRepository.logSystemAction(
      //   'LOGIN_FAILED',
      //   'user',
      //   undefined,
      //   { username, reason: 'User not found or inactive', ipAddress }
      // ); // Disabled
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      // await this.auditLogRepository.logUserAction(
      //   user.id,
      //   'LOGIN_FAILED',
      //   'user',
      //   user.id,
      //   undefined,
      //   { reason: 'Invalid password' },
      //   ipAddress,
      //   userAgent
      // ); // Disabled
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Log successful login
    // await this.auditLogRepository.logUserAction(
    //   user.id,
    //   'LOGIN_SUCCESS',
    //   'user',
    //   user.id,
    //   undefined,
    //   { loginTime: new Date() },
    //   ipAddress,
    //   userAgent
    // ); // Disabled

    return {
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
        secret: this.configService.get<string>('app.jwtSecret'),
      });

      const user = await this.userRepository.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const tokens = await this.generateTokens(user);

      return {
        ...tokens,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return user;
  }

  async logout(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    // await this.auditLogRepository.logUserAction(
    //   userId,
    //   'LOGOUT',
    //   'user',
    //   userId,
    //   undefined,
    //   { logoutTime: new Date() },
    //   ipAddress,
    //   userAgent
    // ); // Disabled
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      // await this.auditLogRepository.logUserAction(
      //   userId,
      //   'PASSWORD_CHANGE_FAILED',
      //   'user',
      //   userId,
      //   undefined,
      //   { reason: 'Invalid current password' },
      //   ipAddress,
      //   userAgent
      // ); // Disabled
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await this.userRepository.update(userId, { passwordHash: newPasswordHash });

    // Log password change
    // await this.auditLogRepository.logUserAction(
    //   userId,
    //   'PASSWORD_CHANGED',
    //   'user',
    //   userId,
    //   undefined,
    //   { changeTime: new Date() },
    //   ipAddress,
    //   userAgent
    // ); // Disabled
  }

  private async generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const jwtPayload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      tokenId: `refresh_${Date.now()}_${Math.random()}`,
    };

    const jwtSecret = this.configService.get<string>('app.jwtSecret');
    const expiresIn = this.configService.get<string>('app.jwtExpiresIn');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: jwtSecret,
        expiresIn,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: jwtSecret,
        expiresIn: '7d', // Refresh token expires in 7 days
      }),
    ]);

    // Convert expiresIn to seconds
    const expiresInSeconds = this.parseExpiresIn(expiresIn || '24h');

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresInSeconds,
    };
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 86400; // Default to 24 hours

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 60 * 60 * 24;
      default: return 86400;
    }
  }
}