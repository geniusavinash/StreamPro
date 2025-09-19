import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCameraDto {
  @ApiProperty({
    description: 'Camera name',
    example: 'Front Door Camera',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Camera manufacturer/company',
    example: 'Hikvision',
    required: false,
  })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({
    description: 'Camera model',
    example: 'DS-2CD2043G0-I',
    required: false,
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({
    description: 'Camera location',
    example: 'Building A - Main Entrance',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: 'Camera placement details',
    example: 'Mounted on wall, facing parking lot',
    required: false,
  })
  @IsOptional()
  @IsString()
  place?: string;

  @ApiProperty({
    description: 'Enable/disable recording for this camera',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isRecording?: boolean;

  @ApiProperty({
    description: 'Activate/deactivate camera',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Stream status',
    example: 'online',
    required: false,
  })
  @IsOptional()
  @IsString()
  streamStatus?: string;
}