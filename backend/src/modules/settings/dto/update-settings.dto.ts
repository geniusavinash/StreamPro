import { IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ description: 'Streaming configuration settings' })
  @IsOptional()
  @IsObject()
  streaming?: any;

  @ApiPropertyOptional({ description: 'Recording configuration settings' })
  @IsOptional()
  @IsObject()
  recording?: any;

  @ApiPropertyOptional({ description: 'Storage configuration settings' })
  @IsOptional()
  @IsObject()
  storage?: any;

  @ApiPropertyOptional({ description: 'Notification configuration settings' })
  @IsOptional()
  @IsObject()
  notifications?: any;

  @ApiPropertyOptional({ description: 'Security configuration settings' })
  @IsOptional()
  @IsObject()
  security?: any;

  @ApiPropertyOptional({ description: 'System configuration settings' })
  @IsOptional()
  @IsObject()
  system?: any;
}