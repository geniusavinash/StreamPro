import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCameraDto {
  @ApiProperty({
    description: 'Camera name',
    example: 'Front Door Camera',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Camera manufacturer/company',
    example: 'Hikvision',
  })
  @IsString()
  @IsNotEmpty()
  company: string;

  @ApiProperty({
    description: 'Camera model',
    example: 'DS-2CD2043G0-I',
  })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({
    description: 'Camera serial number (must be unique)',
    example: 'HK001234567890',
  })
  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @ApiProperty({
    description: 'Camera location',
    example: 'Building A - Main Entrance',
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({
    description: 'Camera placement details',
    example: 'Mounted on wall, facing parking lot',
  })
  @IsString()
  @IsNotEmpty()
  place: string;

  @ApiProperty({
    description: 'Enable recording for this camera',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRecording?: boolean;
}