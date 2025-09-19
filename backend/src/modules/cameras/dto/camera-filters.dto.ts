import { IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { StreamStatus } from '../../../common/enums/stream-status.enum';

export class CameraFiltersDto {
  @ApiProperty({
    description: 'Filter by active status',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;

  @ApiProperty({
    description: 'Filter by recording status',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isRecording?: boolean;

  @ApiProperty({
    description: 'Filter by stream status',
    enum: StreamStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(StreamStatus)
  streamStatus?: StreamStatus;
}