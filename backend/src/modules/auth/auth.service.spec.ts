import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserRepository } from '../../database/repositories/user.repository';
import { AuditService } from '../audit/audit.service';
import { SecurityService } from '../security/security.service';
import { UserRole } from '../../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let auditService: jest.Mocked<AuditService>;
  let securityService: jest.Mocked<SecurityService>;

  const mockUser = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: UserRole.OPERATOR,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: {
            findByUsername: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
        {
          provide: AuditService,
          useValue: {
            logAuthenticationEvent: jest.fn(),
          },
        },
        {
          provide: SecurityService,
          useValue: {
            checkGeolocation: jest.fn(),
            detectAnomalies: jest.fn(),
            respondToThreat: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(UserRepository);
    jwtService = module.get(JwtService);
    auditService = module.get(AuditService);
    securityService = module.get(SecurityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user data when credentials are valid', async () => {
      userRepository.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('testuser', 'password');

      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('should return null when user is not found', async () => {
      userRepository.findByUsername.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      userRepository.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should return null when user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      userRepository.findByUsername.mockResolvedValue(inactiveUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('testuser', 'password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    const loginData = {
      username: 'testuser',
      password: 'password',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    };

    beforeEach(() => {
      securityService.checkGeolocation.mockResolvedValue({ allowed: true });
      securityService.detectAnomalies.mockResolvedValue({
        isAnomalous: false,
        anomalies: [],
        riskScore: 0,
      });
    });

    it('should return access token when login is successful', async () => {
      userRepository.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.login(loginData);

      expect(result.success).toBe(true);
      expect(result.data.accessToken).toBe('mock-jwt-token');
      expect(result.data.user).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('should fail when geolocation is blocked', async () => {
      securityService.checkGeolocation.mockResolvedValue({
        allowed: false,
        reason: 'Blocked country',
      });

      const result = await service.login(loginData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Blocked country');
    });

    it('should fail when credentials are invalid', async () => {
      userRepository.findByUsername.mockResolvedValue(null);

      const result = await service.login(loginData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid credentials');
    });

    it('should log authentication events', async () => {
      userRepository.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('mock-jwt-token');

      await service.login(loginData);

      expect(auditService.logAuthenticationEvent).toHaveBeenCalledWith({
        userId: mockUser.id,
        username: mockUser.username,
        action: 'login',
        ipAddress: loginData.ipAddress,
        userAgent: loginData.userAgent,
        success: true,
      });
    });
  });

  describe('refreshToken', () => {
    it('should return new access token when refresh token is valid', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = { sub: mockUser.id, username: mockUser.username };
      
      jwtService.verify.mockReturnValue(payload);
      userRepository.findByUsername.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshToken(refreshToken);

      expect(result.success).toBe(true);
      expect(result.data.accessToken).toBe('new-access-token');
    });

    it('should fail when refresh token is invalid', async () => {
      const refreshToken = 'invalid-refresh-token';
      
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await service.refreshToken(refreshToken);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid refresh token');
    });
  });

  describe('register', () => {
    const registerData = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123',
      role: UserRole.VIEWER,
    };

    it('should create new user successfully', async () => {
      userRepository.findByUsername.mockResolvedValue(null);
      userRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      userRepository.create.mockReturnValue({ ...registerData, id: '2' } as any);
      userRepository.save.mockResolvedValue({ ...registerData, id: '2' } as any);

      const result = await service.register(registerData);

      expect(result.success).toBe(true);
      expect(result.data.user.username).toBe(registerData.username);
    });

    it('should fail when username already exists', async () => {
      userRepository.findByUsername.mockResolvedValue(mockUser);

      const result = await service.register(registerData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Username already exists');
    });

    it('should fail when email already exists', async () => {
      userRepository.findByUsername.mockResolvedValue(null);
      userRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.register(registerData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email already exists');
    });
  });

  describe('changePassword', () => {
    const changePasswordData = {
      userId: '1',
      currentPassword: 'oldpassword',
      newPassword: 'newpassword',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    };

    it('should change password successfully', async () => {
      userRepository.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newhashed');
      userRepository.save.mockResolvedValue(mockUser);

      const result = await service.changePassword(changePasswordData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password changed successfully');
    });

    it('should fail when current password is incorrect', async () => {
      userRepository.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.changePassword(changePasswordData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Current password is incorrect');
    });
  });
});