import { Module } from '@nestjs/common';
import { CamerasService } from './cameras.service';
import { CamerasController } from './cameras.controller';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { StreamingModule } from '../streaming/streaming.module';

@Module({
  imports: [DatabaseModule, AuthModule, StreamingModule],
  providers: [CamerasService],
  controllers: [CamerasController],
  exports: [CamerasService],
})
export class CamerasModule {}