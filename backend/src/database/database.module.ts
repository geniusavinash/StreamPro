import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Import all entities
import { User } from './entities/user.entity';
import { Camera } from './entities/camera.entity';
import { Recording } from './entities/recording.entity';
import { ApiToken } from './entities/api-token.entity';
import { AuditLog } from './entities/audit-log.entity';

// Import all repositories
import { UserRepository } from './repositories/user.repository';
import { CameraRepository } from './repositories/camera.repository';
import { RecordingRepository } from './repositories/recording.repository';
import { ApiTokenRepository } from './repositories/api-token.repository';
import { AuditLogRepository } from './repositories/audit-log.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Camera,
      Recording,
      ApiToken,
      AuditLog,
    ]),
  ],
  providers: [
    UserRepository,
    CameraRepository,
    RecordingRepository,
    ApiTokenRepository,
    AuditLogRepository,
  ],
  exports: [
    UserRepository,
    CameraRepository,
    RecordingRepository,
    ApiTokenRepository,
    AuditLogRepository,
  ],
})
export class DatabaseModule {}