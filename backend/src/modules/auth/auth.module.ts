import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PermissionService } from './services/permission.service';
import { ApiTokenService } from './services/api-token.service';
import { AuthController } from './auth.controller';
import { ApiTokensController } from './controllers/api-tokens.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { ApiTokenGuard } from './guards/api-token.guard';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('app.jwtSecret'),
        signOptions: {
          expiresIn: configService.get<string>('app.jwtExpiresIn'),
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    PermissionService,
    ApiTokenService,
    JwtStrategy,
    LocalStrategy,
    RolesGuard,
    PermissionsGuard,
    ApiTokenGuard,
  ],
  controllers: [AuthController, ApiTokensController],
  exports: [
    AuthService,
    PermissionService,
    ApiTokenService,
    JwtModule,
    RolesGuard,
    PermissionsGuard,
    ApiTokenGuard,
  ],
})
export class AuthModule {}